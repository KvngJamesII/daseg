/**
 * iDevHost VM Backend — Updated Server
 *
 * Features:
 * - Per-panel resource limits (RAM, CPU) via PM2 max_memory_restart
 * - Auto-restart on crash
 * - Restart counter: if a panel restarts >10 times in 3 hours → auto-stop + notify Supabase
 * - Custom RAM / CPU specs stored per panel
 * - Express API for deploy, start, stop, restart, status, delete, logs
 */

const express = require('express');
const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '50mb' }));

const APPS_DIR = process.env.APPS_DIR || '/home/apps';
const API_KEY = process.env.VM_API_KEY || 'changeme';

// Supabase client (optional — used to mark panels as stopped on restart limit)
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

// Restart tracking: { panelId: [timestamp, timestamp, ...] }
const restartLog = {};
const RESTART_LIMIT = 10;
const RESTART_WINDOW_MS = 3 * 60 * 60 * 1000; // 3 hours

// ─── Auth middleware ──────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function pm2List() {
  try {
    const out = execSync('pm2 jlist', { encoding: 'utf8' });
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function getPanelProcess(panelId) {
  return pm2List().find(p => p.name === panelId);
}

function getAppDir(panelId) {
  return path.join(APPS_DIR, panelId);
}

function pruneRestartLog(panelId) {
  const now = Date.now();
  restartLog[panelId] = (restartLog[panelId] || []).filter(
    ts => now - ts < RESTART_WINDOW_MS
  );
}

async function markPanelStopped(panelId, reason) {
  console.log(`[LIMIT] Panel ${panelId} stopped: ${reason}`);
  if (supabase) {
    await supabase
      .from('panels')
      .update({ status: 'stopped', restart_limit_hit: true })
      .eq('id', panelId);
  }
}

// Watch PM2 events for restarts
function startRestartWatcher() {
  const bus = spawn('pm2', ['log', '--json', '--lines', '0'], { stdio: ['ignore', 'pipe', 'ignore'] });

  bus.stdout.on('data', async (data) => {
    try {
      const lines = data.toString().split('\n').filter(Boolean);
      for (const line of lines) {
        const entry = JSON.parse(line);
        const name = entry.process?.name;
        if (!name || entry.type !== 'log out') continue;

        // PM2 restart detection
        if (entry.message?.includes('App crashed') || entry.data?.includes('restart')) {
          pruneRestartLog(name);
          restartLog[name] = restartLog[name] || [];
          restartLog[name].push(Date.now());

          if (restartLog[name].length > RESTART_LIMIT) {
            execSync(`pm2 stop ${name}`, { stdio: 'ignore' });
            await markPanelStopped(name, `Exceeded ${RESTART_LIMIT} restarts in 3 hours`);
            restartLog[name] = [];
          }
        }
      }
    } catch { /* ignore parse errors */ }
  });
}

// Poll PM2 for restart counts instead if the log watcher doesn't work
function startRestartPoller() {
  setInterval(async () => {
    const processes = pm2List();
    for (const proc of processes) {
      const panelId = proc.name;
      const pm2Restarts = proc.pm2_env?.restart_time || 0;

      pruneRestartLog(panelId);
      const recent = (restartLog[panelId] || []).length;

      // Sync PM2's restart count into our window tracker if it jumped
      const prev = (restartLog[panelId] || []).prevPm2Count || 0;
      if (pm2Restarts > prev) {
        const newRestarts = pm2Restarts - prev;
        for (let i = 0; i < newRestarts; i++) {
          restartLog[panelId] = restartLog[panelId] || [];
          restartLog[panelId].push(Date.now());
        }
        restartLog[panelId].prevPm2Count = pm2Restarts;
      }

      pruneRestartLog(panelId);
      if ((restartLog[panelId] || []).length > RESTART_LIMIT && proc.pm2_env?.status === 'online') {
        execSync(`pm2 stop ${panelId}`, { stdio: 'ignore' });
        await markPanelStopped(panelId, `Exceeded ${RESTART_LIMIT} restarts in 3 hours`);
        restartLog[panelId] = [];
      }
    }
  }, 30000); // Poll every 30 seconds
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// GET /health
app.get('/health', (req, res) => res.json({ ok: true }));

// POST /deploy — write files to disk + install deps
app.post('/deploy', async (req, res) => {
  const { panelId, language, files } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });

  const appDir = getAppDir(panelId);
  fs.mkdirSync(appDir, { recursive: true });

  if (files && typeof files === 'object') {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(appDir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }

  try {
    if (language === 'python') {
      const reqFile = path.join(appDir, 'requirements.txt');
      if (fs.existsSync(reqFile)) {
        execSync(`pip3 install -r requirements.txt`, { cwd: appDir, stdio: 'pipe', timeout: 120000 });
      }
    } else {
      const pkgFile = path.join(appDir, 'package.json');
      if (fs.existsSync(pkgFile)) {
        execSync(`npm install --production`, { cwd: appDir, stdio: 'pipe', timeout: 120000 });
      }
    }
    res.json({ success: true, message: 'Deployed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /start — start with PM2 with resource limits
app.post('/start', async (req, res) => {
  const {
    panelId,
    language,
    entryPoint,
    ramMb = 500,      // default 500 MB
    cpuCores = 0.5,  // fraction (PM2 uses instances)
  } = req.body;

  if (!panelId) return res.status(400).json({ error: 'panelId required' });

  const appDir = getAppDir(panelId);
  const entry = entryPoint || (language === 'python' ? 'main.py' : 'index.js');
  const entryFull = path.join(appDir, entry);

  if (!fs.existsSync(entryFull)) {
    return res.status(400).json({ error: `Entry point not found: ${entry}` });
  }

  // Stop existing process if running
  try { execSync(`pm2 delete ${panelId}`, { stdio: 'ignore' }); } catch {}

  // Reset restart log
  restartLog[panelId] = [];

  const interpreter = language === 'python' ? 'python3' : 'node';
  const maxMemory = `${Math.min(ramMb, 2048)}M`; // Cap at 2GB

  const pm2Cmd = [
    'pm2', 'start', entry,
    '--name', panelId,
    '--interpreter', interpreter,
    '--max-memory-restart', maxMemory,
    '--exp-backoff-restart-delay', '1000', // exponential backoff on restart
    '--log', path.join(appDir, 'app.log'),
    '--error', path.join(appDir, 'error.log'),
    '--no-autorestart', 'false',
    '--',
  ];

  try {
    execSync(pm2Cmd.join(' '), { cwd: appDir, stdio: 'pipe', timeout: 30000 });
    execSync('pm2 save', { stdio: 'ignore' });

    // Optionally apply CPU limit via cgroups/cpulimit if available
    try {
      const pid = getPanelProcess(panelId)?.pid;
      if (pid && cpuCores < 1) {
        const cpuPercent = Math.round(cpuCores * 100);
        exec(`cpulimit -p ${pid} -l ${cpuPercent} -b 2>/dev/null || true`);
      }
    } catch { /* cpulimit optional */ }

    res.json({ success: true, message: `Panel started (${maxMemory} RAM limit)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /stop
app.post('/stop', (req, res) => {
  const { panelId } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });
  try {
    execSync(`pm2 stop ${panelId}`, { stdio: 'pipe' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /restart
app.post('/restart', (req, res) => {
  const { panelId } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });
  try {
    execSync(`pm2 restart ${panelId}`, { stdio: 'pipe' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /delete
app.delete('/delete', (req, res) => {
  const { panelId } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });
  try {
    execSync(`pm2 delete ${panelId}`, { stdio: 'ignore' });
  } catch { }
  const appDir = getAppDir(panelId);
  if (fs.existsSync(appDir)) {
    fs.rmSync(appDir, { recursive: true, force: true });
  }
  delete restartLog[panelId];
  res.json({ success: true });
});

// GET /status/:panelId
app.get('/status/:panelId', (req, res) => {
  const { panelId } = req.params;
  const proc = getPanelProcess(panelId);
  if (!proc) return res.json({ status: 'stopped', cpu: 0, memory: 0, uptime: 0, restarts: 0 });

  const status = proc.pm2_env?.status === 'online' ? 'running' : 'stopped';
  pruneRestartLog(panelId);
  const recentRestarts = (restartLog[panelId] || []).length;

  res.json({
    status,
    cpu: proc.monit?.cpu ?? 0,
    memory: proc.monit?.memory ?? 0,
    uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
    restarts: proc.pm2_env?.restart_time ?? 0,
    restarts_recent_3h: recentRestarts,
    restart_limit_hit: recentRestarts > RESTART_LIMIT,
    pid: proc.pid,
  });
});

// GET /logs/:panelId
app.get('/logs/:panelId', (req, res) => {
  const { panelId } = req.params;
  const appDir = getAppDir(panelId);
  const logFile = path.join(appDir, 'app.log');
  const errFile = path.join(appDir, 'error.log');
  const lines = parseInt(req.query.lines as string) || 200;

  let logs = '';
  if (fs.existsSync(logFile)) {
    const content = fs.readFileSync(logFile, 'utf8');
    logs += content.split('\n').slice(-lines).join('\n');
  }
  if (fs.existsSync(errFile)) {
    const content = fs.readFileSync(errFile, 'utf8');
    if (content.trim()) logs += '\n[STDERR]\n' + content.split('\n').slice(-50).join('\n');
  }

  res.json({ logs: logs.trim() });
});

// GET /files/:panelId — list files
app.get('/files/:panelId', (req, res) => {
  const { panelId } = req.params;
  const appDir = getAppDir(panelId);
  if (!fs.existsSync(appDir)) return res.json({ files: [] });

  const walk = (dir, base = '') => {
    const result = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === '.git') continue;
      const rel = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        result.push({ name: rel, type: 'directory' });
        result.push(...walk(path.join(dir, entry.name), rel));
      } else {
        const stat = fs.statSync(path.join(dir, entry.name));
        result.push({ name: rel, type: 'file', size: stat.size });
      }
    }
    return result;
  };

  res.json({ files: walk(appDir) });
});

// GET /file/:panelId — read file content
app.get('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const { filePath } = req.query;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const full = path.join(getAppDir(panelId), filePath as string);
  if (!full.startsWith(getAppDir(panelId))) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'File not found' });
  try {
    const content = fs.readFileSync(full, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Could not read file' });
  }
});

// POST /file/:panelId — write file
app.post('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const { filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const full = path.join(getAppDir(panelId), filePath);
  if (!full.startsWith(getAppDir(panelId))) return res.status(403).json({ error: 'Forbidden' });
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content ?? '', 'utf8');
  res.json({ success: true });
});

// DELETE /file/:panelId — delete file
app.delete('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const { filePath } = req.body;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const full = path.join(getAppDir(panelId), filePath);
  if (!full.startsWith(getAppDir(panelId))) return res.status(403).json({ error: 'Forbidden' });
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  res.json({ success: true });
});

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`iDevHost VM Backend running on :${PORT}`);
  startRestartPoller();
});

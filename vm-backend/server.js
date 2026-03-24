/**
 * iDevHost VM Backend
 *
 * Features:
 * - Per-panel resource limits (RAM, CPU) via PM2 max_memory_restart
 * - Auto-restart on crash with restart limit protection
 * - File manager: list, read, write, create, delete, mkdir
 * - Terminal exec, logs, deploy
 * - Route aliases for edge function compatibility (/api/apps/... /api/files/...)
 */

const express = require('express');
const { exec, execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '50mb' }));

const APPS_DIR = process.env.APPS_DIR || '/root/apps';
const API_KEY = process.env.VM_API_KEY || 'changeme';

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : null;

const restartLog = {};
const RESTART_LIMIT = 10;
const RESTART_WINDOW_MS = 3 * 60 * 60 * 1000;

const HIDDEN_DIRS = new Set(['node_modules', '.git', '__pycache__', 'venv', '.venv', '.next', 'dist', 'build']);

// ─── Auth middleware ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ─── Crash protection ─────────────────────────────────────────────────────────
process.on('uncaughtException', err => console.error('[GUARD] Uncaught exception (server kept alive):', err));
process.on('unhandledRejection', err => console.error('[GUARD] Unhandled rejection (server kept alive):', err));

// ─── Helpers ──────────────────────────────────────────────────────────────────
function pm2List() {
  try {
    const out = execSync('pm2 jlist', { encoding: 'utf8' });
    return JSON.parse(out);
  } catch {
    return [];
  }
}

function getPanelProcess(panelId) {
  const list = pm2List();
  return list.find(p => p.name === `panel-${panelId}`) || list.find(p => p.name === panelId);
}

function getAppDir(panelId) {
  return path.join(APPS_DIR, panelId);
}

function isHidden(name) {
  const top = name.split('/')[0];
  return HIDDEN_DIRS.has(top) || top.startsWith('.');
}

function pruneRestartLog(panelId) {
  const now = Date.now();
  restartLog[panelId] = (restartLog[panelId] || []).filter(ts => now - ts < RESTART_WINDOW_MS);
}

async function markPanelStopped(panelId, reason) {
  console.log(`[LIMIT] Panel panel-${panelId} stopped: ${reason}`);
  if (supabase) {
    await supabase.from('panels').update({ status: 'stopped', restart_limit_hit: true }).eq('id', panelId);
  }
}

function startRestartPoller() {
  setInterval(async () => {
    const processes = pm2List();
    for (const proc of processes) {
      const name = proc.name;
      if (!name.startsWith('panel-')) continue;
      const panelId = name.replace(/^panel-/, '');
      const pm2Restarts = proc.pm2_env?.restart_time || 0;

      pruneRestartLog(panelId);
      const prev = restartLog[panelId]?.prevPm2Count || 0;
      if (pm2Restarts > prev) {
        const newRestarts = pm2Restarts - prev;
        restartLog[panelId] = restartLog[panelId] || [];
        for (let i = 0; i < newRestarts; i++) restartLog[panelId].push(Date.now());
        restartLog[panelId].prevPm2Count = pm2Restarts;
      }

      pruneRestartLog(panelId);
      if ((restartLog[panelId] || []).length > RESTART_LIMIT && proc.pm2_env?.status === 'online') {
        try { execSync(`pm2 stop panel-${panelId}`, { stdio: 'ignore' }); } catch {}
        await markPanelStopped(panelId, `Exceeded ${RESTART_LIMIT} restarts in 3 hours`);
        restartLog[panelId] = [];
      }
    }
  }, 30000);
}

// ─── Core routes ──────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ ok: true }));

// POST /deploy — write files + install deps
app.post('/deploy', async (req, res) => {
  const { panelId, language, files } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });
  const appDir = getAppDir(panelId);
  fs.mkdirSync(appDir, { recursive: true });

  if (files && typeof files === 'object') {
    for (const [filePath, content] of Object.entries(files)) {
      const fullPath = path.join(appDir, filePath);
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      const safe = content == null ? '' : (typeof content === 'string' ? content : JSON.stringify(content, null, 2));
      fs.writeFileSync(fullPath, safe, 'utf8');
    }
  }

  try {
    if (language === 'python') {
      const reqFile = path.join(appDir, 'requirements.txt');
      if (fs.existsSync(reqFile)) {
        execSync('pip3 install -r requirements.txt', { cwd: appDir, stdio: 'pipe', timeout: 120000 });
      }
    } else {
      const pkgFile = path.join(appDir, 'package.json');
      if (fs.existsSync(pkgFile)) {
        execSync('npm install --production', { cwd: appDir, stdio: 'pipe', timeout: 120000 });
      }
    }
    res.json({ success: true, message: 'Deployed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /start
app.post('/start', async (req, res) => {
  const { panelId, language, entryPoint, ramMb = 500, cpuCores = 0.5 } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });

  const appDir = getAppDir(panelId);
  const entry = entryPoint || (language === 'python' ? 'main.py' : 'index.js');
  const entryFull = path.join(appDir, entry);
  if (!fs.existsSync(entryFull)) return res.status(400).json({ error: `Entry point not found: ${entry}` });

  try { execSync(`pm2 delete panel-${panelId}`, { stdio: 'ignore' }); } catch {}
  restartLog[panelId] = [];

  const interpreter = language === 'python' ? 'python3' : 'node';
  const maxMemory = `${Math.min(ramMb, 2048)}M`;

  const pm2Cmd = [
    'pm2', 'start', entry,
    '--name', `panel-${panelId}`,
    '--interpreter', interpreter,
    '--max-memory-restart', maxMemory,
    '--exp-backoff-restart-delay', '1000',
    '--log', path.join(appDir, 'app.log'),
    '--error', path.join(appDir, 'error.log'),
    '--',
  ].join(' ');

  try {
    execSync(pm2Cmd, { cwd: appDir, stdio: 'pipe', timeout: 30000 });
    execSync('pm2 save', { stdio: 'ignore' });
    try {
      const pid = getPanelProcess(panelId)?.pid;
      if (pid && cpuCores < 1) {
        const cpuPercent = Math.round(cpuCores * 100);
        exec(`cpulimit -p ${pid} -l ${cpuPercent} -b 2>/dev/null || true`);
      }
    } catch {}
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
    execSync(`pm2 stop panel-${panelId}`, { stdio: 'pipe' });
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
    execSync(`pm2 restart panel-${panelId}`, { stdio: 'pipe' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /delete
app.delete('/delete', (req, res) => {
  const { panelId } = req.body;
  if (!panelId) return res.status(400).json({ error: 'panelId required' });
  try { execSync(`pm2 delete panel-${panelId}`, { stdio: 'ignore' }); } catch {}
  const appDir = getAppDir(panelId);
  if (fs.existsSync(appDir)) fs.rmSync(appDir, { recursive: true, force: true });
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
  res.json({
    status,
    cpu: proc.monit?.cpu ?? 0,
    memory: proc.monit?.memory ?? 0,
    uptime: proc.pm2_env?.pm_uptime ? Date.now() - proc.pm2_env.pm_uptime : 0,
    restarts: proc.pm2_env?.restart_time ?? 0,
    restarts_recent_3h: (restartLog[panelId] || []).length,
    restart_limit_hit: (restartLog[panelId] || []).length > RESTART_LIMIT,
    pid: proc.pid,
  });
});

// GET /logs/:panelId
app.get('/logs/:panelId', (req, res) => {
  const { panelId } = req.params;
  const appDir = getAppDir(panelId);
  const lines = parseInt(req.query.lines) || 200;
  let logs = '';
  const logFile = path.join(appDir, 'app.log');
  const errFile = path.join(appDir, 'error.log');
  if (fs.existsSync(logFile)) logs += fs.readFileSync(logFile, 'utf8').split('\n').slice(-lines).join('\n');
  if (fs.existsSync(errFile)) {
    const err = fs.readFileSync(errFile, 'utf8');
    if (err.trim()) logs += '\n[STDERR]\n' + err.split('\n').slice(-50).join('\n');
  }
  res.json({ logs: logs.trim() });
});

// DELETE /logs/:panelId — clear logs
app.delete('/logs/:panelId', (req, res) => {
  const { panelId } = req.params;
  const appDir = getAppDir(panelId);
  try { fs.writeFileSync(path.join(appDir, 'app.log'), '', 'utf8'); } catch {}
  try { fs.writeFileSync(path.join(appDir, 'error.log'), '', 'utf8'); } catch {}
  res.json({ success: true });
});

// GET /files/:panelId — list directory contents
app.get('/files/:panelId', (req, res) => {
  const { panelId } = req.params;
  const appDir = getAppDir(panelId);
  const dir = req.query.dir || '';
  const targetDir = dir ? path.join(appDir, dir) : appDir;
  if (!targetDir.startsWith(appDir)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(targetDir)) return res.json({ files: [] });

  const entries = fs.readdirSync(targetDir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (isHidden(entry.name)) continue;
    const rel = dir ? `${dir}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push({ name: entry.name, type: 'directory', path: rel });
    } else {
      const stat = fs.statSync(path.join(targetDir, entry.name));
      files.push({ name: entry.name, type: 'file', path: rel, size: stat.size });
    }
  }
  res.json({ files });
});

// GET /file/:panelId — read file
app.get('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const filePath = req.query.filePath || req.query.path;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const appDir = getAppDir(panelId);
  const full = path.join(appDir, filePath);
  if (!full.startsWith(appDir)) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'File not found' });
  try {
    res.json({ content: fs.readFileSync(full, 'utf8') });
  } catch {
    res.status(500).json({ error: 'Could not read file' });
  }
});

// POST /file/:panelId — write file
app.post('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const filePath = req.body.filePath || req.body.path;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const appDir = getAppDir(panelId);
  const full = path.join(appDir, filePath);
  if (!full.startsWith(appDir)) return res.status(403).json({ error: 'Forbidden' });
  fs.mkdirSync(path.dirname(full), { recursive: true });
  const raw = req.body.content;
  const safe = raw == null ? '' : (typeof raw === 'string' ? raw : JSON.stringify(raw, null, 2));
  fs.writeFileSync(full, safe, 'utf8');
  res.json({ success: true });
});

// DELETE /file/:panelId — delete file
app.delete('/file/:panelId', (req, res) => {
  const { panelId } = req.params;
  const filePath = req.body.filePath || req.body.path;
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  const appDir = getAppDir(panelId);
  const full = path.join(appDir, filePath);
  if (!full.startsWith(appDir)) return res.status(403).json({ error: 'Forbidden' });
  if (fs.existsSync(full)) fs.rmSync(full, { recursive: true, force: true });
  res.json({ success: true });
});

// ─── Edge function compatibility aliases (/api/...) ───────────────────────────

app.get('/api/apps/:panelId/status', (req, res, next) => {
  req.url = `/status/${req.params.panelId}`; next();
});
app.post('/api/apps/:panelId/start', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/start'; next();
});
app.post('/api/apps/:panelId/stop', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/stop'; next();
});
app.post('/api/apps/:panelId/restart', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/restart'; next();
});
app.post('/api/apps/:panelId/deploy', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/deploy'; next();
});
app.delete('/api/apps/:panelId/delete', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/delete'; next();
});

app.get('/api/logs/:panelId', (req, res, next) => {
  req.url = `/logs/${req.params.panelId}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`; next();
});
app.delete('/api/logs/:panelId', (req, res, next) => {
  req.url = `/logs/${req.params.panelId}`; next();
});

app.get('/api/files/:panelId', (req, res, next) => {
  req.url = `/files/${req.params.panelId}${req.url.includes('?') ? '?' + req.url.split('?')[1] : ''}`; next();
});

app.get('/api/files/:panelId/content', (req, res, next) => {
  req.url = `/file/${req.params.panelId}?filePath=${encodeURIComponent(req.query.path || req.query.filePath || '')}`; next();
});
app.post('/api/files/:panelId/content', (req, res, next) => {
  req.url = `/file/${req.params.panelId}`; next();
});
app.delete('/api/files/:panelId/content', (req, res, next) => {
  req.url = `/file/${req.params.panelId}`; next();
});

app.post('/api/files/:panelId/sync', (req, res, next) => {
  req.body.panelId = req.params.panelId; req.url = '/deploy'; next();
});

app.post('/api/files/:panelId/mkdir', (req, res) => {
  const { panelId } = req.params;
  const dirPath = req.body.path;
  if (!dirPath) return res.status(400).json({ error: 'path required' });
  const appDir = getAppDir(panelId);
  const full = path.join(appDir, dirPath);
  if (!full.startsWith(appDir)) return res.status(403).json({ error: 'Forbidden' });
  fs.mkdirSync(full, { recursive: true });
  res.json({ success: true, created: dirPath });
});

app.post('/api/terminal/:panelId/exec', (req, res) => {
  const { panelId } = req.params;
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'command required' });
  const appDir = getAppDir(panelId);
  try {
    const stdout = execSync(command, { cwd: appDir, encoding: 'utf8', timeout: 10000 });
    res.json({ success: true, stdout, stderr: '', code: 0 });
  } catch (err) {
    res.json({ success: false, stdout: err.stdout || '', stderr: err.stderr || err.message, code: err.status || 1 });
  }
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`iDevHost VM Backend running on :${PORT}`);
  startRestartPoller();
});

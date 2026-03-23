import { useState, useEffect, useRef } from 'react';
import { vmApi } from '@/lib/vmApi';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, Pause, Play } from 'lucide-react';

interface UnifiedConsoleProps {
  panelId: string;
  panelStatus: string;
  entryPoint?: string;
  language?: 'nodejs' | 'python';
}

interface Line {
  id: string;
  kind: 'log' | 'cmd' | 'out' | 'err' | 'sys' | 'info';
  text: string;
  ts: number;
}

const cleanRaw = (s: string) =>
  s.replace(/\x1b\[[0-9;]*[mGKHF]/g, '')
   .replace(/\[\d+m/g, '')
   .replace(/^\d+\|panel-[a-z0-9-]+\s*\|\s*/i, '')
   .replace(/^\d+\|panel\s*\|\s*/i, '')
   .trim();

const isNoise = (s: string) =>
  !s || /\[tailing\]|\.pm2\/logs\/|last \d+ lines/i.test(s);

// Remove full KeyboardInterrupt traceback blocks — these appear when PM2
// kills a Python process that's waiting on input() and are not real errors.
function stripKeyboardInterrupt(lines: Line[]): Line[] {
  const arr = [...lines];
  let i = arr.length - 1;
  while (i >= 0) {
    if (arr[i].text.trim() === 'KeyboardInterrupt') {
      let start = i;
      for (let j = i - 1; j >= Math.max(0, i - 12); j--) {
        if (/Traceback \(most recent call last\)/i.test(arr[j].text)) {
          start = j;
          break;
        }
      }
      arr.splice(start, i - start + 1);
      i = start - 1;
    } else {
      i--;
    }
  }
  return arr;
}

const lineColor = (k: Line['kind']) => ({
  log:  '#d1d5db',
  cmd:  '#34d399',
  out:  '#e5e7eb',
  err:  '#f87171',
  sys:  '#fbbf24',
  info: '#60a5fa',
}[k] ?? '#d1d5db');

export function UnifiedConsole({ panelId, panelStatus, entryPoint = 'main.py', language = 'python' }: UnifiedConsoleProps) {
  const [lines, setLines]     = useState<Line[]>([]);
  const [input, setInput]     = useState('');
  const [running, setRunning] = useState(false);
  const [live, setLive]       = useState(true);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [histBuf, setHistBuf] = useState('');
  const [atBottom, setAtBottom] = useState(true);

  const isRunning = panelStatus === 'running';

  const bodyRef        = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);
  const suppressUntil   = useRef<number>(0);
  const prevStatus      = useRef<string>('');
  const lastPanelId     = useRef<string>('');
  // Interactive session: replay all answers each run, show only new output
  const sessionAnswers  = useRef<string[]>([]);
  const sessionShown    = useRef<number>(0);   // output lines already displayed

  const push = (kind: Line['kind'], text: string) =>
    setLines(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, kind, text, ts: Date.now() }]);

  /* ── System logs (Supabase) ── */
  useEffect(() => {
    const loadSys = async () => {
      const { data } = await supabase
        .from('panel_logs').select('*')
        .eq('panel_id', panelId).order('created_at', { ascending: true }).limit(50);
      const newLines: Line[] = (data || []).map(l => ({
        id: `sys-${l.id}`, kind: l.log_type === 'error' ? 'err' : l.log_type === 'success' ? 'info' : 'sys' as Line['kind'],
        text: `[${l.log_type.toUpperCase()}] ${l.message}`, ts: new Date(l.created_at).getTime(),
      }));
      setLines(newLines);
    };
    loadSys();

    const ch = supabase.channel(`plogs-${panelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'panel_logs', filter: `panel_id=eq.${panelId}` },
        p => {
          const l = p.new as any;
          const kind: Line['kind'] = l.log_type === 'error' ? 'err' : l.log_type === 'success' ? 'info' : 'sys';
          push(kind, `[${l.log_type.toUpperCase()}] ${l.message}`);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [panelId]);

  /* ── App logs (PM2) ── */
  const fetchLogs = async (force = false) => {
    // Suppress fetches for a window after a stdin exec to avoid
    // PM2 restart output appearing as duplicates
    if (!force && Date.now() < suppressUntil.current) return;
    if (!force && panelStatus !== 'running') return;
    setLoading(true);
    try {
      const res = await vmApi.getLogs(panelId, 150);
      const now = Date.now();
      const out: Line[] = [];
      const processStr = (s: string, kind: Line['kind']) =>
        s.split('\n').map(cleanRaw).filter(l => l && !isNoise(l))
          .forEach(text => out.push({ id: `${kind}-${now}-${Math.random()}`, kind, text, ts: now }));
      if (res.logs?.out) processStr(res.logs.out, 'log');
      if (res.logs?.err) {
        res.logs.err.split('\n').map(cleanRaw).filter(l => l && !isNoise(l)).forEach(text => {
          const u = text.toUpperCase();
          const k: Line['kind'] = (u.includes('ERROR') || u.includes('TRACEBACK') || u.includes('EXCEPTION')) ? 'err' : 'log';
          out.push({ id: `err-${now}-${Math.random()}`, kind: k, text, ts: now });
        });
      }
      // Strip KeyboardInterrupt traceback blocks (expected PM2 kill noise)
      const cleaned = stripKeyboardInterrupt(out);
      setLines(prev => {
        const sysLines = prev.filter(l => l.kind === 'sys' || l.kind === 'info');
        const cmdLines = prev.filter(l => l.kind === 'cmd' || l.kind === 'out' || l.kind === 'err' && l.id.startsWith('cmd-'));
        return [...sysLines, ...cleaned, ...cmdLines].sort((a, b) => a.ts - b.ts);
      });
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    // When the panel changes (navigation) or component first mounts, seed
    // prevStatus so we don't mistake "already running" for a fresh restart.
    if (lastPanelId.current !== panelId) {
      lastPanelId.current = panelId;
      prevStatus.current  = panelStatus;
    }

    if (panelStatus === 'running') {
      const wasRunning = prevStatus.current === 'running';
      prevStatus.current = 'running';

      if (!wasRunning) {
        // Real start/restart transition — wipe old output
        setLines([]);
        suppressUntil.current = 0;
        vmApi.clearLogs(panelId).catch(() => {});
        setTimeout(fetchLogs, 2000);
      } else {
        // Already running (mount / re-render) — just load logs
        fetchLogs();
      }
    } else {
      const wasRunning = prevStatus.current === 'running';
      prevStatus.current = panelStatus;

      if (wasRunning) {
        // Panel just stopped — do a final forced log grab to capture fast-exit output
        // (e.g. a script that prints and exits before the 2s poller fires)
        fetchLogs(true).then(() => {
          setLines(prev => {
            // Avoid duplicate idle messages
            if (prev.some(l => l.id === 'idle')) return prev;
            return [...prev, { id: 'idle', kind: 'sys', text: '[SYSTEM] Panel is not running. Press Start to launch your app.', ts: Date.now() }];
          });
        });
      } else {
        setLines(prev => {
          const sysLines = prev.filter(l => l.kind === 'sys' || l.kind === 'info');
          return [...sysLines, { id: 'idle', kind: 'sys', text: '[SYSTEM] Panel is not running. Press Start to launch your app.', ts: Date.now() }];
        });
      }
    }
  }, [panelId, panelStatus]);

  useEffect(() => {
    if (!live || panelStatus !== 'running') return;
    const t = setInterval(fetchLogs, 3000);
    return () => clearInterval(t);
  }, [live, panelStatus, panelId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (atBottom && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [lines, atBottom]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  /* ── Command execution ── */
  const exec = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    setHistory(h => [trimmed, ...h.slice(0, 99)]);
    setHistIdx(-1);
    setHistBuf('');
    setInput('');
    setAtBottom(true);

    /* ── Running mode: always pipe input to the script ── */
    if (isRunning) {
      // Suppress live PM2 log fetches for 8 s to avoid echoed output
      suppressUntil.current = Date.now() + 8000;
      setRunning(true);

      push('cmd', `→ ${trimmed}`);
      // Split on comma so "Alice, 25, Python" becomes 3 stdin lines
      const parts = trimmed.split(',').map(p => p.trim());
      const printfStr = parts.map(p => p.replace(/'/g, "'\\''")).join('\\n') + '\\n';
      const runners = language === 'python' ? ['python3', 'python'] : ['node'];
      let succeeded = false;

      for (const r of runners) {
        const pipedCmd = `printf '${printfStr}' | ${r} ${entryPoint}`;
        try {
          const res = await vmApi.exec(panelId, pipedCmd);
          const out = ((res.stdout || '') + (res.stderr ? '\n' + res.stderr : '')).trim();
          if (out) out.split('\n').forEach(l => { if (l.trim()) push(res.stderr && !res.stdout ? 'err' : 'out', l); });
          else push('out', '(no output)');
          succeeded = true;
          break;
        } catch {
          // try next runner
        }
      }

      if (!succeeded) {
        push('err', 'Pipe failed. Trying without stdin…');
        try {
          const res = await vmApi.exec(panelId, `${runners[0]} ${entryPoint}`);
          const out = ((res.stdout || '') + (res.stderr ? '\n' + res.stderr : '')).trim();
          if (out) out.split('\n').forEach(l => push('out', l));
          push('sys', 'Script ran but stdin piping is not supported by this server.');
        } catch {
          push('err', `Script not found or not runnable: ${entryPoint}`);
          push('sys', 'Check the entry point in Startup settings.');
        }
      }

      setRunning(false);
      return;
    }

    /* ── Stopped mode: run as shell command ── */
    if (trimmed === 'clear') { setLines([]); return; }
    if (trimmed === 'help') {
      push('out', 'Commands: ls, cat main.py, pip install <pkg>, python3 --version, clear');
      return;
    }

    push('cmd', `$ ${trimmed}`);
    setRunning(true);
    try {
      const res = await vmApi.exec(panelId, trimmed);
      const combined = ((res.stdout || '') + (res.stderr ? '\n' + res.stderr : '')).trim();
      if (combined) combined.split('\n').forEach(l => { if (l.trim()) push(res.stderr && !res.stdout ? 'err' : 'out', l); });
      else push('out', '(no output)');
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('non-2xx') || msg.includes('Edge Function')) {
        push('err', 'Command failed — the server rejected the request.');
        push('sys', 'Make sure your command is valid bash. Example: ls, cat main.py, python3 --version');
      } else {
        push('err', `Error: ${msg}`);
      }
    }
    setRunning(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !running) {
      exec(input);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (histIdx === -1) setHistBuf(input);
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next);
      setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setInput(histBuf); return; }
      const next = histIdx - 1;
      setHistIdx(next);
      setInput(history[next]);
    }
  };

  const scrollToBottom = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    setAtBottom(true);
  };

  const promptChar = isRunning ? '→' : '$';
  const promptColor = isRunning ? '#f0a726' : '#3fb950';
  const inputPlaceholder = running
    ? ''
    : isRunning
      ? `answer, next answer, … (comma = multiple inputs)`
      : 'type a command…';

  return (
    <div
      style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', background: '#0d1117', fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid #21262d', background: '#161b22', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: live ? '#27c93f' : '#444' }} />
          </div>
          <span style={{ fontSize: 11, color: '#8b949e', letterSpacing: 0.3 }}>
            panel — {isRunning ? `stdin → ${entryPoint}` : 'bash'}
          </span>
          {loading && <Loader2 style={{ width: 11, height: 11, color: '#58a6ff', animation: 'spin 1s linear infinite' }} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button
            onClick={e => { e.stopPropagation(); setLive(!live); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 9px', borderRadius: 5, border: `1px solid ${live ? '#238636' : '#30363d'}`, background: live ? 'rgba(35,134,54,0.12)' : 'transparent', color: live ? '#3fb950' : '#8b949e', fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}
          >
            {live
              ? <><Pause style={{ width: 9, height: 9 }} /> Pause</>
              : <><Play  style={{ width: 9, height: 9 }} /> Resume</>
            }
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLines([]); }}
            style={{ padding: '3px 9px', borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}
          >
            Clear
          </button>
        </div>
      </div>

      {/* Log body */}
      <div
        ref={bodyRef}
        onScroll={onScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.6, fontSize: 12.5, minHeight: 0 }}
      >
        {lines.length === 0 && (
          <div style={{ color: '#484f58', paddingTop: 20 }}>
            No output yet. Type a command below or start the panel.
          </div>
        )}
        {lines.map(line => (
          <div
            key={line.id}
            style={{ color: lineColor(line.kind), whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingBottom: 1, fontWeight: line.kind === 'cmd' ? 600 : 400 }}
          >
            {line.text}
          </div>
        ))}
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <Loader2 style={{ width: 11, height: 11, color: promptColor, animation: 'spin 1s linear infinite', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#484f58' }}>running…</span>
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {!atBottom && (
        <button
          onClick={scrollToBottom}
          style={{ position: 'absolute', right: 16, bottom: 70, width: 30, height: 30, borderRadius: '50%', background: '#21262d', border: '1px solid #30363d', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#8b949e' }}
        >
          <ChevronDown style={{ width: 14, height: 14 }} />
        </button>
      )}

      {/* Input row */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #21262d', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, background: '#161b22' }}>
        <span style={{ color: promptColor, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
          {promptChar}
        </span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={inputPlaceholder}
          disabled={running}
          autoComplete="off"
          spellCheck={false}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e6edf3', fontFamily: 'inherit', caretColor: promptColor }}
        />
        {running && <Loader2 style={{ width: 13, height: 13, color: promptColor, flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
      </div>
    </div>
  );
}

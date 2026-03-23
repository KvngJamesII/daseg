import { useState, useEffect, useRef } from 'react';
import { vmApi } from '@/lib/vmApi';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, Pause, Play } from 'lucide-react';

interface UnifiedConsoleProps {
  panelId: string;
  panelStatus: string;
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
   .trim();

const isNoise = (s: string) =>
  !s || /\[tailing\]|\.pm2\/logs\/|last \d+ lines/i.test(s);

const lineColor = (k: Line['kind']) => ({
  log:  '#d1d5db',
  cmd:  '#34d399',
  out:  '#e5e7eb',
  err:  '#f87171',
  sys:  '#fbbf24',
  info: '#60a5fa',
}[k] ?? '#d1d5db');

export function UnifiedConsole({ panelId, panelStatus }: UnifiedConsoleProps) {
  const [lines, setLines]         = useState<Line[]>([]);
  const [input, setInput]         = useState('');
  const [running, setRunning]     = useState(false);
  const [live, setLive]           = useState(true);
  const [loading, setLoading]     = useState(false);
  const [history, setHistory]     = useState<string[]>([]);
  const [histIdx, setHistIdx]     = useState(-1);
  const [histBuf, setHistBuf]     = useState('');
  const [atBottom, setAtBottom]   = useState(true);

  const bodyRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  const fetchLogs = async () => {
    if (panelStatus !== 'running') return;
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
      setLines(prev => {
        const sysLines = prev.filter(l => l.kind === 'sys' || l.kind === 'info');
        const cmdLines = prev.filter(l => l.kind === 'cmd' || l.kind === 'out' || l.kind === 'err' && l.id.startsWith('cmd-'));
        return [...sysLines, ...out, ...cmdLines].sort((a, b) => a.ts - b.ts);
      });
    } catch { }
    setLoading(false);
  };

  useEffect(() => {
    if (panelStatus === 'running') {
      fetchLogs();
    } else {
      setLines(prev => {
        const sysLines = prev.filter(l => l.kind === 'sys' || l.kind === 'info');
        return [...sysLines, { id: 'idle', kind: 'sys', text: '[SYSTEM] Panel is not running. Press Start to launch your app.', ts: Date.now() }];
      });
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

    push('cmd', `$ ${trimmed}`);
    setInput('');
    setAtBottom(true);

    if (trimmed === 'clear') { setLines([]); return; }
    if (trimmed === 'help') {
      push('out', 'Shell commands: ls, cat, pip install <pkg>, python main.py, clear');
      push('out', 'Note: this terminal runs NEW commands — it does not send input to your running app.');
      push('out', 'To test interactive scripts, pipe the input:  echo "2" | python main.py');
      return;
    }

    /* Detect likely "app input" mistake while panel is running */
    const looksLikeData = panelStatus === 'running' && /^[\w\s.,!?-]+$/.test(trimmed) && !/\s/.test(trimmed.replace(/^[\d.]+$/, ''));
    if (looksLikeData && /^\d+(\.\d+)?$/.test(trimmed)) {
      push('err', `"${trimmed}" looks like data, not a shell command.`);
      push('sys', 'This terminal runs shell commands, not stdin to your app.');
      push('sys', `To pass input to your script:  echo "${trimmed}" | python main.py`);
      return;
    }

    setRunning(true);
    try {
      const res = await vmApi.exec(panelId, trimmed);
      const combined = ((res.stdout || '') + (res.stderr ? '\n' + res.stderr : '')).trim();
      if (combined) {
        combined.split('\n').forEach(line => {
          if (line.trim()) push(res.stderr && !res.stdout ? 'err' : 'out', line);
        });
      } else {
        push('out', '(no output)');
      }
    } catch (e: any) {
      const msg = e.message || '';
      if (msg.includes('non-2xx') || msg.includes('Edge Function')) {
        push('err', 'Command failed — the server rejected the request.');
        push('sys', 'Make sure your command is valid bash. Example: ls, cat main.py, python --version');
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

  const clear = async () => {
    try { await vmApi.clearLogs(panelId); await supabase.from('panel_logs').delete().eq('panel_id', panelId); } catch { }
    setLines([]);
  };

  const scrollToBottom = () => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    setAtBottom(true);
  };

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
            panel — bash
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
        {/* running indicator */}
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <Loader2 style={{ width: 11, height: 11, color: '#3fb950', animation: 'spin 1s linear infinite', flexShrink: 0 }} />
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

      {/* Shell-not-stdin notice — only shown while panel is running */}
      {panelStatus === 'running' && (
        <div style={{ flexShrink: 0, padding: '5px 12px', background: 'rgba(96,165,250,0.06)', borderTop: '1px solid rgba(96,165,250,0.12)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: '#60a5fa', fontFamily: 'monospace' }}>ℹ</span>
          <span style={{ fontSize: 10.5, color: '#60a5fa', opacity: 0.8 }}>
            Shell terminal — runs commands, not app stdin. To test input:&nbsp;
            <code style={{ background: 'rgba(96,165,250,0.12)', borderRadius: 3, padding: '0 4px', fontSize: 10 }}>echo "answer" | python main.py</code>
          </span>
        </div>
      )}

      {/* Input */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #21262d', padding: '9px 12px', display: 'flex', alignItems: 'center', gap: 8, background: '#161b22' }}>
        <span style={{ color: '#3fb950', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={running ? '' : panelStatus === 'running' ? 'shell command (ls, cat, pip install…)' : 'type a command…'}
          disabled={running}
          autoComplete="off"
          spellCheck={false}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e6edf3', fontFamily: 'inherit', caretColor: '#3fb950' }}
        />
        {running && <Loader2 style={{ width: 13, height: 13, color: '#3fb950', flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
      </div>
    </div>
  );
}

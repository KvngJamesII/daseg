import { useState, useEffect, useRef } from 'react';
import { vmApi } from '@/lib/vmApi';
import { supabase } from '@/integrations/supabase/client';
import {
  Terminal, Trash2, RefreshCw, Loader2, Send, ChevronDown, ChevronUp,
  Play, MessageSquare, Info,
} from 'lucide-react';

interface UnifiedConsoleProps {
  panelId: string;
  panelStatus: string;
}

interface ConsoleLine {
  id: string;
  type: 'stdout' | 'stderr' | 'input' | 'output' | 'error' | 'info' | 'success' | 'system' | 'stdin';
  content: string;
  timestamp: number;
}

const CARD   = '#0d0d1a';
const CARD2  = '#111122';
const BORDER = '#1a1a2e';
const GREEN  = '#00e676';
const CYAN   = '#00b0ff';
const AMBER  = '#f0b429';
const RED    = '#ff4d4d';
const MUTED  = '#5a5a88';

const cleanLine = (line: string): string =>
  line
    .replace(/\x1b\[[0-9;]*m/g, '')
    .replace(/\\x1b\[[0-9;]*m/g, '')
    .replace(/\[\d+m/g, '')
    .replace(/^\d+\|panel-[a-z0-9-]+\s*\|\s*/i, '')
    .trim();

const isMetadataLine = (line: string): boolean => {
  const l = line.toLowerCase();
  return l.includes('[tailing]') || l.includes('.pm2/logs/') ||
    l.includes('last 200 lines') || l.includes('last 100 lines') || line.trim() === '';
};

const detectType = (content: string): ConsoleLine['type'] => {
  const u = content.toUpperCase();
  if (u.includes('ERROR:') || u.includes('[ERROR]') || u.includes('EXCEPTION') || u.includes('TRACEBACK') || u.includes('SYNTAXERROR') || u.includes('NAMEERROR') || u.includes('TYPEERROR')) return 'error';
  if (u.includes('WARN:') || u.includes('WARNING:') || u.includes('[WARN]')) return 'info';
  const http = content.match(/"\s*(GET|POST|PUT|DELETE|PATCH)\s+[^"]+"\s+(\d{3})/);
  if (http && parseInt(http[2]) >= 400) return 'error';
  return 'stdout';
};

const lineColor: Record<string, string> = {
  input:   GREEN,
  stdin:   '#a78bfa',
  stderr:  RED,
  error:   RED,
  success: GREEN,
  info:    AMBER,
  system:  AMBER,
  output:  CYAN,
  stdout:  '#cccccc',
};

type Mode = 'shell' | 'stdin';

export function UnifiedConsole({ panelId, panelStatus }: UnifiedConsoleProps) {
  const [logLines, setLogLines]       = useState<ConsoleLine[]>([]);
  const [systemLogs, setSystemLogs]   = useState<ConsoleLine[]>([]);
  const [cmdLines, setCmdLines]       = useState<ConsoleLine[]>([]);
  const [input, setInput]             = useState('');
  const [executing, setExecuting]     = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading]         = useState(false);
  const [mode, setMode]               = useState<Mode>('shell');
  const [stdinQueue, setStdinQueue]   = useState<string[]>([]);
  const [showStdinHelper, setShowStdinHelper] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  /* ── System logs (Supabase) ── */
  useEffect(() => {
    fetchSystemLogs();
    const channel = supabase
      .channel(`panel-logs-${panelId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'panel_logs', filter: `panel_id=eq.${panelId}` },
        (payload) => {
          const log = payload.new as any;
          setSystemLogs(prev => [...prev, {
            id: `sys-${log.id}`,
            type: log.log_type === 'error' ? 'error' : log.log_type === 'success' ? 'success' : 'info',
            content: `[${log.log_type.toUpperCase()}] ${log.message}`,
            timestamp: new Date(log.created_at).getTime(),
          }]);
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [panelId]);

  const fetchSystemLogs = async () => {
    const { data } = await supabase.from('panel_logs').select('*').eq('panel_id', panelId).order('created_at', { ascending: true }).limit(50);
    setSystemLogs((data || []).map(log => ({
      id: `sys-${log.id}`,
      type: log.log_type === 'error' ? 'error' : log.log_type === 'success' ? 'success' : 'info',
      content: `[${log.log_type.toUpperCase()}] ${log.message}`,
      timestamp: new Date(log.created_at).getTime(),
    })));
  };

  /* ── App logs (PM2) ── */
  const fetchLogs = async () => {
    if (panelStatus !== 'running') return;
    setLoading(true);
    try {
      const result = await vmApi.getLogs(panelId, 100);
      const now = Date.now();
      const outLines: ConsoleLine[] = result.logs?.out
        ? result.logs.out.split('\n').map(cleanLine).filter(l => l && !isMetadataLine(l))
            .map((content, i) => ({ id: `out-${now}-${i}`, type: detectType(content), content, timestamp: now }))
        : [];
      const errLines: ConsoleLine[] = result.logs?.err
        ? result.logs.err.split('\n').map(cleanLine).filter(l => l && !isMetadataLine(l))
            .map((content, i) => ({ id: `err-${now}-${i}`, type: detectType(content), content, timestamp: now }))
        : [];
      setLogLines([...outLines, ...errLines]);
    } catch { /* keep existing */ }
    setLoading(false);
  };

  useEffect(() => {
    if (panelStatus === 'running') fetchLogs();
    else {
      setLogLines([{ id: 'welcome', type: 'info', content: 'Panel is not running. Start the panel to see output.', timestamp: Date.now() }]);
      setCmdLines([]);
    }
  }, [panelId, panelStatus]);

  useEffect(() => {
    if (!autoRefresh || panelStatus !== 'running') return;
    const interval = setInterval(fetchLogs, 3000);
    return () => clearInterval(interval);
  }, [autoRefresh, panelStatus, panelId]);

  useEffect(() => {
    consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight);
  }, [logLines, cmdLines, systemLogs]);

  /* ── Command/stdin handler ── */
  const handleSend = async (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setInput('');

    if (mode === 'shell') {
      /* ── Shell mode: run command ── */
      const inputLine: ConsoleLine = { id: `cmd-${Date.now()}`, type: 'input', content: `$ ${trimmed}`, timestamp: Date.now() };
      setCmdLines(prev => [...prev, inputLine]);

      if (trimmed === 'clear') { setLogLines([]); setCmdLines([]); return; }
      if (trimmed === 'help') {
        setCmdLines(prev => [...prev, { id: `help-${Date.now()}`, type: 'output', content: 'Commands: clear, help, or any shell command (ls, cat, pip install...)', timestamp: Date.now() }]);
        return;
      }

      setExecuting(true);
      try {
        const result = await vmApi.exec(panelId, trimmed);
        const combined = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
        if (combined) {
          setCmdLines(prev => [...prev, { id: `res-${Date.now()}`, type: result.stderr && !result.stdout ? 'error' : 'output', content: combined, timestamp: Date.now() }]);
        } else {
          setCmdLines(prev => [...prev, { id: `empty-${Date.now()}`, type: 'output', content: '(no output)', timestamp: Date.now() }]);
        }
      } catch (e: any) {
        setCmdLines(prev => [...prev, { id: `err-${Date.now()}`, type: 'error', content: `Error: ${e.message}`, timestamp: Date.now() }]);
      }
      setExecuting(false);

    } else {
      /* ── Stdin mode: queue the input for use with shell command ── */
      const newQueue = [...stdinQueue, trimmed];
      setStdinQueue(newQueue);
      setCmdLines(prev => [...prev, { id: `stdin-${Date.now()}`, type: 'stdin', content: `> queued: "${trimmed}"`, timestamp: Date.now() }]);
    }
  };

  /* ── Run with stdin queue ── */
  const runWithInputs = async () => {
    if (stdinQueue.length === 0) return;
    setExecuting(true);
    try {
      const pipedInput = stdinQueue.map(l => l.replace(/'/g, "'\\''")).join('\\n');
      const result = await vmApi.exec(panelId, `printf '${pipedInput}\\n'`);
      setCmdLines(prev => [...prev, {
        id: `run-${Date.now()}`, type: 'output',
        content: `[Stdin queue sent: ${stdinQueue.length} input(s)]`,
        timestamp: Date.now(),
      }]);
      if (result.stdout) {
        setCmdLines(prev => [...prev, { id: `stdout-${Date.now()}`, type: 'stdout', content: result.stdout, timestamp: Date.now() }]);
      }
    } catch (e: any) {
      setCmdLines(prev => [...prev, { id: `err-${Date.now()}`, type: 'error', content: e.message, timestamp: Date.now() }]);
    }
    setExecuting(false);
  };

  const clearConsole = async () => {
    try { await vmApi.clearLogs(panelId); await supabase.from('panel_logs').delete().eq('panel_id', panelId); } catch { }
    setLogLines([]); setSystemLogs([]); setCmdLines([]); setStdinQueue([]);
  };

  const allLines = [...systemLogs, ...logLines, ...cmdLines].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', background: '#08080f' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Terminal style={{ width: 15, height: 15, color: GREEN }} />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#ddddf5' }}>Console</span>
          {panelStatus === 'running' && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: autoRefresh ? `${GREEN}18` : `${MUTED}18`, color: autoRefresh ? GREEN : MUTED, fontFamily: 'monospace', fontWeight: 700 }}>
              {autoRefresh ? '● LIVE' : '⏸ PAUSED'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: autoRefresh ? GREEN : MUTED, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}
          >
            {autoRefresh ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={fetchLogs} disabled={loading || panelStatus !== 'running'}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}
          >
            <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <button
            onClick={clearConsole}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}
          >
            <Trash2 style={{ width: 13, height: 13 }} />
          </button>
        </div>
      </div>

      {/* Log output */}
      <div
        ref={consoleRef}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', fontFamily: '"Fira Code", "JetBrains Mono", monospace', fontSize: 12, lineHeight: 1.7, minHeight: 0 }}
        onClick={() => inputRef.current?.focus()}
      >
        {allLines.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: MUTED }}>
            <Terminal style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.25 }} />
            <div style={{ fontSize: 13 }}>Console ready</div>
            <div style={{ fontSize: 11, marginTop: 6, opacity: 0.6 }}>App output appears here</div>
          </div>
        ) : (
          allLines.map(line => (
            <div key={line.id} style={{ padding: '1px 0', whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: lineColor[line.type] || '#cccccc' }}>
              {line.content}
            </div>
          ))
        )}
      </div>

      {/* Mode tabs + input */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, background: CARD }}>

        {/* Mode selector */}
        <div style={{ display: 'flex', alignItems: 'center', borderBottom: `1px solid ${BORDER}`, padding: '0 12px' }}>
          {[
            { id: 'shell' as Mode, label: 'Shell', icon: Terminal, color: GREEN },
            { id: 'stdin' as Mode, label: 'App Input', icon: MessageSquare, color: '#a78bfa' },
          ].map(({ id, label, icon: Icon, color }) => (
            <button
              key={id}
              onClick={() => setMode(id)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', borderTop: 'none', borderLeft: 'none', borderRight: 'none', borderBottom: mode === id ? `2px solid ${color}` : '2px solid transparent', background: 'transparent', color: mode === id ? color : MUTED, fontSize: 11, fontFamily: 'monospace', fontWeight: mode === id ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s' }}
            >
              <Icon style={{ width: 12, height: 12 }} />
              {label}
            </button>
          ))}
          {mode === 'stdin' && (
            <button
              onClick={() => setShowStdinHelper(!showStdinHelper)}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', border: 'none', background: 'transparent', color: MUTED, fontSize: 10, cursor: 'pointer', fontFamily: 'monospace' }}
            >
              <Info style={{ width: 11, height: 11 }} />
              How it works
              {showStdinHelper ? <ChevronUp style={{ width: 10, height: 10 }} /> : <ChevronDown style={{ width: 10, height: 10 }} />}
            </button>
          )}
        </div>

        {/* Stdin helper info */}
        {mode === 'stdin' && showStdinHelper && (
          <div style={{ padding: '10px 14px', background: '#1a0a2e', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 11, color: '#a78bfa', fontFamily: 'monospace', marginBottom: 6, fontWeight: 700 }}>App Input Mode</div>
            <div style={{ fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
              Queue inputs your script needs. Then switch to Shell mode and pipe them when running your script.
              <br /><br />
              <span style={{ color: '#cccccc' }}>Example:</span> If your script asks "Enter name:" then "Enter age:", queue "John" and "25" here. Then in Shell mode run:<br />
              <span style={{ color: GREEN, fontFamily: 'monospace', display: 'block', marginTop: 4, padding: '4px 8px', background: '#00001a', borderRadius: 5 }}>
                $ printf 'John\n25\n' | python main.py
              </span>
              <br />
              Or copy the queue inputs and run your script interactively via Shell.
            </div>
          </div>
        )}

        {/* Stdin queue display */}
        {mode === 'stdin' && stdinQueue.length > 0 && (
          <div style={{ padding: '6px 14px', background: '#0f0a1a', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: 8, overflowX: 'auto' }}>
            <span style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', flexShrink: 0 }}>Queue:</span>
            {stdinQueue.map((item, i) => (
              <span key={i} style={{ fontSize: 10, background: '#a78bfa15', color: '#a78bfa', borderRadius: 5, padding: '2px 7px', fontFamily: 'monospace', border: '1px solid #a78bfa30', flexShrink: 0 }}>
                {i + 1}. {item}
              </span>
            ))}
            <button
              onClick={() => setStdinQueue([])}
              style={{ marginLeft: 'auto', fontSize: 10, color: MUTED, background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0, fontFamily: 'monospace' }}
            >
              clear
            </button>
          </div>
        )}

        {/* Input row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 14, color: mode === 'shell' ? GREEN : '#a78bfa', flexShrink: 0, fontWeight: 700 }}>
            {mode === 'shell' ? '$' : '>'}
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !executing) handleSend(input); }}
            placeholder={mode === 'shell' ? 'Enter command...' : 'Type input for your app...'}
            disabled={executing}
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: '"Fira Code", monospace', fontSize: 13, color: mode === 'shell' ? GREEN : '#a78bfa', padding: 0 }}
          />
          <button
            onClick={() => handleSend(input)}
            disabled={executing || !input.trim()}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, background: mode === 'shell' ? (input.trim() ? `${GREEN}20` : 'transparent') : (input.trim() ? '#a78bfa20' : 'transparent'), border: `1px solid ${input.trim() ? (mode === 'shell' ? `${GREEN}40` : '#a78bfa40') : BORDER}`, color: mode === 'shell' ? GREEN : '#a78bfa', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}
          >
            {executing ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Send style={{ width: 13, height: 13 }} />}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { vmApi } from '@/lib/vmApi';
import { Loader2, ChevronDown, Square, RotateCcw } from 'lucide-react';

interface Props {
  panelId: string;
}

/* ── ANSI strip ────────────────────────────────────────────────── */
const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
   .replace(/\x1b[()][AB012]/g, '')
   .replace(/\x1b[=>]/g, '')
   .replace(/\r\n/g, '\n')
   .replace(/\r/g, '\n');

/* ── Safe base64 encode (handles UTF-8) ────────────────────────── */
const b64 = (str: string): string => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch { return btoa(str); }
};

/* ── Palette ───────────────────────────────────────────────────── */
const BG    = '#0d1117';
const BAR   = '#161b22';
const BORD  = '#21262d';
const GREEN = '#3fb950';
const BLUE  = '#58a6ff';
const MUTED = '#8b949e';
const DIM   = '#484f58';

export function InteractiveTerminal({ panelId }: Props) {
  const sessionId = `pt${panelId.replace(/-/g, '').slice(0, 12)}`;

  const [output, setOutput]     = useState<string[]>([]);
  const [input, setInput]       = useState('');
  const [ready, setReady]       = useState(false);
  const [sending, setSending]   = useState(false);
  const [history, setHistory]   = useState<string[]>([]);
  const [histIdx, setHistIdx]   = useState(-1);
  const [histBuf, setHistBuf]   = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [status, setStatus]     = useState<'init' | 'ready' | 'error'>('init');

  const bodyRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRaw  = useRef('');
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  /* ── Run a shell command on the VM ── */
  const run = async (cmd: string): Promise<string> => {
    try {
      const res = await vmApi.exec(panelId, cmd);
      return ((res.stdout || '') + (res.stderr ? '\n' + res.stderr : '')).trim();
    } catch { return ''; }
  };

  /* ── Initialize tmux session ── */
  const initSession = useCallback(async () => {
    setStatus('init');
    setOutput(['Initializing terminal…']);
    // create session if it doesn't exist, attach a bash shell
    await run(`tmux new-session -d -s ${sessionId} 2>/dev/null; true`);
    // verify it exists
    const check = await run(`tmux has-session -t ${sessionId} 2>&1 && echo OK`);
    if (!check.includes('OK')) {
      setOutput(['⚠ Could not create terminal session.', 'Make sure tmux is available on the VM.']);
      setStatus('error');
      return;
    }
    setStatus('ready');
    setReady(true);
    setOutput(['Terminal ready. Type commands below.', `Session: ${sessionId}`, '─'.repeat(40)]);
    lastRaw.current = '';
    inputRef.current?.focus();
  }, [panelId, sessionId]);

  /* ── Poll tmux pane output ── */
  const poll = useCallback(async () => {
    if (!ready) return;
    const raw = await run(
      `tmux capture-pane -t ${sessionId} -p -S -500 2>/dev/null`
    );
    if (raw === lastRaw.current) return;
    lastRaw.current = raw;
    const cleaned = stripAnsi(raw);
    const lines = cleaned.split('\n');
    // trim trailing blank lines
    while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
    setOutput(lines);
    if (atBottom && bodyRef.current) {
      setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 30);
    }
  }, [ready, sessionId, atBottom]);

  /* ── Lifecycle ── */
  useEffect(() => { initSession(); }, [panelId]);

  useEffect(() => {
    if (!ready) return;
    pollRef.current = setInterval(poll, 700);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [ready, poll]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (atBottom && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [output, atBottom]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  /* ── Send input ── */
  const sendInput = async (text: string) => {
    if (!ready || sending) return;
    setSending(true);
    try {
      // base64 encode the input to safely handle quotes and special chars
      const encoded = b64(text + '\n');
      const cmd = `echo "${encoded}" | base64 -d | tmux load-buffer - && tmux paste-buffer -t ${sessionId}`;
      await run(cmd);
      // record in history
      if (text.trim()) setHistory(h => [text, ...h.slice(0, 99)]);
      setHistIdx(-1);
      setHistBuf('');
    } catch { /* ignore */ }
    setSending(false);
    // force poll immediately
    setTimeout(poll, 200);
  };

  /* ── Send Ctrl key ── */
  const sendCtrl = async (key: string) => {
    if (!ready) return;
    await run(`tmux send-keys -t ${sessionId} ${key}`);
    setTimeout(poll, 200);
  };

  /* ── Key handling ── */
  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending) {
      e.preventDefault();
      const val = input;
      setInput('');
      await sendInput(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      if (histIdx === -1) setHistBuf(input);
      const next = Math.min(histIdx + 1, history.length - 1);
      setHistIdx(next); setInput(history[next]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setInput(histBuf); return; }
      const next = histIdx - 1; setHistIdx(next); setInput(history[next]);
    } else if (e.ctrlKey && e.key === 'c') {
      e.preventDefault(); await sendCtrl('C-c');
    } else if (e.ctrlKey && e.key === 'd') {
      e.preventDefault(); await sendCtrl('C-d');
    }
  };

  /* ── Color a terminal output line ── */
  const lineColor = (line: string): string => {
    if (!line.trim()) return DIM;
    const l = line.toLowerCase();
    if (/error|traceback|exception|failed|fatal/i.test(l)) return '#f87171';
    if (/warning|warn/i.test(l)) return '#fbbf24';
    if (/^\s*\$\s/.test(line)) return GREEN;
    if (/success|ok\b|done|complete/i.test(l)) return '#4ade80';
    return '#e5e7eb';
  };

  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, fontFamily: '"JetBrains Mono","Fira Code","Cascadia Code","Consolas",monospace', minHeight: 0 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `1px solid ${BORD}`, background: BAR, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: ready ? '#27c93f' : '#444' }} />
          </div>
          <span style={{ fontSize: 11, color: MUTED, letterSpacing: 0.3 }}>
            {status === 'init' ? 'connecting…' : status === 'error' ? 'error' : `${sessionId} — interactive`}
          </span>
          {status === 'init' && <Loader2 style={{ width: 11, height: 11, color: BLUE, animation: 'spin 1s linear infinite' }} />}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Ctrl+C */}
          <button
            onClick={e => { e.stopPropagation(); sendCtrl('C-c'); }}
            title="Ctrl+C — interrupt"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: '#f87171', fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}
          >
            <Square style={{ width: 9, height: 9 }} /> Ctrl+C
          </button>
          {/* Reconnect */}
          <button
            onClick={e => { e.stopPropagation(); setReady(false); initSession(); }}
            title="Reconnect session"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: MUTED, fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}
          >
            <RotateCcw style={{ width: 9, height: 9 }} /> Reconnect
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      <div
        ref={bodyRef}
        onScroll={onScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.65, fontSize: 12.5, minHeight: 0, position: 'relative' }}
      >
        {status === 'error' && (
          <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
            <p style={{ color: '#f87171', fontSize: 12, margin: 0, fontWeight: 600 }}>Terminal unavailable</p>
            <p style={{ color: MUTED, fontSize: 11, margin: '4px 0 0' }}>tmux is not installed on this VM. Contact support to enable interactive terminals.</p>
          </div>
        )}
        {output.map((line, i) => (
          <div key={i} style={{ color: lineColor(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingBottom: 1, minHeight: '1em' }}>
            {line || ' '}
          </div>
        ))}
        {/* blinking cursor when idle */}
        {ready && !sending && (
          <span style={{ display: 'inline-block', width: 8, height: 14, background: GREEN, opacity: 0.7, animation: 'blink 1s step-end infinite', verticalAlign: 'text-bottom', marginLeft: 1 }} />
        )}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <Loader2 style={{ width: 11, height: 11, color: GREEN, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: DIM }}>sending…</span>
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom ── */}
      {!atBottom && (
        <button
          onClick={() => { if (bodyRef.current) { bodyRef.current.scrollTop = bodyRef.current.scrollHeight; } setAtBottom(true); }}
          style={{ position: 'absolute', right: 16, bottom: 60, width: 28, height: 28, borderRadius: '50%', background: '#21262d', border: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED }}
        >
          <ChevronDown style={{ width: 13, height: 13 }} />
        </button>
      )}

      {/* ── Input row ── */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BORD}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: BAR }}>
        <span style={{ color: GREEN, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>❯</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={!ready ? 'connecting…' : sending ? '' : 'type command or answer…'}
          disabled={!ready || sending}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e6edf3', fontFamily: 'inherit', caretColor: GREEN }}
        />
        {sending && <Loader2 style={{ width: 12, height: 12, color: GREEN, flexShrink: 0, animation: 'spin 1s linear infinite' }} />}
      </div>

      {/* CSS for blink animation */}
      <style>{`
        @keyframes blink { 0%,100%{opacity:0.7} 50%{opacity:0} }
      `}</style>
    </div>
  );
}

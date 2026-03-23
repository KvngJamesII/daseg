import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, Square, RotateCcw } from 'lucide-react';

interface Props { panelId: string; }

/* ── ANSI strip ────────────────────────────────────────────────── */
const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')
   .replace(/\x1b[()][AB012]/g, '')
   .replace(/\r\n/g, '\n').replace(/\r/g, '\n');

/* ── UTF-8 safe base64 encode ───────────────────────────────────── */
const b64 = (str: string): string => {
  try {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p1) => String.fromCharCode(parseInt(p1, 16))));
  } catch { return btoa(unescape(encodeURIComponent(str))); }
};

/* ── Palette ────────────────────────────────────────────────────── */
const BG    = '#0d1117';
const BAR   = '#161b22';
const BORD  = '#21262d';
const GREEN = '#3fb950';
const BLUE  = '#58a6ff';
const MUTED = '#8b949e';
const DIM   = '#484f58';

/* ── Low-level exec — returns { ok, out } ───────────────────────── */
async function exec(panelId: string, command: string): Promise<{ ok: boolean; out: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('vm-proxy', {
      body: { action: 'terminal:exec', panelId, command },
    });
    if (error || data?.error) return { ok: false, out: data?.error || error?.message || '' };
    return {
      ok: true,
      out: ((data?.stdout || '') + (data?.stderr ? '\n' + data.stderr : '')).trim(),
    };
  } catch (e: any) {
    return { ok: false, out: e?.message || '' };
  }
}

/* ════════════════════════════════════════════════════════════════ */
export function InteractiveTerminal({ panelId }: Props) {
  const sid = `pt${panelId.replace(/-/g, '').slice(0, 12)}`;

  const [output, setOutput]     = useState<string[]>([]);
  const [input, setInput]       = useState('');
  const [ready, setReady]       = useState(false);
  const [sending, setSending]   = useState(false);
  const [history, setHistory]   = useState<string[]>([]);
  const [histIdx, setHistIdx]   = useState(-1);
  const [histBuf, setHistBuf]   = useState('');
  const [atBottom, setAtBottom] = useState(true);
  const [statusLabel, setStatusLabel] = useState<'init'|'ready'|'error'>('init');

  const bodyRef  = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastRaw  = useRef('');
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const readyRef = useRef(false);

  const addLine = (line: string) => setOutput(prev => [...prev, line]);

  /* ── Initialize tmux session ────────────────────────────────── */
  const initSession = useCallback(async () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    readyRef.current = false;
    setReady(false);
    setStatusLabel('init');
    setOutput(['Connecting to terminal…']);
    lastRaw.current = '';

    // Step 1 — confirm tmux is reachable with a version check
    let ver = await exec(panelId, 'tmux -V');

    // Not found — try to auto-install inside the container
    if (!ver.ok) {
      setOutput(['tmux not found — installing inside container…']);
      const install = await exec(panelId, 'apt-get install -y --no-install-recommends tmux');
      if (!install.ok) {
        setOutput([
          '⚠  Could not install tmux automatically.',
          'Debug: ' + (install.out || ver.out || '(no message)'),
          '',
          '── Try these steps ──────────────────────────',
          '1. Make sure your panel is STARTED (not stopped)',
          '2. Go to the Logs tab and run:',
          '     apt-get install -y tmux',
          '3. Come back here and press Reconnect',
        ]);
        setStatusLabel('error');
        return;
      }
      // retry after install
      ver = await exec(panelId, 'tmux -V');
      if (!ver.ok) {
        setOutput([
          '⚠  Installed tmux but still cannot run it.',
          'Debug: ' + (ver.out || '(no message)'),
          '',
          'Press Reconnect to try again.',
        ]);
        setStatusLabel('error');
        return;
      }
    }

    setOutput(['tmux ' + ver.out + ' — creating session…']);

    // Step 2 — kill old session (may exit non-zero if not exists; that's ok — we ignore)
    await exec(panelId, `tmux kill-session -t ${sid}`);
    // small delay so tmux cleans up
    await new Promise(r => setTimeout(r, 300));

    // Step 3 — create session
    const create = await exec(panelId, `TERM=xterm-256color tmux new-session -d -s ${sid} -x 200 -y 50`);
    if (!create.ok) {
      setOutput([
        '⚠  Could not create tmux session.',
        'Error: ' + (create.out || '(unknown)'),
        '',
        'Try pressing Reconnect.',
      ]);
      setStatusLabel('error');
      return;
    }

    // Step 4 — verify session listed
    const list = await exec(panelId, `tmux list-sessions`);
    if (!list.ok || !list.out.includes(sid)) {
      setOutput([
        '⚠  Session created but not found in list.',
        'Sessions: ' + (list.out || '(empty)'),
        'Try pressing Reconnect.',
      ]);
      setStatusLabel('error');
      return;
    }

    setOutput([
      'Terminal ready — session: ' + sid,
      'Type commands below. Ctrl+C to interrupt.',
      '─'.repeat(44),
    ]);
    setStatusLabel('ready');
    readyRef.current = true;
    setReady(true);
    inputRef.current?.focus();

    // Start polling
    pollRef.current = setInterval(doPoll, 800);
  }, [panelId, sid]);

  /* ── Poll tmux pane ─────────────────────────────────────────── */
  const doPoll = useCallback(async () => {
    if (!readyRef.current) return;
    const res = await exec(panelId, `TERM=xterm-256color tmux capture-pane -t ${sid} -p -S -300`);
    if (!res.ok) return; // session may have been killed; just skip
    if (res.out === lastRaw.current) return;
    lastRaw.current = res.out;
    const lines = stripAnsi(res.out).split('\n');
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    setOutput(lines.length ? lines : ['(empty pane)']);
    if (atBottom && bodyRef.current) {
      setTimeout(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, 30);
    }
  }, [panelId, sid, atBottom]);

  /* ── Lifecycle ── */
  useEffect(() => { initSession(); return () => { if (pollRef.current) clearInterval(pollRef.current); }; }, [panelId]);

  /* ── Auto-scroll ── */
  useEffect(() => {
    if (atBottom && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [output]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (!el) return;
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  /* ── Send text input ────────────────────────────────────────── */
  const sendInput = async (text: string) => {
    if (!readyRef.current || sending) return;
    setSending(true);
    // base64 encode → pipe to tmux load-buffer → paste into session
    const encoded = b64(text + '\n');
    const cmd = `echo "${encoded}" | base64 -d | tmux load-buffer - && tmux paste-buffer -t ${sid}`;
    const res = await exec(panelId, cmd);
    if (!res.ok) {
      addLine('⚠ Send failed: ' + (res.out || 'unknown error'));
    }
    if (text.trim()) setHistory(h => [text, ...h.slice(0, 99)]);
    setHistIdx(-1); setHistBuf('');
    setSending(false);
    setTimeout(doPoll, 300);
  };

  /* ── Send ctrl key ── */
  const sendCtrl = async (key: string) => {
    if (!readyRef.current) return;
    await exec(panelId, `TERM=xterm-256color tmux send-keys -t ${sid} ${key}`);
    setTimeout(doPoll, 300);
  };

  /* ── Keyboard ── */
  const onKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !sending) {
      e.preventDefault(); const val = input; setInput(''); await sendInput(val);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      if (histIdx === -1) setHistBuf(input);
      const n = Math.min(histIdx + 1, history.length - 1); setHistIdx(n); setInput(history[n]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setInput(histBuf); return; }
      const n = histIdx - 1; setHistIdx(n); setInput(history[n]);
    } else if (e.ctrlKey && e.key === 'c') { e.preventDefault(); await sendCtrl('C-c'); }
    else if (e.ctrlKey && e.key === 'd') { e.preventDefault(); await sendCtrl('C-d'); }
  };

  /* ── Line color ── */
  const lineColor = (line: string) => {
    if (!line.trim()) return DIM;
    if (/error|traceback|exception|failed|fatal/i.test(line)) return '#f87171';
    if (/warning|warn/i.test(line)) return '#fbbf24';
    if (/^\s*([$#])\s/.test(line)) return GREEN;
    if (/success|ok\b|done|complete/i.test(line)) return '#4ade80';
    return '#e5e7eb';
  };

  /* ══════════════════ RENDER ══════════════════════════════════ */
  return (
    <div
      style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, fontFamily: '"JetBrains Mono","Fira Code","Consolas",monospace', minHeight: 0 }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `1px solid ${BORD}`, background: BAR, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f56','#ffbd2e', ready ? '#27c93f' : '#555'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: MUTED, letterSpacing: 0.3 }}>
            {statusLabel === 'init' ? 'connecting…' : statusLabel === 'error' ? 'unavailable' : `${sid} — bash`}
          </span>
          {statusLabel === 'init' && <Loader2 style={{ width: 11, height: 11, color: BLUE, animation: 'spin 1s linear infinite' }} />}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); sendCtrl('C-c'); }} disabled={!ready}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: ready ? '#f87171' : '#555', fontSize: 10.5, cursor: ready ? 'pointer' : 'default', fontFamily: 'monospace', fontWeight: 600 }}>
            <Square style={{ width: 9, height: 9 }} /> Ctrl+C
          </button>
          <button onClick={e => { e.stopPropagation(); setReady(false); readyRef.current = false; initSession(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: MUTED, fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
            <RotateCcw style={{ width: 9, height: 9 }} /> Reconnect
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      <div ref={bodyRef} onScroll={onScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.65, fontSize: 12.5, minHeight: 0 }}>
        {output.map((line, i) => (
          <div key={i} style={{ color: lineColor(line), whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingBottom: 1, minHeight: '1em' }}>
            {line || ' '}
          </div>
        ))}
        {ready && !sending && (
          <span style={{ display: 'inline-block', width: 7, height: 13, background: GREEN, opacity: 0.7, animation: 'termBlink 1s step-end infinite', verticalAlign: 'text-bottom', marginLeft: 1 }} />
        )}
        {sending && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingTop: 4 }}>
            <Loader2 style={{ width: 11, height: 11, color: GREEN, animation: 'spin 1s linear infinite' }} />
            <span style={{ fontSize: 11, color: DIM }}>sending…</span>
          </div>
        )}
      </div>

      {/* ── Scroll button ── */}
      {!atBottom && (
        <button onClick={() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; setAtBottom(true); }}
          style={{ position: 'absolute', right: 16, bottom: 56, width: 28, height: 28, borderRadius: '50%', background: '#21262d', border: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED }}>
          <ChevronDown style={{ width: 13, height: 13 }} />
        </button>
      )}

      {/* ── Input row ── */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BORD}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: BAR }}>
        <span style={{ color: GREEN, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>❯</span>
        <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKeyDown}
          placeholder={!ready ? 'connecting…' : sending ? '' : 'type command or answer…'}
          disabled={!ready || sending} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e6edf3', fontFamily: 'inherit', caretColor: GREEN }} />
        {sending && <Loader2 style={{ width: 12, height: 12, color: GREEN, animation: 'spin 1s linear infinite' }} />}
      </div>

      <style>{`@keyframes termBlink { 0%,100%{opacity:0.7} 50%{opacity:0} }`}</style>
    </div>
  );
}

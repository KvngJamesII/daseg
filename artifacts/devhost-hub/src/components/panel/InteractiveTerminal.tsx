import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ChevronDown, Play, Trash2, FolderOpen, Info } from 'lucide-react';

interface Props {
  panelId: string;
  isRunning?: boolean;
  onStart?: () => void;
  actionLoading?: boolean;
}

/* ── ANSI strip ───────────────────────────────────────────────── */
const stripAnsi = (s: string) =>
  s.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\r/g, '').trim();

/* ── Low-level exec ───────────────────────────────────────────── */
async function execCmd(panelId: string, command: string): Promise<{ ok: boolean; out: string; err: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('vm-proxy', {
      body: { action: 'terminal:exec', panelId, command },
    });
    if (error) return { ok: false, out: '', err: error.message || 'exec failed' };
    if (data?.error) return { ok: false, out: '', err: data.error };
    return {
      ok: true,
      out: stripAnsi(data?.stdout || ''),
      err: stripAnsi(data?.stderr || ''),
    };
  } catch (e: any) {
    return { ok: false, out: '', err: e?.message || 'unknown error' };
  }
}

/* ── Palette ──────────────────────────────────────────────────── */
const BG    = '#0d1117';
const CARD  = '#161b22';
const BORD  = '#21262d';
const GREEN = '#3fb950';
const BLUE  = '#58a6ff';
const MUTED = '#8b949e';
const DIM   = '#484f58';
const AMBER = '#f0a726';

interface ShellLine {
  id: string;
  type: 'cmd' | 'out' | 'err' | 'sys' | 'info';
  text: string;
}

const mk = (type: ShellLine['type'], text: string): ShellLine =>
  ({ id: `${Date.now()}-${Math.random()}`, type, text });

/* ════════════════════════════════════════════════════════════════ */
export function InteractiveTerminal({ panelId, isRunning = false, onStart, actionLoading = false }: Props) {
  const [lines, setLines]     = useState<ShellLine[]>([]);
  const [cmd, setCmd]         = useState('');
  const [stdin, setStdin]     = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [cwd, setCwd]         = useState('~');
  const [running, setRunning] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [histBuf, setHistBuf] = useState('');
  const [atBottom, setAtBottom] = useState(true);

  const bodyRef  = useRef<HTMLDivElement>(null);
  const cmdRef   = useRef<HTMLInputElement>(null);
  const stdinRef = useRef<HTMLTextAreaElement>(null);

  const push = (...items: ShellLine[]) => setLines(prev => [...prev, ...items]);

  /* ── init: get real cwd ── */
  useEffect(() => {
    if (!isRunning) { setLines([]); setCwd('~'); return; }
    setLines([
      mk('sys', '── Smart Shell ─────────────────────────────'),
      mk('info', 'Commands run inside your panel container.'),
      mk('info', 'Use the stdin field ↓ to send input to scripts.'),
      mk('sys', '─────────────────────────────────────────────'),
    ]);
    execCmd(panelId, 'pwd').then(r => { if (r.ok && r.out) setCwd(r.out); });
    setTimeout(() => cmdRef.current?.focus(), 100);
  }, [panelId, isRunning]);

  /* ── auto-scroll ── */
  useEffect(() => {
    if (atBottom && bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [lines]);

  const onScroll = () => {
    const el = bodyRef.current;
    if (el) setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 40);
  };

  /* ── run command ── */
  const run = async () => {
    const trimmed = cmd.trim();
    if (!trimmed || running) return;
    setRunning(true);
    setCmd('');
    setHistIdx(-1);
    setHistBuf('');
    setHistory(h => [trimmed, ...h.slice(0, 99)]);

    // Track cd commands
    const cdMatch = trimmed.match(/^cd\s+(.+)$/);

    // Build the actual command to exec
    let execCommand: string;
    const hasStdin = showStdin && stdin.trim();

    if (cdMatch) {
      // cd: change directory
      const target = cdMatch[1].trim();
      const newDir = target.startsWith('/') ? target :
                     target === '..' ? cwd.split('/').slice(0, -1).join('/') || '/' :
                     target === '~' ? '~' :
                     cwd === '~' ? `~/${target}` : `${cwd}/${target}`;
      push(mk('cmd', `${cwd} $ ${trimmed}`));
      const res = await execCmd(panelId, `cd ${newDir} && pwd`);
      if (res.ok && res.out) {
        setCwd(res.out);
        push(mk('out', `→ ${res.out}`));
      } else {
        push(mk('err', res.err || 'No such directory'));
      }
      setRunning(false);
      return;
    }

    if (hasStdin) {
      // Pipe stdin through echo -e
      const escapedStdin = stdin.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
      const prefix = cwd !== '~' ? `cd ${cwd} && ` : '';
      execCommand = `${prefix}printf "${escapedStdin}\\n" | ${trimmed}`;
      push(mk('cmd', `${cwd} $ ${trimmed} [stdin: ${stdin.split('\n').length} line(s)]`));
    } else {
      const prefix = cwd !== '~' ? `cd ${cwd} && ` : '';
      execCommand = `${prefix}${trimmed}`;
      push(mk('cmd', `${cwd} $ ${trimmed}`));
    }

    const res = await execCmd(panelId, execCommand);
    if (res.out) push(...res.out.split('\n').filter(Boolean).map(l => mk('out', l)));
    if (res.err) push(...res.err.split('\n').filter(Boolean).map(l => mk('err', l)));
    if (!res.ok && !res.out && !res.err) push(mk('err', 'Command failed (non-zero exit)'));
    if (res.ok && !res.out && !res.err) push(mk('sys', '(no output)'));

    setRunning(false);
    setTimeout(() => cmdRef.current?.focus(), 50);
  };

  /* ── keyboard ── */
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); run(); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      if (histIdx === -1) setHistBuf(cmd);
      const n = Math.min(histIdx + 1, history.length - 1); setHistIdx(n); setCmd(history[n]);
    }
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx <= 0) { setHistIdx(-1); setCmd(histBuf); return; }
      const n = histIdx - 1; setHistIdx(n); setCmd(history[n]);
    }
  };

  /* ── line style ── */
  const lineStyle = (t: ShellLine['type']) => ({
    cmd:  { color: GREEN,  fontWeight: 600 },
    out:  { color: '#e6edf3' },
    err:  { color: '#f87171' },
    sys:  { color: DIM,    fontSize: 11 },
    info: { color: MUTED,  fontSize: 11.5 },
  }[t] ?? { color: '#e6edf3' });

  /* ── gate: panel not running ── */
  if (!isRunning) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: BG, gap: 16, padding: 32 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', background: '#1a1f2e', border: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={BLUE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#e6edf3', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Terminal requires a running panel</div>
          <div style={{ color: MUTED, fontSize: 12.5, lineHeight: 1.6 }}>Start your panel to open a shell inside its container.</div>
        </div>
        <button onClick={onStart} disabled={actionLoading || !onStart}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 20px', borderRadius: 8, border: 'none', background: GREEN, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: actionLoading ? 0.6 : 1 }}>
          {actionLoading ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 13, height: 13 }} />}
          {actionLoading ? 'Starting…' : 'Start Panel'}
        </button>
      </div>
    );
  }

  /* ══════════════════ RENDER ══════════════════════════════════ */
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: BG, fontFamily: '"JetBrains Mono","Fira Code","Consolas",monospace', minHeight: 0 }}
      onClick={() => cmdRef.current?.focus()}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: `1px solid ${BORD}`, background: CARD, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          <span style={{ fontSize: 11, color: MUTED, letterSpacing: 0.3 }}>
            shell — {cwd}
          </span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={e => { e.stopPropagation(); setShowStdin(s => !s); }}
            title="Toggle stdin input"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${showStdin ? BLUE : BORD}`, background: showStdin ? 'rgba(88,166,255,0.1)' : 'transparent', color: showStdin ? BLUE : MUTED, fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
            <Info style={{ width: 9, height: 9 }} /> stdin
          </button>
          <button onClick={e => { e.stopPropagation(); setLines([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: MUTED, fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
            <Trash2 style={{ width: 9, height: 9 }} /> clear
          </button>
          <button onClick={e => { e.stopPropagation(); execCmd(panelId, 'pwd').then(r => { if (r.ok && r.out) setCwd(r.out); }); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 5, border: `1px solid ${BORD}`, background: 'transparent', color: MUTED, fontSize: 10.5, cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
            <FolderOpen style={{ width: 9, height: 9 }} /> pwd
          </button>
        </div>
      </div>

      {/* ── Output ── */}
      <div ref={bodyRef} onScroll={onScroll}
        style={{ flex: 1, overflowY: 'auto', padding: '10px 14px', lineHeight: 1.7, fontSize: 12.5, minHeight: 0 }}>
        {lines.map(l => (
          <div key={l.id} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', paddingBottom: 1, minHeight: '1.1em', ...lineStyle(l.type) }}>
            {l.text || ' '}
          </div>
        ))}
        {running && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: DIM, fontSize: 11.5, paddingTop: 4 }}>
            <Loader2 style={{ width: 11, height: 11, animation: 'spin 1s linear infinite' }} /> running…
          </div>
        )}
      </div>

      {/* ── Scroll-to-bottom ── */}
      {!atBottom && (
        <button onClick={() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; setAtBottom(true); }}
          style={{ position: 'absolute', right: 16, bottom: showStdin ? 140 : 56, width: 28, height: 28, borderRadius: '50%', background: '#21262d', border: `1px solid ${BORD}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED }}>
          <ChevronDown style={{ width: 13, height: 13 }} />
        </button>
      )}

      {/* ── Stdin panel (shown when toggled) ── */}
      {showStdin && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${BORD}`, padding: '8px 12px', background: 'rgba(240,167,38,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
            <span style={{ fontSize: 10.5, color: AMBER, fontWeight: 600 }}>STDIN</span>
            <span style={{ fontSize: 10.5, color: DIM }}>— typed here will be piped into your command (one answer per line)</span>
          </div>
          <textarea
            ref={stdinRef}
            value={stdin}
            onChange={e => setStdin(e.target.value)}
            placeholder={'e.g. John\n25\nyes'}
            rows={3}
            style={{ width: '100%', resize: 'vertical', background: '#0d1117', border: `1px solid ${AMBER}33`, borderRadius: 5, padding: '6px 8px', fontSize: 12, color: '#e6edf3', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
          />
        </div>
      )}

      {/* ── Command input row ── */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${BORD}`, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8, background: CARD }}>
        <span style={{ color: GREEN, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>❯</span>
        <input ref={cmdRef} value={cmd} onChange={e => setCmd(e.target.value)} onKeyDown={onKeyDown}
          placeholder={running ? 'running…' : 'type a command…'}
          disabled={running} autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#e6edf3', fontFamily: 'inherit', caretColor: GREEN }} />
        {running
          ? <Loader2 style={{ width: 13, height: 13, color: GREEN, animation: 'spin 1s linear infinite' }} />
          : <button onClick={run} disabled={!cmd.trim()}
              style={{ padding: '3px 10px', borderRadius: 5, border: `1px solid ${BORD}`, background: cmd.trim() ? GREEN : 'transparent', color: cmd.trim() ? '#000' : DIM, fontSize: 11, cursor: cmd.trim() ? 'pointer' : 'default', fontWeight: 700 }}>
              Run
            </button>
        }
      </div>
    </div>
  );
}

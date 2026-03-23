/* Panel Page — Variant B: 2×2 compact metric cards with SVG icons + expand console */

const BG     = '#0c0c0f';
const CARD   = '#141418';
const BORDER = 'rgba(255,255,255,0.07)';
const GREEN  = '#22c55e';
const AMBER  = '#fbbf24';
const BLUE   = '#60a5fa';
const MUTED  = 'rgba(255,255,255,0.35)';
const DIM    = 'rgba(255,255,255,0.08)';

/* ── SVG icons ── */
const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 12H5M12 5l-7 7 7 7"/>
  </svg>
);
const IconPlay = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5,3 19,12 5,21"/>
  </svg>
);
const IconRestart = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);
const IconStop = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
  </svg>
);
const IconCpu = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="4" width="16" height="16" rx="2"/>
    <rect x="8" y="8" width="8" height="8"/>
    <path d="M9 4V2M15 4V2M9 22v-2M15 22v-2M4 9H2M4 15H2M22 9h-2M22 15h-2"/>
  </svg>
);
const IconRam = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="8" width="20" height="10" rx="2"/>
    <path d="M6 8V6M10 8V6M14 8V6M18 8V6M6 18v2M10 18v2M14 18v2M18 18v2"/>
  </svg>
);
const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);
const IconRotate = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
    <path d="M3 3v5h5"/>
  </svg>
);
const IconTerminal = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);
const IconFolder = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IconSettings = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IconExpand = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3"/>
  </svg>
);
const IconPause = () => (
  <svg width="9" height="9" viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="4" width="4" height="16" rx="1"/>
    <rect x="14" y="4" width="4" height="16" rx="1"/>
  </svg>
);

/* ── Compact bar gauge ── */
function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ width: '100%', height: 3, borderRadius: 2, background: DIM, overflow: 'hidden', marginTop: 7 }}>
      <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: color }} />
    </div>
  );
}

/* ── Single metric card ── */
function MetCard({ label, value, sub, color, pct, accent, Icon }: {
  label: string; value: string; sub: string; color: string; pct: number; accent: string;
  Icon: () => JSX.Element;
}) {
  return (
    <div style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px 9px', position: 'relative', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2.5, borderRadius: '12px 0 0 12px', background: accent }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sub}</div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0, marginLeft: 6 }}>
          <Icon />
        </div>
      </div>
      <Bar pct={pct} color={color} />
    </div>
  );
}

const tabs = [
  { label: 'Console',  Icon: IconTerminal, isConsole: true },
  { label: 'Files',    Icon: IconFolder },
  { label: 'Startup',  Icon: IconPlay },
  { label: 'Settings', Icon: IconSettings },
];

export default function PanelVariantB() {
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
        <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <IconArrowLeft />
        </button>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 11, color: GREEN }}>PY</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>my-flask-api</div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>Python · Expires Apr 23</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 10.5, fontWeight: 700, color: GREEN, flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: GREEN, boxShadow: `0 0 5px ${GREEN}` }} />
          Online
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 7 }}>
        <button style={{ flex: 1, height: 38, borderRadius: 10, border: 'none', background: GREEN, color: '#000', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <IconPlay /> Start
        </button>
        <button style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: '#fff', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <IconRestart /> Restart
        </button>
        <button style={{ flex: 1, height: 38, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontWeight: 600, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
          <IconStop /> Stop
        </button>
      </div>

      {/* 2×2 compact metric cards */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <MetCard label="CPU" value="34%" sub="of vCPU" color={BLUE} pct={34} accent={BLUE} Icon={IconCpu} />
          <MetCard label="RAM" value="178 MB" sub="of 512 MB" color={GREEN} pct={35} accent={GREEN} Icon={IconRam} />
        </div>
        <div style={{ display: 'flex', gap: 7 }}>
          <MetCard label="Uptime" value="3h 22m" sub="running" color={GREEN} pct={100} accent={GREEN} Icon={IconClock} />
          <MetCard label="Restarts" value="2" sub="total" color={AMBER} pct={20} accent={AMBER} Icon={IconRotate} />
        </div>
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}` }}>
        {tabs.map((t, i) => (
          <button key={t.label} style={{
            padding: '10px 13px', fontSize: 12.5, fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? GREEN : MUTED, background: 'none', border: 'none',
            borderBottom: i === 0 ? `2px solid ${GREEN}` : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <t.Icon />
            {t.label}
            {t.isConsole && (
              <span style={{ marginLeft: 1, opacity: 0.45, display: 'flex', alignItems: 'center' }} title="Expand to full screen">
                <IconExpand />
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Console body */}
      <div style={{ background: '#0d1117', margin: '10px 12px', borderRadius: 11, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ padding: '7px 10px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8, background: '#161b22' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />)}
          </div>
          <span style={{ fontSize: 10.5, color: '#6b7280', fontFamily: 'monospace', flex: 1 }}>panel — bash</span>
          <div style={{ display: 'flex', gap: 5 }}>
            <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '2px 7px', fontSize: 10, borderRadius: 4, border: '1px solid #238636', background: 'rgba(35,134,54,0.12)', color: '#3fb950', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>
              <IconPause /> Pause
            </button>
            <button style={{ padding: '2px 7px', fontSize: 10, borderRadius: 4, border: '1px solid #30363d', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>Clear</button>
          </div>
        </div>
        <div style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.65 }}>
          <div style={{ color: '#60a5fa' }}>[INFO] Starting deployment…</div>
          <div style={{ color: '#22c55e' }}>[SUCCESS] Started on port 3000 (main.py)</div>
          <div style={{ color: '#d1d5db' }}>* Serving Flask app 'main'</div>
          <div style={{ color: '#d1d5db' }}>* Running on http://0.0.0.0:3000</div>
          <div style={{ color: '#34d399', marginTop: 6 }}>$ pip list | grep flask</div>
          <div style={{ color: '#e5e7eb' }}>Flask     3.0.3</div>
          <div style={{ color: '#34d399', marginTop: 4 }}>$ _</div>
        </div>
      </div>
    </div>
  );
}

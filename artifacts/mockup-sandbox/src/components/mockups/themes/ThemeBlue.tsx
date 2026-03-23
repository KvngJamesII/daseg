const A = '#2563eb';   // electric blue
const A2 = '#60a5fa';  // sky blue
const BG = '#080c14';  // deep dark blue-black
const CARD = '#0d1220';
const CARD2 = '#111827';
const BORDER = '#1e2a3d';
const MUTED = '#4b6280';
const FG = '#e2eaf5';
const SUCCESS = '#10b981';
const WARN = '#f59e0b';
const ERR = '#ef4444';
const TEAL = '#14b8a6';

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="44" height="16" viewBox="0 0 44 16" fill="none">
      <polyline points="0,12 7,8 14,5 22,9 30,2 37,5 44,3"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'running' ? SUCCESS : status === 'stopped' ? MUTED : ERR;
  const glow = status === 'running' ? `0 0 6px ${SUCCESS}` : 'none';
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: glow, flexShrink: 0 }} />;
}

export function ThemeBlue() {
  const panels = [
    { name: 'discord-bot', lang: 'JS', status: 'running', days: 18 },
    { name: 'api-server', lang: 'PY', status: 'stopped', days: 5 },
    { name: 'ClaimedPanel_1', lang: '??', status: 'stopped', days: 30, unconfigured: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: FG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Grid pattern */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: `linear-gradient(${A}08 1px,transparent 1px),linear-gradient(90deg,${A}08 1px,transparent 1px)`, backgroundSize: '40px 40px', pointerEvents: 'none', zIndex: 0 }} />

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${BG}f0`, backdropFilter: 'blur(16px)', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo icon */}
          <div style={{ width: 28, height: 28, borderRadius: 7, background: `${A}25`, border: `1px solid ${A}50`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={A2} strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `${A}20`, border: `1.5px solid ${A}45`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11, color: A2 }}>JD</div>
          <span style={{ fontWeight: 700, fontSize: 14, color: FG }}>johndoe</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M15 17H20L18.595 15.595A1 1 0 0118 14.721V11a6 6 0 10-12 0v3.721a1 1 0 01-.595.874L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: ERR, border: `2px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>2</div>
          </div>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, padding: '16px' }}>

        {/* Welcome bar */}
        <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 12, background: `${A}12`, border: `1px solid ${A}25`, display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: SUCCESS, boxShadow: `0 0 6px ${SUCCESS}` }} />
          <span style={{ fontSize: 12, color: A2 }}>3 of 5 panels in use · <span style={{ color: FG, fontWeight: 700 }}>All systems online</span></span>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
          {[
            { label: 'Total Panels', value: '3', color: A2 },
            { label: 'Running', value: '1', color: SUCCESS },
            { label: 'Expires Soon', value: '1', color: WARN },
            { label: 'Usage', value: '60%', color: TEAL },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 13px 9px', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1.1 }}>{s.value}</p>
              <div style={{ marginTop: 7 }}><Sparkline color={s.color} /></div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', letterSpacing: '0.1em' }}>panels</p>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + New
          </button>
        </div>

        {/* Panel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {panels.map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${p.unconfigured ? A + '35' : BORDER}`, borderRadius: 12, padding: '12px 13px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: p.lang === 'JS' ? '#32330070' : p.lang === 'PY' ? '#4584b630' : CARD2, border: `1px solid ${p.lang === 'JS' ? '#f7df1e25' : p.lang === 'PY' ? '#ffde5725' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, fontWeight: 900, color: p.lang === 'JS' ? '#f7df1e' : p.lang === 'PY' ? '#ffde57' : MUTED, flexShrink: 0 }}>
                {p.lang}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={p.status} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: p.unconfigured ? MUTED : FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.unconfigured ? 'Tap to configure →' : p.name}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.unconfigured ? 'New panel · needs setup' : `${p.days}d remaining`}</p>
              </div>
              {!p.unconfigured && (
                <span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: p.status === 'running' ? `${SUCCESS}18` : `${MUTED}18`, color: p.status === 'running' ? SUCCESS : MUTED, fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>
                  {p.status === 'running' ? 'ONLINE' : 'IDLE'}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Redeem + CTA */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: FG, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎁</span> Redeem Code
          </p>
          <div style={{ display: 'flex', gap: 7 }}>
            <input readOnly placeholder="ENTER-CODE" style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 11px', fontSize: 13, color: MUTED, fontFamily: 'monospace', outline: 'none' }} />
            <button style={{ padding: '8px 13px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Go</button>
          </div>
        </div>
        <div style={{ marginTop: 10, padding: '11px 13px', borderRadius: 12, background: `linear-gradient(135deg, ${A}18, ${A2}08)`, border: `1px solid ${A}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: A2 }}>Upgrade your plan</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>From ₦1,400/mo · No DevOps</p>
          </div>
          <button style={{ padding: '7px 12px', borderRadius: 7, background: A, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Pricing →</button>
        </div>
      </div>
    </div>
  );
}

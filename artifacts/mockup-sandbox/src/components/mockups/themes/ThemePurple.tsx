const A = '#7c3aed';   // violet accent
const A2 = '#a78bfa';  // light violet
const BG = '#09090f';  // pure black, barely purple tint
const CARD = '#0f0f1a';
const CARD2 = '#141425';
const BORDER = '#1e1e35';
const MUTED = '#6b6b9b';
const FG = '#e2e2f0';
const SUCCESS = '#22c55e';
const WARN = '#f59e0b';
const ERR = '#ef4444';
const CYAN = '#06b6d4';

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="44" height="16" viewBox="0 0 44 16" fill="none">
      <polyline points="0,12 7,8 14,5 22,9 30,2 37,5 44,3"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatusDot({ status }: { status: string }) {
  const color = status === 'running' ? SUCCESS : status === 'stopped' ? MUTED : status === 'error' ? ERR : WARN;
  const glow = status === 'running' ? `0 0 6px ${SUCCESS}` : 'none';
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: glow, flexShrink: 0 }} />;
}

export function ThemePurple() {
  const panels = [
    { name: 'discord-bot', lang: 'JS', status: 'running', days: 18 },
    { name: 'api-server', lang: 'PY', status: 'stopped', days: 5 },
    { name: 'ClaimedPanel_1', lang: '??', status: 'stopped', days: 30, unconfigured: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: FG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Dot grid */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04, zIndex: 0 }}>
        <defs><pattern id="dp" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill={A} /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#dp)" />
      </svg>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${BG}ee`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${A}22`, border: `1.5px solid ${A}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: A2 }}>JD</div>
          <span style={{ fontWeight: 700, fontSize: 15, color: FG }}>johndoe</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M15 17H20L18.595 15.595A1 1 0 0118 14.721V11a6 6 0 10-12 0v3.721a1 1 0 01-.595.874L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: '50%', background: ERR, border: `2px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>2</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, padding: '16px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Total Panels', value: '3', color: A2, icon: '▣' },
            { label: 'Running', value: '1', color: SUCCESS, icon: '●' },
            { label: 'Expires Soon', value: '1', color: WARN, icon: '⏰' },
            { label: 'Usage', value: '60%', color: CYAN, icon: '◐' },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px 14px 10px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>{s.label}</p>
                  <p style={{ fontSize: 24, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1 }}>{s.value}</p>
                </div>
                <span style={{ fontSize: 16, opacity: 0.4 }}>{s.icon}</span>
              </div>
              <div style={{ marginTop: 8 }}><Sparkline color={s.color} /></div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', letterSpacing: '0.1em' }}>// PANELS</p>
          <button style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            <span style={{ fontSize: 16, lineHeight: 1 }}>+</span> New Panel
          </button>
        </div>

        {/* Panel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {panels.map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${p.unconfigured ? A + '40' : BORDER}`, borderRadius: 14, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'all 0.15s' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: p.lang === 'JS' ? '#32330080' : p.lang === 'PY' ? '#4584b640' : CARD2, border: `1px solid ${p.lang === 'JS' ? '#f7df1e30' : p.lang === 'PY' ? '#ffde5730' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 11, fontWeight: 900, color: p.lang === 'JS' ? '#f7df1e' : p.lang === 'PY' ? '#ffde57' : MUTED, flexShrink: 0 }}>
                {p.lang}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={p.status} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: p.unconfigured ? MUTED : FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.unconfigured ? 'Tap to setup →' : p.name}
                  </span>
                  {p.unconfigured && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: `${A}25`, color: A2, fontWeight: 700 }}>SETUP</span>}
                </div>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                  {p.unconfigured ? 'Unconfigured panel' : `${p.days} days left · ${p.status}`}
                </p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>

        {/* Redeem code */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '14px' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: FG, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 15 }}>🎁</span> Redeem Access Code
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 9, padding: '9px 12px', fontSize: 13, color: MUTED, fontFamily: 'monospace' }}>ENTER-CODE-HERE</div>
            <button style={{ padding: '9px 14px', borderRadius: 9, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          </div>
        </div>

        {/* Get more panels CTA */}
        <div style={{ marginTop: 12, padding: '12px 14px', borderRadius: 14, background: `${A}12`, border: `1px solid ${A}25`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: A2 }}>Need more panels?</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>Plans from ₦1,400/month</p>
          </div>
          <button style={{ padding: '7px 14px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>View Plans →</button>
        </div>
      </div>
    </div>
  );
}

const A = '#f97316';   // vibrant orange
const A2 = '#fdba74';  // peach/light orange
const BG = '#0d0906';  // very dark warm black
const CARD = '#15100a';
const CARD2 = '#1d1610';
const BORDER = '#2a1f14';
const MUTED = '#7a6050';
const FG = '#f5ede5';
const SUCCESS = '#22c55e';
const WARN = '#facc15';
const ERR = '#ef4444';
const AMBER = '#fb923c';

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

export function ThemeOrange() {
  const panels = [
    { name: 'discord-bot', lang: 'JS', status: 'running', days: 18 },
    { name: 'api-server', lang: 'PY', status: 'stopped', days: 5 },
    { name: 'ClaimedPanel_1', lang: '??', status: 'stopped', days: 30, unconfigured: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: FG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Noise texture effect */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.03, zIndex: 0 }}>
        <defs><pattern id="op" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill={A} /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#op)" />
      </svg>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${BG}f0`, backdropFilter: 'blur(14px)', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${A}22`, border: `1.5px solid ${A}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: A2 }}>JD</div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 9, height: 9, borderRadius: '50%', background: SUCCESS, border: `2px solid ${BG}` }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: FG }}>johndoe</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M15 17H20L18.595 15.595A1 1 0 0118 14.721V11a6 6 0 10-12 0v3.721a1 1 0 01-.595.874L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 14, height: 14, borderRadius: '50%', background: ERR, border: `2px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>2</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={MUTED} strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </div>
        </div>
      </header>

      <div style={{ position: 'relative', zIndex: 1, padding: '16px' }}>
        {/* Flame accent bar */}
        <div style={{ height: 2, borderRadius: 1, background: `linear-gradient(90deg, transparent, ${A}, ${WARN}, transparent)`, marginBottom: 14, opacity: 0.6 }} />

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9, marginBottom: 14 }}>
          {[
            { label: 'Total Panels', value: '3', color: A2 },
            { label: 'Running', value: '1', color: SUCCESS },
            { label: 'Expires Soon', value: '1', color: WARN },
            { label: 'Usage', value: '60%', color: AMBER },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 13px 9px', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1.1 }}>{s.value}</p>
              <div style={{ marginTop: 7 }}><Sparkline color={s.color} /></div>
            </div>
          ))}
        </div>

        {/* Section label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <p style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>my panels</p>
          <button style={{ padding: '5px 12px', borderRadius: 8, background: `linear-gradient(135deg, ${A}, ${WARN})`, border: 'none', color: '#000', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
            + New Panel
          </button>
        </div>

        {/* Panel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {panels.map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${p.unconfigured ? A + '35' : BORDER}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: p.lang === 'JS' ? '#32330070' : p.lang === 'PY' ? '#4584b630' : CARD2, border: `1px solid ${p.lang === 'JS' ? '#f7df1e25' : p.lang === 'PY' ? '#ffde5725' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, fontWeight: 900, color: p.lang === 'JS' ? '#f7df1e' : p.lang === 'PY' ? '#ffde57' : MUTED, flexShrink: 0 }}>
                {p.lang}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={p.status} />
                  <span style={{ fontWeight: 700, fontSize: 13, color: p.unconfigured ? MUTED : FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.unconfigured ? 'Setup required →' : p.name}
                  </span>
                </div>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.unconfigured ? 'Click to configure' : `${p.days} days left`}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>

        {/* Redeem code */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: FG, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎁</span> Redeem Access Code
          </p>
          <div style={{ display: 'flex', gap: 7 }}>
            <input readOnly placeholder="ENTER-CODE-HERE" style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 11px', fontSize: 12, color: MUTED, fontFamily: 'monospace', outline: 'none' }} />
            <button style={{ padding: '9px 14px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: `linear-gradient(135deg, ${A}18, ${WARN}08)`, border: `1px solid ${A}30`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: A2 }}>Scale your project</p>
            <p style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Plans from ₦1,400/month</p>
          </div>
          <button style={{ padding: '7px 12px', borderRadius: 7, background: `linear-gradient(135deg, ${A}, ${WARN})`, border: 'none', color: '#000', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}>Plans →</button>
        </div>
      </div>
    </div>
  );
}

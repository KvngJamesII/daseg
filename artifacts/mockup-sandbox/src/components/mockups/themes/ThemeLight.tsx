const A = '#16a34a';   // dark green (primary)
const A2 = '#15803d';  // deeper green for text
const A3 = '#bbf7d0';  // mint for backgrounds
const BG = '#f8fafc';  // off white
const CARD = '#ffffff';
const CARD2 = '#f1f5f9';
const BORDER = '#e2e8f0';
const BORDER2 = '#cbd5e1';
const MUTED = '#94a3b8';
const MUTED2 = '#64748b';
const FG = '#0f172a';
const SUCCESS = '#16a34a';
const WARN = '#d97706';
const ERR = '#dc2626';
const BLUE = '#2563eb';

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
  const glow = status === 'running' ? `0 0 5px ${SUCCESS}80` : 'none';
  return <div style={{ width: 7, height: 7, borderRadius: '50%', background: color, boxShadow: glow, flexShrink: 0 }} />;
}

export function ThemeLight() {
  const panels = [
    { name: 'discord-bot', lang: 'JS', status: 'running', days: 18 },
    { name: 'api-server', lang: 'PY', status: 'stopped', days: 5 },
    { name: 'ClaimedPanel_1', lang: '??', status: 'stopped', days: 30, unconfigured: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, color: FG, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${CARD}f8`, backdropFilter: 'blur(12px)', borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Logo */}
          <div style={{ width: 28, height: 28, borderRadius: 7, background: A, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: A3, border: `2px solid ${BORDER2}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: A2 }}>JD</div>
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 8, height: 8, borderRadius: '50%', background: SUCCESS, border: `2px solid ${CARD}` }} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: FG }}>johndoe</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', cursor: 'pointer' }}>
            <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke={MUTED2} strokeWidth="2"><path d="M15 17H20L18.595 15.595A1 1 0 0118 14.721V11a6 6 0 10-12 0v3.721a1 1 0 01-.595.874L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            <div style={{ position: 'absolute', top: -3, right: -3, width: 15, height: 15, borderRadius: '50%', background: ERR, border: `2px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff' }}>2</div>
          </div>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: CARD, border: `1px solid ${BORDER}`, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke={MUTED2} strokeWidth="2"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          </div>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 9, marginBottom: 14 }}>
          {[
            { label: 'Total Panels', value: '3', color: BLUE },
            { label: 'Running', value: '1', color: SUCCESS },
            { label: 'Expires Soon', value: '1', color: WARN },
            { label: 'Usage', value: '60%', color: A },
          ].map(s => (
            <div key={s.label} style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px 13px 10px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
              <p style={{ fontSize: 10, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: s.color, fontFamily: 'monospace', lineHeight: 1.1 }}>{s.value}</p>
              <div style={{ marginTop: 7 }}><Sparkline color={s.color} /></div>
            </div>
          ))}
        </div>

        {/* Section header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: FG }}>My Panels</p>
          <button style={{ padding: '6px 14px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${A}40` }}>
            + New Panel
          </button>
        </div>

        {/* Panel cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {panels.map(p => (
            <div key={p.name} style={{ background: CARD, border: `1px solid ${p.unconfigured ? A + '40' : BORDER}`, borderRadius: 12, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: p.lang === 'JS' ? '#fffbeb' : p.lang === 'PY' ? '#eff6ff' : CARD2, border: `1.5px solid ${p.lang === 'JS' ? '#fde68a' : p.lang === 'PY' ? '#bfdbfe' : BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontSize: 10, fontWeight: 900, color: p.lang === 'JS' ? '#92400e' : p.lang === 'PY' ? '#1e40af' : MUTED, flexShrink: 0 }}>
                {p.lang}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusDot status={p.status} />
                  <span style={{ fontWeight: 600, fontSize: 13, color: p.unconfigured ? MUTED : FG, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.unconfigured ? 'Configure panel →' : p.name}
                  </span>
                  {p.unconfigured && <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 5, background: A3, color: A2, fontWeight: 700 }}>SETUP</span>}
                </div>
                <p style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{p.unconfigured ? 'New · needs configuration' : `${p.days} days remaining`}</p>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={MUTED} strokeWidth="2" style={{ flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          ))}
        </div>

        {/* Redeem code */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '13px', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', marginBottom: 10 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: FG, marginBottom: 9, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🎁</span> Redeem Access Code
          </p>
          <div style={{ display: 'flex', gap: 7 }}>
            <input readOnly placeholder="ENTER-CODE-HERE" style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER2}`, borderRadius: 8, padding: '9px 11px', fontSize: 12, color: MUTED2, fontFamily: 'monospace', outline: 'none' }} />
            <button style={{ padding: '9px 14px', borderRadius: 8, background: A, border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${A}30` }}>Apply</button>
          </div>
        </div>

        {/* Upgrade CTA */}
        <div style={{ padding: '12px 14px', borderRadius: 12, background: `linear-gradient(135deg, ${A3}, ${BG})`, border: `1.5px solid ${BORDER2}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: A2 }}>Need more panels?</p>
            <p style={{ fontSize: 11, color: MUTED2, marginTop: 1 }}>Plans from ₦1,400/month</p>
          </div>
          <button style={{ padding: '7px 12px', borderRadius: 7, background: A, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: `0 2px 8px ${A}35` }}>View Plans →</button>
        </div>
      </div>
    </div>
  );
}

/* Panel Page — Variant A: Compact Metric Strip
   Dark #0c0c0f bg • horizontal scrollable stat pills • clean action row */

const BG    = '#0c0c0f';
const CARD  = '#141418';
const CARD2 = '#18181d';
const BORDER = 'rgba(255,255,255,0.07)';
const GREEN = '#22c55e';
const AMBER = '#fbbf24';
const BLUE  = '#60a5fa';
const MUTED = 'rgba(255,255,255,0.35)';
const DIM   = 'rgba(255,255,255,0.12)';

function RadialMini({ pct, color, size = 36 }: { pct: number; color: string; size?: number }) {
  const r  = (size - 6) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DIM} strokeWidth={3} />
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke={color} strokeWidth={3}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function PanelVariantA() {
  const cpu  = 34;
  const ram  = 178;
  const ramMax = 512;

  const stats = [
    { label: 'CPU',     value: `${cpu}%`,    sub: 'of vCPU',  color: BLUE,  pct: cpu },
    { label: 'RAM',     value: `${ram} MB`,  sub: 'of 512 MB', color: GREEN, pct: (ram / ramMax) * 100 },
    { label: 'Uptime',  value: '3h 22m',     sub: 'running',  color: GREEN, pct: 100 },
    { label: 'Restart', value: '2',          sub: 'today',    color: AMBER,  pct: 20 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#fff' }}>

      {/* Header */}
      <div style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 10 }}>
        <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16 }}>←</button>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 12, color: GREEN }}>PY</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>my-flask-api</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 1 }}>Python · Expires Apr 23</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', fontSize: 11, fontWeight: 700, color: GREEN }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, boxShadow: `0 0 6px ${GREEN}` }} />
          Online
        </div>
      </div>

      {/* Action bar */}
      <div style={{ padding: '12px 16px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 8 }}>
        <button style={{ flex: 1, height: 40, borderRadius: 10, border: 'none', background: GREEN, color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ▶ Start
        </button>
        <button style={{ flex: 1, height: 40, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD, color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ↺ Restart
        </button>
        <button style={{ flex: 1, height: 40, borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', color: '#f87171', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          ■ Stop
        </button>
      </div>

      {/* ── Compact metric strip ── */}
      <div style={{ padding: '12px 16px 0', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 8, minWidth: 'max-content', paddingBottom: 12 }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 14, background: CARD, border: `1px solid ${BORDER}`, minWidth: 120 }}>
              <RadialMini pct={s.pct} color={s.color} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab row */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${BORDER}`, paddingLeft: 4 }}>
        {['Console', 'Files', 'Startup', 'Settings'].map((t, i) => (
          <button key={t} style={{
            padding: '12px 16px', fontSize: 13, fontWeight: i === 0 ? 700 : 500,
            color: i === 0 ? GREEN : MUTED, background: 'none', border: 'none',
            borderBottom: i === 0 ? `2px solid ${GREEN}` : '2px solid transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {['⌨', '📁', '▶', '⚙'][i]} {t}
          </button>
        ))}
      </div>

      {/* Console body (preview) */}
      <div style={{ background: '#0d1117', margin: 12, borderRadius: 12, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div style={{ padding: '8px 12px', borderBottom: '1px solid #21262d', display: 'flex', alignItems: 'center', gap: 8, background: '#161b22' }}>
          <div style={{ display: 'flex', gap: 5 }}>
            {['#ff5f56','#ffbd2e','#27c93f'].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: '50%', background: c }} />)}
          </div>
          <span style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>panel — bash</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, border: '1px solid #238636', background: 'rgba(35,134,54,0.12)', color: '#3fb950', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>⏸ Pause</button>
            <button style={{ padding: '2px 8px', fontSize: 10, borderRadius: 4, border: '1px solid #30363d', background: 'transparent', color: '#6b7280', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 600 }}>Clear</button>
          </div>
        </div>
        <div style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, lineHeight: 1.7 }}>
          <div style={{ color: '#60a5fa' }}>[INFO] Starting deployment…</div>
          <div style={{ color: '#60a5fa' }}>[INFO] Dependencies installed, starting app…</div>
          <div style={{ color: '#22c55e' }}>[SUCCESS] Started on port 3000 (main.py)</div>
          <div style={{ color: '#d1d5db' }}>* Serving Flask app 'main'</div>
          <div style={{ color: '#d1d5db' }}>* Running on http://0.0.0.0:3000</div>
          <div style={{ color: '#34d399', marginTop: 8 }}>$ pip list | grep flask</div>
          <div style={{ color: '#e5e7eb' }}>Flask     3.0.3</div>
          <div style={{ color: '#34d399', marginTop: 4 }}>$ _</div>
        </div>
      </div>
    </div>
  );
}

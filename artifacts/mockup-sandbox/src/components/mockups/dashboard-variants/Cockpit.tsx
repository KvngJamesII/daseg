import { Server, Activity, Zap, ShoppingCart, ChevronRight, LogOut, Shield, RotateCcw, AlertCircle, Clock, Terminal, Gift } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

const statusStyles = {
  running: { ring: "#00e676", label: "ONLINE", glow: "0 0 8px #00e67666" },
  stopped: { ring: "#444", label: "OFFLINE", glow: "none" },
  error: { ring: "#ff4444", label: "ERROR", glow: "0 0 8px #ff444466" },
};

export function Cockpit() {
  return (
    <div style={{ minHeight: "100vh", background: "#07070d", color: "#e8e8f0", fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 13 }}>

      {/* Header */}
      <div style={{ background: "#0d0d1a", borderBottom: "1px solid #1a1a2e", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg,#00e676,#00b0ff)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, color: "#000", boxShadow: "0 0 16px #00e67640" }}>JA</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>james<span style={{ color: "#00e676" }}>@idevhost</span></div>
            <div style={{ fontSize: 10, color: "#444", letterSpacing: "0.1em" }}>PREMIUM · 3/5 PANELS</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button style={{ padding: "6px 8px", background: "#1a1a2e", border: "1px solid #222", borderRadius: 6, cursor: "pointer", color: "#f0b429" }}><Shield size={14} /></button>
          <button style={{ padding: "6px 8px", background: "#1a1a2e", border: "1px solid #222", borderRadius: 6, cursor: "pointer", color: "#555" }}><LogOut size={14} /></button>
        </div>
      </div>

      <div style={{ padding: "16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Metric row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {[
            { label: "PANELS", value: "3/5", icon: <Server size={14} />, color: "#00b0ff" },
            { label: "ONLINE", value: "1", icon: <Activity size={14} />, color: "#00e676", glow: "0 0 20px #00e67630" },
            { label: "PLAN", value: "PRO", icon: <Zap size={14} />, color: "#f0b429" },
          ].map(m => (
            <div key={m.label} style={{ background: "#0d0d1a", border: `1px solid ${m.color}22`, borderRadius: 12, padding: "12px 10px", boxShadow: m.glow }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ color: m.color }}>{m.icon}</span>
                <span style={{ fontSize: 9, color: "#333", letterSpacing: "0.12em" }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.color, letterSpacing: "-0.02em" }}>{m.value}</div>
            </div>
          ))}
        </div>

        {/* Usage bar */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ color: "#555", fontSize: 10, letterSpacing: "0.1em" }}>CAPACITY</span>
            <span style={{ color: "#00b0ff", fontWeight: 700 }}>3 / 5</span>
          </div>
          <div style={{ height: 4, background: "#1a1a2e", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#00b0ff,#00e676)", borderRadius: 4, boxShadow: "0 0 8px #00b0ff60" }} />
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: "#333" }}>2 slots available · <span style={{ color: "#00e676", cursor: "pointer" }}>buy more →</span></div>
        </div>

        {/* Buy CTA */}
        <div style={{ background: "linear-gradient(135deg,#00b0ff18,#00e67608)", border: "1px solid #00b0ff30", borderRadius: 14, padding: "14px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, background: "#00b0ff15", border: "1px solid #00b0ff30", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={18} color="#00b0ff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 13 }}>Deploy another panel</div>
              <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>From <span style={{ color: "#00b0ff" }}>₦1,400/mo</span> · instant</div>
            </div>
          </div>
          <div style={{ background: "#00b0ff", color: "#000", fontWeight: 800, fontSize: 11, padding: "6px 12px", borderRadius: 8, boxShadow: "0 0 12px #00b0ff50", display: "flex", alignItems: "center", gap: 4 }}>
            BUY <ChevronRight size={12} />
          </div>
        </div>

        {/* Redeem terminal */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 12, overflow: "hidden" }}>
          <div style={{ background: "#0a0a14", borderBottom: "1px solid #1a1a2e", padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
            <Terminal size={12} color="#00e676" />
            <span style={{ color: "#333", fontSize: 10, letterSpacing: "0.1em" }}>REDEEM_CODE.SH</span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4444" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#f0b429" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00e676" }} />
            </div>
          </div>
          <div style={{ padding: "14px" }}>
            <div style={{ fontSize: 11, color: "#333", marginBottom: 8 }}>
              <span style={{ color: "#00e676" }}>$</span> Enter redemption code
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#070711", border: "1px solid #222", borderRadius: 8, padding: "10px 12px", marginBottom: 10 }}>
              <span style={{ color: "#00e676", fontWeight: 700 }}>&gt;_</span>
              <span style={{ color: "#333", letterSpacing: "0.15em", flex: 1 }}>IDEV-XXXX-XXXX</span>
            </div>
            <button style={{ width: "100%", padding: "10px", background: "#00e67615", border: "1px solid #00e67640", borderRadius: 8, color: "#00e676", fontWeight: 700, fontSize: 12, cursor: "pointer", letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Gift size={14} /> REDEEM →
            </button>
          </div>
        </div>

        {/* Panels */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.12em" }}>YOUR PANELS</span>
            <span style={{ fontSize: 10, color: "#00b0ff", cursor: "pointer" }}>+ NEW</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {panels.map(p => {
              const s = statusStyles[p.status as keyof typeof statusStyles];
              return (
                <div key={p.id} style={{ background: "#0d0d1a", border: `1px solid ${s.ring}22`, borderRadius: 12, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, position: "relative", overflow: "hidden" }}>
                  {/* Left strip */}
                  <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: s.ring, boxShadow: s.glow }} />
                  {/* Lang */}
                  <div style={{ width: 40, height: 40, background: p.lang === "nodejs" ? "#00e67615" : "#2196f315", border: `1px solid ${p.lang === "nodejs" ? "#00e67630" : "#2196f330"}`, borderRadius: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, color: p.lang === "nodejs" ? "#00e676" : "#2196f3" }}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                    <span style={{ fontSize: 8, color: "#333" }}>{p.lang === "nodejs" ? "node" : "py3"}</span>
                  </div>
                  {/* Name */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "#fff", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 10, color: "#333", marginTop: 2 }}>
                      {p.expires <= 5 ? <span style={{ color: "#f0b429" }}><AlertCircle size={10} style={{ display: "inline" }} /> {p.expires}d left</span> : <span>{p.lang === "nodejs" ? "Node.js" : "Python"}</span>}
                    </div>
                  </div>
                  {/* Status */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: `${s.ring}15`, border: `1px solid ${s.ring}33`, borderRadius: 6, padding: "4px 8px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: s.ring, boxShadow: s.glow }} />
                    <span style={{ fontSize: 9, color: s.ring, fontWeight: 700, letterSpacing: "0.1em" }}>{s.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 10, padding: "10px 14px", fontSize: 11, color: "#333" }}>
          <span style={{ color: "#00e676" }}>$</span> idevhost --status &nbsp;<span style={{ color: "#444" }}>·</span>&nbsp; <span style={{ color: "#00e676" }}>1 running</span> · 3 panels · pro plan
        </div>
      </div>
    </div>
  );
}

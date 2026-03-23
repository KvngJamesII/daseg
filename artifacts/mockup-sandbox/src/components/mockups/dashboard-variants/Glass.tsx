import { Server, Activity, Zap, ShoppingCart, ChevronRight, LogOut, Plus, AlertCircle, Clock, Gift, CornerDownRight } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 20,
      ...style,
    }}>
      {children}
    </div>
  );
}

export function Glass() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(145deg, #0e0f1a 0%, #131524 40%, #0e1220 100%)",
      color: "#e2e8f0",
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14,
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Ambient blobs */}
      <div style={{ position: "absolute", top: -80, left: -80, width: 280, height: 280, background: "radial-gradient(circle,#6366f140,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", top: 200, right: -60, width: 200, height: 200, background: "radial-gradient(circle,#8b5cf630,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: 100, left: 40, width: 160, height: 160, background: "radial-gradient(circle,#06b6d425,transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Header */}
        <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: 14, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff", boxShadow: "0 4px 20px #6366f150" }}>JA</div>
            <div>
              <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 15 }}>james</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Premium plan</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)" }}><LogOut size={14} /></button>
          </div>
        </div>

        <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 16 }}>

          {/* Stats grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "Panels", value: "3/5", icon: <Server size={14} />, accent: "#6366f1" },
              { label: "Online", value: "1", icon: <Activity size={14} />, accent: "#22d3ee" },
              { label: "Plan", value: "PRO", icon: <Zap size={14} />, accent: "#a78bfa" },
            ].map(s => (
              <GlassCard key={s.label} style={{ padding: "14px 10px", textAlign: "center" }}>
                <div style={{ width: 28, height: 28, margin: "0 auto 8px", background: `${s.accent}20`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: s.accent }}>
                  {s.icon}
                </div>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.accent }}>{s.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{s.label}</div>
              </GlassCard>
            ))}
          </div>

          {/* Buy banner */}
          <div style={{ position: "relative", borderRadius: 20, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))" }} />
            <div style={{ position: "absolute", inset: 0, border: "1px solid rgba(99,102,241,0.3)", borderRadius: 20 }} />
            <div style={{ position: "relative", padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 44, height: 44, background: "rgba(99,102,241,0.2)", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(99,102,241,0.3)" }}>
                <ShoppingCart size={20} color="#818cf8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: "#f1f5f9", fontSize: 14 }}>Get a hosting panel</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>From <span style={{ color: "#818cf8" }}>₦1,400/mo</span></div>
              </div>
              <ChevronRight size={18} color="#818cf8" />
            </div>
          </div>

          {/* Redeem */}
          <GlassCard style={{ padding: 18 }}>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14, marginBottom: 4 }}>
                <Gift size={14} style={{ display: "inline", marginRight: 6, color: "#a78bfa" }} />
                Redeem a Code
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>Unlock free panel slots instantly</div>
            </div>
            <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ color: "#6366f1", fontFamily: "monospace", fontWeight: 700 }}>&gt;</span>
              <span style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", fontSize: 13, flex: 1 }}>IDEV-XXXX-XXXX</span>
            </div>
            <button style={{ width: "100%", padding: "11px", background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, color: "#818cf8", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, backdropFilter: "blur(4px)" }}>
              <CornerDownRight size={14} /> Redeem
            </button>
          </GlassCard>

          {/* Panels */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 600, color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: "0.06em" }}>YOUR PANELS</div>
              <button style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, padding: "4px 10px", color: "#818cf8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={12} /> New
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {panels.map(p => {
                const accent = p.status === "running" ? "#22d3ee" : p.status === "error" ? "#f87171" : "#475569";
                const labelBg = p.status === "running" ? "rgba(34,211,238,0.1)" : p.status === "error" ? "rgba(248,113,113,0.1)" : "rgba(71,85,105,0.15)";
                const labelText = p.status === "running" ? "Online" : p.status === "error" ? "Error" : "Offline";
                return (
                  <GlassCard key={p.id} style={{ padding: "13px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, borderColor: p.status === "running" ? "rgba(34,211,238,0.15)" : "rgba(255,255,255,0.06)" }}>
                    {/* Left accent */}
                    <div style={{ width: 3, height: 36, borderRadius: 2, background: accent, boxShadow: `0 0 8px ${accent}60`, flexShrink: 0 }} />
                    {/* Lang */}
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: p.lang === "nodejs" ? "rgba(132,204,22,0.12)" : "rgba(56,189,248,0.12)", border: `1px solid ${p.lang === "nodejs" ? "rgba(132,204,22,0.2)" : "rgba(56,189,248,0.2)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 800, flexShrink: 0 }}>
                      <span style={{ fontSize: 13, color: p.lang === "nodejs" ? "#84cc16" : "#38bdf8" }}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                    </div>
                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 14 }}>{p.name}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                        {p.expires <= 5
                          ? <span style={{ color: "#fbbf24" }}><Clock size={10} style={{ display: "inline" }} /> {p.expires}d left</span>
                          : p.lang === "nodejs" ? "Node.js" : "Python"}
                      </div>
                    </div>
                    {/* Status */}
                    <div style={{ background: labelBg, borderRadius: 8, padding: "4px 9px", display: "flex", alignItems: "center", gap: 5 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: accent }} />
                      <span style={{ fontSize: 11, color: accent, fontWeight: 600 }}>{labelText}</span>
                    </div>
                    <ChevronRight size={15} color="rgba(255,255,255,0.15)" />
                  </GlassCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

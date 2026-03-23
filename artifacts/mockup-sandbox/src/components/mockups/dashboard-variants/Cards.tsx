import { Server, Activity, Zap, ShoppingCart, ChevronRight, LogOut, Bell, Plus, AlertCircle, Clock, Gift, Ticket, Star } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

export function Cards() {
  return (
    <div style={{ minHeight: "100vh", background: "#111318", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif", fontSize: 14 }}>

      {/* Header */}
      <div style={{ padding: "16px", paddingBottom: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ position: "relative" }}>
            <div style={{ width: 46, height: 46, borderRadius: 16, background: "linear-gradient(135deg,#6366f1,#8b5cf6,#ec4899)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16, color: "#fff", boxShadow: "0 4px 20px #6366f140" }}>JA</div>
            <div style={{ position: "absolute", bottom: 1, right: 1, width: 12, height: 12, background: "#22c55e", borderRadius: "50%", border: "2px solid #111318", boxShadow: "0 0 6px #22c55e80" }} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: "#fff" }}>Hey, james 👋</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
              <Star size={11} color="#f59e0b" fill="#f59e0b" />
              <span style={{ fontSize: 11, color: "#f59e0b", fontWeight: 600 }}>Premium</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={{ width: 36, height: 36, borderRadius: 12, background: "#1e2028", border: "1px solid #2a2d38", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><Bell size={16} /></button>
          <button style={{ width: 36, height: 36, borderRadius: 12, background: "#1e2028", border: "1px solid #2a2d38", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}><LogOut size={16} /></button>
        </div>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14, paddingBottom: 32 }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {/* Panels card */}
          <div style={{ background: "#1e2028", borderRadius: 20, padding: 16, border: "1px solid #2a2d38" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: "#6366f120", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Server size={15} color="#6366f1" /></div>
              <span style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.05em" }}>PANELS</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#fff", lineHeight: 1 }}>3<span style={{ fontSize: 14, color: "#475569", fontWeight: 400" }}>/5</span></div>
            <div style={{ marginTop: 8, height: 3, background: "#2a2d38", borderRadius: 3 }}>
              <div style={{ width: "60%", height: "100%", background: "linear-gradient(90deg,#6366f1,#8b5cf6)", borderRadius: 3 }} />
            </div>
          </div>

          {/* Running card */}
          <div style={{ background: "#0f2618", borderRadius: 20, padding: 16, border: "1px solid #22c55e22" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <div style={{ width: 32, height: 32, background: "#22c55e20", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><Activity size={15} color="#22c55e" /></div>
              <span style={{ fontSize: 10, color: "#475569", fontWeight: 600, letterSpacing: "0.05em" }}>ONLINE</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: "#22c55e", lineHeight: 1 }}>1</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e" }} className="animate-pulse" />
              <span style={{ fontSize: 10, color: "#22c55e", fontWeight: 600 }}>live now</span>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)", borderRadius: 20, padding: "16px 20px", cursor: "pointer", boxShadow: "0 8px 32px #6366f130" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Get a hosting panel</div>
              <div style={{ fontSize: 12, color: "#c4b5fd", marginTop: 3 }}>From ₦1,400/mo · No DevOps</div>
            </div>
            <div style={{ width: 44, height: 44, background: "#ffffff25", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={20} color="#fff" />
            </div>
          </div>
        </div>

        {/* Redeem Code */}
        <div style={{ background: "#1e2028", border: "1px solid #2a2d38", borderRadius: 20, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 38, height: 38, background: "linear-gradient(135deg,#f59e0b,#ef4444)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px #f59e0b30" }}>
              <Gift size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>Got a code?</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Redeem for free panel slots</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1, background: "#111318", border: "1px solid #2a2d38", borderRadius: 12, padding: "11px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <Ticket size={14} color="#475569" />
              <span style={{ color: "#334155", fontFamily: "monospace", letterSpacing: "0.15em", fontSize: 13 }}>IDEV-XXXX</span>
            </div>
            <button style={{ background: "linear-gradient(135deg,#f59e0b,#ef4444)", border: "none", borderRadius: 12, padding: "0 18px", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", boxShadow: "0 4px 12px #f59e0b30" }}>
              Claim
            </button>
          </div>
        </div>

        {/* Panels section */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ fontWeight: 700, color: "#fff", fontSize: 15 }}>Your Panels</div>
            <button style={{ display: "flex", alignItems: "center", gap: 5, background: "#6366f120", border: "1px solid #6366f130", borderRadius: 8, padding: "5px 10px", color: "#6366f1", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>
              <Plus size={13} /> New
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {panels.map(p => {
              const colors = {
                running: { bg: "#0f2618", border: "#22c55e30", dot: "#22c55e", label: "Online", lbg: "#22c55e15", lc: "#22c55e" },
                stopped: { bg: "#1e2028", border: "#2a2d38", dot: "#475569", label: "Offline", lbg: "#1e2028", lc: "#475569" },
                error: { bg: "#1a0f0f", border: "#ef444430", dot: "#ef4444", label: "Error", lbg: "#ef444415", lc: "#ef4444" },
              }[p.status] ?? { bg: "#1e2028", border: "#2a2d38", dot: "#475569", label: "Offline", lbg: "#1e2028", lc: "#475569" };
              return (
                <div key={p.id} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 18, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "transform 0.15s" }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: p.lang === "nodejs" ? "#84cc1615" : "#38bdf815", border: `1px solid ${p.lang === "nodejs" ? "#84cc1630" : "#38bdf830"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontWeight: 900, flexShrink: 0 }}>
                    <span style={{ fontSize: 15, color: p.lang === "nodejs" ? "#84cc16" : "#38bdf8" }}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                    <span style={{ fontSize: 9, color: "#475569" }}>{p.lang === "nodejs" ? "node" : "py3"}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: "#475569", marginTop: 2 }}>
                      {p.expires <= 5 ? <span style={{ color: "#f59e0b" }}><Clock size={11} style={{ display: "inline", marginRight: 3 }} />{p.expires}d left</span> : p.lang === "nodejs" ? "Node.js" : "Python"}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, background: colors.lbg, borderRadius: 8, padding: "5px 10px" }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: colors.dot }} />
                    <span style={{ fontSize: 11, color: colors.lc, fontWeight: 600 }}>{colors.label}</span>
                  </div>
                  <ChevronRight size={16} color="#334155" />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

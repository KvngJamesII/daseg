import { Plus, LogOut, ShoppingCart, Clock, ChevronRight, Gift, Bell } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

const A = "#f97316";
const A_SOFT = "#fb923c";
const A_WARM = "#fdba74";
const A_GLOW = "rgba(249,115,22,0.14)";
const A_BORDER = "rgba(249,115,22,0.2)";
const BG = "#0c0906";
const CARD = "#131009";
const CARD2 = "#100d07";
const BORDER = "rgba(255,255,255,0.055)";

export function RingOrange() {
  const used = 3, total = 5;
  const r = 32, circ = 2 * Math.PI * r;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "22px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginBottom: 3 }}>Good morning</p>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>james</h1>
          </div>
          <div style={{ display: "flex", gap: 7 }}>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: BORDER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", position: "relative" }}>
              <Bell size={15} color="rgba(255,255,255,0.3)" />
              <div style={{ position: "absolute", top: -2, right: -2, width: 14, height: 14, borderRadius: "50%", background: "#ef4444", border: `2px solid ${BG}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 800 }}>2</div>
            </button>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.04)", border: BORDER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <LogOut size={15} color="rgba(255,255,255,0.3)" />
            </button>
          </div>
        </div>

        {/* Decorative accent line */}
        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${A}50, ${A_WARM}30, transparent)`, marginBottom: 20 }} />

        {/* Ring — centered hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <div style={{ position: "absolute", inset: -8, borderRadius: "50%", background: `radial-gradient(circle, ${A_GLOW} 0%, transparent 70%)` }} />
            <svg width="96" height="96" viewBox="0 0 96 96">
              {/* Track */}
              <circle cx="48" cy="48" r={r} fill="none" stroke="#1e160a" strokeWidth="7" />
              {/* Secondary arc for depth */}
              <circle cx="48" cy="48" r={r} fill="none" stroke={A} strokeWidth="7"
                strokeDasharray={circ}
                strokeDashoffset={circ * (1 - used / total)}
                strokeLinecap="round" transform="rotate(-90 48 48)" />
              {/* Warm tip glow effect */}
              <circle cx="48" cy="48" r={r} fill="none" stroke={A_WARM} strokeWidth="2"
                strokeDasharray={`3 ${circ - 3}`}
                strokeDashoffset={circ * (1 - used / total) + 1.5}
                strokeLinecap="round" transform="rotate(-90 48 48)" opacity="0.6" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 24, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{used}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginTop: 2 }}>/ {total}</span>
            </div>
          </div>

          {/* Compact chips */}
          <div style={{ display: "flex", gap: 7, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 4px #22c55e" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>1 online</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: A_GLOW, border: A_BORDER }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: A_SOFT }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: A_SOFT }}>2 idle</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 12px", borderRadius: 20, background: "rgba(255,255,255,0.03)", border: BORDER }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.28)" }}>2 free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy banner */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ borderRadius: 18, padding: "14px 15px", display: "flex", alignItems: "center", justifyContent: "space-between", background: `linear-gradient(135deg, #1a0f07 0%, #130c05 100%)`, border: A_BORDER, cursor: "pointer" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: A_GLOW, border: A_BORDER, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={18} color={A_SOFT} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Add a panel</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>From <span style={{ color: A_SOFT, fontWeight: 600 }}>₦1,400/mo</span></p>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, background: `linear-gradient(135deg, ${A}, #fb923c)`, color: "#fff", padding: "8px 16px", borderRadius: 10, flexShrink: 0 }}>Buy Now</div>
        </div>
      </div>

      {/* Panels */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 11 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Panels</p>
          <button style={{ fontSize: 12, color: A_SOFT, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <Plus size={12} /> New
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {panels.map(p => {
            const isRunning = p.status === "running";
            const isError = p.status === "error";
            const accent = isRunning ? "#22c55e" : isError ? "#ef4444" : "#1e1609";
            const statusColor = isRunning ? "#4ade80" : isError ? "#f87171" : "rgba(255,255,255,0.28)";
            const expiringSoon = p.expires <= 5;
            return (
              <div key={p.id} style={{ borderRadius: 18, padding: "12px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: CARD, border: `1px solid ${isRunning ? "rgba(34,197,94,0.14)" : isError ? "rgba(239,68,68,0.14)" : BORDER}` }}>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, flexShrink: 0, background: accent, opacity: isRunning || isError ? 1 : 0.18 }} />
                <div style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: p.lang === "nodejs" ? "rgba(34,197,94,0.07)" : "rgba(96,165,250,0.07)", border: `1px solid ${p.lang === "nodejs" ? "rgba(34,197,94,0.12)" : "rgba(96,165,250,0.12)"}` }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: p.lang === "nodejs" ? "#4ade80" : "#60a5fa", lineHeight: 1 }}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: p.lang === "nodejs" ? "rgba(74,222,128,0.4)" : "rgba(96,165,250,0.4)", marginTop: 2 }}>{p.lang === "nodejs" ? "node" : "py3"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{isRunning ? "Running" : isError ? "Error" : "Stopped"}</span>
                    {expiringSoon && <><span style={{ color: "rgba(255,255,255,0.1)" }}>·</span><span style={{ fontSize: 11, color: "#fbbf24", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />{p.expires}d</span></>}
                  </div>
                </div>
                <ChevronRight size={15} color="rgba(255,255,255,0.1)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem — compact inline */}
      <div style={{ padding: "0 20px 32px" }}>
        <div style={{ borderRadius: 16, padding: "10px 13px", display: "flex", alignItems: "center", gap: 9, background: CARD, border: "1px solid rgba(251,191,36,0.1)" }}>
          <Gift size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, background: CARD2, borderRadius: 9, padding: "8px 11px", fontSize: 12, color: "rgba(255,255,255,0.15)", fontFamily: "monospace", letterSpacing: "0.06em" }}>IDEV-XXXX-XXXX</div>
          <button style={{ fontSize: 12, fontWeight: 700, padding: "8px 13px", borderRadius: 9, background: "rgba(251,191,36,0.1)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.15)", cursor: "pointer", flexShrink: 0 }}>Claim</button>
        </div>
      </div>
    </div>
  );
}

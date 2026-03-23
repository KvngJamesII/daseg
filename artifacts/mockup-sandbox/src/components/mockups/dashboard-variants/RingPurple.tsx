import { Plus, LogOut, ShoppingCart, Clock, ChevronRight, Gift, Bell } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

const A = "#8b5cf6";   // violet
const A_GLOW = "#8b5cf620";
const A_SOFT = "#a78bfa";
const BG = "#09090f";
const CARD = "#101016";
const CARD2 = "#0d0d13";
const BORDER = "rgba(255,255,255,0.06)";
const BORDER_A = "rgba(139,92,246,0.18)";

export function RingPurple() {
  const used = 3, total = 5;
  const frac = used / total;
  const r = 30, circ = 2 * Math.PI * r;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div style={{ padding: "24px 20px 20px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginBottom: 3 }}>Welcome back</p>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>james</h1>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: BORDER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <Bell size={15} color="rgba(255,255,255,0.35)" />
            </button>
            <button style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.05)", border: BORDER, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <LogOut size={15} color="rgba(255,255,255,0.35)" />
            </button>
          </div>
        </div>

        {/* Usage ring — centered, no text beside it */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
          <div style={{ position: "relative", width: 90, height: 90 }}>
            {/* Outer glow */}
            <div style={{ position: "absolute", inset: -6, borderRadius: "50%", background: `radial-gradient(circle, ${A}15 0%, transparent 70%)`, pointerEvents: "none" }} />
            <svg width="90" height="90" viewBox="0 0 90 90">
              {/* Track */}
              <circle cx="45" cy="45" r="38" fill="none" stroke="#1c1c28" strokeWidth="7" />
              {/* Progress */}
              <circle cx="45" cy="45" r="38" fill="none" stroke={A} strokeWidth="7"
                strokeDasharray={`${2 * Math.PI * 38}`}
                strokeDashoffset={`${2 * Math.PI * 38 * (1 - frac)}`}
                strokeLinecap="round" transform="rotate(-90 45 45)" />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#fff", lineHeight: 1 }}>{used}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1, marginTop: 2 }}>of {total}</span>
            </div>
          </div>

          {/* Compact metric chips below ring */}
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 5px #22c55e" }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: "#4ade80" }}>1 online</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: A_GLOW, border: BORDER_A }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: A_SOFT }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: A_SOFT }}>2 idle</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 11px", borderRadius: 20, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.35)" }}>2 free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy banner */}
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ borderRadius: 18, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", background: "linear-gradient(135deg, #110d1f 0%, #0d0d1a 100%)", border: BORDER_A }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: A_GLOW, border: BORDER_A, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ShoppingCart size={18} color={A_SOFT} />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#fff" }}>Add a panel</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>From <span style={{ color: A_SOFT, fontWeight: 600 }}>₦1,400/mo</span></p>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, background: A, color: "#fff", padding: "8px 16px", borderRadius: 10 }}>Buy Now</div>
        </div>
      </div>

      {/* Panels */}
      <div style={{ padding: "0 20px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 600 }}>Panels</p>
          <button style={{ fontSize: 12, color: A_SOFT, fontWeight: 700, display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer" }}>
            <Plus size={12} /> New
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {panels.map(p => {
            const isRunning = p.status === "running";
            const isError = p.status === "error";
            const accent = isRunning ? "#22c55e" : isError ? "#ef4444" : "#334155";
            const statusColor = isRunning ? "#4ade80" : isError ? "#f87171" : "rgba(255,255,255,0.3)";
            const expiringSoon = p.expires <= 5;
            return (
              <div key={p.id} style={{ borderRadius: 18, padding: "13px 14px", cursor: "pointer", display: "flex", alignItems: "center", gap: 11, background: CARD, border: `1px solid ${isRunning ? "rgba(34,197,94,0.15)" : isError ? "rgba(239,68,68,0.15)" : BORDER}` }}>
                <div style={{ width: 4, alignSelf: "stretch", borderRadius: 4, flexShrink: 0, background: accent, opacity: isRunning || isError ? 1 : 0.18 }} />
                <div style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: p.lang === "nodejs" ? "rgba(34,197,94,0.07)" : "rgba(96,165,250,0.07)", border: `1px solid ${p.lang === "nodejs" ? "rgba(34,197,94,0.13)" : "rgba(96,165,250,0.13)"}` }}>
                  <span style={{ fontSize: 14, fontWeight: 900, color: p.lang === "nodejs" ? "#4ade80" : "#60a5fa", lineHeight: 1 }}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: p.lang === "nodejs" ? "rgba(74,222,128,0.45)" : "rgba(96,165,250,0.45)", marginTop: 2 }}>{p.lang === "nodejs" ? "node" : "py3"}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{isRunning ? "Running" : isError ? "Error" : "Stopped"}</span>
                    {expiringSoon && <><span style={{ color: "rgba(255,255,255,0.1)", fontSize: 10 }}>·</span><span style={{ fontSize: 11, color: "#fbbf24", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} />{p.expires}d left</span></>}
                  </div>
                </div>
                <ChevronRight size={15} color="rgba(255,255,255,0.12)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem code — minimal inline row */}
      <div style={{ padding: "0 20px 32px" }}>
        <div style={{ borderRadius: 16, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, background: CARD, border: `1px solid rgba(251,191,36,0.12)` }}>
          <Gift size={14} color="#fbbf24" style={{ flexShrink: 0 }} />
          <div style={{ flex: 1, background: CARD2, borderRadius: 9, padding: "8px 11px", fontSize: 12, color: "rgba(255,255,255,0.18)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
            IDEV-XXXX-XXXX
          </div>
          <button style={{ fontSize: 12, fontWeight: 700, padding: "8px 14px", borderRadius: 9, background: "rgba(251,191,36,0.12)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.18)", cursor: "pointer", flexShrink: 0 }}>Claim</button>
        </div>
      </div>
    </div>
  );
}

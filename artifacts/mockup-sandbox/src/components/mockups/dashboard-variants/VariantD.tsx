import { LogOut, ShoppingCart, ChevronRight, Gift, Plus, Clock, Shield } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

function Sparkline({ color }: { color: string }) {
  return (
    <svg width="44" height="18" viewBox="0 0 44 18" fill="none">
      <polyline
        points="0,14 7,10 14,6 22,11 30,3 37,7 44,4"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerRackSVG() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" opacity="0.18">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(8,${6 + i * 16})`}>
          <rect x="0" y="0" width="60" height="11" rx="2" fill="#00e676" />
          <rect x="3" y="2.5" width="4" height="6" rx="1" fill="#07070d" />
          <rect x="9" y="2.5" width="4" height="6" rx="1" fill="#07070d" />
          <rect x="18" y="3.5" width="22" height="4" rx="1" fill="#07070d" opacity="0.6" />
          <circle cx="54" cy="5.5" r="2.5" fill={i === 0 ? "#00e676" : i === 2 ? "#ff4d4d" : "#1a2a1a"} />
        </g>
      ))}
      <rect x="8" y="70" width="60" height="3" rx="1.5" fill="#00e676" opacity="0.3" />
    </svg>
  );
}

function HexPattern() {
  const hexPoints = (cx: number, cy: number, r: number) => {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
    }).join(" ");
  };
  const positions = [[20,14],[44,14],[68,14],[32,34],[56,34],[80,34],[20,54],[44,54],[68,54]];
  return (
    <svg
      width="100"
      height="70"
      viewBox="0 0 100 70"
      fill="none"
      style={{ position: "absolute", right: 0, bottom: 0, opacity: 0.06, pointerEvents: "none" }}
    >
      {positions.map(([cx, cy], i) => (
        <polygon key={i} points={hexPoints(cx, cy, 10)} stroke="#00e676" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

export function VariantD() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#07070d",
        color: "#e0e4ef",
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 14,
        position: "relative",
        overflowX: "hidden",
      }}
    >
      {/* Dot grid background */}
      <svg
        style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0, opacity: 0.04 }}
      >
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#00e676" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div style={{ position: "relative", zIndex: 1 }}>

        {/* ── Header ── */}
        <div
          style={{
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background: "rgba(7,7,13,0.9)",
            backdropFilter: "blur(12px)",
            position: "sticky",
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Avatar with SVG pulse rings */}
            <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: "absolute", inset: 0 }}>
                <circle cx="22" cy="22" r="21" stroke="#00e676" strokeWidth="1" strokeOpacity="0.25" />
                <circle cx="22" cy="22" r="16" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.12" />
              </svg>
              <div
                style={{
                  position: "absolute",
                  top: 5,
                  left: 5,
                  right: 5,
                  bottom: 5,
                  borderRadius: "50%",
                  background: "#0d1a12",
                  border: "1px solid #00e67640",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: 13,
                  color: "#00e676",
                }}
              >
                JA
              </div>
              <div
                style={{
                  position: "absolute",
                  bottom: 1,
                  right: 1,
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#00e676",
                  border: "2px solid #07070d",
                  boxShadow: "0 0 6px #00e676",
                }}
              />
            </div>

            <div>
              <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>
                james<span style={{ color: "#00e676" }}>@idevhost</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 3 }}>
                {/* SVG star for premium */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="#f0b429">
                  <path d="M5 0.5L6.12 3.62H9.51L6.69 5.63L7.81 8.75L5 6.74L2.19 8.75L3.31 5.63L0.49 3.62H3.88L5 0.5Z" />
                </svg>
                <span style={{ fontSize: 11, color: "#f0b429", fontWeight: 600 }}>PREMIUM</span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <button
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "rgba(240,180,41,0.08)",
                border: "1px solid rgba(240,180,41,0.15)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Shield size={14} color="#f0b429" />
            </button>
            <button
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: "#111",
                border: "1px solid #1a1a2e",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <LogOut size={14} color="#333" />
            </button>
          </div>
        </div>

        <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 14 }}>

          {/* ── Stats row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {[
              { label: "PANELS", value: "3/5", color: "#00b0ff" },
              { label: "ONLINE", value: "1", color: "#00e676" },
              { label: "PLAN", value: "PRO", color: "#f0b429" },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "#0d0d1a",
                  border: `1px solid ${s.color}1a`,
                  borderRadius: 16,
                  padding: "13px 11px 9px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ fontSize: 9, color: "#333", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 5 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {s.value}
                </div>
                {/* Sparkline bottom-right */}
                <div style={{ position: "absolute", bottom: 4, right: 2, opacity: 0.35 }}>
                  <Sparkline color={s.color} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Buy banner with server rack SVG ── */}
          <div
            style={{
              background: "#0d0d1a",
              border: "1px solid rgba(0,230,118,0.12)",
              borderRadius: 18,
              padding: "16px 18px",
              position: "relative",
              overflow: "hidden",
              cursor: "pointer",
            }}
          >
            <HexPattern />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: "#fff" }}>Deploy a panel</div>
                <div style={{ fontSize: 12, color: "#444", marginTop: 5 }}>
                  From{" "}
                  <span style={{ color: "#00e676", fontWeight: 700 }}>₦1,400/mo</span>
                  {" · "}Node.js & Python
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    background: "#00e676",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 12,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  <ShoppingCart size={12} />
                  BUY NOW
                </div>
              </div>
              <ServerRackSVG />
            </div>
          </div>

          {/* ── Capacity bar ── */}
          <div
            style={{
              background: "#0d0d1a",
              border: "1px solid #1a1a2e",
              borderRadius: 12,
              padding: "12px 16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: "#333", letterSpacing: "0.1em", fontWeight: 600 }}>CAPACITY</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#00b0ff" }}>3 / 5</span>
            </div>
            <div style={{ height: 3, background: "#1a1a2e", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: "60%", height: "100%", background: "#00b0ff", borderRadius: 3 }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: "#2a2a3a" }}>
              2 slots free{" "}
              <span style={{ color: "#00e676", cursor: "pointer" }}>· buy more →</span>
            </div>
          </div>

          {/* ── Redeem code ── */}
          <div
            style={{ background: "#0d0d1a", border: "1px solid #1a1a2e", borderRadius: 14, overflow: "hidden" }}
          >
            {/* Window bar */}
            <div
              style={{
                background: "#0a0a14",
                borderBottom: "1px solid #1a1a2e",
                padding: "8px 14px",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#ff4d4d" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#f0b429" }} />
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: "#00e676" }} />
              </div>
              <span
                style={{ flex: 1, textAlign: "center", fontSize: 10, color: "#2a2a3a", letterSpacing: "0.08em" }}
              >
                redeem_code.sh
              </span>
              {/* Star SVG */}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#f0b429" opacity="0.5">
                <path d="M6 0.5L7.3 4.2H11.3L8.1 6.6L9.3 10.3L6 7.9L2.7 10.3L3.9 6.6L0.7 4.2H4.7L6 0.5Z" />
              </svg>
            </div>

            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: "#2a2a3a", marginBottom: 8, fontFamily: "monospace" }}>
                <span style={{ color: "#00e676" }}>$</span> enter your redemption code
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#07070d",
                  border: "1px solid #1a1a2e",
                  borderRadius: 8,
                  padding: "10px 12px",
                  marginBottom: 10,
                }}
              >
                <span style={{ color: "#00e676", fontWeight: 700, fontFamily: "monospace" }}>&gt;_</span>
                <span
                  style={{
                    color: "#1e1e2e",
                    fontFamily: "monospace",
                    letterSpacing: "0.18em",
                    fontSize: 13,
                    flex: 1,
                  }}
                >
                  IDEV-XXXX-XXXX
                </span>
              </div>
              <button
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "rgba(0,230,118,0.08)",
                  border: "1px solid rgba(0,230,118,0.25)",
                  borderRadius: 8,
                  color: "#00e676",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <Gift size={13} />
                REDEEM CODE
              </button>
            </div>
          </div>

          {/* ── Panels ── */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 10, color: "#2a2a3a", letterSpacing: "0.12em", fontWeight: 700 }}>
                YOUR PANELS
              </span>
              <button
                style={{
                  fontSize: 10,
                  color: "#00b0ff",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  background: "rgba(0,176,255,0.08)",
                  border: "1px solid rgba(0,176,255,0.2)",
                  borderRadius: 6,
                  padding: "4px 9px",
                  fontWeight: 600,
                }}
              >
                <Plus size={10} /> NEW
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {panels.map((p) => {
                const statusColor =
                  p.status === "running" ? "#00e676" : p.status === "error" ? "#ff4d4d" : "#1e1e2e";
                const statusLabel =
                  p.status === "running" ? "ONLINE" : p.status === "error" ? "ERROR" : "OFFLINE";
                const glow =
                  p.status === "running"
                    ? "0 0 8px rgba(0,230,118,0.3)"
                    : p.status === "error"
                    ? "0 0 8px rgba(255,77,77,0.3)"
                    : "none";
                const langColor = p.lang === "nodejs" ? "#00e676" : "#3b82f6";
                const langBg =
                  p.lang === "nodejs" ? "rgba(0,230,118,0.07)" : "rgba(59,130,246,0.07)";
                const langBorder =
                  p.lang === "nodejs"
                    ? "rgba(0,230,118,0.15)"
                    : "rgba(59,130,246,0.15)";

                return (
                  <div
                    key={p.id}
                    style={{
                      background: "#0d0d1a",
                      border: `1px solid ${statusColor}1a`,
                      borderRadius: 14,
                      padding: "13px 14px 13px 17px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    {/* Left accent strip */}
                    <div
                      style={{
                        position: "absolute",
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: 3,
                        background: statusColor,
                        boxShadow: glow,
                      }}
                    />

                    {/* Language icon */}
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 12,
                        background: langBg,
                        border: `1px solid ${langBorder}`,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{ fontSize: 15, fontWeight: 900, color: langColor, lineHeight: 1 }}
                      >
                        {p.lang === "nodejs" ? "JS" : "PY"}
                      </span>
                      <span style={{ fontSize: 9, color: langColor + "55", marginTop: 1 }}>
                        {p.lang === "nodejs" ? "node" : "py3"}
                      </span>
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: "#fff",
                          fontSize: 14,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#2a2a3a", marginTop: 2 }}>
                        {p.expires <= 5 ? (
                          <span
                            style={{
                              color: "#f0b429",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Clock size={10} />
                            {p.expires}d left
                          </span>
                        ) : p.lang === "nodejs" ? (
                          "Node.js 20"
                        ) : (
                          "Python 3.11"
                        )}
                      </div>
                    </div>

                    {/* Status badge */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                        background: `${statusColor}12`,
                        border: `1px solid ${statusColor}25`,
                        borderRadius: 6,
                        padding: "4px 8px",
                        flexShrink: 0,
                      }}
                    >
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: statusColor,
                          boxShadow: glow,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 9,
                          color: statusColor,
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>

                    <ChevronRight size={14} color="#1e1e2e" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Terminal footer ── */}
          <div
            style={{
              background: "#0d0d1a",
              border: "1px solid #1a1a2e",
              borderRadius: 10,
              padding: "10px 14px",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {/* Terminal chevron SVG */}
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <polyline
                points="1,3 5,6 1,9"
                stroke="#00e676"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line x1="6" y1="9" x2="11" y2="9" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "monospace", fontSize: 11, color: "#2a2a3a" }}>
              <span style={{ color: "#00e676" }}>james</span>
              {" · "}3 panels{" · "}
              <span style={{ color: "#00e676" }}>1 running</span>
              {" · "}premium
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

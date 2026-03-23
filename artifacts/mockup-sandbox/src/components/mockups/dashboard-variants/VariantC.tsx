import { Server, Activity, Zap, Plus, LogOut, ShoppingCart, Clock, AlertCircle, ChevronRight, Gift, Bell } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

export function VariantC() {
  return (
    <div className="min-h-screen bg-[#0c0c0f] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Hero header */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-white/40 mb-1">Welcome back</p>
            <h1 className="text-3xl font-black text-white tracking-tight">james</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40">
              <Bell size={15} />
            </button>
            <button className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-white/40">
              <LogOut size={15} />
            </button>
          </div>
        </div>

        {/* Usage ring + stats */}
        <div className="flex items-center gap-5">
          {/* Ring */}
          <div className="relative flex-shrink-0">
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="30" fill="none" stroke="#1c1c22" strokeWidth="6" />
              <circle
                cx="36" cy="36" r="30"
                fill="none"
                stroke="#22c55e"
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 30}`}
                strokeDashoffset={`${2 * Math.PI * 30 * (1 - 3/5)}`}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-white leading-none">3</span>
              <span className="text-[9px] text-white/30 leading-none mt-0.5">of 5</span>
            </div>
          </div>

          {/* Stat pills */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-sm text-white/70"><span className="font-bold text-white">1</span> panel online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-sm text-white/70"><span className="font-bold text-white">Premium</span> plan active</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/20" />
              <span className="text-sm text-white/40">2 slots available</span>
            </div>
          </div>
        </div>
      </div>

      {/* Buy banner */}
      <div className="px-5 mb-5">
        <div
          className="rounded-2xl p-4 cursor-pointer flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/[0.08] flex items-center justify-center">
              <ShoppingCart size={18} className="text-white/60" />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Add a panel</p>
              <p className="text-xs text-white/35 mt-0.5">From <span className="text-emerald-400 font-semibold">₦1,400/mo</span></p>
            </div>
          </div>
          <div className="text-xs font-bold bg-emerald-500 text-black px-4 py-2 rounded-xl">
            Buy Now
          </div>
        </div>
      </div>

      {/* Panels */}
      <div className="px-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Panels</p>
          <button className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
            <Plus size={12} /> New
          </button>
        </div>

        <div className="space-y-2">
          {panels.map(p => {
            const isRunning = p.status === "running";
            const isError = p.status === "error";
            const expiringSoon = p.expires <= 5;
            const accentColor = isRunning ? "#22c55e" : isError ? "#ef4444" : "#334155";
            const statusLabel = isRunning ? "Running" : isError ? "Error" : "Stopped";
            const statusTextColor = isRunning ? "text-emerald-400" : isError ? "text-red-400" : "text-slate-600";

            return (
              <div
                key={p.id}
                className="rounded-2xl p-4 cursor-pointer flex items-center gap-3 group"
                style={{ background: "#141418", border: `1px solid ${isRunning ? "#22c55e20" : isError ? "#ef444420" : "#ffffff08"}` }}
              >
                {/* Left accent */}
                <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: accentColor, opacity: isRunning || isError ? 1 : 0.2 }} />

                {/* Lang icon */}
                <div
                  className="w-11 h-11 rounded-2xl flex flex-col items-center justify-center flex-shrink-0"
                  style={{
                    background: p.lang === "nodejs" ? "rgba(34,197,94,0.08)" : "rgba(59,130,246,0.08)",
                    border: p.lang === "nodejs" ? "1px solid rgba(34,197,94,0.15)" : "1px solid rgba(59,130,246,0.15)",
                  }}
                >
                  <span className="text-base font-black leading-none" style={{ color: p.lang === "nodejs" ? "#4ade80" : "#60a5fa" }}>
                    {p.lang === "nodejs" ? "JS" : "PY"}
                  </span>
                  <span className="text-[9px] mt-0.5 font-medium" style={{ color: p.lang === "nodejs" ? "#4ade8060" : "#60a5fa60" }}>
                    {p.lang === "nodejs" ? "node" : "py3"}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{p.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className={`text-[11px] font-medium ${statusTextColor}`}>{statusLabel}</span>
                    {expiringSoon && (
                      <>
                        <span className="text-white/10">·</span>
                        <span className="text-[11px] text-amber-400 flex items-center gap-1">
                          <Clock size={9} />{p.expires}d left
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} className="text-white/10 group-hover:text-white/30 transition-colors flex-shrink-0" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Redeem */}
      <div className="px-5 pb-8">
        <div className="rounded-2xl p-4" style={{ background: "#141418", border: "1px solid #ffffff08" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(251,191,36,0.1)" }}>
              <Gift size={15} className="text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Redeem a code</p>
              <p className="text-[11px] text-white/30">Unlock free panel slots</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div
              className="flex-1 rounded-xl px-3 py-2.5 text-xs text-white/20 font-mono tracking-widest"
              style={{ background: "#0c0c0f", border: "1px solid #ffffff08" }}
            >
              IDEV-XXXX-XXXX
            </div>
            <button className="text-xs font-bold px-5 py-2.5 rounded-xl transition-colors" style={{ background: "rgba(251,191,36,0.15)", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.2)" }}>
              Claim
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

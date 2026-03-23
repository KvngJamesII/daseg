import { Server, Activity, Zap, Plus, LogOut, ShoppingCart, Clock, AlertCircle, ChevronRight, Gift, RefreshCw, Shield } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

export function VariantA() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top nav */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.08] flex items-center justify-center text-xs font-bold text-white/80">
            JA
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">james</p>
            <p className="text-[11px] text-white/30 mt-0.5">Premium</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-white/30">
            <RefreshCw size={14} />
          </button>
          <button className="w-8 h-8 rounded-md hover:bg-white/[0.06] flex items-center justify-center text-white/30">
            <LogOut size={14} />
          </button>
        </div>
      </div>

      <div className="px-5 pt-6 pb-24 space-y-6">

        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Good morning</h1>
          <p className="text-white/40 text-sm mt-1">3 of 5 panel slots used</p>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-6 border-b border-white/[0.06] pb-6">
          <div>
            <p className="text-3xl font-bold text-white tabular-nums">3</p>
            <p className="text-[11px] text-white/30 mt-0.5 uppercase tracking-wider">Panels</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div>
            <p className="text-3xl font-bold text-emerald-400 tabular-nums">1</p>
            <p className="text-[11px] text-white/30 mt-0.5 uppercase tracking-wider">Running</p>
          </div>
          <div className="w-px h-8 bg-white/[0.08]" />
          <div>
            <p className="text-3xl font-bold text-amber-400 tabular-nums">PRO</p>
            <p className="text-[11px] text-white/30 mt-0.5 uppercase tracking-wider">Plan</p>
          </div>
        </div>

        {/* Panels section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-white/30 uppercase tracking-widest font-medium">Your panels</p>
            <button className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors bg-white/[0.06] px-2.5 py-1 rounded-md">
              <Plus size={12} /> New
            </button>
          </div>

          {panels.map((p, i) => {
            const isRunning = p.status === "running";
            const isError = p.status === "error";
            const expiringSoon = p.expires <= 5;
            return (
              <div key={p.id}>
                <div className="flex items-center gap-3 py-3 cursor-pointer group">
                  {/* Status dot */}
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isRunning ? "bg-emerald-400" : isError ? "bg-red-400" : "bg-white/20"}`} />

                  {/* Lang badge */}
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${
                    p.lang === "nodejs" ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"
                  }`}>
                    {p.lang === "nodejs" ? "JS" : "PY"}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 truncate group-hover:text-white transition-colors">{p.name}</p>
                    <p className="text-[11px] text-white/30 mt-0.5">
                      {expiringSoon
                        ? <span className="text-amber-400">{p.expires}d left</span>
                        : p.lang === "nodejs" ? "Node.js 20" : "Python 3.11"
                      }
                    </p>
                  </div>

                  {/* Status label */}
                  <p className={`text-[11px] font-medium flex-shrink-0 ${isRunning ? "text-emerald-400" : isError ? "text-red-400" : "text-white/25"}`}>
                    {isRunning ? "Running" : isError ? "Error" : "Stopped"}
                  </p>
                  <ChevronRight size={14} className="text-white/15 group-hover:text-white/40 transition-colors flex-shrink-0" />
                </div>
                {i < panels.length - 1 && <div className="h-px bg-white/[0.05] ml-11" />}
              </div>
            );
          })}
        </div>

        {/* Buy + Redeem */}
        <div className="space-y-3">
          {/* Buy */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 cursor-pointer hover:bg-white/[0.05] transition-colors flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                <ShoppingCart size={18} className="text-white/60" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Get a panel</p>
                <p className="text-xs text-white/35 mt-0.5">From <span className="text-emerald-400">₦1,400/mo</span></p>
              </div>
            </div>
            <div className="text-xs font-semibold bg-white text-black px-3 py-1.5 rounded-lg">
              Buy →
            </div>
          </div>

          {/* Redeem */}
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-3">
              <Gift size={14} className="text-white/40" />
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Redeem code</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white/20 font-mono tracking-widest">
                IDEV-XXXX-XXXX
              </div>
              <button className="bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.08] text-white text-xs font-semibold px-4 rounded-xl transition-colors">
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

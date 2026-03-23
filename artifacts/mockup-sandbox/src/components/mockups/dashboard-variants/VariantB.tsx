import { Server, Activity, Zap, Plus, LogOut, ShoppingCart, Clock, AlertCircle, ChevronRight, Gift, Settings } from "lucide-react";

const panels = [
  { id: 1, name: "discord-bot-v2", lang: "nodejs", status: "running", expires: 12 },
  { id: 2, name: "price-scraper", lang: "python", status: "stopped", expires: 5 },
  { id: 3, name: "api-gateway", lang: "nodejs", status: "error", expires: 28 },
];

export function VariantB() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Header */}
      <div className="px-4 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Dashboard</p>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[11px] font-bold text-white">J</div>
              <h1 className="text-lg font-bold text-white">james</h1>
              <span className="text-[10px] font-bold text-violet-400 bg-violet-400/10 border border-violet-400/20 px-2 py-0.5 rounded-full">PRO</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
              <Settings size={15} />
            </button>
            <button className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center text-slate-400">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <div className="px-4 mb-5">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-white tabular-nums">3<span className="text-slate-600 text-base font-normal">/5</span></p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Panels</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <p className="text-2xl font-black text-emerald-400 tabular-nums">1</p>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Online</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center flex-1">
              <p className="text-2xl font-black text-violet-400">PRO</p>
              <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wider">Plan</p>
            </div>
          </div>
          {/* Usage bar */}
          <div className="mt-4">
            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="w-[60%] h-full bg-violet-500 rounded-full" />
            </div>
            <p className="text-[10px] text-slate-600 mt-1.5">2 slots remaining</p>
          </div>
        </div>
      </div>

      {/* Panel grid */}
      <div className="px-4 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Your Panels</p>
          <button className="flex items-center gap-1.5 text-xs text-violet-400 bg-violet-400/10 border border-violet-400/20 px-3 py-1.5 rounded-lg font-semibold">
            <Plus size={12} /> New Panel
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {panels.map(p => {
            const isRunning = p.status === "running";
            const isError = p.status === "error";
            const expiringSoon = p.expires <= 5;
            const statusColor = isRunning ? "#34d399" : isError ? "#f87171" : "#475569";
            const statusLabel = isRunning ? "Online" : isError ? "Error" : "Offline";
            const langColor = p.lang === "nodejs" ? { bg: "bg-green-500/10", text: "text-green-400", border: "border-green-500/20" } : { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" };

            return (
              <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 transition-colors relative overflow-hidden">
                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{ background: statusColor }} />

                <div className={`w-12 h-12 rounded-2xl ${langColor.bg} border ${langColor.border} flex flex-col items-center justify-center mb-3`}>
                  <span className={`text-lg font-black ${langColor.text}`}>{p.lang === "nodejs" ? "JS" : "PY"}</span>
                </div>

                <p className="text-sm font-semibold text-white truncate mb-1">{p.name}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: statusColor }} />
                  <span className="text-[11px]" style={{ color: statusColor }}>{statusLabel}</span>
                </div>
                {expiringSoon && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <Clock size={10} className="text-amber-400" />
                    <span className="text-[10px] text-amber-400">{p.expires}d left</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add panel card */}
          <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-4 cursor-pointer hover:border-slate-700 hover:bg-slate-900 transition-colors flex flex-col items-center justify-center gap-2 min-h-[120px]">
            <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center">
              <Plus size={18} className="text-slate-500" />
            </div>
            <p className="text-xs text-slate-500 text-center">Buy a panel</p>
          </div>
        </div>
      </div>

      {/* Buy + Redeem */}
      <div className="px-4 space-y-3 pb-8">
        {/* Buy */}
        <div className="bg-violet-600 rounded-2xl p-4 cursor-pointer flex items-center justify-between">
          <div>
            <p className="font-bold text-white text-sm">Get more panels</p>
            <p className="text-violet-200 text-xs mt-0.5">From ₦1,400/month</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
            <ShoppingCart size={18} className="text-white" />
          </div>
        </div>

        {/* Redeem */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={15} className="text-amber-400" />
            <p className="text-sm font-semibold text-white">Got a code?</p>
            <span className="text-xs text-slate-500">Redeem for free slots</span>
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-500 font-mono tracking-widest">
              IDEV-XXXX-XXXX
            </div>
            <button className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 rounded-xl transition-colors">
              Redeem
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

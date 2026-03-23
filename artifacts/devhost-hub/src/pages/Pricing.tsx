import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Terminal,
  ArrowLeft,
  Check,
  Loader2,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  MemoryStick,
  Cpu,
  HardDrive,
  Rocket,
  Star,
  Users,
  Clock,
} from 'lucide-react';

// ─── Pricing constants ────────────────────────────────────────────────────────
const BASE_KOBO = 140000;         // ₦1,400 — 500MB RAM, 0.5 CPU, 1GB storage

// RAM: ₦200 per extra 128MB above 500MB
const RAM_MIN = 500;
const RAM_MAX = 2048;
const RAM_STEP = 128;
const RAM_EXTRA_PER_SLAB = 20000; // ₦200 per 128MB slab

// CPU: ₦300 per 0.25 core above 0.5
const CPU_OPTIONS = [0.5, 1, 1.5, 2];
const CPU_BASE = 0.5;
const CPU_PRICE_PER_QUARTER = 30000; // ₦300 per 0.25 core

// Storage: ₦500 per extra 512MB above 1GB (max 4GB)
const STORAGE_MIN = 1024;  // MB
const STORAGE_MAX = 4096;  // MB
const STORAGE_STEP = 512;
const STORAGE_EXTRA_PER_SLAB = 50000; // ₦500 per 512MB slab

function calcTotal(ramMb: number, cpuCores: number, storageMb: number): number {
  const ramExtra = Math.max(0, Math.floor((ramMb - RAM_MIN) / RAM_STEP)) * RAM_EXTRA_PER_SLAB;
  const cpuExtra = Math.max(0, Math.round((cpuCores - CPU_BASE) / 0.25)) * CPU_PRICE_PER_QUARTER;
  const storageExtra = Math.max(0, Math.floor((storageMb - STORAGE_MIN) / STORAGE_STEP)) * STORAGE_EXTRA_PER_SLAB;
  return BASE_KOBO + ramExtra + cpuExtra + storageExtra;
}

function fmt(kobo: number) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(kobo / 100);
}

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  displayFn,
  extraPrice,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayFn: (v: number) => string;
  extraPrice: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {icon}
          {label}
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-foreground text-sm">{displayFn(value)}</span>
          {extraPrice > 0 && (
            <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
              +{fmt(extraPrice)}/mo
            </span>
          )}
        </div>
      </div>
      <div className="relative py-1">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${pct}%, hsl(var(--muted)) ${pct}%, hsl(var(--muted)) 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground font-mono">
        <span>{displayFn(min)}</span>
        <span>{displayFn(Math.round((min + max) / 2 / step) * step)}</span>
        <span>{displayFn(max)}</span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const [purchasing, setPurchasing] = useState<'basic' | 'advanced' | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [panelName, setPanelName] = useState('');
  const [stack, setStack] = useState<'nodejs' | 'python'>('nodejs');
  const [ramMb, setRamMb] = useState(500);
  const [cpuCores, setCpuCores] = useState(0.5);
  const [storageMb, setStorageMb] = useState(1024);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth?redirect=/pricing');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const reference = searchParams.get('reference') || searchParams.get('trxref');
    if (reference) verifyPayment(reference);
  }, [searchParams]);

  const advancedTotal = useMemo(() => calcTotal(ramMb, cpuCores, storageMb), [ramMb, cpuCores, storageMb]);
  const ramExtra = useMemo(() => Math.max(0, Math.floor((ramMb - RAM_MIN) / RAM_STEP)) * RAM_EXTRA_PER_SLAB, [ramMb]);
  const cpuExtra = useMemo(() => Math.max(0, Math.round((cpuCores - CPU_BASE) / 0.25)) * CPU_PRICE_PER_QUARTER, [cpuCores]);
  const storageExtra = useMemo(() => Math.max(0, Math.floor((storageMb - STORAGE_MIN) / STORAGE_STEP)) * STORAGE_EXTRA_PER_SLAB, [storageMb]);

  const verifyPayment = async (reference: string) => {
    setPurchasing('basic');
    try {
      const { data, error } = await supabase.functions.invoke('paystack', { body: { action: 'verify', reference } });
      if (error) throw error;
      if (data.success && data.status === 'success') {
        toast({ title: 'Payment Successful! 🎉', description: data.message || 'Your panel has been created — check your dashboard!' });
        navigate('/dashboard', { replace: true });
      } else {
        toast({ title: 'Payment Failed', description: data.message || 'Payment was not completed.', variant: 'destructive' });
        navigate('/pricing', { replace: true });
      }
    } catch (e: any) {
      toast({ title: 'Verification Error', description: e.message, variant: 'destructive' });
      navigate('/pricing', { replace: true });
    }
    setPurchasing(null);
  };

  const handlePurchase = async (type: 'basic' | 'advanced') => {
    if (!user) { navigate('/auth?redirect=/pricing'); return; }
    if (type === 'advanced' && !panelName.trim()) {
      toast({ title: 'Panel name required', description: 'Enter a name for your panel in the Advanced options', variant: 'destructive' });
      return;
    }
    setPurchasing(type);
    try {
      const amount = type === 'basic' ? BASE_KOBO : advancedTotal;
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: {
          action: 'initialize',
          email: user.email,
          amount,
          user_id: user.id,
          callback_url: `${window.location.origin}/pricing`,
          panels_count: 1,
          duration_months: 1,
          panel_name: type === 'advanced' ? panelName.trim() : undefined,
          panel_language: type === 'advanced' ? stack : undefined,
          panel_ram_mb: type === 'advanced' ? ramMb : 500,
          panel_cpu_cores: type === 'advanced' ? cpuCores : 0.5,
          panel_storage_mb: type === 'advanced' ? storageMb : 1024,
        },
      });
      if (error) throw error;
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
      setPurchasing(null);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Terminal className="w-12 h-12 text-primary animate-pulse" />
      </div>
    );
  }

  if (purchasing && searchParams.get('reference')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="font-mono text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border px-4 py-3 flex items-center gap-3">
        <Link to="/dashboard">
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Terminal className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="font-mono font-bold text-sm text-foreground">Hosting Plans</h1>
          <p className="text-xs text-muted-foreground font-mono">Secure · Instant · Reliable</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 space-y-6">

        {/* Hero */}
        <div className="pt-6 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono font-semibold">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Paystack Secured · Instant Activation
          </div>
          <h2 className="text-3xl font-bold text-foreground leading-tight">
            Ship your app <span className="text-primary">today</span>
          </h2>
          <p className="text-muted-foreground text-sm max-w-xs mx-auto">
            Start with the Basic plan or fully customize your server specs. No DevOps needed.
          </p>
        </div>

        {/* Social proof strip */}
        <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span>500+ developers</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
            <span>4.9 / 5 rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>99.9% uptime</span>
          </div>
        </div>

        {/* ── BASIC PLAN CARD ─────────────────────────────────────────────── */}
        <div className="relative rounded-2xl overflow-hidden border border-primary/30 bg-card shadow-lg">
          {/* Glow top bar */}
          <div className="h-1 w-full bg-gradient-to-r from-primary via-primary/60 to-primary/20" />

          {/* Popular badge */}
          <div className="absolute top-4 right-4">
            <div className="flex items-center gap-1 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-primary/30">
              <Zap className="w-3 h-3" />
              MOST POPULAR
            </div>
          </div>

          <div className="p-6 space-y-5">
            {/* Plan name + price */}
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest mb-1">Basic Plan</p>
              <div className="flex items-end gap-2">
                <span className="text-5xl font-bold font-mono text-foreground">₦1,400</span>
                <span className="text-muted-foreground text-sm mb-1">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">One panel · 1 month · no hidden fees</p>
            </div>

            {/* Spec chips */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: <MemoryStick className="w-3.5 h-3.5" />, label: '500 MB RAM' },
                { icon: <Cpu className="w-3.5 h-3.5" />, label: '0.5 CPU' },
                { icon: <HardDrive className="w-3.5 h-3.5" />, label: '1 GB Storage' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40 border border-border">
                  <span className="text-primary">{icon}</span>
                  <span className="text-xs font-mono font-semibold text-foreground">{label}</span>
                </div>
              ))}
            </div>

            {/* Features */}
            <ul className="space-y-2">
              {[
                'Node.js & Python support',
                'Auto-restart on crash',
                'Web file manager & console',
                '24/7 uptime monitoring',
                'Instant panel activation',
                'Telegram support',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm">
                  <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <div className="space-y-3 pt-1">
              <Button
                className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:scale-[1.01]"
                onClick={() => handlePurchase('basic')}
                disabled={!!purchasing}
              >
                {purchasing === 'basic' ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                ) : (
                  <><Rocket className="w-4 h-4 mr-2" />Get Started — ₦1,400/mo</>
                )}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                By paying you agree to our{' '}
                <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                {' '}· No Refunds
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground font-mono">OR CUSTOMIZE</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* ── ADVANCED OPTIONS CARD ────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Toggle header */}
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors group"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-foreground text-sm">Build Your Own Plan</p>
                <p className="text-xs text-muted-foreground">Set name, stack, RAM, CPU & storage</p>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full border border-border flex items-center justify-center transition-colors ${showAdvanced ? 'bg-primary/10 border-primary/30' : 'group-hover:border-accent/30'}`}>
              {showAdvanced
                ? <ChevronUp className="w-4 h-4 text-primary" />
                : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </div>
          </button>

          {showAdvanced && (
            <div className="border-t border-border">
              {/* Live price bar */}
              <div className="px-5 py-3 bg-primary/5 border-b border-primary/15 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  Live price preview
                </div>
                <div className="flex items-center gap-3">
                  {[
                    ramExtra > 0 && `RAM +${fmt(ramExtra)}`,
                    cpuExtra > 0 && `CPU +${fmt(cpuExtra)}`,
                    storageExtra > 0 && `Storage +${fmt(storageExtra)}`,
                  ].filter(Boolean).map((label) => (
                    <span key={String(label)} className="text-xs text-muted-foreground font-mono">{label}</span>
                  ))}
                  <span className="text-xl font-bold font-mono text-primary">{fmt(advancedTotal)}</span>
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>
              </div>

              <div className="px-5 py-5 space-y-7">
                {/* Panel name */}
                <div className="space-y-2">
                  <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Panel Name *</Label>
                  <Input
                    placeholder="e.g. my-discord-bot"
                    value={panelName}
                    onChange={(e) => setPanelName(e.target.value)}
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">This will be the identifier for your panel.</p>
                </div>

                {/* Stack */}
                <div className="space-y-3">
                  <Label className="text-xs font-mono uppercase tracking-wide text-muted-foreground">Runtime</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { key: 'nodejs', code: 'JS', label: 'Node.js', color: 'nodejs' },
                      { key: 'python', code: 'PY', label: 'Python', color: 'python' },
                    ] as const).map(({ key, code, label, color }) => (
                      <button
                        key={key}
                        onClick={() => setStack(key)}
                        className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                          stack === key
                            ? `border-${color} bg-${color}/10`
                            : `border-border hover:border-${color}/40`
                        }`}
                      >
                        {stack === key && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-primary-foreground" />
                          </div>
                        )}
                        <span className={`font-mono font-black text-3xl block text-${color}`}>{code}</span>
                        <p className="text-sm text-muted-foreground mt-1">{label}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* RAM Slider */}
                <SliderRow
                  icon={<MemoryStick className="w-4 h-4 text-primary" />}
                  label="RAM"
                  value={ramMb}
                  min={RAM_MIN}
                  max={RAM_MAX}
                  step={RAM_STEP}
                  displayFn={(v) => v >= 1024 ? `${(v / 1024).toFixed(1)} GB` : `${v} MB`}
                  extraPrice={ramExtra}
                  onChange={setRamMb}
                />

                {/* CPU Selector */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Cpu className="w-4 h-4 text-primary" />
                      CPU Cores
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-foreground text-sm">{cpuCores} core{cpuCores !== 1 ? 's' : ''}</span>
                      {cpuExtra > 0 && (
                        <span className="text-xs text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full font-mono">
                          +{fmt(cpuExtra)}/mo
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {CPU_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCpuCores(c)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-mono font-semibold transition-all ${
                          cpuCores === c
                            ? 'border-primary bg-primary/10 text-primary shadow-inner'
                            : 'border-border text-muted-foreground hover:border-primary/40'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">Higher cores = more parallel processing power.</p>
                </div>

                {/* Storage Slider */}
                <SliderRow
                  icon={<HardDrive className="w-4 h-4 text-primary" />}
                  label="Storage"
                  value={storageMb}
                  min={STORAGE_MIN}
                  max={STORAGE_MAX}
                  step={STORAGE_STEP}
                  displayFn={(v) => `${(v / 1024).toFixed(1)} GB`}
                  extraPrice={storageExtra}
                  onChange={setStorageMb}
                />

                {/* Price breakdown */}
                <div className="rounded-xl bg-muted/30 border border-border divide-y divide-border overflow-hidden">
                  {[
                    { label: 'Base plan (500 MB, 0.5 CPU, 1 GB)', value: BASE_KOBO },
                    ...(ramExtra > 0 ? [{ label: `RAM upgrade (+${ramMb - 500} MB)`, value: ramExtra }] : []),
                    ...(cpuExtra > 0 ? [{ label: `CPU upgrade (+${cpuCores - CPU_BASE} core${cpuCores - CPU_BASE !== 1 ? 's' : ''})`, value: cpuExtra }] : []),
                    ...(storageExtra > 0 ? [{ label: `Storage upgrade (+${((storageMb - STORAGE_MIN) / 1024).toFixed(1)} GB)`, value: storageExtra }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center px-4 py-2.5 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-mono font-semibold text-foreground">{fmt(value)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center px-4 py-3 bg-primary/5">
                    <span className="font-semibold text-foreground">Total / month</span>
                    <span className="font-mono font-bold text-primary text-lg">{fmt(advancedTotal)}</span>
                  </div>
                </div>

                {/* Advanced Buy Button */}
                <Button
                  className="w-full h-12 text-base font-bold bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all hover:shadow-accent/35 hover:scale-[1.01]"
                  onClick={() => handlePurchase('advanced')}
                  disabled={!!purchasing || !panelName.trim()}
                >
                  {purchasing === 'advanced' ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
                  ) : (
                    <><Zap className="w-4 h-4 mr-2" />Buy Custom Plan — {fmt(advancedTotal)}/mo</>
                  )}
                </Button>
                {!panelName.trim() && (
                  <p className="text-xs text-center text-warning">Enter a panel name above to enable purchase</p>
                )}
                <p className="text-center text-xs text-muted-foreground">
                  By paying you agree to our{' '}
                  <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  {' '}· No Refunds
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Trust row */}
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground py-2">
          <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-success" />Secure via Paystack</span>
          <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-primary" />Instant activation</span>
          <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-success" />No hidden fees</span>
        </div>

        <p className="text-center text-sm text-muted-foreground pb-2">
          Questions?{' '}
          <a href="https://t.me/theidledeveloper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Chat on Telegram
          </a>
        </p>
      </main>

      {/* Floating support button */}
      <a
        href="https://t.me/theidledeveloper"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-50"
        title="Contact Support"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default Pricing;

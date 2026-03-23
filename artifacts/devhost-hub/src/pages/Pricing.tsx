import { useState, useEffect } from 'react';
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
  Server,
  ChevronDown,
  ChevronUp,
  Zap,
  Shield,
  MemoryStick,
  Cpu,
  HardDrive,
} from 'lucide-react';

const BASE_PRICE_KOBO = 140000; // ₦1,400 in kobo
const RAM_STEP = 128; // MB
const RAM_MIN = 500;
const RAM_MAX = 2048;
const CPU_OPTIONS = [0.25, 0.5, 1, 2];

function ramToExtraKobo(ramMb: number): number {
  const extraRam = Math.max(0, ramMb - 500);
  const extraSlabs = Math.floor(extraRam / 128);
  return extraSlabs * 20000; // ₦200 per extra 128MB slab
}

function formatPrice(kobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const [loading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [panelName, setPanelName] = useState('');
  const [stack, setStack] = useState<'nodejs' | 'python'>('nodejs');
  const [ramMb, setRamMb] = useState(500);
  const [cpuCores, setCpuCores] = useState(0.5);
  const [months, setMonths] = useState(1);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=/pricing');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');
    if (reference || trxref) {
      verifyPayment(reference || trxref!);
    }
  }, [searchParams]);

  const totalKobo = (BASE_PRICE_KOBO + ramToExtraKobo(ramMb)) * months;

  const verifyPayment = async (reference: string) => {
    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: { action: 'verify', reference },
      });
      if (error) throw error;
      if (data.success && data.status === 'success') {
        toast({ title: 'Payment Successful!', description: data.message || 'Your panel has been created' });
        navigate('/dashboard', { replace: true });
      } else {
        toast({ title: 'Payment Failed', description: data.message || 'Payment was not successful', variant: 'destructive' });
        navigate('/pricing', { replace: true });
      }
    } catch (error: any) {
      toast({ title: 'Verification Error', description: error.message || 'Could not verify payment', variant: 'destructive' });
      navigate('/pricing', { replace: true });
    }
    setPurchasing(false);
  };

  const handlePurchase = async () => {
    if (!user) { navigate('/auth?redirect=/pricing'); return; }
    if (showAdvanced && !panelName.trim()) {
      toast({ title: 'Panel name required', description: 'Please enter a name for your panel', variant: 'destructive' });
      return;
    }

    setPurchasing(true);
    try {
      const callback_url = `${window.location.origin}/pricing`;
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: {
          action: 'initialize',
          email: user.email,
          amount: totalKobo,
          user_id: user.id,
          callback_url,
          panels_count: 1,
          duration_months: months,
          panel_name: showAdvanced ? panelName.trim() : undefined,
          panel_language: showAdvanced ? stack : undefined,
          panel_ram_mb: showAdvanced ? ramMb : 500,
          panel_cpu_cores: showAdvanced ? cpuCores : 0.5,
        },
      });
      if (error) throw error;
      if (data.success && data.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error(data.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to initiate payment', variant: 'destructive' });
      setPurchasing(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Terminal className="w-12 h-12 mx-auto text-primary animate-pulse mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (purchasing && searchParams.get('reference')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto text-primary animate-spin mb-4" />
          <p className="text-muted-foreground font-mono text-sm">Verifying payment...</p>
        </div>
      </div>
    );
  }

  const ramPercent = ((ramMb - RAM_MIN) / (RAM_MAX - RAM_MIN)) * 100;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Terminal className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-mono font-bold text-lg text-foreground">Buy a Panel</h1>
            <p className="text-xs text-muted-foreground font-mono">Instant activation · Paystack secured</p>
          </div>
        </div>
      </header>

      <main className="p-4 pb-28 max-w-lg mx-auto space-y-4">
        {/* Badge */}
        <div className="text-center pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 font-mono text-xs text-primary">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Secure Payments via Paystack
          </div>
        </div>

        {/* Basic Plan Card */}
        <div className="rounded-2xl border border-primary/40 bg-card overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-5 py-4 border-b border-primary/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-lg text-foreground">Basic Plan</p>
                <p className="text-xs text-muted-foreground mt-0.5">Perfect for personal projects & bots</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-mono font-bold text-primary">{formatPrice(totalKobo)}</p>
                <p className="text-xs text-muted-foreground">/{months === 1 ? 'month' : `${months} months`}</p>
              </div>
            </div>
          </div>

          {/* Specs */}
          <div className="px-5 py-4 grid grid-cols-3 gap-3 border-b border-border">
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
              <MemoryStick className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-mono">RAM</p>
              <p className="text-sm font-mono font-bold text-foreground">{ramMb}MB</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
              <Cpu className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-mono">CPU</p>
              <p className="text-sm font-mono font-bold text-foreground">{cpuCores} core{cpuCores !== 1 ? 's' : ''}</p>
            </div>
            <div className="flex flex-col items-center gap-1 p-3 rounded-xl bg-muted/40">
              <HardDrive className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground font-mono">Storage</p>
              <p className="text-sm font-mono font-bold text-foreground">1 GB</p>
            </div>
          </div>

          {/* Includes */}
          <div className="px-5 py-4 space-y-2 border-b border-border">
            {[
              'Node.js & Python support',
              'Auto-restart on crash',
              '24/7 uptime monitoring',
              'Web file manager',
              'Console / log viewer',
              'Instant activation',
            ].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                <span>{f}</span>
              </div>
            ))}
          </div>

          {/* Duration */}
          <div className="px-5 py-4 border-b border-border">
            <p className="text-xs font-mono text-muted-foreground uppercase mb-3">Duration</p>
            <div className="flex gap-2">
              {[1, 3, 6, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMonths(m)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-mono transition-all ${
                    months === m
                      ? 'border-primary bg-primary/10 text-primary font-bold'
                      : 'border-border text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {m}mo
                </button>
              ))}
            </div>
          </div>

          {/* Buy Button */}
          <div className="px-5 py-4">
            <Button
              className="w-full h-12 font-mono text-base bg-gradient-primary hover:opacity-90"
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>
              ) : (
                <><Zap className="w-4 h-4 mr-2" />Pay {formatPrice(totalKobo)}</>
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground mt-2">
              By paying you agree to our{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
              {' '}including the No Refund Policy.
            </p>
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <div className="flex items-center gap-3">
              <Server className="w-5 h-5 text-muted-foreground" />
              <div className="text-left">
                <p className="font-mono font-semibold text-foreground text-sm">Advanced Options</p>
                <p className="text-xs text-muted-foreground">Customize your panel name, stack & resources</p>
              </div>
            </div>
            {showAdvanced ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </button>

          {showAdvanced && (
            <div className="px-5 pb-5 space-y-6 border-t border-border pt-4">
              {/* Panel Name */}
              <div className="space-y-2">
                <Label htmlFor="panel-name" className="font-mono text-xs uppercase text-muted-foreground">Panel Name</Label>
                <Input
                  id="panel-name"
                  placeholder="my-awesome-bot"
                  value={panelName}
                  onChange={(e) => setPanelName(e.target.value)}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">Letters, numbers, and hyphens only. Used as your panel identifier.</p>
              </div>

              {/* Stack */}
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase text-muted-foreground">Runtime Stack</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setStack('nodejs')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      stack === 'nodejs' ? 'border-nodejs bg-nodejs/10' : 'border-border hover:border-nodejs/50'
                    }`}
                  >
                    <span className="font-mono font-bold text-2xl text-nodejs block">JS</span>
                    <p className="text-sm text-muted-foreground mt-1">Node.js</p>
                  </button>
                  <button
                    onClick={() => setStack('python')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      stack === 'python' ? 'border-python bg-python/10' : 'border-border hover:border-python/50'
                    }`}
                  >
                    <span className="font-mono font-bold text-2xl text-python block">PY</span>
                    <p className="text-sm text-muted-foreground mt-1">Python</p>
                  </button>
                </div>
              </div>

              {/* RAM Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                    <MemoryStick className="w-3.5 h-3.5" /> RAM
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground text-sm">{ramMb} MB</span>
                    {ramMb > 500 && (
                      <span className="text-xs text-primary font-mono">+{formatPrice(ramToExtraKobo(ramMb))}/mo</span>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min={RAM_MIN}
                    max={RAM_MAX}
                    step={RAM_STEP}
                    value={ramMb}
                    onChange={(e) => setRamMb(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${ramPercent}%, hsl(var(--muted)) ${ramPercent}%, hsl(var(--muted)) 100%)`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>500 MB</span>
                  <span>1 GB</span>
                  <span>2 GB</span>
                </div>
                {ramMb === RAM_MAX && (
                  <p className="text-xs text-warning flex items-center gap-1">
                    <span>⚠</span> Maximum RAM limit reached
                  </p>
                )}
              </div>

              {/* CPU */}
              <div className="space-y-2">
                <Label className="font-mono text-xs uppercase text-muted-foreground flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" /> CPU Cores
                </Label>
                <div className="flex gap-2">
                  {CPU_OPTIONS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCpuCores(c)}
                      className={`flex-1 py-2 rounded-lg border text-sm font-mono transition-all ${
                        cpuCores === c
                          ? 'border-primary bg-primary/10 text-primary font-bold'
                          : 'border-border text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">CPU is shared infrastructure. Higher values give priority access.</p>
              </div>

              {/* Price Preview */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground font-mono">Base plan ({months} mo)</p>
                    {ramMb > 500 && (
                      <p className="text-xs text-muted-foreground font-mono">RAM upgrade (+{ramMb - 500} MB)</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-mono font-bold text-primary">{formatPrice(totalKobo)}</p>
                    {months > 1 && (
                      <p className="text-xs text-muted-foreground">{formatPrice(totalKobo / months)}/mo</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Trust Row */}
        <div className="flex flex-wrap gap-3 justify-center text-xs text-muted-foreground pt-2">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-success" /> Secure Payment</span>
          <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-primary" /> Instant Activation</span>
          <span className="flex items-center gap-1"><Check className="w-3 h-3 text-success" /> 24/7 Uptime</span>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-muted-foreground">
          Need help?{' '}
          <a href="https://t.me/theidledeveloper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Contact us on Telegram
          </a>
        </div>
      </main>

      {/* Floating Support */}
      <a
        href="https://t.me/theidledeveloper"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-50"
        title="Contact Support"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default Pricing;

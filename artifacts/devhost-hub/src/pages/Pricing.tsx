import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Check,
  Loader2,
  MessageCircle,
  Zap,
  Shield,
  Rocket,
  Star,
  Crown,
  MemoryStick,
  Cpu,
  HardDrive,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-react';

// ─── Plan definitions ─────────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Run a small bot or script',
    priceKobo: 140000,
    ram: '500 MB',
    ramMb: 500,
    cpu: '0.5 cores',
    cpuCores: 0.5,
    storage: '1 GB',
    storageMb: 1024,
    icon: Zap,
    iconColor: 'text-muted-foreground',
    cardClass: 'border-border',
    badgeClass: '',
    badge: '',
    features: [
      'Node.js & Python support',
      'Auto-restart on crash',
      'Web file manager',
      'Console & logs',
      '24/7 uptime monitoring',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    tagline: 'Discord bots & simple APIs',
    priceKobo: 250000,
    ram: '1 GB',
    ramMb: 1024,
    cpu: '1 core',
    cpuCores: 1,
    storage: '2 GB',
    storageMb: 2048,
    icon: Star,
    iconColor: 'text-primary',
    cardClass: 'border-primary/40',
    badgeClass: 'bg-primary text-primary-foreground',
    badge: 'Most Popular',
    features: [
      'Everything in Starter',
      'Double the RAM',
      '2× CPU performance',
      '2 GB file storage',
      'Priority activation',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    tagline: 'Multi-feature apps & scrapers',
    priceKobo: 420000,
    ram: '1.5 GB',
    ramMb: 1536,
    cpu: '1.5 cores',
    cpuCores: 1.5,
    storage: '3 GB',
    storageMb: 3072,
    icon: Rocket,
    iconColor: 'text-accent',
    cardClass: 'border-accent/30',
    badgeClass: 'bg-accent text-white',
    badge: 'Best Value',
    features: [
      'Everything in Basic',
      '1.5 GB RAM',
      '1.5× CPU cores',
      '3 GB file storage',
      'Higher restart tolerance',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'Heavy workloads & ML scripts',
    priceKobo: 650000,
    ram: '2 GB',
    ramMb: 2048,
    cpu: '2 cores',
    cpuCores: 2,
    storage: '4 GB',
    storageMb: 4096,
    icon: Crown,
    iconColor: 'text-warning',
    cardClass: 'border-warning/40',
    badgeClass: 'bg-warning text-black',
    badge: 'Power User',
    features: [
      'Everything in Standard',
      'Max 2 GB RAM',
      '2 full CPU cores',
      '4 GB storage',
      'Highest restart limit',
    ],
  },
] as const;

type PlanId = typeof PLANS[number]['id'];

function fmt(kobo: number) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(kobo / 100);
}

// ─── Component ────────────────────────────────────────────────────────────────
const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // No forced redirect — visitors can browse plans, redirect only on purchase

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) verifyPayment(ref);
  }, [searchParams]);

  const verifyPayment = async (reference: string) => {
    setPurchasing('starter');
    try {
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: { action: 'verify', reference },
      });
      if (error) throw error;
      if (data.success && data.status === 'success') {
        toast({ title: 'Payment Successful! 🎉', description: data.message || 'Your panel is ready — check your dashboard!' });
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

  const handlePurchase = async (plan: typeof PLANS[number]) => {
    if (!user) { navigate('/auth?redirect=/pricing'); return; }
    setPurchasing(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: {
          action: 'initialize',
          email: user.email,
          amount: plan.priceKobo,
          user_id: user.id,
          callback_url: `${window.location.origin}/pricing`,
          panels_count: 1,
          duration_months: 1,
          panel_ram_mb: plan.ramMb,
          panel_cpu_cores: plan.cpuCores,
          panel_storage_mb: plan.storageMb,
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

  if (purchasing && searchParams.get('reference')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="font-mono text-muted-foreground text-sm">Verifying payment…</p>
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
        <div>
          <h1 className="font-semibold text-sm text-foreground">Choose a Plan</h1>
          <p className="text-xs text-muted-foreground">Monthly billing · Instant activation · No DevOps</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 pb-24 space-y-5">

        {/* Hero */}
        <div className="pt-5 text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">
            Pick your plan, <span className="text-primary">ship today</span>
          </h2>
          <p className="text-sm text-muted-foreground">
            All plans include auto-restart, file manager, console, and 24/7 uptime.
          </p>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-primary" />500+ devs hosted</span>
          <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-warning fill-warning" />4.9 / 5 rating</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-primary" />99.9% uptime</span>
        </div>

        {/* Plan cards */}
        <div className="space-y-3">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isPopular = plan.badge === 'Most Popular';
            const isLoading = purchasing === plan.id;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border bg-card overflow-hidden transition-all hover:shadow-lg ${
                  isPopular
                    ? 'border-primary/50 shadow-md shadow-primary/10'
                    : plan.cardClass
                }`}
              >
                {/* Top accent line for popular plan */}
                {isPopular && (
                  <div className="h-0.5 w-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    {/* Left: icon + name */}
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        isPopular ? 'bg-primary/15 border border-primary/25' :
                        plan.id === 'standard' ? 'bg-accent/15 border border-accent/20' :
                        plan.id === 'pro' ? 'bg-warning/15 border border-warning/20' :
                        'bg-muted/50 border border-border'
                      }`}>
                        <Icon className={`w-5 h-5 ${plan.iconColor}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{plan.name}</p>
                          {plan.badge && (
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${plan.badgeClass}`}>
                              {plan.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                      </div>
                    </div>

                    {/* Right: price */}
                    <div className="text-right shrink-0 ml-2">
                      <p className="text-2xl font-bold font-mono text-foreground">{fmt(plan.priceKobo)}</p>
                      <p className="text-xs text-muted-foreground">/month</p>
                    </div>
                  </div>

                  {/* Spec chips */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="flex items-center gap-1.5 text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2">
                      <MemoryStick className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-mono font-semibold text-foreground">{plan.ram}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2">
                      <Cpu className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-mono font-semibold text-foreground">{plan.cpu}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs bg-muted/40 border border-border rounded-lg px-2.5 py-2">
                      <HardDrive className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-mono font-semibold text-foreground">{plan.storage}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-1.5 mb-5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isPopular ? 'bg-primary/20' : 'bg-muted/60'
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${isPopular ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-muted-foreground">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full h-11 font-semibold gap-2 transition-all hover:scale-[1.01] ${
                      isPopular
                        ? 'bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20'
                        : plan.id === 'pro'
                        ? 'bg-warning hover:bg-warning/90 text-black shadow-lg shadow-warning/20'
                        : plan.id === 'standard'
                        ? 'bg-accent hover:bg-accent/90 shadow-lg shadow-accent/20'
                        : 'bg-card border border-border hover:bg-muted/40 text-foreground'
                    }`}
                    onClick={() => handlePurchase(plan)}
                    disabled={!!purchasing}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                    ) : (
                      <>
                        Get {plan.name}
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Comparison footnote */}
        <div className="rounded-2xl border border-border bg-card/40 p-4 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">All plans include:</p>
          <div className="flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            {[
              { icon: Shield, text: 'Auto-restart on crash' },
              { icon: Zap, text: 'Instant activation' },
              { icon: Clock, text: '24/7 monitoring' },
            ].map(({ icon: I, text }) => (
              <span key={text} className="flex items-center gap-1.5">
                <I className="w-3.5 h-3.5 text-primary" />
                {text}
              </span>
            ))}
          </div>
        </div>

        {/* ToS note */}
        <p className="text-xs text-center text-muted-foreground">
          By purchasing you agree to our{' '}
          <Link to="/terms" className="text-primary hover:underline">Terms of Service</Link>
          {' '}·{' '}
          <span className="text-warning font-medium">All sales are final · No refunds</span>
        </p>

        <p className="text-center text-sm text-muted-foreground pb-2">
          Not sure which to pick?{' '}
          <a href="https://t.me/theidledeveloper" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Ask on Telegram
          </a>
        </p>
      </main>

      {/* Floating support button */}
      <a
        href="https://t.me/theidledeveloper"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 w-14 h-14 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full flex items-center justify-center shadow-xl hover:scale-110 transition-all z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </a>
    </div>
  );
};

export default Pricing;

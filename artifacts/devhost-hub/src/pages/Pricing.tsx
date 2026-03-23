import { useState, useEffect, useRef } from 'react';
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
  Rocket,
  Star,
  Crown,
  MemoryStick,
  Cpu,
  HardDrive,
  Users,
  Clock,
  ChevronRight,
  ChevronLeft,
  Shield,
} from 'lucide-react';

// ─── Plans ───────────────────────────────────────────────────────────────────
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
    accent: 'hsl(var(--muted-foreground))',
    badge: null,
    gradient: 'from-muted/30 to-transparent',
    btnClass: 'bg-card border border-border hover:bg-muted/40 text-foreground',
    features: [
      'Node.js & Python support',
      'Auto-restart on crash',
      'Web file manager',
      'Console & live logs',
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
    accent: 'hsl(var(--primary))',
    badge: 'Most Popular',
    badgeClass: 'bg-primary text-primary-foreground',
    gradient: 'from-primary/15 to-transparent',
    btnClass: 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25',
    features: [
      'Everything in Starter',
      'Double the RAM (1 GB)',
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
    accent: 'hsl(var(--accent))',
    badge: 'Best Value',
    badgeClass: 'bg-accent text-white',
    gradient: 'from-accent/15 to-transparent',
    btnClass: 'bg-accent hover:bg-accent/90 text-white shadow-lg shadow-accent/25',
    features: [
      'Everything in Basic',
      '1.5 GB RAM',
      '1.5 CPU cores',
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
    accent: 'hsl(var(--warning))',
    badge: 'Power User',
    badgeClass: 'bg-warning text-black',
    gradient: 'from-warning/15 to-transparent',
    btnClass: 'bg-warning hover:bg-warning/90 text-black shadow-lg shadow-warning/25',
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

// ─── Component ───────────────────────────────────────────────────────────────
const Pricing = () => {
  const { user } = useAuth();
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [activeIndex, setActiveIndex] = useState(1); // default to "Most Popular"
  const [searchParams] = useSearchParams();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-swipe refs — all refs to avoid stale closures and unnecessary re-renders
  const activeIndexRef = useRef(1);
  const autoSwipeActive = useRef(true);   // armed on mount, killed on first interaction
  const autoSwipeTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) verifyPayment(ref);
  }, [searchParams]);

  // Scroll to Most Popular (index 1) on mount using center-based calculation
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Wait for layout to settle
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        const card = el.children[2] as HTMLElement; // children[0]=left spacer, [1]=Starter, [2]=Basic
        if (card) {
          const targetLeft = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
          el.scrollLeft = Math.max(0, targetLeft);
        }
      }, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, []);

  // Track which card is in view (children[0] is the left spacer, real cards start at index 1)
  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const center = el.scrollLeft + el.clientWidth / 2;
    const cards = Array.from(el.children).slice(1, PLANS.length + 1) as HTMLElement[];
    let closest = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < closestDist) { closestDist = dist; closest = i; }
    });
    setActiveIndex(closest);
  };

  const scrollTo = (index: number) => {
    const clamped = Math.max(0, Math.min(PLANS.length - 1, index));
    const el = scrollRef.current;
    if (!el) return;
    // +1 because children[0] is the left spacer
    const card = el.children[clamped + 1] as HTMLElement;
    if (card) {
      const targetLeft = card.offsetLeft + card.offsetWidth / 2 - el.clientWidth / 2;
      el.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
    activeIndexRef.current = clamped;
    setActiveIndex(clamped);
  };

  // Kill auto-swipe permanently on any user interaction
  const killAutoSwipe = () => {
    if (!autoSwipeActive.current) return;
    autoSwipeActive.current = false;
    if (initialDelayTimer.current) { clearTimeout(initialDelayTimer.current); initialDelayTimer.current = null; }
    if (autoSwipeTimer.current) { clearInterval(autoSwipeTimer.current); autoSwipeTimer.current = null; }
  };

  // Auto-swipe: 5s delay then every 3.5s, wraps around, stops on interaction
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Attach interaction listeners — any touch/click/wheel kills auto-swipe
    const events: (keyof HTMLElementEventMap)[] = ['touchstart', 'mousedown', 'wheel', 'pointerdown'];
    events.forEach(ev => el.addEventListener(ev, killAutoSwipe, { passive: true }));

    // Initial 5s delay, then interval
    initialDelayTimer.current = setTimeout(() => {
      if (!autoSwipeActive.current) return;
      autoSwipeTimer.current = setInterval(() => {
        if (!autoSwipeActive.current) {
          clearInterval(autoSwipeTimer.current!);
          return;
        }
        const next = (activeIndexRef.current + 1) % PLANS.length;
        scrollTo(next);
      }, 3500);
    }, 5000);

    return () => {
      events.forEach(ev => el.removeEventListener(ev, killAutoSwipe));
      if (initialDelayTimer.current) clearTimeout(initialDelayTimer.current);
      if (autoSwipeTimer.current) clearInterval(autoSwipeTimer.current);
    };
  }, []); // runs once on mount

  const verifyPayment = async (reference: string) => {
    setPurchasing('starter');
    try {
      const { data, error } = await supabase.functions.invoke('paystack', {
        body: { action: 'verify', reference },
      });
      if (error) throw error;
      if (data.success && data.status === 'success') {
        toast({ title: 'Payment Successful! 🎉', description: 'Your panel is ready — check your dashboard!' });
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
          plan_id: plan.id,
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
      let msg = e.message || 'Payment could not be started.';
      // FunctionsHttpError carries the raw response — try to read the actual reason
      if (e.context?.json) {
        try {
          const body = await e.context.json();
          msg = body.error || body.message || msg;
        } catch {}
      }
      toast({ title: 'Payment Error', description: msg, variant: 'destructive' });
      setPurchasing(null);
    }
  };

  if (purchasing && searchParams.get('reference')) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0c0c0f' }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
            <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#4ade80' }} />
          </div>
          <p className="font-mono text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>Verifying payment…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0c0c0f' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur px-4 py-3 flex items-center gap-3 shrink-0" style={{ background: 'rgba(12,12,15,0.92)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <Link to={user ? '/dashboard' : '/'}>
          <Button variant="ghost" size="icon" className="h-9 w-9" style={{ color: 'rgba(255,255,255,0.7)' }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="font-semibold text-sm" style={{ color: '#fff' }}>Choose a Plan</h1>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Monthly · Instant activation · No DevOps</p>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="shrink-0 pt-5 pb-3 px-4 text-center space-y-2">
        <h2 className="text-2xl font-bold leading-tight" style={{ color: '#fff' }}>
          Pick your plan,{' '}
          <span style={{ color: '#4ade80' }}>ship today</span>
        </h2>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
          All plans include auto-restart, file manager &amp; 24/7 uptime.
        </p>
      </div>

      {/* ── Social proof ─────────────────────────────────────────────────── */}
      <div className="shrink-0 flex items-center justify-center gap-5 pb-4 text-xs px-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
        <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />500+ devs</span>
        <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 fill-current" style={{ color: '#fbbf24' }} />4.9/5 rating</span>
        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" style={{ color: '#4ade80' }} />99.9% uptime</span>
      </div>

      {/* ── Carousel ─────────────────────────────────────────────────────── */}
      <div className="relative shrink-0">

        {/* Desktop: Prev button */}
        <button
          onClick={() => scrollTo(activeIndex - 1)}
          disabled={activeIndex === 0}
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ background: '#1a1a20', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Desktop: Next button */}
        <button
          onClick={() => scrollTo(activeIndex + 1)}
          disabled={activeIndex === PLANS.length - 1}
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-11 h-11 items-center justify-center rounded-full transition-all disabled:opacity-25 disabled:cursor-not-allowed"
          style={{ background: '#1a1a20', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Scroll track */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-4 overflow-x-auto pb-4"
          style={{
            scrollSnapType: 'x mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          {/* Left spacer — pushes first card to center */}
          <div className="shrink-0" style={{ width: 'calc((100vw - min(85vw, 340px)) / 2 - 8px)', minWidth: '4px' }} aria-hidden />

        {PLANS.map((plan, i) => {
          const Icon = plan.icon;
          const isActive = i === activeIndex;
          const isLoading = purchasing === plan.id;

          // Per-plan accent colours
          const accentColor =
            plan.id === 'starter' ? 'rgba(255,255,255,0.35)' :
            plan.id === 'basic'   ? '#4ade80' :
            plan.id === 'standard'? '#60a5fa' :
            '#fbbf24';
          const accentBg =
            plan.id === 'starter' ? 'rgba(255,255,255,0.05)' :
            plan.id === 'basic'   ? 'rgba(74,222,128,0.1)' :
            plan.id === 'standard'? 'rgba(96,165,250,0.1)' :
            'rgba(251,191,36,0.1)';
          const accentBorder =
            plan.id === 'starter' ? 'rgba(255,255,255,0.07)' :
            plan.id === 'basic'   ? 'rgba(74,222,128,0.25)' :
            plan.id === 'standard'? 'rgba(96,165,250,0.25)' :
            'rgba(251,191,36,0.25)';
          const barColor =
            plan.id === 'starter' ? 'rgba(255,255,255,0.15)' :
            plan.id === 'basic'   ? '#22c55e' :
            plan.id === 'standard'? '#3b82f6' :
            '#f59e0b';
          const btnStyle =
            plan.id === 'starter' ? { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff' } :
            plan.id === 'basic'   ? { background: '#16a34a', color: '#fff', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' } :
            plan.id === 'standard'? { background: '#2563eb', color: '#fff', boxShadow: '0 4px 24px rgba(59,130,246,0.3)' } :
            { background: '#d97706', color: '#fff', boxShadow: '0 4px 24px rgba(251,191,36,0.3)' };
          const badgeStyle =
            plan.id === 'basic'   ? { background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', color: '#4ade80' } :
            plan.id === 'standard'? { background: 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', color: '#60a5fa' } :
            { background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' };

          return (
            <div
              key={plan.id}
              className="shrink-0 flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
              style={{
                scrollSnapAlign: 'center',
                width: 'min(85vw, 340px)',
                minWidth: '260px',
                background: '#141418',
                border: isActive && plan.badge ? `1px solid ${accentBorder}` : '1px solid rgba(255,255,255,0.07)',
                transform: isActive ? 'scale(1)' : 'scale(0.97)',
                opacity: isActive ? 1 : 0.65,
              }}
            >
              {/* Top accent bar */}
              <div style={{ height: 3, background: barColor, opacity: isActive ? 1 : 0.5 }} />

              <div className="flex flex-col flex-1 p-5">
                {/* Badge */}
                {plan.badge && (
                  <div className="flex mb-3">
                    <span className="text-xs font-bold px-3 py-1 rounded-full" style={badgeStyle}>
                      {plan.badge}
                    </span>
                  </div>
                )}
                {!plan.badge && <div className="mb-3 h-[28px]" />}

                {/* Icon + Name + Price */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: accentBg, border: `1px solid ${accentBorder}` }}>
                      <Icon className="w-5 h-5" style={{ color: accentColor }} />
                    </div>
                    <div>
                      <p className="font-bold text-lg leading-none" style={{ color: '#fff' }}>{plan.name}</p>
                      <p className="text-xs mt-0.5 leading-tight max-w-[110px]" style={{ color: 'rgba(255,255,255,0.4)' }}>{plan.tagline}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black font-mono leading-none" style={{ color: '#fff' }}>{fmt(plan.priceKobo)}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>/month</p>
                  </div>
                </div>

                {/* Spec chips */}
                <div className="grid grid-cols-3 gap-1.5 mb-4">
                  {[
                    { icon: MemoryStick, label: plan.ram },
                    { icon: Cpu, label: plan.cpu },
                    { icon: HardDrive, label: plan.storage },
                  ].map(({ icon: I, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1 text-center rounded-xl py-2.5 px-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <I className="w-4 h-4" style={{ color: accentColor }} />
                      <span className="text-[11px] font-mono font-semibold leading-none" style={{ color: '#fff' }}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-sm">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: accentBg }}>
                        <Check className="w-2.5 h-2.5" style={{ color: accentColor }} />
                      </div>
                      <span className="text-sm leading-tight" style={{ color: 'rgba(255,255,255,0.55)' }}>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  className="w-full h-12 font-bold text-base rounded-xl flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                  style={btnStyle}
                  onClick={() => handlePurchase(plan)}
                  disabled={!!purchasing}
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Processing…</>
                  ) : (
                    <>Get {plan.name} <ChevronRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}

          {/* Right spacer — lets last card center */}
          <div className="shrink-0" style={{ width: 'calc((100vw - min(85vw, 340px)) / 2 - 8px)', minWidth: '4px' }} aria-hidden />
        </div>{/* end scroll track */}
      </div>{/* end relative wrapper */}

      {/* ── Dot indicators ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 py-2 shrink-0">
        {PLANS.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollTo(i)}
            className="h-1.5 rounded-full transition-all duration-300"
            style={{
              width: i === activeIndex ? 24 : 6,
              background: i === activeIndex ? '#4ade80' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>

      {/* Swipe / arrow hint */}
      <p className="text-center text-xs pb-2 font-mono shrink-0 md:hidden" style={{ color: 'rgba(255,255,255,0.2)' }}>
        ← swipe to compare →
      </p>
      <p className="text-center text-xs pb-2 font-mono shrink-0 hidden md:block" style={{ color: 'rgba(255,255,255,0.2)' }}>
        use the arrows to browse plans
      </p>

      {/* ── Included in all plans ─────────────────────────────────────────── */}
      <div className="mx-4 mb-4 rounded-2xl p-4 shrink-0" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-xs font-semibold text-center mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>Included in every plan</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Shield, text: 'Auto-restart on crash' },
            { icon: Zap, text: 'Instant activation' },
            { icon: Clock, text: '24/7 monitoring' },
          ].map(({ icon: I, text }) => (
            <div key={text} className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)' }}>
                <I className="w-4 h-4" style={{ color: '#4ade80' }} />
              </div>
              <span className="text-[11px] leading-tight" style={{ color: 'rgba(255,255,255,0.4)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ToS & support ────────────────────────────────────────────────── */}
      <div className="shrink-0 px-4 pb-6 space-y-3 text-center">
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          By purchasing you agree to our{' '}
          <Link to="/terms" style={{ color: '#4ade80' }} className="hover:underline">Terms of Service</Link>
          {' '}·{' '}
          <span style={{ color: '#fbbf24' }} className="font-medium">All sales are final · No refunds</span>
        </p>
        <a
          href="https://t.me/theidledeveloper"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm hover:underline"
          style={{ color: '#4ade80' }}
        >
          <MessageCircle className="w-4 h-4" />
          Questions? Chat on Telegram
        </a>
      </div>
    </div>
  );
};

export default Pricing;

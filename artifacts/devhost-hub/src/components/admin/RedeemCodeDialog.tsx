import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, Check, Gift, Star } from 'lucide-react';

interface RedeemCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const s1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const s2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `IDEV-${s1}-${s2}`;
};

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: '₦1,400',
    duration: '1 month',
    durationHours: 720,
    panels: 1,
    color: '#00b0ff',
    bg: '#00b0ff12',
    border: '#00b0ff30',
    features: ['1 Panel', 'Node.js or Python', 'Community support'],
    popular: false,
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '₦2,500',
    duration: '1 month',
    durationHours: 720,
    panels: 2,
    color: '#00e676',
    bg: '#00e67612',
    border: '#00e67630',
    features: ['2 Panels', 'Both languages', 'Priority support'],
    popular: false,
  },
  {
    id: 'standard',
    name: 'Standard',
    price: '₦4,200',
    duration: '1 month',
    durationHours: 720,
    panels: 3,
    color: '#f0b429',
    bg: '#f0b42912',
    border: '#f0b42930',
    features: ['3 Panels', 'Both languages', 'Priority support'],
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₦6,500',
    duration: '1 month',
    durationHours: 720,
    panels: 5,
    color: '#a78bfa',
    bg: '#a78bfa12',
    border: '#a78bfa30',
    features: ['5 Panels', 'Both languages', 'Dedicated support'],
    popular: false,
  },
];

const DURATION_OPTIONS = [
  { value: '720',  label: '1 Month' },
  { value: '1440', label: '2 Months' },
  { value: '2160', label: '3 Months' },
  { value: '4320', label: '6 Months' },
  { value: '8640', label: '1 Year' },
];

const MAX_USES_OPTIONS = [
  { value: '1',          label: '1 user' },
  { value: '2',          label: '2 users' },
  { value: '5',          label: '5 users' },
  { value: '10',         label: '10 users' },
  { value: 'unlimited',  label: 'Unlimited' },
];

const BG     = '#0c0d16';
const CARD   = '#0d0d1a';
const CARD2  = '#111122';
const BORDER = '#1a1a2e';
const MUTED  = '#5a5a88';

export function RedeemCodeDialog({ open, onOpenChange, onCreated }: RedeemCodeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  const [maxUses, setMaxUses]           = useState('1');
  const [durationHours, setDurationHours] = useState('720');
  const [customPanels, setCustomPanels] = useState('');
  const [loading, setLoading]           = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied]             = useState(false);
  const { toast } = useToast();

  const reset = () => {
    setSelectedPlan(null);
    setMaxUses('1');
    setDurationHours('720');
    setCustomPanels('');
    setGeneratedCode(null);
    setCopied(false);
    onOpenChange(false);
  };

  const handleCreate = async () => {
    if (!selectedPlan) return;
    setLoading(true);
    const code = generateCode();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Error', description: 'Not authenticated', variant: 'destructive' });
      setLoading(false);
      return;
    }
    const panelsGranted = customPanels ? parseInt(customPanels) : selectedPlan.panels;
    const { error } = await supabase.from('redeem_codes').insert({
      code,
      max_uses: maxUses === 'unlimited' ? null : parseInt(maxUses),
      panels_granted: panelsGranted,
      duration_hours: parseInt(durationHours),
      created_by: user.id,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setGeneratedCode(code);
      onCreated();
    }
    setLoading(false);
  };

  const handleCopy = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const durLabel = DURATION_OPTIONS.find(d => d.value === durationHours)?.label || durationHours + 'h';

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent style={{ background: BG, border: `1px solid ${BORDER}`, maxWidth: 520, padding: 0, borderRadius: 16 }}>
        <DialogHeader style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${BORDER}` }}>
          <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ddddf5', fontFamily: 'monospace', fontSize: 15 }}>
            <Gift style={{ width: 18, height: 18, color: '#a78bfa' }} />
            {generatedCode ? 'Code Generated!' : 'Generate Redeem Code'}
          </DialogTitle>
        </DialogHeader>

        <div style={{ padding: '16px 20px 20px', maxHeight: '80vh', overflowY: 'auto' }}>

          {/* ── Code result ── */}
          {generatedCode ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: '#a78bfa18', border: '1px solid #a78bfa30', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check style={{ width: 28, height: 28, color: '#00e676' }} />
              </div>
              <div style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color: '#ddddf5', letterSpacing: 2, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                {generatedCode}
                <button
                  onClick={handleCopy}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#00e676' : MUTED, transition: 'color 0.15s' }}
                >
                  {copied ? <Check style={{ width: 18, height: 18 }} /> : <Copy style={{ width: 18, height: 18 }} />}
                </button>
              </div>
              <div style={{ marginTop: 14, display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {[
                  `${selectedPlan?.name} plan`,
                  `${customPanels || selectedPlan?.panels} panel(s)`,
                  durLabel,
                  maxUses === 'unlimited' ? 'Unlimited uses' : `${maxUses} use(s)`,
                ].map((tag, i) => (
                  <span key={i} style={{ fontSize: 11, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '3px 9px', color: MUTED, fontFamily: 'monospace' }}>{tag}</span>
                ))}
              </div>
              <button
                onClick={reset}
                style={{ marginTop: 20, width: '100%', padding: '11px', borderRadius: 10, background: '#00e676', border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'monospace', color: '#000' }}
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* ── Plan picker ── */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Select Plan
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {PLANS.map(plan => (
                    <button
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan)}
                      style={{
                        background: selectedPlan?.id === plan.id ? plan.bg : CARD2,
                        border: `1.5px solid ${selectedPlan?.id === plan.id ? plan.color : BORDER}`,
                        borderRadius: 12, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
                        position: 'relative', transition: 'all 0.15s',
                      }}
                    >
                      {plan.popular && (
                        <span style={{ position: 'absolute', top: -8, right: 10, fontSize: 9, background: plan.color, color: '#000', borderRadius: 4, padding: '2px 6px', fontWeight: 900, fontFamily: 'monospace' }}>
                          POPULAR
                        </span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Star style={{ width: 12, height: 12, color: plan.color }} />
                        <span style={{ fontFamily: 'monospace', fontWeight: 900, fontSize: 13, color: plan.color }}>{plan.name}</span>
                      </div>
                      <div style={{ fontFamily: 'monospace', fontSize: 16, fontWeight: 900, color: '#ddddf5', marginBottom: 4 }}>{plan.price}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginBottom: 6 }}>{plan.duration}</div>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ fontSize: 10, color: selectedPlan?.id === plan.id ? plan.color : MUTED, marginBottom: 1 }}>· {f}</div>
                      ))}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Duration override ── */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Duration
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {DURATION_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setDurationHours(opt.value)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${durationHours === opt.value ? '#00e676' : BORDER}`, background: durationHours === opt.value ? '#00e67612' : CARD2, color: durationHours === opt.value ? '#00e676' : MUTED, fontSize: 11, fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Max uses ── */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Max Uses
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {MAX_USES_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setMaxUses(opt.value)}
                      style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${maxUses === opt.value ? '#00b0ff' : BORDER}`, background: maxUses === opt.value ? '#00b0ff12' : CARD2, color: maxUses === opt.value ? '#00b0ff' : MUTED, fontSize: 11, fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── Custom panel count ── */}
              {selectedPlan && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Panel Override <span style={{ textTransform: 'none', color: '#3a3a6a' }}>(optional, defaults to {selectedPlan.panels})</span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={customPanels}
                    onChange={e => setCustomPanels(e.target.value)}
                    placeholder={`${selectedPlan.panels} (plan default)`}
                    style={{ background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontFamily: 'monospace', fontSize: 12, color: '#ddddf5', width: '100%', outline: 'none' }}
                  />
                </div>
              )}

              {/* ── Generate button ── */}
              <button
                onClick={handleCreate}
                disabled={!selectedPlan || loading}
                style={{ width: '100%', padding: '12px', borderRadius: 10, background: selectedPlan ? '#a78bfa' : '#2a2a4a', border: 'none', fontWeight: 700, fontSize: 13, cursor: selectedPlan ? 'pointer' : 'default', fontFamily: 'monospace', color: selectedPlan ? '#fff' : MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.15s' }}
              >
                {loading ? <Loader2 style={{ width: 15, height: 15, animation: 'spin 1s linear infinite' }} /> : <Gift style={{ width: 15, height: 15 }} />}
                {loading ? 'Generating…' : selectedPlan ? `Generate Code · ${selectedPlan.name}` : 'Select a plan above'}
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  ChevronRight,
  Gift,
  ShoppingCart,
  Clock,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { CreatePanelDialog } from '@/components/CreatePanelDialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/* ─── Types ─────────────────────────────────────────────────────────── */
interface Panel {
  id: string;
  name: string;
  language: 'nodejs' | 'python';
  status: 'stopped' | 'running' | 'deploying' | 'error';
  created_at: string;
  expires_at: string | null;
}
interface SetupPanelData {
  id: string;
  name: string;
  language: 'nodejs' | 'python';
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function getInitials(str: string) {
  return str?.slice(0, 2).toUpperCase() || 'U?';
}
function daysLeft(expires_at: string | null) {
  if (!expires_at) return null;
  return Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
}

/* ─── SVG decorations ────────────────────────────────────────────────── */
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
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" opacity="0.18" className="shrink-0">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(8,${6 + i * 16})`}>
          <rect x="0" y="0" width="60" height="11" rx="2" fill="#00e676" />
          <rect x="3" y="2.5" width="4" height="6" rx="1" fill="#07070d" />
          <rect x="9" y="2.5" width="4" height="6" rx="1" fill="#07070d" />
          <rect x="18" y="3.5" width="22" height="4" rx="1" fill="#07070d" opacity="0.6" />
          <circle cx="54" cy="5.5" r="2.5" fill={i === 0 ? '#00e676' : i === 2 ? '#ff4d4d' : '#1a2a1a'} />
        </g>
      ))}
      <rect x="8" y="70" width="60" height="3" rx="1.5" fill="#00e676" opacity="0.3" />
    </svg>
  );
}

function HexPattern() {
  const hexPoints = (cx: number, cy: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  const positions: [number, number][] = [
    [20, 14], [44, 14], [68, 14],
    [32, 34], [56, 34], [80, 34],
    [20, 54], [44, 54], [68, 54],
  ];
  return (
    <svg
      width="100" height="70" viewBox="0 0 100 70" fill="none"
      style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.06, pointerEvents: 'none' }}
    >
      {positions.map(([cx, cy], i) => (
        <polygon key={i} points={hexPoints(cx, cy, 10)} stroke="#00e676" strokeWidth="0.8" />
      ))}
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user, profile, isAdmin, isPremium, signOut, loading: authLoading } = useAuth();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemFocused, setRedeemFocused] = useState(false);
  const [setupPanel, setSetupPanel] = useState<SetupPanelData | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupLanguage, setSetupLanguage] = useState<'nodejs' | 'python'>('nodejs');
  const [savingSetup, setSavingSetup] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchPanels();
  }, [user]);

  const fetchPanels = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    const { data, error } = await supabase
      .from('panels')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: 'Failed to load panels', variant: 'destructive' });
    else setPanels(data as Panel[]);
    setLoading(false);
    setRefreshing(false);
  };

  const handleSignOut = async () => { await signOut(); navigate('/'); };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !user) return;
    setRedeeming(true);
    try {
      const { data: codeData, error: codeError } = await supabase
        .from('redeem_codes').select('*')
        .eq('code', redeemCode.trim().toUpperCase()).eq('is_active', true).maybeSingle();
      if (codeError || !codeData) {
        toast({ title: 'Invalid Code', description: 'This code does not exist or is inactive', variant: 'destructive' });
        setRedeeming(false); return;
      }
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        toast({ title: 'Code Expired', description: 'This code has reached its maximum uses', variant: 'destructive' });
        setRedeeming(false); return;
      }
      const { data: existingRedemption } = await supabase
        .from('code_redemptions').select('id')
        .eq('code_id', codeData.id).eq('user_id', user.id).maybeSingle();
      if (existingRedemption) {
        toast({ title: 'Already Redeemed', description: 'You have already used this code', variant: 'destructive' });
        setRedeeming(false); return;
      }
      const { error: redemptionError } = await supabase
        .from('code_redemptions').insert({ code_id: codeData.id, user_id: user.id });
      if (redemptionError) {
        toast({ title: 'Error', description: 'Failed to redeem code', variant: 'destructive' });
        setRedeeming(false); return;
      }
      await supabase.from('redeem_codes').update({ current_uses: codeData.current_uses + 1 }).eq('id', codeData.id);
      const currentLimit = profile?.panels_limit || 0;
      await supabase.from('profiles').update({ premium_status: 'approved', panels_limit: currentLimit + codeData.panels_granted }).eq('id', user.id);
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + (codeData.duration_hours || 720));
      for (let i = 0; i < codeData.panels_granted; i++) {
        await supabase.from('panels').insert({
          user_id: user.id, name: `ClaimedPanel_${Date.now()}_${i}`,
          language: 'nodejs', expires_at: expiresAt.toISOString(),
        });
      }
      toast({ title: '🎉 Code Redeemed!', description: `${codeData.panels_granted} panel(s) unlocked!` });
      setRedeemCode('');
      await fetchPanels();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
    setRedeeming(false);
  };

  const handlePanelClick = (panel: Panel) => {
    if (panel.name.startsWith('ClaimedPanel_')) {
      setSetupPanel({ id: panel.id, name: '', language: 'nodejs' });
      setSetupName(''); setSetupLanguage('nodejs');
    } else {
      navigate(`/panel/${panel.id}`);
    }
  };

  const handleSaveSetup = async () => {
    if (!setupPanel || !setupName.trim()) {
      toast({ title: 'Name required', description: 'Please enter a name for your panel', variant: 'destructive' });
      return;
    }
    setSavingSetup(true);
    const { error } = await supabase.from('panels')
      .update({ name: setupName.trim(), language: setupLanguage }).eq('id', setupPanel.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update panel', variant: 'destructive' });
      setSavingSetup(false);
    } else {
      toast({ title: 'Panel configured!', description: 'Your panel is ready to use' });
      const panelId = setupPanel.id;
      setSetupPanel(null); setSavingSetup(false);
      navigate(`/panel/${panelId}`);
    }
  };

  /* ── Derived values ── */
  const runningCount = panels.filter(p => p.status === 'running').length;
  const panelsLimit = profile?.panels_limit || 0;
  const canCreatePanel = isPremium && panels.length < panelsLimit;
  const username = profile?.username || profile?.email?.split('@')[0] || 'user';
  const firstName = username.split(/[._-]/)[0];
  const usagePct = panelsLimit > 0 ? Math.round((panels.length / panelsLimit) * 100) : 0;
  const initials = getInitials(username);

  /* ── Loading screen ── */
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#07070d', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.04 }}>
          <defs>
            <pattern id="dotgrid-load" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#00e676" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid-load)" />
        </svg>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', inset: 0, animation: 'spin 2s linear infinite' }}>
            <circle cx="26" cy="26" r="24" stroke="#00e676" strokeWidth="1.5" strokeOpacity="0.3" strokeDasharray="8 4" />
          </svg>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: '#0d1a12', border: '1px solid #00e67640', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={16} color="#00e676" />
          </div>
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#2a2a3a', letterSpacing: '0.12em' }}>CONNECTING...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#07070d', color: '#e0e4ef', overflowX: 'hidden' }}>

      {/* ── Dot grid background ── */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.04 }}>
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#00e676" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <header
          style={{
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            background: 'rgba(7,7,13,0.92)',
            backdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Avatar with SVG pulse rings */}
            <div style={{ position: 'relative', width: 44, height: 44, flexShrink: 0 }}>
              <svg width="44" height="44" viewBox="0 0 44 44" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="22" cy="22" r="21" stroke="#00e676" strokeWidth="1" strokeOpacity="0.25" />
                <circle cx="22" cy="22" r="16" stroke="#00e676" strokeWidth="0.6" strokeOpacity="0.12" />
              </svg>
              <div style={{
                position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
                borderRadius: '50%', background: '#0d1a12', border: '1px solid rgba(0,230,118,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 13, color: '#00e676',
              }}>
                {initials}
              </div>
              <div style={{
                position: 'absolute', bottom: 1, right: 1, width: 10, height: 10,
                borderRadius: '50%', background: '#00e676', border: '2px solid #07070d',
                boxShadow: '0 0 6px #00e676',
              }} />
            </div>

            <div>
              <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>
                {firstName}<span style={{ color: '#00e676' }}>@idevhost</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
                {isPremium ? (
                  <>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="#f0b429">
                      <path d="M5 0.5L6.12 3.62H9.51L6.69 5.63L7.81 8.75L5 6.74L2.19 8.75L3.31 5.63L0.49 3.62H3.88L5 0.5Z" />
                    </svg>
                    <span style={{ fontSize: 11, color: '#f0b429', fontWeight: 600 }}>PREMIUM</span>
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: '#333' }}>Free plan</span>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 6 }}>
            <button
              onClick={() => fetchPanels(true)}
              disabled={refreshing}
              style={{ width: 34, height: 34, borderRadius: 10, background: '#0d0d1a', border: '1px solid #1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <RefreshCw size={13} color="#333" style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            {isAdmin && (
              <Link to="/admin">
                <button style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(240,180,41,0.08)', border: '1px solid rgba(240,180,41,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={14} color="#f0b429" />
                </button>
              </Link>
            )}
            <button
              onClick={handleSignOut}
              style={{ width: 34, height: 34, borderRadius: 10, background: '#0d0d1a', border: '1px solid #1a1a2e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={13} color="#333" />
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '20px 18px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* ── Stats cards ── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'PANELS', value: `${panels.length}/${panelsLimit || '—'}`, color: '#00b0ff' },
              { label: 'ONLINE', value: String(runningCount), color: '#00e676' },
              { label: 'PLAN', value: isPremium ? 'PRO' : 'FREE', color: isPremium ? '#f0b429' : '#333' },
            ].map(s => (
              <div key={s.label} style={{ background: '#0d0d1a', border: `1px solid ${s.color}1a`, borderRadius: 16, padding: '13px 11px 9px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 9, color: '#333', letterSpacing: '0.12em', fontWeight: 600, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ position: 'absolute', bottom: 4, right: 2, opacity: 0.35 }}>
                  <Sparkline color={s.color} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Capacity bar ── */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: '#333', letterSpacing: '0.1em', fontWeight: 600 }}>CAPACITY</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#00b0ff' }}>{panels.length} / {panelsLimit || '—'}</span>
            </div>
            <div style={{ height: 3, background: '#1a1a2e', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, usagePct)}%`, height: '100%', background: usagePct >= 90 ? '#ff4d4d' : usagePct >= 60 ? '#f0b429' : '#00b0ff', borderRadius: 3, transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 10, color: '#2a2a3a' }}>
              {panelsLimit === 0
                ? 'No panels purchased yet · '
                : `${panelsLimit - panels.length} slot${panelsLimit - panels.length !== 1 ? 's' : ''} available · `}
              <span onClick={() => navigate('/pricing')} style={{ color: '#00e676', cursor: 'pointer' }}>buy more →</span>
            </div>
          </div>

          {/* ── Buy banner ── */}
          <div
            onClick={() => navigate('/pricing')}
            style={{ background: '#0d0d1a', border: '1px solid rgba(0,230,118,0.12)', borderRadius: 18, padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
          >
            <HexPattern />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Deploy a panel</div>
                <div style={{ fontSize: 12, color: '#444', marginTop: 5 }}>
                  From <span style={{ color: '#00e676', fontWeight: 700 }}>₦1,400/mo</span> · Node.js & Python
                </div>
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: '#00e676', color: '#000', fontWeight: 800, fontSize: 12, padding: '7px 14px', borderRadius: 8 }}>
                  <ShoppingCart size={12} /> BUY NOW
                </div>
              </div>
              <ServerRackSVG />
            </div>
          </div>

          {/* ── Redeem code ── */}
          <div style={{ background: '#0d0d1a', border: redeemFocused ? '1px solid rgba(0,230,118,0.3)' : '1px solid #1a1a2e', borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.2s' }}>
            <div style={{ background: '#0a0a14', borderBottom: '1px solid #1a1a2e', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#ff4d4d' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#f0b429' }} />
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00e676' }} />
              </div>
              <span style={{ flex: 1, textAlign: 'center', fontSize: 10, color: '#2a2a3a', letterSpacing: '0.08em' }}>redeem_code.sh</span>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#f0b429" opacity="0.5">
                <path d="M6 0.5L7.3 4.2H11.3L8.1 6.6L9.3 10.3L6 7.9L2.7 10.3L3.9 6.6L0.7 4.2H4.7L6 0.5Z" />
              </svg>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: '#2a2a3a', marginBottom: 8, fontFamily: 'monospace' }}>
                <span style={{ color: '#00e676' }}>$</span> enter your redemption code
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#07070d', border: `1px solid ${redeemFocused ? 'rgba(0,230,118,0.3)' : '#1a1a2e'}`, borderRadius: 8, padding: '10px 12px', marginBottom: 10, transition: 'border-color 0.2s' }}>
                <span style={{ color: '#00e676', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0 }}>&gt;_</span>
                <input
                  type="text"
                  placeholder="IDEV-XXXX-XXXX"
                  value={redeemCode}
                  onChange={e => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                  onFocus={() => setRedeemFocused(true)}
                  onBlur={() => setRedeemFocused(false)}
                  onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
                  maxLength={20}
                  spellCheck={false}
                  autoCapitalize="characters"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'monospace', fontSize: 13, letterSpacing: '0.18em', color: '#fff', caretColor: '#00e676' }}
                />
                {redeemCode && (
                  <button onClick={() => setRedeemCode('')} style={{ color: '#333', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace', fontSize: 11 }}>✕</button>
                )}
              </div>
              <button
                onClick={handleRedeemCode}
                disabled={redeeming || !redeemCode.trim()}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  cursor: redeemCode.trim() && !redeeming ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: redeemCode.trim() && !redeeming ? 'rgba(0,230,118,0.12)' : 'rgba(255,255,255,0.03)',
                  border: redeemCode.trim() && !redeeming ? '1px solid rgba(0,230,118,0.3)' : '1px solid #1a1a2e',
                  color: redeemCode.trim() && !redeeming ? '#00e676' : '#333',
                  transition: 'all 0.2s',
                }}
              >
                {redeeming ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : <><Gift size={13} /> REDEEM CODE</>}
              </button>
            </div>
          </div>

          {/* ── Panels header ── */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: '#2a2a3a', letterSpacing: '0.12em', fontWeight: 700 }}>YOUR PANELS</span>
            {canCreatePanel && (
              <button
                onClick={() => setShowCreateDialog(true)}
                style={{ fontSize: 10, color: '#00b0ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,176,255,0.08)', border: '1px solid rgba(0,176,255,0.2)', borderRadius: 6, padding: '4px 9px', fontWeight: 600 }}
              >
                <Plus size={10} /> NEW
              </button>
            )}
          </div>

          {/* ── Empty state ── */}
          {panels.length === 0 && (
            <div style={{ background: '#0d0d1a', border: '1px dashed #1a1a2e', borderRadius: 16, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
                {[0, 1, 2].map(i => (
                  <g key={i} transform={`translate(4,${6 + i * 13})`}>
                    <rect x="0" y="0" width="40" height="10" rx="2" stroke="#00e676" strokeWidth="1" fill="none" />
                    <circle cx="35" cy="5" r="2" fill={i === 0 ? '#00e676' : '#1a2a1a'} />
                  </g>
                ))}
              </svg>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>No panels yet</p>
                <p style={{ fontSize: 13, color: '#333', marginBottom: 16 }}>
                  {isPremium ? 'Create your first panel to start hosting' : 'Purchase a plan to get started'}
                </p>
                <button
                  onClick={() => isPremium ? setShowCreateDialog(true) : navigate('/pricing')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#00e676', color: '#000', fontWeight: 800, fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', border: 'none' }}
                >
                  <ShoppingCart size={13} /> {isPremium ? 'Create Panel' : 'Browse Plans'}
                </button>
              </div>
            </div>
          )}

          {/* ── Panel cards ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {panels.map(panel => {
              const days = daysLeft(panel.expires_at);
              const isExpiringSoon = days !== null && days <= 5 && days > 0;
              const isExpired = days !== null && days <= 0;
              const needsSetup = panel.name.startsWith('ClaimedPanel_');

              const statusColor =
                panel.status === 'running' ? '#00e676' :
                panel.status === 'deploying' ? '#f0b429' :
                panel.status === 'error' ? '#ff4d4d' : '#1e1e2e';
              const statusLabel =
                panel.status === 'running' ? 'ONLINE' :
                panel.status === 'deploying' ? 'DEPLOYING' :
                panel.status === 'error' ? 'ERROR' : 'OFFLINE';
              const glow =
                panel.status === 'running' ? '0 0 8px rgba(0,230,118,0.3)' :
                panel.status === 'error' ? '0 0 8px rgba(255,77,77,0.3)' : 'none';

              const langColor = panel.language === 'nodejs' ? '#00e676' : '#3b82f6';
              const langBg = panel.language === 'nodejs' ? 'rgba(0,230,118,0.07)' : 'rgba(59,130,246,0.07)';
              const langBorder = panel.language === 'nodejs' ? 'rgba(0,230,118,0.15)' : 'rgba(59,130,246,0.15)';

              return (
                <div
                  key={panel.id}
                  onClick={() => handlePanelClick(panel)}
                  style={{ background: '#0d0d1a', border: `1px solid ${statusColor}1a`, borderRadius: 14, padding: '13px 14px 13px 17px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}
                >
                  {/* Left accent strip */}
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: statusColor, boxShadow: glow }} />

                  {/* Lang icon */}
                  {needsSetup ? (
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px dashed #1a1a2e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, color: '#333' }}>?</span>
                    </div>
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: langBg, border: `1px solid ${langBorder}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: langColor, lineHeight: 1 }}>
                        {panel.language === 'nodejs' ? 'JS' : 'PY'}
                      </span>
                      <span style={{ fontSize: 9, color: langColor + '55', marginTop: 1 }}>
                        {panel.language === 'nodejs' ? 'node' : 'py3'}
                      </span>
                    </div>
                  )}

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: needsSetup ? '#00b0ff' : '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {needsSetup ? 'Tap to configure →' : panel.name}
                    </div>
                    <div style={{ fontSize: 11, color: '#2a2a3a', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isExpired ? (
                        <span style={{ color: '#ff4d4d', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="#ff4d4d" strokeWidth="1"/><path d="M5 3v2.5" stroke="#ff4d4d" strokeWidth="1" strokeLinecap="round"/><circle cx="5" cy="7" r="0.5" fill="#ff4d4d"/></svg>
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span style={{ color: '#f0b429', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} />{days}d left
                        </span>
                      ) : !needsSetup ? (
                        panel.language === 'nodejs' ? 'Node.js 20' : 'Python 3.11'
                      ) : null}
                    </div>
                  </div>

                  {/* Status badge */}
                  {!needsSetup && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${statusColor}12`, border: `1px solid ${statusColor}25`, borderRadius: 6, padding: '4px 8px', flexShrink: 0 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, boxShadow: glow }} />
                      <span style={{ fontSize: 9, color: statusColor, fontWeight: 700, letterSpacing: '0.1em' }}>{statusLabel}</span>
                    </div>
                  )}

                  <ChevronRight size={14} color="#1e1e2e" />
                </div>
              );
            })}
          </div>

          {/* ── Slots full note ── */}
          {panels.length > 0 && panels.length >= panelsLimit && panelsLimit > 0 && (
            <div style={{ textAlign: 'center', fontSize: 11, fontFamily: 'monospace', color: '#2a2a3a' }}>
              All {panelsLimit} slots used ·{' '}
              <span onClick={() => navigate('/pricing')} style={{ color: '#00e676', cursor: 'pointer' }}>buy more →</span>
            </div>
          )}

          {/* ── Terminal footer ── */}
          <div style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <polyline points="1,3 5,6 1,9" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="6" y1="9" x2="11" y2="9" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#2a2a3a' }}>
              <span style={{ color: '#00e676' }}>{username}</span>
              {' · '}{panels.length}/{panelsLimit || '—'} panels{' · '}
              {runningCount > 0 && <span style={{ color: '#00e676' }}>{runningCount} running · </span>}
              {isPremium ? 'premium' : 'free'}
            </span>
          </div>
        </main>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <CreatePanelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPanels} />

      {/* Panel Setup Dialog */}
      <Dialog open={!!setupPanel} onOpenChange={(open) => !open && setSetupPanel(null)}>
        <DialogContent className="sm:max-w-md" style={{ background: '#0d0d1a', border: '1px solid #1a1a2e', color: '#e0e4ef' }}>
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fff' }}>
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                <polyline points="1,3 5,6 1,9" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="6" y1="9" x2="11" y2="9" stroke="#00e676" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Configure Panel
            </DialogTitle>
            <DialogDescription style={{ color: '#444' }}>Name your panel and choose its runtime</DialogDescription>
          </DialogHeader>
          <div style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: '#888', fontSize: 12 }}>Panel Name</Label>
              <Input
                placeholder="my-discord-bot"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                className="font-mono"
                style={{ background: '#07070d', border: '1px solid #1a1a2e', color: '#fff' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: '#888', fontSize: 12 }}>Runtime</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['nodejs', 'python'] as const).map(key => {
                  const color = key === 'nodejs' ? '#00e676' : '#3b82f6';
                  const selected = setupLanguage === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSetupLanguage(key)}
                      style={{ padding: 16, borderRadius: 12, border: `2px solid ${selected ? color : '#1a1a2e'}`, background: selected ? `${color}10` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                    >
                      <span style={{ display: 'block', fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color }}>{key === 'nodejs' ? 'JS' : 'PY'}</span>
                      <span style={{ display: 'block', fontSize: 12, color: '#555', marginTop: 4 }}>{key === 'nodejs' ? 'Node.js' : 'Python'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="outline" onClick={() => setSetupPanel(null)} style={{ borderColor: '#1a1a2e', color: '#555' }}>Cancel</Button>
            <Button
              onClick={handleSaveSetup}
              disabled={savingSetup || !setupName.trim()}
              style={{ background: '#00e676', color: '#000', fontWeight: 700 }}
            >
              {savingSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Open'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

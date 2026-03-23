import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  LogOut,
  Shield,
  Loader2,
  ChevronRight,
  Gift,
  ShoppingCart,
  Clock,
  Bell,
  Terminal,
  X,
  CheckCheck,
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

/* ─── Colors (Variant C palette) ───────────────────────────────────── */
const BG     = '#0c0c0f';
const CARD   = '#141418';
const BORDER = 'rgba(255,255,255,0.07)';
const MUTED  = 'rgba(255,255,255,0.35)';
const GREEN  = '#22c55e';
const GREEN2 = '#4ade80';
const AMBER  = '#fbbf24';
const RED    = '#ef4444';
const BLUE   = '#60a5fa';
const CYAN   = '#00b0ff';

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
interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_global: boolean;
  created_at: string;
  read_by: string[];
}

/* ─── Helpers ────────────────────────────────────────────────────────── */
function daysLeft(expires_at: string | null) {
  if (!expires_at) return null;
  return Math.ceil((new Date(expires_at).getTime() - Date.now()) / 86400000);
}
function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ─── Main component ─────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user, profile, isAdmin, isPremium, signOut, loading: authLoading } = useAuth();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [setupPanel, setSetupPanel] = useState<SetupPanelData | null>(null);
  const [setupName, setSetupName] = useState('');
  const [setupLanguage, setSetupLanguage] = useState<'nodejs' | 'python'>('nodejs');
  const [savingSetup, setSavingSetup] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  /* ── Auth guard ── */
  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPanels();
      fetchNotifications();
    }
  }, [user]);

  /* ── Close notif dropdown on outside click ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Real-time notifications subscription ── */
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, (payload) => {
        const n = payload.new as Notification;
        if (n.is_global || (n as any).user_id === user.id) {
          setNotifications(prev => [n, ...prev]);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  /* ── Data fetchers ── */
  const fetchPanels = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('panels')
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    if (error) toast({ title: 'Error', description: 'Failed to load panels', variant: 'destructive' });
    else setPanels(data as Panel[]);
    setLoading(false);
  };

  const fetchNotifications = async () => {
    const { data } = await (supabase as any)
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) {
      const visible = (data as Notification[]).filter(
        n => n.is_global || (n as any).user_id === user?.id
      );
      setNotifications(visible);
    }
  };

  /* ── Notification actions ── */
  const markOneRead = async (n: Notification) => {
    if (!user || n.read_by.includes(user.id)) return;
    const updated = [...n.read_by, user.id];
    await (supabase as any)
      .from('notifications')
      .update({ read_by: updated })
      .eq('id', n.id);
    setNotifications(prev =>
      prev.map(x => x.id === n.id ? { ...x, read_by: updated } : x)
    );
  };

  const markAllRead = async () => {
    if (!user) return;
    const unread = notifications.filter(n => !n.read_by.includes(user.id));
    await Promise.all(unread.map(n => markOneRead(n)));
  };

  /* ── Handlers ── */
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
      toast({ title: 'Code Redeemed!', description: `${codeData.panels_granted} panel(s) unlocked!` });
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
  const panelsLimit  = profile?.panels_limit || 0;
  const freeSlots    = Math.max(0, panelsLimit - panels.length);
  const canCreatePanel = isPremium && panels.length < panelsLimit;
  const username     = profile?.username || profile?.email?.split('@')[0] || 'user';
  const unreadCount  = notifications.filter(n => !n.read_by.includes(user?.id || '')).length;

  /* Ring math */
  const ringUsed  = panels.length;
  const ringTotal = panelsLimit || 1;
  const ringR     = 30;
  const ringCirc  = 2 * Math.PI * ringR;
  const ringOffset = ringCirc * (1 - Math.min(1, ringUsed / ringTotal));

  /* ── Loading screen ── */
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', inset: 0, animation: 'spin 2s linear infinite' }}>
            <circle cx="26" cy="26" r="24" stroke={GREEN} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="8 4" />
          </svg>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: '#0d1a12', border: `1px solid ${GREEN}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={16} color={GREEN} />
          </div>
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: MUTED, letterSpacing: '0.12em' }}>LOADING...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: "'Inter', system-ui, sans-serif", overflowX: 'hidden' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Hero header ── */}
      <div style={{ padding: '24px 20px 20px' }}>

        {/* Top row: greeting + action buttons */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.40)', marginBottom: 4 }}>Welcome back</p>
            <h1 style={{ fontSize: 30, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1 }}>{username}</h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
              >
                <Bell size={15} color="rgba(255,255,255,0.40)" />
                {unreadCount > 0 && (
                  <div style={{ position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, borderRadius: 9, background: RED, border: `2px solid ${BG}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 800, color: '#fff', padding: '0 3px' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 300, maxHeight: 400, overflowY: 'auto', background: '#1a1a22', border: `1px solid rgba(255,255,255,0.08)`, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', zIndex: 100 }}>
                  <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid rgba(255,255,255,0.06)` }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: 13 }}>Notifications</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} style={{ fontSize: 11, color: CYAN, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <CheckCheck size={11} /> Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '28px 14px', textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>
                      <Bell size={26} color="rgba(255,255,255,0.1)" style={{ margin: '0 auto 8px', display: 'block' }} />
                      No notifications yet
                    </div>
                  ) : (
                    <div>
                      {notifications.map(n => {
                        const isRead = n.read_by.includes(user?.id || '');
                        const typeColor = n.type === 'success' ? GREEN : n.type === 'warning' ? AMBER : CYAN;
                        return (
                          <div key={n.id} onClick={() => markOneRead(n)} style={{ padding: '11px 14px', borderBottom: `1px solid rgba(255,255,255,0.05)`, background: isRead ? 'transparent' : 'rgba(255,255,255,0.02)', cursor: 'pointer', display: 'flex', gap: 9 }}>
                            <div style={{ width: 3, borderRadius: 3, background: typeColor, flexShrink: 0, alignSelf: 'stretch', minHeight: 28 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
                                <span style={{ fontWeight: isRead ? 500 : 700, color: isRead ? 'rgba(255,255,255,0.4)' : '#fff', fontSize: 13 }}>{n.title}</span>
                                {!isRead && <div style={{ width: 6, height: 6, borderRadius: '50%', background: CYAN, flexShrink: 0, marginTop: 4 }} />}
                              </div>
                              {n.message && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>}
                              <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 3, display: 'block' }}>{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Admin link */}
            {isAdmin && (
              <Link to="/admin">
                <button style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={14} color={AMBER} />
                </button>
              </Link>
            )}

            {/* Logout */}
            <button
              onClick={handleSignOut}
              style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(255,255,255,0.08)`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={15} color="rgba(255,255,255,0.40)" />
            </button>
          </div>
        </div>

        {/* Usage ring + stat pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Ring */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <svg width="72" height="72" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r={ringR} fill="none" stroke="#1c1c22" strokeWidth="6" />
              <circle
                cx="36" cy="36" r={ringR}
                fill="none"
                stroke={GREEN}
                strokeWidth="6"
                strokeDasharray={ringCirc}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
                transform="rotate(-90 36 36)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 18, fontWeight: 900, color: '#fff', lineHeight: 1 }}>{ringUsed}</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.30)', lineHeight: 1, marginTop: 2 }}>of {panelsLimit || '—'}</span>
            </div>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>{runningCount}</span> panel{runningCount !== 1 ? 's' : ''} online
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: AMBER, display: 'inline-block' }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)' }}>
                <span style={{ fontWeight: 700, color: '#fff' }}>{isPremium ? 'Premium' : 'Free'}</span> plan active
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.20)', display: 'inline-block' }} />
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.40)' }}>{freeSlots} slot{freeSlots !== 1 ? 's' : ''} available</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Buy banner ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <div
          onClick={() => navigate('/pricing')}
          style={{ borderRadius: 18, padding: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: BORDER }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingCart size={18} color="rgba(255,255,255,0.60)" />
            </div>
            <div>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Add a panel</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                From <span style={{ color: GREEN2, fontWeight: 600 }}>₦1,400/mo</span>
              </p>
            </div>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, background: GREEN, color: '#000', padding: '8px 16px', borderRadius: 10 }}>
            Buy Now
          </div>
        </div>
      </div>

      {/* ── Panels ── */}
      <div style={{ padding: '0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)', textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 600 }}>Panels</p>
          {canCreatePanel && (
            <button
              onClick={() => setShowCreateDialog(true)}
              style={{ fontSize: 12, color: GREEN2, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <Plus size={12} /> New
            </button>
          )}
        </div>

        {/* Empty state */}
        {panels.length === 0 && (
          <div style={{ background: CARD, border: `1px dashed rgba(255,255,255,0.08)`, borderRadius: 18, padding: '36px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(34,197,94,0.08)', border: `1px solid rgba(34,197,94,0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Terminal size={20} color="rgba(34,197,94,0.6)" />
            </div>
            <p style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>No panels yet</p>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>
              {isPremium ? 'Create your first panel to start hosting' : 'Purchase a plan to get started'}
            </p>
            <button
              onClick={() => isPremium ? setShowCreateDialog(true) : navigate('/pricing')}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GREEN, color: '#000', fontWeight: 800, fontSize: 12, padding: '8px 16px', borderRadius: 10, cursor: 'pointer', border: 'none', marginTop: 4 }}
            >
              <ShoppingCart size={13} /> {isPremium ? 'Create Panel' : 'Browse Plans'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {panels.map(panel => {
            const days = daysLeft(panel.expires_at);
            const isExpiringSoon = days !== null && days <= 5 && days > 0;
            const isExpired = days !== null && days <= 0;
            const needsSetup = panel.name.startsWith('ClaimedPanel_');
            const isRunning  = panel.status === 'running';
            const isError    = panel.status === 'error';
            const isDeploying = panel.status === 'deploying';

            const accentColor   = isRunning ? GREEN : isError ? RED : isDeploying ? AMBER : '#334155';
            const statusLabel   = isRunning ? 'Running' : isError ? 'Error' : isDeploying ? 'Deploying' : 'Stopped';
            const statusColor   = isRunning ? GREEN2 : isError ? '#f87171' : isDeploying ? AMBER : 'rgba(255,255,255,0.25)';
            const langColor     = panel.language === 'nodejs' ? GREEN2 : BLUE;

            return (
              <div
                key={panel.id}
                onClick={() => handlePanelClick(panel)}
                style={{ borderRadius: 18, padding: '13px 14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11, background: CARD, border: `1px solid ${isRunning ? 'rgba(34,197,94,0.13)' : isError ? 'rgba(239,68,68,0.13)' : 'rgba(255,255,255,0.05)'}` }}
              >
                {/* Left accent bar */}
                <div style={{ width: 4, alignSelf: 'stretch', borderRadius: 4, flexShrink: 0, background: accentColor, opacity: isRunning || isError || isDeploying ? 1 : 0.18 }} />

                {/* Language badge */}
                {needsSetup ? (
                  <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,176,255,0.07)', border: '1px dashed rgba(0,176,255,0.25)' }}>
                    <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }}>?</span>
                  </div>
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: `${langColor}10`, border: `1px solid ${langColor}20` }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: langColor, lineHeight: 1 }}>
                      {panel.language === 'nodejs' ? 'JS' : 'PY'}
                    </span>
                    <span style={{ fontSize: 9, marginTop: 2, fontWeight: 600, color: `${langColor}60` }}>
                      {panel.language === 'nodejs' ? 'node' : 'py3'}
                    </span>
                  </div>
                )}

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: needsSetup ? CYAN : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {needsSetup ? 'Tap to configure →' : panel.name}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                    {!needsSetup && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                    )}
                    {isExpired && (
                      <span style={{ fontSize: 11, color: RED }}>Expired</span>
                    )}
                    {isExpiringSoon && !isExpired && (
                      <>
                        <span style={{ color: 'rgba(255,255,255,0.10)', fontSize: 10 }}>·</span>
                        <span style={{ fontSize: 11, color: AMBER, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={9} />{days}d left
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight size={16} color="rgba(255,255,255,0.10)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>

        {/* Slots full note */}
        {panels.length > 0 && panels.length >= panelsLimit && panelsLimit > 0 && (
          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.30)', marginTop: 10 }}>
            All {panelsLimit} slots used ·{' '}
            <span onClick={() => navigate('/pricing')} style={{ color: GREEN2, cursor: 'pointer' }}>buy more →</span>
          </p>
        )}
      </div>

      {/* ── Redeem code ── */}
      <div style={{ padding: '0 20px 40px' }}>
        <div style={{ borderRadius: 18, padding: 16, background: CARD, border: 'rgba(255,255,255,0.05) solid 1px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(251,191,36,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Gift size={15} color={AMBER} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Redeem a code</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.30)' }}>Unlock free panel slots</p>
            </div>
          </div>
          {/* Input + button */}
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="IDEV-XXXX-XXXX"
              value={redeemCode}
              onChange={e => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
              onKeyDown={e => e.key === 'Enter' && handleRedeemCode()}
              maxLength={20}
              spellCheck={false}
              autoCapitalize="characters"
              style={{
                flex: 1, borderRadius: 12, padding: '10px 14px',
                background: BG, border: '1px solid rgba(255,255,255,0.08)',
                fontSize: 12, fontFamily: 'monospace', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,0.20)', caretColor: AMBER, outline: 'none',
              }}
              onFocus={e => (e.target.style.color = '#fff')}
              onBlur={e => { if (!e.target.value) e.target.style.color = 'rgba(255,255,255,0.20)'; }}
            />
            <button
              onClick={handleRedeemCode}
              disabled={redeeming || !redeemCode.trim()}
              style={{
                fontSize: 12, fontWeight: 700, padding: '10px 20px', borderRadius: 12,
                background: 'rgba(251,191,36,0.15)', color: AMBER, border: '1px solid rgba(251,191,36,0.20)',
                cursor: redeemCode.trim() && !redeeming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, opacity: redeemCode.trim() ? 1 : 0.6,
              }}
            >
              {redeeming ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              {redeeming ? 'Checking…' : 'Claim'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <CreatePanelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPanels} />

      <Dialog open={!!setupPanel} onOpenChange={(open) => !open && setSetupPanel(null)}>
        <DialogContent className="sm:max-w-md" style={{ background: CARD, border: `1px solid rgba(255,255,255,0.08)`, color: '#fff' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>Configure Panel</DialogTitle>
            <DialogDescription style={{ color: 'rgba(255,255,255,0.40)' }}>Name your panel and choose its runtime</DialogDescription>
          </DialogHeader>
          <div style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>Panel Name</Label>
              <Input
                placeholder="my-discord-bot"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                className="font-mono"
                style={{ background: BG, border: `1px solid rgba(255,255,255,0.10)`, color: '#fff' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: 'rgba(255,255,255,0.50)', fontSize: 12 }}>Runtime</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['nodejs', 'python'] as const).map(key => {
                  const color = key === 'nodejs' ? GREEN2 : BLUE;
                  const selected = setupLanguage === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSetupLanguage(key)}
                      style={{ padding: 16, borderRadius: 12, border: `2px solid ${selected ? color : 'rgba(255,255,255,0.08)'}`, background: selected ? `${color}12` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                    >
                      <span style={{ display: 'block', fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color }}>{key === 'nodejs' ? 'JS' : 'PY'}</span>
                      <span style={{ display: 'block', fontSize: 12, color: 'rgba(255,255,255,0.40)', marginTop: 4 }}>{key === 'nodejs' ? 'Node.js' : 'Python'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="outline" onClick={() => setSetupPanel(null)} style={{ borderColor: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.50)' }}>Cancel</Button>
            <Button onClick={handleSaveSetup} disabled={savingSetup || !setupName.trim()} style={{ background: GREEN, color: '#000', fontWeight: 700 }}>
              {savingSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Open'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

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

/* ─── Constants ─────────────────────────────────────────────────────── */
const BG      = '#0c0d16';   /* dark navy — just a touch lighter than original */
const CARD    = '#0d0d1a';   /* near-black card — keeps green popping */
const CARD2   = '#111122';   /* slightly lighter card for hover/alternate */
const BORDER  = '#1a1a2e';   /* barely-visible border — identical to VariantD */
const MUTED   = '#5a5a88';   /* readable soft purple-grey for icon/text hints */
const LABEL   = '#303050';   /* nearly-invisible dark label — makes coloured numbers pop */
const GREEN   = '#00e676';
const CYAN    = '#00b0ff';
const AMBER   = '#f0b429';
const BLUE    = '#3b82f6';
const RED     = '#ff4d4d';

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
function getInitials(str: string) {
  return str?.slice(0, 2).toUpperCase() || 'U?';
}
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

/* ─── SVG decorations ────────────────────────────────────────────────── */
function Sparkline({ color }: { color: string }) {
  return (
    <svg width="44" height="18" viewBox="0 0 44 18" fill="none">
      <polyline
        points="0,14 7,10 14,6 22,11 30,3 37,7 44,4"
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ServerRackSVG() {
  return (
    <svg width="76" height="76" viewBox="0 0 76 76" fill="none" opacity="0.22" className="shrink-0">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(8,${6 + i * 16})`}>
          <rect x="0" y="0" width="60" height="11" rx="2" fill={GREEN} />
          <rect x="3" y="2.5" width="4" height="6" rx="1" fill={BG} />
          <rect x="9" y="2.5" width="4" height="6" rx="1" fill={BG} />
          <rect x="18" y="3.5" width="22" height="4" rx="1" fill={BG} opacity="0.6" />
          <circle cx="54" cy="5.5" r="2.5" fill={i === 0 ? GREEN : i === 2 ? RED : '#253050'} />
        </g>
      ))}
      <rect x="8" y="70" width="60" height="3" rx="1.5" fill={GREEN} opacity="0.3" />
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
    <svg width="100" height="70" viewBox="0 0 100 70" fill="none"
      style={{ position: 'absolute', right: 0, bottom: 0, opacity: 0.07, pointerEvents: 'none' }}
    >
      {positions.map(([cx, cy], i) => (
        <polygon key={i} points={hexPoints(cx, cy, 10)} stroke={GREEN} strokeWidth="0.8" />
      ))}
    </svg>
  );
}

/* ─── Main component ─────────────────────────────────────────────────── */
const Dashboard = () => {
  const { user, profile, isAdmin, isPremium, signOut, loading: authLoading } = useAuth();
  const [panels, setPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemFocused, setRedeemFocused] = useState(false);
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
        if (n.is_global || n.user_id === user.id) {
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
  const panelsLimit = profile?.panels_limit || 0;
  const canCreatePanel = isPremium && panels.length < panelsLimit;
  const username = profile?.username || profile?.email?.split('@')[0] || 'user';
  const usagePct = panelsLimit > 0 ? Math.round((panels.length / panelsLimit) * 100) : 0;
  const initials = getInitials(username);
  const unreadCount = notifications.filter(n => !n.read_by.includes(user?.id || '')).length;

  const notifTypeColor = (type: string) =>
    type === 'success' ? GREEN : type === 'warning' ? AMBER : CYAN;

  /* ── Loading screen ── */
  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
        <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.05 }}>
          <defs>
            <pattern id="dotgrid-load" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill={GREEN} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dotgrid-load)" />
        </svg>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: 'absolute', inset: 0, animation: 'spin 2s linear infinite' }}>
            <circle cx="26" cy="26" r="24" stroke={GREEN} strokeWidth="1.5" strokeOpacity="0.35" strokeDasharray="8 4" />
          </svg>
          <div style={{ position: 'absolute', inset: 6, borderRadius: '50%', background: '#0d1a12', border: `1px solid ${GREEN}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Terminal size={16} color={GREEN} />
          </div>
        </div>
        <p style={{ fontFamily: 'monospace', fontSize: 11, color: MUTED, letterSpacing: '0.12em' }}>CONNECTING...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Main render ── */
  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#dde4f5', overflowX: 'hidden' }}>

      {/* Dot grid */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.055 }}>
        <defs>
          <pattern id="dotgrid" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill={GREEN} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotgrid)" />
      </svg>

      <div style={{ position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <header style={{
          padding: '13px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(12,13,22,0.93)',
          backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          {/* Left: Avatar + username */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* SVG avatar */}
            <div style={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
              <svg width="38" height="38" viewBox="0 0 38 38" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="19" cy="19" r="18" stroke={GREEN} strokeWidth="1" strokeOpacity="0.3" />
                <circle cx="19" cy="19" r="13" stroke={GREEN} strokeWidth="0.5" strokeOpacity="0.12" />
              </svg>
              <div style={{
                position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
                borderRadius: '50%', background: '#0d1a12',
                border: `1px solid ${GREEN}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: 12, color: GREEN,
              }}>
                {initials}
              </div>
              <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 9, height: 9,
                borderRadius: '50%', background: GREEN, border: `2px solid ${BG}`,
                boxShadow: `0 0 5px ${GREEN}`,
              }} />
            </div>

            <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>{username}</span>
          </div>

          {/* Right: Bell + Admin + Logout */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {/* Notification bell */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setShowNotifs(v => !v)}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: unreadCount > 0 ? `${CYAN}12` : CARD,
                  border: `1px solid ${unreadCount > 0 ? `${CYAN}35` : BORDER}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <Bell size={15} color={unreadCount > 0 ? CYAN : MUTED} />
                {unreadCount > 0 && (
                  <div style={{
                    position: 'absolute', top: -4, right: -4,
                    minWidth: 17, height: 17, borderRadius: 9,
                    background: RED, border: `2px solid ${BG}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 800, color: '#fff', padding: '0 3px',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </div>
                )}
              </button>

              {/* Notifications dropdown */}
              {showNotifs && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                  width: 320, maxHeight: 420, overflowY: 'auto',
                  background: '#1e2240', border: `1px solid ${BORDER}`,
                  borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  zIndex: 100,
                }}>
                  {/* Header */}
                  <div style={{ padding: '14px 16px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${BORDER}` }}>
                    <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>Notifications</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          style={{ fontSize: 11, color: CYAN, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                        >
                          <CheckCheck size={12} /> Mark all read
                        </button>
                      )}
                      <button onClick={() => setShowNotifs(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED }}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div style={{ padding: '32px 16px', textAlign: 'center', color: MUTED, fontSize: 13 }}>
                      <Bell size={28} color={BORDER} style={{ margin: '0 auto 10px', display: 'block' }} />
                      No notifications yet
                    </div>
                  ) : (
                    <div>
                      {notifications.map(n => {
                        const isRead = n.read_by.includes(user?.id || '');
                        const typeColor = notifTypeColor(n.type);
                        return (
                          <div
                            key={n.id}
                            style={{
                              padding: '12px 16px',
                              borderBottom: `1px solid ${BORDER}`,
                              background: isRead ? 'transparent' : `${CYAN}06`,
                              cursor: 'pointer',
                              display: 'flex',
                              gap: 10,
                            }}
                            onClick={() => markOneRead(n)}
                          >
                            {/* Type indicator */}
                            <div style={{ width: 4, borderRadius: 4, background: typeColor, flexShrink: 0, alignSelf: 'stretch', minHeight: 32 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ fontWeight: isRead ? 500 : 700, color: isRead ? MUTED : '#fff', fontSize: 13 }}>
                                  {n.title}
                                </span>
                                {!isRead && (
                                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: CYAN, flexShrink: 0, marginTop: 3 }} />
                                )}
                              </div>
                              {n.message && (
                                <p style={{ fontSize: 12, color: MUTED, marginTop: 2, lineHeight: 1.4 }}>{n.message}</p>
                              )}
                              <span style={{ fontSize: 10, color: `${MUTED}80`, marginTop: 4, display: 'block' }}>{timeAgo(n.created_at)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {isAdmin && (
              <Link to="/admin">
                <button style={{ width: 36, height: 36, borderRadius: 10, background: `${AMBER}10`, border: `1px solid ${AMBER}25`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={14} color={AMBER} />
                </button>
              </Link>
            )}

            <button
              onClick={handleSignOut}
              style={{ width: 36, height: 36, borderRadius: 10, background: CARD, border: `1px solid ${BORDER}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={13} color={MUTED} />
            </button>
          </div>
        </header>

        {/* ── Main content ── */}
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '20px 16px 100px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { label: 'PANELS', value: `${panels.length}/${panelsLimit || '—'}`, color: CYAN },
              { label: 'ONLINE', value: String(runningCount), color: GREEN },
              { label: 'PLAN', value: isPremium ? 'PRO' : 'FREE', color: isPremium ? AMBER : MUTED },
            ].map(s => (
              <div key={s.label} style={{ background: CARD, border: `1px solid ${s.color}28`, borderRadius: 16, padding: '13px 11px 9px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ fontSize: 9, color: LABEL, letterSpacing: '0.12em', fontWeight: 600, marginBottom: 5 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1, letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ position: 'absolute', bottom: 4, right: 2, opacity: 0.3 }}>
                  <Sparkline color={s.color} />
                </div>
              </div>
            ))}
          </div>

          {/* Capacity bar */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, color: LABEL, letterSpacing: '0.1em', fontWeight: 600 }}>CAPACITY</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: CYAN }}>{panels.length} / {panelsLimit || '—'}</span>
            </div>
            <div style={{ height: 4, background: BORDER, borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, usagePct)}%`, height: '100%', background: usagePct >= 90 ? RED : usagePct >= 60 ? AMBER : CYAN, borderRadius: 4, transition: 'width 0.7s ease' }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: MUTED }}>
              {panelsLimit === 0 ? 'No panels purchased yet · ' : `${panelsLimit - panels.length} slot${panelsLimit - panels.length !== 1 ? 's' : ''} free · `}
              <span onClick={() => navigate('/pricing')} style={{ color: GREEN, cursor: 'pointer' }}>buy more →</span>
            </div>
          </div>

          {/* Buy banner */}
          <div
            onClick={() => navigate('/pricing')}
            style={{ background: CARD, border: `1px solid ${GREEN}20`, borderRadius: 18, padding: '16px 18px', position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
          >
            <HexPattern />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: '#fff' }}>Deploy a panel</div>
                <div style={{ fontSize: 12, color: MUTED, marginTop: 5 }}>
                  From <span style={{ color: GREEN, fontWeight: 700 }}>₦1,400/mo</span> · Node.js & Python
                </div>
                <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: GREEN, color: '#000', fontWeight: 800, fontSize: 12, padding: '7px 14px', borderRadius: 8 }}>
                  <ShoppingCart size={12} /> BUY NOW
                </div>
              </div>
              <ServerRackSVG />
            </div>
          </div>

          {/* Redeem */}
          <div style={{ background: CARD, border: `1px solid ${redeemFocused ? `${GREEN}45` : BORDER}`, borderRadius: 16, padding: '18px', transition: 'border-color 0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Gift size={16} color={GREEN} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Redeem a Code</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
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
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: BG, border: `1px solid ${redeemFocused ? `${GREEN}45` : BORDER}`,
                  borderRadius: 10, padding: '12px 40px 12px 14px',
                  fontFamily: 'monospace', fontSize: 14, letterSpacing: '0.12em',
                  color: '#fff', caretColor: GREEN, outline: 'none', transition: 'border-color 0.2s',
                }}
              />
              {redeemCode && (
                <button
                  onClick={() => setRedeemCode('')}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: MUTED, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, lineHeight: 1 }}
                >✕</button>
              )}
            </div>
            <button
              onClick={handleRedeemCode}
              disabled={redeeming || !redeemCode.trim()}
              style={{
                width: '100%', padding: '11px', borderRadius: 10, fontWeight: 700, fontSize: 13,
                cursor: redeemCode.trim() && !redeeming ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: redeemCode.trim() && !redeeming ? GREEN : BORDER,
                border: 'none',
                color: redeemCode.trim() && !redeeming ? '#000' : MUTED,
                transition: 'all 0.2s',
              }}
            >
              {redeeming ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Verifying…</> : <><Gift size={14} /> Redeem Code</>}
            </button>
          </div>

          {/* Panels section */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: LABEL, letterSpacing: '0.12em', fontWeight: 700 }}>YOUR PANELS</span>
            {canCreatePanel && (
              <button
                onClick={() => setShowCreateDialog(true)}
                style={{ fontSize: 10, color: CYAN, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, background: `${CYAN}10`, border: `1px solid ${CYAN}25`, borderRadius: 6, padding: '4px 9px', fontWeight: 600 }}
              >
                <Plus size={10} /> NEW
              </button>
            )}
          </div>

          {/* Empty state */}
          {panels.length === 0 && (
            <div style={{ background: CARD, border: `1px dashed ${BORDER}`, borderRadius: 16, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" opacity="0.3">
                {[0, 1, 2].map(i => (
                  <g key={i} transform={`translate(4,${6 + i * 13})`}>
                    <rect x="0" y="0" width="40" height="10" rx="2" stroke={GREEN} strokeWidth="1" fill="none" />
                    <circle cx="35" cy="5" r="2" fill={i === 0 ? GREEN : BORDER} />
                  </g>
                ))}
              </svg>
              <div>
                <p style={{ fontWeight: 700, color: '#fff', marginBottom: 6 }}>No panels yet</p>
                <p style={{ fontSize: 13, color: MUTED, marginBottom: 16 }}>
                  {isPremium ? 'Create your first panel to start hosting' : 'Purchase a plan to get started'}
                </p>
                <button
                  onClick={() => isPremium ? setShowCreateDialog(true) : navigate('/pricing')}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: GREEN, color: '#000', fontWeight: 800, fontSize: 12, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', border: 'none' }}
                >
                  <ShoppingCart size={13} /> {isPremium ? 'Create Panel' : 'Browse Plans'}
                </button>
              </div>
            </div>
          )}

          {/* Panel cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {panels.map(panel => {
              const days = daysLeft(panel.expires_at);
              const isExpiringSoon = days !== null && days <= 5 && days > 0;
              const isExpired = days !== null && days <= 0;
              const needsSetup = panel.name.startsWith('ClaimedPanel_');

              const statusColor =
                panel.status === 'running' ? GREEN :
                panel.status === 'deploying' ? AMBER :
                panel.status === 'error' ? RED : MUTED;
              const statusLabel =
                panel.status === 'running' ? 'ONLINE' :
                panel.status === 'deploying' ? 'DEPLOYING' :
                panel.status === 'error' ? 'ERROR' : 'OFFLINE';
              const glow =
                panel.status === 'running' ? `0 0 8px ${GREEN}40` :
                panel.status === 'error' ? `0 0 8px ${RED}40` : 'none';
              const langColor = panel.language === 'nodejs' ? GREEN : BLUE;

              return (
                <div
                  key={panel.id}
                  onClick={() => handlePanelClick(panel)}
                  style={{ background: CARD, border: `1px solid ${statusColor}28`, borderRadius: 14, padding: '13px 14px 13px 17px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: statusColor, boxShadow: glow }} />

                  {needsSetup ? (
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${CYAN}08`, border: `1px dashed ${CYAN}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 18, color: MUTED }}>?</span>
                    </div>
                  ) : (
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: `${langColor}08`, border: `1px solid ${langColor}20`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: langColor, lineHeight: 1 }}>
                        {panel.language === 'nodejs' ? 'JS' : 'PY'}
                      </span>
                      <span style={{ fontSize: 9, color: `${langColor}60`, marginTop: 1 }}>
                        {panel.language === 'nodejs' ? 'node' : 'py3'}
                      </span>
                    </div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: needsSetup ? CYAN : '#fff', fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {needsSetup ? 'Tap to configure →' : panel.name}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {isExpired ? (
                        <span style={{ color: RED, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke={RED} strokeWidth="1"/><path d="M5 3v2.5" stroke={RED} strokeWidth="1" strokeLinecap="round"/><circle cx="5" cy="7" r="0.5" fill={RED}/></svg>
                          Expired
                        </span>
                      ) : isExpiringSoon ? (
                        <span style={{ color: AMBER, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={10} />{days}d left
                        </span>
                      ) : !needsSetup ? (
                        panel.language === 'nodejs' ? 'Node.js 20' : 'Python 3.11'
                      ) : null}
                    </div>
                  </div>

                  {!needsSetup && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, background: `${statusColor}14`, border: `1px solid ${statusColor}28`, borderRadius: 6, padding: '4px 8px', flexShrink: 0 }}>
                      <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor, boxShadow: glow }} />
                      <span style={{ fontSize: 9, color: statusColor, fontWeight: 700, letterSpacing: '0.1em' }}>{statusLabel}</span>
                    </div>
                  )}

                  <ChevronRight size={14} color={BORDER} />
                </div>
              );
            })}
          </div>

          {/* Slots full note */}
          {panels.length > 0 && panels.length >= panelsLimit && panelsLimit > 0 && (
            <div style={{ textAlign: 'center', fontSize: 12, color: MUTED }}>
              All {panelsLimit} slots used ·{' '}
              <span onClick={() => navigate('/pricing')} style={{ color: GREEN, cursor: 'pointer' }}>buy more →</span>
            </div>
          )}

          {/* Footer */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <polyline points="1,3 5,6 1,9" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="6" y1="9" x2="11" y2="9" stroke={GREEN} strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: MUTED }}>
              <span style={{ color: GREEN }}>{username}</span>
              {' · '}{panels.length}/{panelsLimit || '—'} panels
              {runningCount > 0 && <span style={{ color: GREEN }}> · {runningCount} running</span>}
              {' · '}{isPremium ? 'premium' : 'free'}
            </span>
          </div>
        </main>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <CreatePanelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPanels} />

      {/* Panel Setup Dialog */}
      <Dialog open={!!setupPanel} onOpenChange={(open) => !open && setSetupPanel(null)}>
        <DialogContent className="sm:max-w-md" style={{ background: CARD, border: `1px solid ${BORDER}`, color: '#dde4f5' }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#fff' }}>Configure Panel</DialogTitle>
            <DialogDescription style={{ color: MUTED }}>Name your panel and choose its runtime</DialogDescription>
          </DialogHeader>
          <div style={{ paddingTop: 16, paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: MUTED, fontSize: 12 }}>Panel Name</Label>
              <Input
                placeholder="my-discord-bot"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                className="font-mono"
                style={{ background: BG, border: `1px solid ${BORDER}`, color: '#fff' }}
                autoFocus
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Label style={{ color: MUTED, fontSize: 12 }}>Runtime</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {(['nodejs', 'python'] as const).map(key => {
                  const color = key === 'nodejs' ? GREEN : BLUE;
                  const selected = setupLanguage === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSetupLanguage(key)}
                      style={{ padding: 16, borderRadius: 12, border: `2px solid ${selected ? color : BORDER}`, background: selected ? `${color}10` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}
                    >
                      <span style={{ display: 'block', fontFamily: 'monospace', fontWeight: 900, fontSize: 22, color }}>{key === 'nodejs' ? 'JS' : 'PY'}</span>
                      <span style={{ display: 'block', fontSize: 12, color: MUTED, marginTop: 4 }}>{key === 'nodejs' ? 'Node.js' : 'Python'}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="outline" onClick={() => setSetupPanel(null)} style={{ borderColor: BORDER, color: MUTED }}>Cancel</Button>
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

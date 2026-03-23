import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RedeemCodeDialog } from '@/components/admin/RedeemCodeDialog';
import { RevenueChart } from '@/components/admin/RevenueChart';
import { UserGrowthChart } from '@/components/admin/UserGrowthChart';
import { PanelStatusChart } from '@/components/admin/PanelStatusChart';
import { TransactionsTable } from '@/components/admin/TransactionsTable';
import { PlanPerformance } from '@/components/admin/PlanPerformance';
import {
  ArrowLeft, Users, Crown, Server, Loader2, Check, X, Ban, Shield,
  Search, Gift, Activity, TrendingUp, Terminal, Copy, Trash2, Eye,
  MoreVertical, Plus, Calendar, Settings, DollarSign, BarChart3,
  Bell, Send, Power, AlertTriangle, Pencil, Save, RefreshCw, ChevronRight,
  Zap, Radio,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const BG     = '#0c0d16';
const CARD   = '#0d0d1a';
const CARD2  = '#111122';
const BORDER = '#1a1a2e';
const MUTED  = '#5a5a88';
const GREEN  = '#00e676';
const CYAN   = '#00b0ff';
const AMBER  = '#f0b429';
const RED    = '#ff4d4d';

interface User {
  id: string;
  email: string;
  username: string | null;
  premium_status: 'none' | 'pending' | 'approved' | 'rejected';
  is_banned: boolean;
  ban_reason: string | null;
  created_at: string;
  panels_limit: number;
}

interface PremiumRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  profiles?: { email: string; username: string | null };
}

interface RedeemCode {
  id: string;
  code: string;
  max_uses: number | null;
  current_uses: number;
  panels_granted: number;
  created_at: string;
  is_active: boolean;
}

interface UserPanel {
  id: string;
  name: string;
  language: string;
  status: string;
  created_at: string;
  expires_at: string | null;
}

interface ManagedPanel {
  id: string;
  name: string;
  language: string;
  status: string;
  expires_at: string | null;
  user_id: string;
  created_at: string;
  user_email?: string;
}

interface AllPanel {
  id: string;
  status: string;
  language: string;
  created_at: string;
}

interface Transaction {
  id: string;
  user_id: string;
  plan_id: string | null;
  amount: number;
  currency: string;
  status: string;
  paystack_reference: string | null;
  created_at: string;
  user_email?: string;
  plan_name?: string;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  panels_count: number;
  duration_days: number;
  description: string | null;
  is_popular: boolean;
  is_active: boolean;
  features?: string[];
  ram_mb?: number;
  cpu_cores?: number;
  storage_mb?: number;
  sort_order?: number;
}

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  pendingRequests: number;
  totalPanels: number;
  runningPanels: number;
  bannedUsers: number;
  activeCodesCount: number;
  totalRedemptions: number;
  totalRevenue: number;
  transactionsCount: number;
}

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: BarChart3  },
  { id: 'users',     label: 'Users',     icon: Users      },
  { id: 'plans',     label: 'Plans',     icon: DollarSign },
  { id: 'codes',     label: 'Codes',     icon: Gift       },
  { id: 'notify',    label: 'Notify',    icon: Bell       },
  { id: 'finance',   label: 'Finance',   icon: TrendingUp },
  { id: 'panels',    label: 'Panels',    icon: Server     },
];

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<PremiumRequest[]>([]);
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, premiumUsers: 0, pendingRequests: 0, totalPanels: 0,
    runningPanels: 0, bannedUsers: 0, activeCodesCount: 0, totalRedemptions: 0,
    totalRevenue: 0, transactionsCount: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPanels, setAllPanels] = useState<AllPanel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionUser, setActionUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'ban' | 'unban' | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [userPanels, setUserPanels] = useState<UserPanel[]>([]);
  const [loadingPanels, setLoadingPanels] = useState(false);
  const [addPanelsUser, setAddPanelsUser] = useState<User | null>(null);
  const [panelsToAdd, setPanelsToAdd] = useState('1');
  const [panelIdSearch, setPanelIdSearch] = useState('');
  const [searchingPanel, setSearchingPanel] = useState(false);
  const [managedPanel, setManagedPanel] = useState<ManagedPanel | null>(null);
  const [extendDuration, setExtendDuration] = useState('720');
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMessage, setNotifMessage] = useState('');
  const [notifType, setNotifType] = useState<'info' | 'success' | 'warning'>('info');
  const [notifTarget, setNotifTarget] = useState('all');
  const [sendingNotif, setSendingNotif] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(
    'We are performing scheduled maintenance. Please check back shortly.'
  );
  const [savingMaintenance, setSavingMaintenance] = useState(false);
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planEdits, setPlanEdits] = useState<Record<string, Partial<Plan>>>({});
  const [savingPlan, setSavingPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) navigate('/auth');
      else if (!isAdmin) navigate('/dashboard');
    }
  }, [user, isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      loadSettings();
    }
  }, [isAdmin]);

  const loadSettings = async () => {
    const { data } = await (supabase as any).from('site_settings').select('*').eq('id', 'main').maybeSingle();
    if (data) {
      setMaintenanceMode(data.maintenance_mode || false);
      setMaintenanceMessage(data.maintenance_message || 'We are performing scheduled maintenance. Please check back shortly.');
    }
  };

  const saveMaintenanceSettings = async (enabled: boolean) => {
    setSavingMaintenance(true);
    const { error } = await (supabase as any).from('site_settings').upsert({
      id: 'main',
      maintenance_mode: enabled,
      maintenance_message: maintenanceMessage,
      updated_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: 'Error', description: 'Run the site_settings SQL migration first', variant: 'destructive' });
    } else {
      setMaintenanceMode(enabled);
      toast({
        title: enabled ? 'Maintenance Mode ON' : 'Site is Live',
        description: enabled ? 'Users will see the maintenance page' : 'Site is now accessible to all users',
      });
    }
    setSavingMaintenance(false);
  };

  const fetchData = async () => {
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (usersData) setUsers(usersData as User[]);

    const { data: requestsData } = await supabase
      .from('premium_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    if (requestsData) {
      const enriched = await Promise.all(requestsData.map(async (req) => {
        const { data: profile } = await supabase.from('profiles').select('email, username').eq('id', req.user_id).single();
        return { ...req, profiles: profile };
      }));
      setRequests(enriched as PremiumRequest[]);
    }

    const { data: codesData } = await supabase.from('redeem_codes').select('*').order('created_at', { ascending: false });
    if (codesData) setRedeemCodes(codesData as RedeemCode[]);

    const { data: txData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false }).limit(100);
    if (txData) {
      const enrichedTx = await Promise.all((txData as Transaction[]).map(async (tx) => {
        const [profileRes, planRes] = await Promise.all([
          supabase.from('profiles').select('email').eq('id', tx.user_id).maybeSingle(),
          tx.plan_id ? supabase.from('plans').select('name').eq('id', tx.plan_id).maybeSingle() : Promise.resolve({ data: null }),
        ]);
        return { ...tx, user_email: profileRes.data?.email, plan_name: (planRes as any).data?.name };
      }));
      setTransactions(enrichedTx);
    }

    const [
      { count: totalUsers }, { count: premiumUsers }, { count: pendingRequests },
      { count: totalPanels }, { count: runningPanels }, { count: bannedUsers },
      { count: activeCodesCount }, { count: totalRedemptions }, { count: transactionsCount },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('premium_status', 'approved'),
      supabase.from('premium_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('panels').select('*', { count: 'exact', head: true }),
      supabase.from('panels').select('*', { count: 'exact', head: true }).eq('status', 'running'),
      supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('redeem_codes').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('code_redemptions').select('*', { count: 'exact', head: true }),
      supabase.from('transactions').select('*', { count: 'exact', head: true }).eq('status', 'success'),
    ]);

    const { data: successfulTx } = await supabase.from('transactions').select('amount').eq('status', 'success');
    const totalRevenue = (successfulTx || []).reduce((sum, tx) => sum + (tx.amount || 0), 0);

    setStats({
      totalUsers: totalUsers || 0, premiumUsers: premiumUsers || 0,
      pendingRequests: pendingRequests || 0, totalPanels: totalPanels || 0,
      runningPanels: runningPanels || 0, bannedUsers: bannedUsers || 0,
      activeCodesCount: activeCodesCount || 0, totalRedemptions: totalRedemptions || 0,
      totalRevenue, transactionsCount: transactionsCount || 0,
    });

    const { data: plansData } = await supabase.from('plans').select('*').order('sort_order', { ascending: true });
    if (plansData) setPlans(plansData as Plan[]);

    const { data: panelsData } = await supabase.from('panels').select('id, status, language, created_at');
    if (panelsData) setAllPanels(panelsData as AllPanel[]);

    setLoading(false);
  };

  const handleApproveRequest = async (request: PremiumRequest) => {
    await supabase.from('premium_requests').update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', request.id);
    await supabase.from('profiles').update({ premium_status: 'approved', panels_limit: 5 }).eq('id', request.user_id);
    toast({ title: 'Approved', description: 'Premium access granted with 5 panel slots' });
    fetchData();
  };

  const handleRejectRequest = async (request: PremiumRequest) => {
    await supabase.from('premium_requests').update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', request.id);
    await supabase.from('profiles').update({ premium_status: 'rejected' }).eq('id', request.user_id);
    toast({ title: 'Rejected', description: 'Premium request rejected' });
    fetchData();
  };

  const handleTogglePremium = async (targetUser: User) => {
    const newStatus = targetUser.premium_status === 'approved' ? 'none' : 'approved';
    const newLimit = newStatus === 'approved' ? 5 : 0;
    await supabase.from('profiles').update({ premium_status: newStatus, panels_limit: newLimit }).eq('id', targetUser.id);
    toast({ title: newStatus === 'approved' ? 'Premium Granted' : 'Premium Revoked', description: `Updated for ${targetUser.email}` });
    fetchData();
  };

  const handleBanUser = async () => {
    if (!actionUser) return;
    const isBanning = actionType === 'ban';
    await supabase.from('profiles').update({ is_banned: isBanning, ban_reason: isBanning ? 'Banned by admin' : null }).eq('id', actionUser.id);
    if (isBanning) await supabase.from('panels').update({ status: 'stopped' }).eq('user_id', actionUser.id);
    toast({ title: isBanning ? 'User Banned' : 'User Unbanned', description: isBanning ? `${actionUser.email} banned, panels stopped` : `${actionUser.email} unbanned` });
    setActionUser(null);
    setActionType(null);
    fetchData();
  };

  const handleViewUser = async (targetUser: User) => {
    setViewingUser(targetUser);
    setLoadingPanels(true);
    const { data: panels } = await supabase.from('panels').select('*').eq('user_id', targetUser.id).order('created_at', { ascending: false });
    setUserPanels((panels || []) as UserPanel[]);
    setLoadingPanels(false);
  };

  const handleAddPanels = async () => {
    if (!addPanelsUser) return;
    const numPanels = parseInt(panelsToAdd) || 0;
    if (numPanels <= 0) { toast({ title: 'Error', description: 'Enter a valid number', variant: 'destructive' }); return; }
    const newLimit = (addPanelsUser.panels_limit || 0) + numPanels;
    const { error } = await supabase.from('profiles').update({ panels_limit: newLimit }).eq('id', addPanelsUser.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update', variant: 'destructive' }); }
    else { toast({ title: 'Panels Added', description: `+${numPanels} slots → new limit: ${newLimit}` }); fetchData(); }
    setAddPanelsUser(null);
    setPanelsToAdd('1');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: 'Copied!' });
  };

  const handleDeleteCode = async (codeId: string) => {
    await supabase.from('redeem_codes').delete().eq('id', codeId);
    toast({ title: 'Deleted' });
    fetchData();
  };

  const handleToggleCodeActive = async (code: RedeemCode) => {
    await supabase.from('redeem_codes').update({ is_active: !code.is_active }).eq('id', code.id);
    toast({ title: code.is_active ? 'Code Deactivated' : 'Code Activated' });
    fetchData();
  };

  const handleSearchPanel = async () => {
    if (!panelIdSearch.trim()) return;
    setSearchingPanel(true);
    const { data: panel, error } = await supabase.from('panels').select('*').eq('id', panelIdSearch.trim()).maybeSingle();
    if (error || !panel) {
      toast({ title: 'Not Found', description: 'No panel with that ID', variant: 'destructive' });
      setSearchingPanel(false);
      return;
    }
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', panel.user_id).maybeSingle();
    setManagedPanel({ ...panel, user_email: profile?.email } as ManagedPanel);
    setSearchingPanel(false);
  };

  const handleExtendPanel = async () => {
    if (!managedPanel) return;
    const hours = parseInt(extendDuration) || 720;
    const currentExpiry = managedPanel.expires_at ? new Date(managedPanel.expires_at) : new Date();
    const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
    newExpiry.setHours(newExpiry.getHours() + hours);
    const { error } = await supabase.from('panels').update({ expires_at: newExpiry.toISOString() }).eq('id', managedPanel.id);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); }
    else { toast({ title: 'Extended!', description: `Expires: ${newExpiry.toLocaleDateString()}` }); setManagedPanel({ ...managedPanel, expires_at: newExpiry.toISOString() }); }
  };

  const handleDeletePanel = async () => {
    if (!managedPanel) return;
    const { error } = await supabase.from('panels').delete().eq('id', managedPanel.id);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); }
    else { toast({ title: 'Panel Deleted' }); setManagedPanel(null); setPanelIdSearch(''); fetchData(); }
  };

  const handleStopPanel = async () => {
    if (!managedPanel) return;
    const { error } = await supabase.from('panels').update({ status: 'stopped' }).eq('id', managedPanel.id);
    if (error) { toast({ title: 'Error', variant: 'destructive' }); }
    else { toast({ title: 'Panel Stopped' }); setManagedPanel({ ...managedPanel, status: 'stopped' }); }
  };

  const handleSendNotification = async () => {
    if (!notifTitle.trim() || !user) return;
    setSendingNotif(true);
    const payload: Record<string, unknown> = {
      title: notifTitle.trim(), message: notifMessage.trim(),
      type: notifType, is_global: notifTarget === 'all', read_by: [],
    };
    if (notifTarget !== 'all') {
      const found = users.find(u =>
        u.email.toLowerCase() === notifTarget.toLowerCase() ||
        u.username?.toLowerCase() === notifTarget.toLowerCase()
      );
      if (!found) {
        toast({ title: 'User not found', description: `No user matching "${notifTarget}"`, variant: 'destructive' });
        setSendingNotif(false);
        return;
      }
      payload.user_id = found.id;
      payload.is_global = false;
    }
    const { error } = await (supabase as any).from('notifications').insert(payload);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); }
    else {
      toast({ title: 'Notification Sent!', description: notifTarget === 'all' ? 'Broadcast to all users' : `Sent to ${notifTarget}` });
      setNotifTitle(''); setNotifMessage(''); setNotifTarget('all'); setNotifType('info');
    }
    setSendingNotif(false);
  };

  const startEditPlan = (plan: Plan) => {
    setEditingPlan(plan.id);
    setPlanEdits(prev => ({ ...prev, [plan.id]: { ...plan } }));
  };

  const savePlan = async (plan: Plan) => {
    const edits = planEdits[plan.id];
    if (!edits) return;
    setSavingPlan(plan.id);
    const { error } = await supabase.from('plans').update({
      name: edits.name,
      price: edits.price,
      panels_count: edits.panels_count,
      duration_days: edits.duration_days,
      description: edits.description,
      is_active: edits.is_active,
      is_popular: edits.is_popular,
      ram_mb: edits.ram_mb,
      cpu_cores: edits.cpu_cores,
      storage_mb: edits.storage_mb,
    }).eq('id', plan.id);
    if (error) { toast({ title: 'Error', description: 'Failed to update plan', variant: 'destructive' }); }
    else { toast({ title: 'Plan Updated!', description: `${edits.name} saved` }); fetchData(); setEditingPlan(null); }
    setSavingPlan(null);
  };

  const updatePlanEdit = (planId: string, field: keyof Plan, value: any) => {
    setPlanEdits(prev => ({ ...prev, [planId]: { ...prev[planId], [field]: value } }));
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: `${GREEN}18`, border: `1.5px solid ${GREEN}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Shield style={{ width: 26, height: 26, color: GREEN }} />
          </div>
          <p style={{ color: MUTED, fontFamily: 'monospace', fontSize: 13 }}>Loading admin panel…</p>
        </div>
      </div>
    );
  }

  const Card = ({ children, style = {}, glow }: { children: React.ReactNode; style?: React.CSSProperties; glow?: string }) => (
    <div style={{ background: CARD, border: `1px solid ${glow ? `${glow}30` : BORDER}`, borderRadius: 14, ...style }}>
      {children}
    </div>
  );

  const StatCard = ({ label, value, sub, color, icon: Icon }: { label: string; value: string | number; sub?: string; color: string; icon: any }) => (
    <Card glow={color} style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon style={{ width: 18, height: 18, color }} />
        </div>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'monospace', color, lineHeight: 1 }}>{value}</div>
          <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{label}</div>
          {sub && <div style={{ fontSize: 10, color: `${MUTED}88`, marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );

  const notifColors: Record<string, string> = { info: CYAN, success: GREEN, warning: AMBER };

  return (
    <div style={{ minHeight: '100vh', background: BG }}>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: `${CARD}f5`, backdropFilter: 'blur(20px)', borderBottom: `1px solid ${BORDER}`, WebkitBackdropFilter: 'blur(20px)' }}>
        <div style={{ padding: '0 16px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: CARD2, color: MUTED, textDecoration: 'none', flexShrink: 0 }}>
              <ArrowLeft style={{ width: 16, height: 16 }} />
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, background: `${GREEN}15`, border: `1.5px solid ${GREEN}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Shield style={{ width: 18, height: 18, color: GREEN }} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: 15, color: '#eeeeff', lineHeight: 1 }}>Admin Panel</div>
                <div style={{ fontSize: 11, color: MUTED, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: maintenanceMode ? AMBER : GREEN, display: 'inline-block', boxShadow: maintenanceMode ? `0 0 6px ${AMBER}` : `0 0 6px ${GREEN}` }} />
                  {maintenanceMode ? 'Maintenance Mode' : 'System Live'}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => fetchData()}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 36, height: 36, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}
            >
              <RefreshCw style={{ width: 15, height: 15 }} />
            </button>
            <button
              onClick={() => setShowRedeemDialog(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 36, borderRadius: 10, background: GREEN, border: 'none', color: '#000', fontWeight: 700, fontFamily: 'monospace', fontSize: 12, cursor: 'pointer' }}
            >
              <Gift style={{ width: 14, height: 14 }} />
              Generate Code
            </button>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', overflowX: 'auto', borderTop: `1px solid ${BORDER}`, scrollbarWidth: 'none' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '10px 16px',
                  borderBottom: active ? `2px solid ${GREEN}` : '2px solid transparent',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: active ? GREEN : MUTED, fontFamily: 'monospace', fontSize: 12,
                  fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              >
                <tab.icon style={{ width: 13, height: 13 }} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      <main style={{ padding: '20px 16px 100px' }}>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stats grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <StatCard label="Total Users" value={stats.totalUsers} icon={Users} color={CYAN} />
              <StatCard label="Premium Users" value={stats.premiumUsers} icon={Crown} color={AMBER} />
              <StatCard label="Running Panels" value={stats.runningPanels} sub={`of ${stats.totalPanels} total`} icon={Server} color={GREEN} />
              <StatCard label="Total Revenue" value={`₦${(stats.totalRevenue / 100).toLocaleString()}`} sub={`${stats.transactionsCount} txns`} icon={DollarSign} color="#a855f7" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <StatCard label="Pending" value={stats.pendingRequests} icon={AlertTriangle} color={AMBER} />
              <StatCard label="Banned" value={stats.bannedUsers} icon={Ban} color={RED} />
              <StatCard label="Redemptions" value={stats.totalRedemptions} icon={Gift} color={CYAN} />
            </div>

            {/* Maintenance Mode Card */}
            <Card glow={maintenanceMode ? AMBER : BORDER}>
              <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: `${AMBER}18`, border: `1px solid ${AMBER}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Power style={{ width: 18, height: 18, color: AMBER }} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontFamily: 'monospace', color: '#eeeeff', fontSize: 14 }}>Maintenance Mode</div>
                      <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>
                        {maintenanceMode ? 'Site is DOWN for users' : 'Site is live for all users'}
                      </div>
                    </div>
                  </div>
                  {/* Toggle */}
                  <button
                    onClick={() => saveMaintenanceSettings(!maintenanceMode)}
                    disabled={savingMaintenance}
                    style={{
                      width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                      background: maintenanceMode ? AMBER : BORDER, transition: 'background 0.2s',
                      position: 'relative', display: 'flex', alignItems: 'center', padding: '0 3px',
                    }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: '50%', background: '#fff',
                      transform: maintenanceMode ? 'translateX(24px)' : 'translateX(0px)',
                      transition: 'transform 0.2s', flexShrink: 0,
                    }} />
                  </button>
                </div>

                {maintenanceMode && (
                  <div style={{ padding: '12px 0 0', borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 11, color: MUTED, marginBottom: 6, fontFamily: 'monospace' }}>Maintenance Message</div>
                    <textarea
                      rows={2}
                      value={maintenanceMessage}
                      onChange={e => setMaintenanceMessage(e.target.value)}
                      style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#cccde8', resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                    />
                    <button
                      onClick={() => saveMaintenanceSettings(true)}
                      disabled={savingMaintenance}
                      style={{ marginTop: 8, padding: '7px 14px', borderRadius: 8, background: AMBER, border: 'none', color: '#000', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}
                    >
                      {savingMaintenance ? 'Saving…' : 'Update Message'}
                    </button>
                  </div>
                )}

                {!maintenanceMode && (
                  <div style={{ padding: '12px 0 0', borderTop: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: 12, color: `${MUTED}aa` }}>
                      Toggle to take the site offline for maintenance. Admins will still have full access.
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Quick Actions */}
            <Card>
              <div style={{ padding: '16px 20px' }}>
                <div style={{ fontSize: 12, color: MUTED, fontFamily: 'monospace', marginBottom: 12 }}>QUICK ACTIONS</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Generate Redeem Code', icon: Gift, color: GREEN, action: () => setShowRedeemDialog(true) },
                    { label: 'Manage Users', icon: Users, color: CYAN, action: () => setActiveTab('users') },
                    { label: 'Edit Pricing Plans', icon: DollarSign, color: AMBER, action: () => setActiveTab('plans') },
                    { label: 'Broadcast Notification', icon: Radio, color: '#a855f7', action: () => setActiveTab('notify') },
                  ].map(({ label, icon: Icon, color, action }) => (
                    <button
                      key={label}
                      onClick={action}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 10, background: CARD2, border: `1px solid ${BORDER}`, cursor: 'pointer', width: '100%', textAlign: 'left' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Icon style={{ width: 16, height: 16, color }} />
                        <span style={{ fontSize: 13, color: '#cccde8', fontWeight: 500 }}>{label}</span>
                      </div>
                      <ChevronRight style={{ width: 14, height: 14, color: MUTED }} />
                    </button>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ── USERS TAB ── */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: MUTED }} />
              <input
                placeholder="Search by email or username…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '10px 12px 10px 36px', fontSize: 13, color: '#cccde8', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>{filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}</div>
            {filteredUsers.map(u => (
              <Card key={u.id} glow={u.is_banned ? RED : u.premium_status === 'approved' ? AMBER : undefined}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Avatar */}
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: u.is_banned ? `${RED}20` : u.premium_status === 'approved' ? `${AMBER}20` : `${CYAN}15`, border: `1.5px solid ${u.is_banned ? RED : u.premium_status === 'approved' ? AMBER : CYAN}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontFamily: 'monospace', fontWeight: 800, fontSize: 14, color: u.is_banned ? RED : u.premium_status === 'approved' ? AMBER : CYAN }}>
                    {(u.username || u.email)[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#ddddf5' }}>{u.username || u.email.split('@')[0]}</span>
                      {u.is_banned && <span style={{ fontSize: 10, background: `${RED}20`, color: RED, border: `1px solid ${RED}40`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>BANNED</span>}
                      {u.premium_status === 'approved' && <span style={{ fontSize: 10, background: `${AMBER}20`, color: AMBER, border: `1px solid ${AMBER}40`, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>PRO</span>}
                    </div>
                    <div style={{ fontSize: 11, color: MUTED, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    <div style={{ fontSize: 11, color: `${MUTED}88`, marginTop: 1, fontFamily: 'monospace' }}>{u.panels_limit || 0} panel slots</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: MUTED, flexShrink: 0 }}>
                        <MoreVertical style={{ width: 15, height: 15 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
                      <DropdownMenuItem onClick={() => handleViewUser(u)} style={{ color: '#cccde8', cursor: 'pointer' }}>
                        <Eye style={{ width: 14, height: 14, marginRight: 8, color: CYAN }} />
                        View Panels
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleTogglePremium(u)} style={{ color: '#cccde8', cursor: 'pointer' }}>
                        <Crown style={{ width: 14, height: 14, marginRight: 8, color: AMBER }} />
                        {u.premium_status === 'approved' ? 'Revoke Premium' : 'Grant Premium'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => { setAddPanelsUser(u); setPanelsToAdd('1'); }} style={{ color: '#cccde8', cursor: 'pointer' }}>
                        <Plus style={{ width: 14, height: 14, marginRight: 8, color: GREEN }} />
                        Add Panel Slots
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => { setActionUser(u); setActionType(u.is_banned ? 'unban' : 'ban'); }}
                        style={{ color: u.is_banned ? GREEN : RED, cursor: 'pointer' }}
                      >
                        <Ban style={{ width: 14, height: 14, marginRight: 8 }} />
                        {u.is_banned ? 'Unban User' : 'Ban User'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── PLANS TAB ── */}
        {activeTab === 'plans' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 12, color: MUTED }}>Edit pricing plans. Changes apply immediately to new purchases.</div>
            {plans.map(plan => {
              const isEditing = editingPlan === plan.id;
              const edits = planEdits[plan.id] || plan;
              const planColor = plan.is_popular ? AMBER : CYAN;
              return (
                <Card key={plan.id} glow={planColor}>
                  <div style={{ padding: 18 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${planColor}18`, border: `1px solid ${planColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <DollarSign style={{ width: 16, height: 16, color: planColor }} />
                        </div>
                        <div>
                          {isEditing ? (
                            <input
                              value={edits.name || ''}
                              onChange={e => updatePlanEdit(plan.id, 'name', e.target.value)}
                              style={{ background: CARD2, border: `1px solid ${planColor}60`, borderRadius: 6, padding: '3px 8px', fontSize: 14, fontWeight: 700, color: '#eeeeff', fontFamily: 'monospace', width: 130, outline: 'none' }}
                            />
                          ) : (
                            <div style={{ fontWeight: 800, fontFamily: 'monospace', color: '#eeeeff', fontSize: 14 }}>{plan.name}</div>
                          )}
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            {plan.is_popular && <span style={{ fontSize: 10, background: `${AMBER}20`, color: AMBER, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>POPULAR</span>}
                            <span style={{ fontSize: 10, background: plan.is_active ? `${GREEN}15` : `${RED}15`, color: plan.is_active ? GREEN : RED, borderRadius: 4, padding: '1px 6px', fontWeight: 700 }}>
                              {plan.is_active ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </div>
                        </div>
                      </div>
                      {!isEditing ? (
                        <button
                          onClick={() => startEditPlan(plan)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: CARD2, border: `1px solid ${BORDER}`, color: MUTED, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                        >
                          <Pencil style={{ width: 12, height: 12 }} />
                          Edit
                        </button>
                      ) : (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => { setEditingPlan(null); }}
                            style={{ padding: '6px 10px', borderRadius: 8, background: 'transparent', border: `1px solid ${BORDER}`, color: MUTED, cursor: 'pointer', fontSize: 12 }}
                          >
                            <X style={{ width: 13, height: 13 }} />
                          </button>
                          <button
                            onClick={() => savePlan(plan)}
                            disabled={savingPlan === plan.id}
                            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, background: GREEN, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                          >
                            {savingPlan === plan.id ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" /> : <Save style={{ width: 12, height: 12 }} />}
                            Save
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>PRICE (KOBO)</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edits.price || 0}
                            onChange={e => updatePlanEdit(plan.id, 'price', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: planColor }}>
                            ₦{((edits.price || 0) / 100).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>PANELS</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edits.panels_count || 0}
                            onChange={e => updatePlanEdit(plan.id, 'panels_count', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#cccde8' }}>{edits.panels_count}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>DURATION (DAYS)</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edits.duration_days || 0}
                            onChange={e => updatePlanEdit(plan.id, 'duration_days', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#cccde8' }}>{edits.duration_days}d</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>RAM (MB)</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edits.ram_mb || 0}
                            onChange={e => updatePlanEdit(plan.id, 'ram_mb', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>
                            {edits.ram_mb ? (edits.ram_mb >= 1024 ? `${(edits.ram_mb / 1024).toFixed(1).replace(/\.0$/, '')} GB` : `${edits.ram_mb} MB`) : '—'}
                          </div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>CPU (CORES)</div>
                        {isEditing ? (
                          <input
                            type="number"
                            step="0.5"
                            value={edits.cpu_cores || 0}
                            onChange={e => updatePlanEdit(plan.id, 'cpu_cores', parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>{edits.cpu_cores ?? '—'}</div>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>STORAGE (MB)</div>
                        {isEditing ? (
                          <input
                            type="number"
                            value={edits.storage_mb || 0}
                            onChange={e => updatePlanEdit(plan.id, 'storage_mb', parseInt(e.target.value) || 0)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 18, color: '#60a5fa' }}>
                            {edits.storage_mb ? (edits.storage_mb >= 1024 ? `${(edits.storage_mb / 1024).toFixed(1).replace(/\.0$/, '')} GB` : `${edits.storage_mb} MB`) : '—'}
                          </div>
                        )}
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 4 }}>DESCRIPTION</div>
                        {isEditing ? (
                          <input
                            value={edits.description || ''}
                            onChange={e => updatePlanEdit(plan.id, 'description', e.target.value)}
                            style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#cccde8', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          />
                        ) : (
                          <div style={{ fontSize: 12, color: MUTED }}>{edits.description || '—'}</div>
                        )}
                      </div>
                    </div>

                    {isEditing && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 12, paddingTop: 12, borderTop: `1px solid ${BORDER}` }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={edits.is_active ?? true} onChange={e => updatePlanEdit(plan.id, 'is_active', e.target.checked)} style={{ accentColor: GREEN }} />
                          <span style={{ fontSize: 12, color: '#cccde8' }}>Active</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                          <input type="checkbox" checked={edits.is_popular ?? false} onChange={e => updatePlanEdit(plan.id, 'is_popular', e.target.checked)} style={{ accentColor: AMBER }} />
                          <span style={{ fontSize: 12, color: '#cccde8' }}>Mark as Popular</span>
                        </label>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* ── CODES TAB ── */}
        {activeTab === 'codes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => setShowRedeemDialog(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: `${GREEN}15`, border: `1.5px dashed ${GREEN}50`, color: GREEN, fontWeight: 700, fontFamily: 'monospace', fontSize: 13, cursor: 'pointer', width: '100%' }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Generate New Code
            </button>
            {redeemCodes.length === 0 && (
              <Card>
                <div style={{ padding: 48, textAlign: 'center' }}>
                  <Gift style={{ width: 40, height: 40, color: MUTED, margin: '0 auto 12px', opacity: 0.4 }} />
                  <div style={{ color: MUTED, fontFamily: 'monospace', fontSize: 13 }}>No redeem codes yet</div>
                </div>
              </Card>
            )}
            {redeemCodes.map(code => (
              <Card key={code.id} glow={code.is_active ? GREEN : undefined} style={{ opacity: code.is_active ? 1 : 0.55 }}>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, color: code.is_active ? GREEN : MUTED, letterSpacing: 1 }}>{code.code}</span>
                      <button onClick={() => handleCopyCode(code.code)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: MUTED, padding: 2 }}>
                        <Copy style={{ width: 13, height: 13 }} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 5, fontSize: 11, color: MUTED, fontFamily: 'monospace' }}>
                      <span>Uses: {code.current_uses}/{code.max_uses ?? '∞'}</span>
                      <span>•</span>
                      <span>{code.panels_granted} panel{code.panels_granted !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span style={{ color: code.is_active ? GREEN : RED }}>{code.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button style={{ width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <MoreVertical style={{ width: 14, height: 14 }} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" style={{ background: CARD2, border: `1px solid ${BORDER}` }}>
                      <DropdownMenuItem onClick={() => handleToggleCodeActive(code)} style={{ color: '#cccde8', cursor: 'pointer' }}>
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteCode(code.id)} style={{ color: RED, cursor: 'pointer' }}>
                        <Trash2 style={{ width: 13, height: 13, marginRight: 8 }} />
                        Delete Code
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* ── NOTIFY TAB ── */}
        {activeTab === 'notify' && (
          <Card>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#a855f715', border: '1px solid #a855f740', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Radio style={{ width: 17, height: 17, color: '#a855f7' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#eeeeff', fontSize: 14, fontFamily: 'monospace' }}>Broadcast Notification</div>
                  <div style={{ fontSize: 11, color: MUTED }}>Send to all users or specific user</div>
                </div>
              </div>

              {/* Target */}
              <div>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>TARGET</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['all', 'user'].map(t => {
                    const active = t === 'all' ? notifTarget === 'all' : notifTarget !== 'all';
                    return (
                      <button key={t} onClick={() => setNotifTarget(t === 'all' ? 'all' : '')}
                        style={{ flex: 1, padding: '9px', borderRadius: 10, background: active ? `${GREEN}18` : CARD2, border: `1.5px solid ${active ? GREEN : BORDER}`, color: active ? GREEN : MUTED, fontWeight: 700, fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', transition: 'all 0.15s' }}>
                        {t === 'all' ? 'All Users' : 'Specific User'}
                      </button>
                    );
                  })}
                </div>
                {notifTarget !== 'all' && (
                  <input
                    placeholder="Email or username"
                    value={notifTarget}
                    onChange={e => setNotifTarget(e.target.value)}
                    style={{ width: '100%', marginTop: 8, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#cccde8', outline: 'none', fontFamily: 'monospace', boxSizing: 'border-box' }}
                  />
                )}
              </div>

              {/* Type */}
              <div>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>TYPE</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['info', 'success', 'warning'] as const).map(t => {
                    const c = notifColors[t];
                    const sel = notifType === t;
                    return (
                      <button key={t} onClick={() => setNotifType(t)}
                        style={{ flex: 1, padding: '8px', borderRadius: 10, background: sel ? `${c}18` : CARD2, border: `1.5px solid ${sel ? c : BORDER}`, color: sel ? c : MUTED, fontWeight: 700, fontSize: 12, fontFamily: 'monospace', cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.15s' }}>
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>TITLE</div>
                <input
                  placeholder="Notification title…"
                  value={notifTitle}
                  onChange={e => setNotifTitle(e.target.value)}
                  style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#cccde8', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
              </div>

              {/* Message */}
              <div>
                <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>MESSAGE (OPTIONAL)</div>
                <textarea
                  rows={3}
                  placeholder="Additional details…"
                  value={notifMessage}
                  onChange={e => setNotifMessage(e.target.value)}
                  style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '10px 12px', fontSize: 13, color: '#cccde8', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Preview */}
              {notifTitle && (
                <div style={{ padding: 14, background: CARD2, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 8 }}>PREVIEW</div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <div style={{ width: 3, borderRadius: 3, background: notifColors[notifType], alignSelf: 'stretch', minHeight: 28, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontWeight: 700, color: '#eeeeff', fontSize: 13 }}>{notifTitle}</div>
                      {notifMessage && <div style={{ fontSize: 12, color: MUTED, marginTop: 3 }}>{notifMessage}</div>}
                      <div style={{ fontSize: 10, color: `${MUTED}66`, marginTop: 4 }}>just now</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Send */}
              <button
                onClick={handleSendNotification}
                disabled={sendingNotif || !notifTitle.trim()}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12, border: 'none',
                  background: notifTitle.trim() && !sendingNotif ? GREEN : BORDER,
                  color: notifTitle.trim() && !sendingNotif ? '#000' : MUTED,
                  fontWeight: 800, fontFamily: 'monospace', fontSize: 14,
                  cursor: notifTitle.trim() && !sendingNotif ? 'pointer' : 'not-allowed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.15s',
                }}
              >
                {sendingNotif ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Send style={{ width: 16, height: 16 }} />}
                {sendingNotif ? 'Sending…' : notifTarget === 'all' ? 'Broadcast to All Users' : 'Send to User'}
              </button>
            </div>
          </Card>
        )}

        {/* ── FINANCE TAB ── */}
        {activeTab === 'finance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <StatCard label="Total Revenue" value={`₦${(stats.totalRevenue / 100).toLocaleString()}`} icon={DollarSign} color={GREEN} />
              <StatCard label="Successful Txns" value={stats.transactionsCount} icon={TrendingUp} color={CYAN} />
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, background: CARD }}>
              <RevenueChart transactions={transactions} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 12 }}>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, background: CARD }}>
                <UserGrowthChart users={users} />
              </div>
              <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, background: CARD }}>
                <PlanPerformance transactions={transactions} plans={plans} />
              </div>
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, background: CARD }}>
              <TransactionsTable transactions={transactions} />
            </div>
          </div>
        )}

        {/* ── PANELS TAB ── */}
        {activeTab === 'panels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Settings style={{ width: 16, height: 16, color: CYAN }} />
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#ddddf5' }}>Manage Panel by ID</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    placeholder="Enter panel UUID…"
                    value={panelIdSearch}
                    onChange={e => setPanelIdSearch(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearchPanel()}
                    style={{ flex: 1, background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: '#cccde8', outline: 'none', fontFamily: 'monospace' }}
                  />
                  <button
                    onClick={handleSearchPanel}
                    disabled={searchingPanel}
                    style={{ padding: '9px 14px', borderRadius: 8, background: CYAN, border: 'none', color: '#000', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                  >
                    {searchingPanel ? <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> : <Search style={{ width: 16, height: 16 }} />}
                  </button>
                </div>

                {managedPanel && (
                  <div style={{ marginTop: 16, padding: 16, background: CARD2, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: managedPanel.status === 'running' ? GREEN : RED, boxShadow: managedPanel.status === 'running' ? `0 0 8px ${GREEN}` : 'none' }} />
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 14, color: '#eeeeff' }}>{managedPanel.name}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 14 }}>
                      {[
                        { label: 'Owner', value: managedPanel.user_email || 'Unknown' },
                        { label: 'Language', value: managedPanel.language },
                        { label: 'Status', value: managedPanel.status },
                        { label: 'ID', value: managedPanel.id.slice(0, 12) + '…' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '8px 10px', background: CARD, borderRadius: 8, border: `1px solid ${BORDER}` }}>
                          <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace' }}>{label}</div>
                          <div style={{ fontSize: 12, color: '#cccde8', fontFamily: 'monospace', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
                        </div>
                      ))}
                    </div>
                    {managedPanel.expires_at && (
                      <div style={{ fontSize: 11, color: new Date(managedPanel.expires_at) < new Date() ? RED : MUTED, marginBottom: 12, fontFamily: 'monospace' }}>
                        Expires: {new Date(managedPanel.expires_at).toLocaleDateString()}
                      </div>
                    )}
                    <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginBottom: 6 }}>EXTEND DURATION</div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <select
                            value={extendDuration}
                            onChange={e => setExtendDuration(e.target.value)}
                            style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#cccde8', outline: 'none' }}
                          >
                            <option value="2">2 hours</option>
                            <option value="24">1 day</option>
                            <option value="168">1 week</option>
                            <option value="720">1 month</option>
                            <option value="1440">2 months</option>
                            <option value="2160">3 months</option>
                            <option value="4320">6 months</option>
                            <option value="8760">1 year</option>
                          </select>
                          <button onClick={handleExtendPanel} style={{ padding: '8px 14px', borderRadius: 8, background: `${GREEN}20`, border: `1px solid ${GREEN}50`, color: GREEN, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Calendar style={{ width: 14, height: 14 }} />
                            Extend
                          </button>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {managedPanel.status === 'running' && (
                          <button onClick={handleStopPanel} style={{ flex: 1, padding: '9px', borderRadius: 8, background: `${AMBER}15`, border: `1px solid ${AMBER}40`, color: AMBER, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
                            Stop Panel
                          </button>
                        )}
                        <button onClick={handleDeletePanel} style={{ flex: 1, padding: '9px', borderRadius: 8, background: `${RED}15`, border: `1px solid ${RED}40`, color: RED, fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'monospace' }}>
                          Delete Panel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Panel analytics */}
            <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${BORDER}`, background: CARD }}>
              <PanelStatusChart panels={allPanels} />
            </div>
          </div>
        )}

      </main>

      {/* Dialogs */}
      <AlertDialog open={!!actionUser} onOpenChange={() => setActionUser(null)}>
        <AlertDialogContent style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#eeeeff' }}>{actionType === 'ban' ? 'Ban User?' : 'Unban User?'}</AlertDialogTitle>
            <AlertDialogDescription style={{ color: MUTED }}>
              {actionType === 'ban'
                ? `This will ban ${actionUser?.email} and stop all their running panels.`
                : `This will restore ${actionUser?.email}'s access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: CARD2, color: MUTED, border: `1px solid ${BORDER}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBanUser} style={{ background: actionType === 'ban' ? RED : GREEN, color: actionType === 'ban' ? '#fff' : '#000', fontWeight: 700 }}>
              {actionType === 'ban' ? 'Ban User' : 'Unban User'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewingUser} onOpenChange={() => setViewingUser(null)}>
        <DialogContent style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <DialogHeader>
            <DialogTitle style={{ color: '#eeeeff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Server style={{ width: 18, height: 18, color: CYAN }} />
              {viewingUser?.username || viewingUser?.email}'s Panels
            </DialogTitle>
          </DialogHeader>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
            {loadingPanels ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
                <Loader2 style={{ width: 24, height: 24, color: GREEN }} className="animate-spin" />
              </div>
            ) : userPanels.length === 0 ? (
              <p style={{ textAlign: 'center', color: MUTED, padding: 32, fontFamily: 'monospace', fontSize: 13 }}>No panels found</p>
            ) : (
              userPanels.map(panel => (
                <div key={panel.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: CARD2, borderRadius: 10, border: `1px solid ${BORDER}` }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: '#ddddf5', fontSize: 13 }}>{panel.name}</div>
                    <div style={{ fontSize: 11, color: MUTED }}>{panel.language}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: panel.status === 'running' ? GREEN : MUTED, background: panel.status === 'running' ? `${GREEN}18` : BORDER, padding: '3px 8px', borderRadius: 6 }}>
                    {panel.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <RedeemCodeDialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog} onCreated={fetchData} />

      <AlertDialog open={!!addPanelsUser} onOpenChange={() => setAddPanelsUser(null)}>
        <AlertDialogContent style={{ background: CARD, border: `1px solid ${BORDER}` }}>
          <AlertDialogHeader>
            <AlertDialogTitle style={{ color: '#eeeeff', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus style={{ width: 18, height: 18, color: GREEN }} />
              Add Panel Slots
            </AlertDialogTitle>
            <AlertDialogDescription style={{ color: MUTED }}>
              Adding slots to {addPanelsUser?.email} — current limit: {addPanelsUser?.panels_limit || 0}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div style={{ padding: '8px 0' }}>
            <label style={{ fontSize: 13, color: '#cccde8', fontFamily: 'monospace', display: 'block', marginBottom: 6 }}>Panels to add</label>
            <input
              type="number" min="1" max="50"
              value={panelsToAdd}
              onChange={e => setPanelsToAdd(e.target.value)}
              style={{ width: '100%', background: CARD2, border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#cccde8', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }}
            />
            <p style={{ fontSize: 11, color: MUTED, marginTop: 6, fontFamily: 'monospace' }}>
              New limit: {(addPanelsUser?.panels_limit || 0) + (parseInt(panelsToAdd) || 0)}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel style={{ background: CARD2, color: MUTED, border: `1px solid ${BORDER}` }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddPanels} style={{ background: GREEN, color: '#000', fontWeight: 700 }}>
              Add Panels
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default Admin;

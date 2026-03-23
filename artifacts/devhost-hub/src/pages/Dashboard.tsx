import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Server,
  Plus,
  LogOut,
  Shield,
  Loader2,
  AlertCircle,
  Terminal,
  Activity,
  ChevronRight,
  Gift,
  ShoppingCart,
  Clock,
  Zap,
  CornerDownRight,
  RefreshCw,
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

function getInitials(str: string) {
  return str?.slice(0, 2).toUpperCase() || 'U?';
}

function daysLeft(expires_at: string | null) {
  if (!expires_at) return null;
  const diff = new Date(expires_at).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

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
    if (error) {
      toast({ title: 'Error', description: 'Failed to load panels', variant: 'destructive' });
    } else {
      setPanels(data as Panel[]);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleRedeemCode = async () => {
    if (!redeemCode.trim() || !user) return;
    setRedeeming(true);
    try {
      const { data: codeData, error: codeError } = await supabase
        .from('redeem_codes')
        .select('*')
        .eq('code', redeemCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (codeError || !codeData) {
        toast({ title: 'Invalid Code', description: 'This code does not exist or is inactive', variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      if (codeData.max_uses !== null && codeData.current_uses >= codeData.max_uses) {
        toast({ title: 'Code Expired', description: 'This code has reached its maximum uses', variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      const { data: existingRedemption } = await supabase
        .from('code_redemptions')
        .select('id')
        .eq('code_id', codeData.id)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existingRedemption) {
        toast({ title: 'Already Redeemed', description: 'You have already used this code', variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      const { error: redemptionError } = await supabase
        .from('code_redemptions')
        .insert({ code_id: codeData.id, user_id: user.id });
      if (redemptionError) {
        toast({ title: 'Error', description: 'Failed to redeem code', variant: 'destructive' });
        setRedeeming(false);
        return;
      }
      await supabase.from('redeem_codes').update({ current_uses: codeData.current_uses + 1 }).eq('id', codeData.id);
      const currentLimit = profile?.panels_limit || 0;
      await supabase.from('profiles').update({ premium_status: 'approved', panels_limit: currentLimit + codeData.panels_granted }).eq('id', user.id);
      const durationHours = codeData.duration_hours || 720;
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + durationHours);
      for (let i = 0; i < codeData.panels_granted; i++) {
        await supabase.from('panels').insert({
          user_id: user.id,
          name: `ClaimedPanel_${Date.now()}_${i}`,
          language: 'nodejs',
          expires_at: expiresAt.toISOString(),
        });
      }
      toast({ title: '🎉 Code Redeemed!', description: `${codeData.panels_granted} panel(s) unlocked! Tap them to set up.` });
      setRedeemCode('');
      await fetchPanels();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setRedeeming(false);
  };

  const handlePanelClick = (panel: Panel) => {
    if (panel.name.startsWith('ClaimedPanel_')) {
      setSetupPanel({ id: panel.id, name: '', language: 'nodejs' });
      setSetupName('');
      setSetupLanguage('nodejs');
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
    const { error } = await supabase.from('panels').update({ name: setupName.trim(), language: setupLanguage }).eq('id', setupPanel.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update panel', variant: 'destructive' });
      setSavingSetup(false);
    } else {
      toast({ title: 'Panel configured!', description: 'Your panel is ready to use' });
      const panelId = setupPanel.id;
      setSetupPanel(null);
      setSavingSetup(false);
      navigate(`/panel/${panelId}`);
    }
  };

  const runningCount = panels.filter(p => p.status === 'running').length;
  const panelsLimit = profile?.panels_limit || 0;
  const canCreatePanel = isPremium && panels.length < panelsLimit;
  const username = profile?.username || profile?.email?.split('@')[0] || 'user';
  const firstName = username.split(/[._-]/)[0];
  const usagePct = panelsLimit > 0 ? Math.round((panels.length / panelsLimit) * 100) : 0;

  const statusConfig = {
    running:   { dot: 'bg-success shadow-[0_0_5px_1px_hsl(var(--success)/0.7)]', badge: 'text-success bg-success/10 border-success/20', label: 'ONLINE' },
    deploying: { dot: 'bg-warning animate-pulse', badge: 'text-warning bg-warning/10 border-warning/20', label: 'DEPLOYING' },
    error:     { dot: 'bg-destructive', badge: 'text-destructive bg-destructive/10 border-destructive/20', label: 'ERROR' },
    stopped:   { dot: 'bg-muted-foreground/30', badge: 'text-muted-foreground bg-muted/20 border-border', label: 'OFFLINE' },
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Terminal className="w-6 h-6 text-primary" />
            </div>
          </div>
          <p className="text-muted-foreground font-mono text-sm tracking-wider">CONNECTING...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar with online indicator */}
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-primary/50 flex items-center justify-center shadow-lg shadow-primary/25">
                <span className="font-mono font-black text-sm text-primary-foreground tracking-tight">{getInitials(username)}</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-success rounded-full border-2 border-background shadow-[0_0_4px_hsl(var(--success)/0.8)]" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground leading-none">{getGreeting()}, <span className="text-primary">{firstName}</span></p>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isPremium ? (
                  <span className="text-[10px] font-bold font-mono tracking-widest text-warning bg-warning/10 border border-warning/20 px-1.5 py-0.5 rounded">PREMIUM</span>
                ) : (
                  <span className="text-[10px] font-mono text-muted-foreground">Free plan</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground" onClick={() => fetchPanels(true)} disabled={refreshing}>
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-warning hover:text-warning hover:bg-warning/10">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/60 hover:text-foreground" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-28 pt-4 space-y-4 max-w-lg mx-auto">

        {/* ── Stats ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Panels used — wide card */}
          <div className="col-span-2 bg-card border border-border rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono font-semibold text-muted-foreground tracking-wider">PANEL USAGE</span>
              </div>
              <span className="font-mono font-bold text-foreground text-sm">
                {panels.length}<span className="text-muted-foreground font-normal">/{panelsLimit || '—'}</span>
              </span>
            </div>
            {/* Usage bar */}
            <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  usagePct >= 90 ? 'bg-destructive' : usagePct >= 60 ? 'bg-warning' : 'bg-primary'
                }`}
                style={{ width: `${Math.min(100, usagePct)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 font-mono">
              {panelsLimit === 0 ? 'No panels purchased yet' : `${panelsLimit - panels.length} slot${panelsLimit - panels.length !== 1 ? 's' : ''} remaining`}
            </p>
          </div>

          {/* Running */}
          <div className="bg-card border border-border rounded-2xl p-4 relative overflow-hidden">
            {runningCount > 0 && (
              <div className="absolute inset-0 bg-success/5 pointer-events-none" />
            )}
            <div className="flex items-center justify-between mb-2">
              <Activity className={`w-4 h-4 ${runningCount > 0 ? 'text-success' : 'text-muted-foreground/40'}`} />
              <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider">ONLINE</span>
            </div>
            <p className={`text-3xl font-mono font-black ${runningCount > 0 ? 'text-success' : 'text-muted-foreground/40'}`}>
              {runningCount}
            </p>
            {runningCount > 0 && (
              <div className="flex items-center gap-1 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-success shadow-[0_0_4px_hsl(var(--success)/0.8)] animate-pulse" />
                <span className="text-[10px] text-success font-mono">live</span>
              </div>
            )}
          </div>

          {/* Plan */}
          <div className={`border rounded-2xl p-4 relative overflow-hidden ${isPremium ? 'bg-warning/5 border-warning/20' : 'bg-card border-border'}`}>
            <div className="flex items-center justify-between mb-2">
              <Zap className={`w-4 h-4 ${isPremium ? 'text-warning' : 'text-muted-foreground/40'}`} />
              <span className="text-[10px] font-mono font-semibold text-muted-foreground tracking-wider">PLAN</span>
            </div>
            <p className={`text-xl font-mono font-black tracking-wider ${isPremium ? 'text-warning' : 'text-muted-foreground/50'}`}>
              {isPremium ? 'PRO' : 'FREE'}
            </p>
            {!isPremium && (
              <button onClick={() => navigate('/pricing')} className="text-[10px] text-primary font-mono mt-1 hover:underline">
                Upgrade →
              </button>
            )}
          </div>
        </div>

        {/* ── Buy Banner ───────────────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group active:scale-[0.99] transition-transform"
          onClick={() => navigate('/pricing')}
        >
          {/* Layered gradients */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-primary/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_110%_50%,hsl(var(--primary)/0.2),transparent)]" />
          {/* Subtle grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{ backgroundImage: 'linear-gradient(hsl(var(--primary)) 1px,transparent 1px),linear-gradient(90deg,hsl(var(--primary)) 1px,transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <div className="relative border border-primary/30 rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">Host your next project</p>
                  <p className="text-xs text-muted-foreground mt-0.5">From <span className="text-primary font-semibold">₦1,400/month</span> · Instant activation</p>
                </div>
              </div>
              <div className="shrink-0 ml-3">
                <div className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-xl group-hover:bg-primary/90 transition-colors">
                  Buy <ChevronRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Redeem Code — Terminal Style ─────────────────────────────────── */}
        <div
          className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
            redeemFocused
              ? 'border-primary/50 shadow-lg shadow-primary/10'
              : 'border-border'
          }`}
          style={{
            background: 'hsl(var(--card))',
          }}
        >
          {/* Header bar */}
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/30">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-destructive/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-warning/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-success/60" />
            </div>
            <span className="text-xs font-mono text-muted-foreground/60 flex-1 text-center">
              redeem_code.sh
            </span>
            <Gift className="w-3.5 h-3.5 text-muted-foreground/40" />
          </div>

          {/* Terminal body */}
          <div className="p-4 space-y-3">
            <div className="flex items-start gap-2 font-mono text-xs text-muted-foreground">
              <span className="text-primary mt-0.5">$</span>
              <span>Enter your redemption code below</span>
            </div>

            {/* Code input row */}
            <div className={`flex items-center gap-2 bg-background/60 border rounded-xl px-3 py-2.5 transition-all ${
              redeemFocused ? 'border-primary/50' : 'border-border/50'
            }`}>
              <span className={`font-mono text-sm font-bold shrink-0 transition-colors ${redeemFocused ? 'text-primary' : 'text-muted-foreground/50'}`}>
                &gt;_
              </span>
              <input
                type="text"
                placeholder="IDEV-XXXX-XXXX"
                value={redeemCode}
                onChange={(e) => setRedeemCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                onFocus={() => setRedeemFocused(true)}
                onBlur={() => setRedeemFocused(false)}
                onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
                maxLength={20}
                className="flex-1 bg-transparent font-mono text-sm font-bold tracking-[0.25em] text-foreground placeholder:text-muted-foreground/30 placeholder:font-normal placeholder:tracking-widest outline-none uppercase"
                spellCheck={false}
                autoCapitalize="characters"
                autoCorrect="off"
              />
              {redeemCode && (
                <button
                  onClick={() => setRedeemCode('')}
                  className="text-muted-foreground/40 hover:text-muted-foreground transition-colors font-mono text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Submit button */}
            <button
              onClick={handleRedeemCode}
              disabled={redeeming || !redeemCode.trim()}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-mono font-bold text-sm transition-all ${
                redeemCode.trim() && !redeeming
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 hover:shadow-primary/30'
                  : 'bg-muted/40 text-muted-foreground/40 cursor-not-allowed'
              }`}
            >
              {redeeming ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Verifying code…</>
              ) : (
                <><CornerDownRight className="w-4 h-4" />REDEEM CODE</>
              )}
            </button>

            <p className="text-[10px] font-mono text-muted-foreground/40 text-center">
              Codes unlock free panel slots · Obtain from promotions
            </p>
          </div>
        </div>

        {/* ── Panels ───────────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <h2 className="font-bold text-foreground text-sm tracking-wide">YOUR PANELS</h2>
              {panels.length > 0 && (
                <span className="text-[10px] font-mono font-bold text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-full">
                  {panels.length}/{panelsLimit}
                </span>
              )}
            </div>
            {canCreatePanel && (
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 h-8 text-xs gap-1.5 font-mono">
                <Plus className="w-3 h-3" /> New Panel
              </Button>
            )}
          </div>

          {/* Empty state */}
          {panels.length === 0 && (
            <div className="relative flex flex-col items-center text-center py-14 rounded-2xl border border-dashed border-border overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.02]"
                style={{ backgroundImage: 'radial-gradient(hsl(var(--primary)) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
              />
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mx-auto mb-4">
                  <Server className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="font-bold text-foreground mb-1">No panels yet</p>
                <p className="text-sm text-muted-foreground mb-6 max-w-[220px]">
                  {isPremium ? 'Create your first panel to start hosting your app' : 'Purchase a hosting plan to get started'}
                </p>
                {isPremium ? (
                  <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 gap-2">
                    <Plus className="w-4 h-4" /> Create Panel
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/pricing')} className="bg-primary hover:bg-primary/90 gap-2">
                    <ShoppingCart className="w-4 h-4" /> Browse Plans
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Panel cards */}
          <div className="space-y-2">
            {panels.map((panel) => {
              const days = daysLeft(panel.expires_at);
              const isExpiringSoon = days !== null && days <= 5 && days > 0;
              const isExpired = days !== null && days <= 0;
              const needsSetup = panel.name.startsWith('ClaimedPanel_');
              const cfg = statusConfig[panel.status as keyof typeof statusConfig] ?? statusConfig.stopped;

              return (
                <div
                  key={panel.id}
                  onClick={() => handlePanelClick(panel)}
                  className={`group relative bg-card rounded-2xl border cursor-pointer active:scale-[0.985] transition-all duration-200 overflow-hidden ${
                    panel.status === 'running'
                      ? 'border-success/20 hover:border-success/40 hover:shadow-md hover:shadow-success/5'
                      : panel.status === 'error'
                      ? 'border-destructive/20 hover:border-destructive/30'
                      : 'border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
                  }`}
                >
                  {/* Subtle status glow on running panels */}
                  {panel.status === 'running' && (
                    <div className="absolute inset-0 bg-success/[0.03] pointer-events-none" />
                  )}

                  {/* Left accent strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${
                    panel.status === 'running' ? 'bg-success' :
                    panel.status === 'deploying' ? 'bg-warning' :
                    panel.status === 'error' ? 'bg-destructive' : 'bg-muted/30'
                  }`} />

                  <div className="flex items-center gap-3 p-4 pl-5">
                    {/* Language icon */}
                    <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-mono font-black shrink-0 ${
                      needsSetup
                        ? 'bg-muted/40 border border-dashed border-border text-muted-foreground'
                        : panel.language === 'nodejs'
                        ? 'bg-nodejs/10 border border-nodejs/20 text-nodejs'
                        : 'bg-python/10 border border-python/20 text-python'
                    }`}>
                      <span className="text-base leading-none">
                        {needsSetup ? '?' : panel.language === 'nodejs' ? 'JS' : 'PY'}
                      </span>
                      <span className="text-[9px] opacity-50 leading-none mt-0.5">
                        {needsSetup ? 'tap' : panel.language === 'nodejs' ? 'node' : 'py3'}
                      </span>
                    </div>

                    {/* Name & meta */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">
                        {needsSetup ? <span className="text-primary">Tap to configure →</span> : panel.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {!needsSetup && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {panel.language === 'nodejs' ? 'Node.js' : 'Python'}
                          </span>
                        )}
                        {isExpired && (
                          <span className="flex items-center gap-1 text-[11px] text-destructive font-semibold">
                            <AlertCircle className="w-3 h-3" />Expired
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="flex items-center gap-1 text-[11px] text-warning font-semibold">
                            <Clock className="w-3 h-3" />{days}d left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status badge + arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!needsSetup && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-mono font-bold tracking-wider ${cfg.badge}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          <span className="hidden xs:inline">{cfg.label}</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {panels.length > 0 && panels.length >= panelsLimit && panelsLimit > 0 && (
            <div className="flex items-center justify-center gap-2 py-2 text-xs font-mono text-muted-foreground">
              <span>All {panelsLimit} slots used</span>
              <span className="text-border">·</span>
              <button onClick={() => navigate('/pricing')} className="text-primary hover:underline">Buy more</button>
            </div>
          )}
        </div>

        {/* ── Live terminal footer ──────────────────────────────────────────── */}
        <div className="font-mono text-xs bg-[hsl(var(--card))] border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/30 border-b border-border">
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-muted/60" />
              <div className="w-2 h-2 rounded-full bg-muted/60" />
              <div className="w-2 h-2 rounded-full bg-muted/60" />
            </div>
            <span className="text-muted-foreground/40 text-[10px]">terminal</span>
          </div>
          <div className="px-4 py-3 space-y-1">
            <p><span className="text-primary">$</span> <span className="text-muted-foreground/60">idevhost status --user</span></p>
            <p><span className="text-muted-foreground/40">›</span> <span className="text-muted-foreground">user:</span> <span className="text-foreground">{username}</span></p>
            <p><span className="text-muted-foreground/40">›</span> <span className="text-muted-foreground">panels:</span> <span className="text-foreground">{panels.length}/{panelsLimit || '—'}</span> &nbsp;<span className="text-success">{runningCount > 0 ? `(${runningCount} running)` : ''}</span></p>
            <p><span className="text-muted-foreground/40">›</span> <span className="text-muted-foreground">plan:</span> <span className={isPremium ? 'text-warning' : 'text-muted-foreground'}>{isPremium ? 'premium' : 'free'}</span></p>
          </div>
        </div>
      </main>

      <CreatePanelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPanels} />

      {/* Panel Setup Dialog */}
      <Dialog open={!!setupPanel} onOpenChange={(open) => !open && setSetupPanel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Configure Panel
            </DialogTitle>
            <DialogDescription>Name your panel and choose its runtime</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="panel-name">Panel Name</Label>
              <Input
                id="panel-name"
                placeholder="my-discord-bot"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
                className="font-mono"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label>Runtime</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'nodejs', code: 'JS', label: 'Node.js' },
                  { key: 'python', code: 'PY', label: 'Python' },
                ] as const).map(({ key, code, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSetupLanguage(key)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      setupLanguage === key
                        ? `border-${key === 'nodejs' ? 'nodejs' : 'python'} bg-${key === 'nodejs' ? 'nodejs' : 'python'}/10`
                        : 'border-border hover:border-border/60'
                    }`}
                  >
                    <span className={`font-mono font-black text-2xl block text-${key === 'nodejs' ? 'nodejs' : 'python'}`}>{code}</span>
                    <p className="text-sm text-muted-foreground mt-1">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSetupPanel(null)}>Cancel</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleSaveSetup} disabled={savingSetup || !setupName.trim()}>
              {savingSetup ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save & Open'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;

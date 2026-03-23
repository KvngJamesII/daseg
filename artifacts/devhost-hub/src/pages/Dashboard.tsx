import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import {
  Server,
  Plus,
  LogOut,
  Shield,
  Loader2,
  Play,
  Square,
  AlertCircle,
  Terminal,
  Activity,
  ChevronRight,
  Gift,
  Ticket,
  ShoppingCart,
  Clock,
  Zap,
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchPanels();
  }, [user]);

  const fetchPanels = async () => {
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

      await supabase
        .from('redeem_codes')
        .update({ current_uses: codeData.current_uses + 1 })
        .eq('id', codeData.id);

      const currentLimit = profile?.panels_limit || 0;
      await supabase
        .from('profiles')
        .update({ premium_status: 'approved', panels_limit: currentLimit + codeData.panels_granted })
        .eq('id', user.id);

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

      toast({ title: '🎉 Code Redeemed!', description: `${codeData.panels_granted} panel(s) activated! Tap them to set up.` });
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
    const { error } = await supabase
      .from('panels')
      .update({ name: setupName.trim(), language: setupLanguage })
      .eq('id', setupPanel.id);

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

  const getStatusDot = (status: string) => {
    if (status === 'running') return 'bg-success shadow-[0_0_6px_1px_hsl(var(--success)/0.6)]';
    if (status === 'deploying') return 'bg-warning animate-pulse';
    if (status === 'error') return 'bg-destructive';
    return 'bg-muted-foreground/40';
  };

  const getStatusText = (status: string) => {
    if (status === 'running') return { label: 'ONLINE', cls: 'text-success bg-success/10 border-success/25' };
    if (status === 'deploying') return { label: 'DEPLOYING', cls: 'text-warning bg-warning/10 border-warning/25' };
    if (status === 'error') return { label: 'ERROR', cls: 'text-destructive bg-destructive/10 border-destructive/25' };
    return { label: 'OFFLINE', cls: 'text-muted-foreground bg-muted/30 border-border' };
  };

  const runningCount = panels.filter(p => p.status === 'running').length;
  const panelsLimit = profile?.panels_limit || 0;
  const canCreatePanel = isPremium && panels.length < panelsLimit;
  const username = profile?.username || profile?.email?.split('@')[0] || 'user';

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Terminal className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground font-mono text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="font-mono font-bold text-sm text-primary-foreground">{getInitials(username)}</span>
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{username}</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isPremium ? 'bg-warning' : 'bg-muted-foreground/40'}`} />
                <p className="text-xs text-muted-foreground font-mono">
                  {isPremium ? 'Premium' : 'Free'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="icon" className="h-9 w-9 text-warning hover:text-warning hover:bg-warning/10">
                  <Shield className="w-4 h-4" />
                </Button>
              </Link>
            )}
            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground" onClick={handleSignOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 pb-24 space-y-5 pt-4">

        {/* ── Stats Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Server className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">PANELS</span>
            </div>
            <p className="text-2xl font-mono font-bold text-foreground">
              {panels.length}
              <span className="text-sm font-normal text-muted-foreground">/{panelsLimit}</span>
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Activity className="w-4 h-4 text-success" />
              <span className="text-xs font-mono text-muted-foreground">ONLINE</span>
            </div>
            <p className="text-2xl font-mono font-bold text-success">{runningCount}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <Zap className="w-4 h-4 text-warning" />
              <span className="text-xs font-mono text-muted-foreground">PLAN</span>
            </div>
            <p className={`text-sm font-mono font-bold ${isPremium ? 'text-warning' : 'text-muted-foreground'}`}>
              {isPremium ? 'PRO' : 'FREE'}
            </p>
          </div>
        </div>

        {/* ── Buy Panels Banner ─────────────────────────────────────────── */}
        <div
          className="relative rounded-2xl overflow-hidden cursor-pointer group"
          onClick={() => navigate('/pricing')}
        >
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_right,hsl(var(--primary)/0.15),transparent_70%)]" />
          <div className="relative border border-primary/25 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Get a Hosting Panel</p>
                <p className="text-xs text-muted-foreground">From ₦1,400/month · Instant activation</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
                Buy Now
              </span>
              <ChevronRight className="w-4 h-4 text-primary" />
            </div>
          </div>
        </div>

        {/* ── Redeem Code ───────────────────────────────────────────────── */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 border border-accent/20 flex items-center justify-center">
              <Ticket className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Redeem Code</p>
              <p className="text-xs text-muted-foreground">Have a code? Claim your panel slots</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="IDEV-XXX-XXX"
              value={redeemCode}
              onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
              className="font-mono text-sm uppercase tracking-widest flex-1"
              onKeyDown={(e) => e.key === 'Enter' && handleRedeemCode()}
            />
            <Button
              onClick={handleRedeemCode}
              disabled={redeeming || !redeemCode.trim()}
              className="bg-accent hover:bg-accent/90 px-4 shrink-0"
            >
              {redeeming
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Gift className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* ── Panels Section ────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-foreground">Your Panels</h2>
              {panels.length > 0 && (
                <span className="text-xs font-mono text-muted-foreground bg-muted/60 border border-border px-2 py-0.5 rounded-full">
                  {panels.length}
                </span>
              )}
            </div>
            {canCreatePanel && (
              <Button
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="font-mono bg-primary hover:bg-primary/90 h-8 text-xs gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                New Panel
              </Button>
            )}
          </div>

          {/* Empty state */}
          {panels.length === 0 && (
            <div className="flex flex-col items-center text-center py-12 border border-dashed border-border rounded-2xl bg-muted/20">
              <div className="w-16 h-16 rounded-2xl bg-muted/60 border border-border flex items-center justify-center mb-4">
                <Server className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-semibold text-foreground mb-1">No panels yet</p>
              <p className="text-sm text-muted-foreground mb-5 max-w-[200px]">
                {isPremium ? 'Create your first panel to start hosting' : 'Purchase a plan to get started'}
              </p>
              {isPremium ? (
                <Button onClick={() => setShowCreateDialog(true)} className="bg-primary hover:bg-primary/90 gap-2">
                  <Plus className="w-4 h-4" /> Create Panel
                </Button>
              ) : (
                <Button onClick={() => navigate('/pricing')} className="bg-primary hover:bg-primary/90 gap-2">
                  <ShoppingCart className="w-4 h-4" /> Buy a Panel
                </Button>
              )}
            </div>
          )}

          {/* Panel cards */}
          <div className="space-y-2.5">
            {panels.map((panel) => {
              const statusText = getStatusText(panel.status);
              const days = daysLeft(panel.expires_at);
              const isExpiringSoon = days !== null && days <= 5 && days > 0;
              const isExpired = days !== null && days <= 0;
              const needsSetup = panel.name.startsWith('ClaimedPanel_');

              return (
                <div
                  key={panel.id}
                  onClick={() => handlePanelClick(panel)}
                  className="group relative bg-card border border-border rounded-2xl p-4 cursor-pointer hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 active:scale-[0.99] transition-all"
                >
                  {/* Status bar on left */}
                  <div className={`absolute left-0 top-4 bottom-4 w-1 rounded-r-full ${
                    panel.status === 'running' ? 'bg-success' :
                    panel.status === 'deploying' ? 'bg-warning' :
                    panel.status === 'error' ? 'bg-destructive' : 'bg-muted/40'
                  }`} />

                  <div className="flex items-center gap-3 pl-3">
                    {/* Language badge */}
                    <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-mono font-black text-sm shrink-0 ${
                      needsSetup ? 'bg-muted/50 border border-dashed border-border text-muted-foreground' :
                      panel.language === 'nodejs'
                        ? 'bg-nodejs/10 border border-nodejs/25 text-nodejs'
                        : 'bg-python/10 border border-python/25 text-python'
                    }`}>
                      <span className="text-base leading-none">
                        {needsSetup ? '?' : panel.language === 'nodejs' ? 'JS' : 'PY'}
                      </span>
                      <span className="text-[9px] opacity-60 leading-none mt-0.5">
                        {needsSetup ? 'setup' : panel.language === 'nodejs' ? 'node' : 'py'}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {needsSetup ? 'Tap to configure' : panel.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {!needsSetup && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {panel.language === 'nodejs' ? 'Node.js' : 'Python'}
                          </span>
                        )}
                        {/* Expiry badge */}
                        {isExpired && (
                          <span className="flex items-center gap-1 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3" /> Expired
                          </span>
                        )}
                        {isExpiringSoon && !isExpired && (
                          <span className="flex items-center gap-1 text-xs text-warning">
                            <Clock className="w-3 h-3" /> {days}d left
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status + arrow */}
                    <div className="flex items-center gap-2 shrink-0">
                      {!needsSetup && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-mono font-semibold ${statusText.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(panel.status)}`} />
                          <span className="hidden sm:inline">{statusText.label}</span>
                        </div>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {panels.length > 0 && panels.length >= panelsLimit && panelsLimit > 0 && (
            <p className="text-xs text-center text-muted-foreground font-mono pt-1">
              Panel limit reached ({panelsLimit}/{panelsLimit}) ·{' '}
              <span className="text-primary cursor-pointer hover:underline" onClick={() => navigate('/pricing')}>
                Upgrade to add more
              </span>
            </p>
          )}
        </div>

        {/* ── Terminal footer ───────────────────────────────────────────── */}
        <div className="font-mono text-xs text-muted-foreground bg-card/50 border border-border/50 rounded-xl px-4 py-3">
          <span className="text-primary">$</span>{' '}
          <span className="text-muted-foreground/70">idevhost status</span>
          <br />
          <span className="text-success">✓</span> {runningCount} panel{runningCount !== 1 ? 's' : ''} running · {panels.length} total
        </div>
      </main>

      <CreatePanelDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} onCreated={fetchPanels} />

      {/* Setup Dialog */}
      <Dialog open={!!setupPanel} onOpenChange={(open) => !open && setSetupPanel(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-primary" />
              Configure Your Panel
            </DialogTitle>
            <DialogDescription>Give your panel a name and choose its runtime</DialogDescription>
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
              />
            </div>

            <div className="space-y-2">
              <Label>Runtime</Label>
              <div className="grid grid-cols-2 gap-3">
                {([
                  { key: 'nodejs', code: 'JS', label: 'Node.js', color: 'nodejs' },
                  { key: 'python', code: 'PY', label: 'Python', color: 'python' },
                ] as const).map(({ key, code, label, color }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSetupLanguage(key)}
                    className={`p-4 rounded-xl border-2 transition-all text-center ${
                      setupLanguage === key ? `border-${color} bg-${color}/10` : 'border-border hover:border-border/70'
                    }`}
                  >
                    <span className={`font-mono font-black text-2xl block text-${color}`}>{code}</span>
                    <p className="text-sm text-muted-foreground mt-1">{label}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setSetupPanel(null)}>Cancel</Button>
            <Button
              className="bg-primary hover:bg-primary/90"
              onClick={handleSaveSetup}
              disabled={savingSetup || !setupName.trim()}
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

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { vmApi, AppStatus } from '@/lib/vmApi';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Play,
  Square,
  Trash2,
  Loader2,
  FolderOpen,
  Terminal,
  Settings,
  AlertCircle,
  RefreshCw,
  Cpu,
  MemoryStick,
  Clock,
  RotateCcw,
  ShoppingCart,
} from 'lucide-react';
import { FileManager } from '@/components/panel/FileManager';
import { UnifiedConsole } from '@/components/panel/UnifiedConsole';
import { StartupSettings } from '@/components/panel/StartupSettings';
import { PanelSettings } from '@/components/panel/PanelSettings';
import { RenewalWarning } from '@/components/panel/RenewalWarning';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Panel {
  id: string;
  name: string;
  language: 'nodejs' | 'python';
  status: 'stopped' | 'running' | 'deploying' | 'error';
  created_at: string;
  entry_point?: string | null;
  expires_at?: string | null;
}

function formatUptime(ms: number): string {
  if (ms <= 0 || ms > 365 * 24 * 60 * 60 * 1000) return '—';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

function MetricBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const warn = pct > 80;
  return (
    <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden mt-1.5">
      <div
        className={`h-full rounded-full transition-all ${warn ? 'bg-warning' : color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

const PanelPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [vmStatus, setVmStatus] = useState<AppStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStopDialog, setShowStopDialog] = useState(false);
  const [liveUptime, setLiveUptime] = useState<number>(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (id && user) fetchPanel();
  }, [id, user]);

  const fetchPanel = async () => {
    const { data, error } = await supabase
      .from('panels')
      .select('*')
      .eq('id', id)
      .eq('user_id', user?.id)
      .single();

    if (error || !data) {
      toast({ title: 'Error', description: 'Panel not found', variant: 'destructive' });
      navigate('/dashboard');
    } else {
      const p = data as Panel;
      // Auto-delete if expired > 7 days ago
      if (p.expires_at) {
        const expiresAt = new Date(p.expires_at).getTime();
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        if (expiresAt < sevenDaysAgo) {
          try { await vmApi.delete(p.id); } catch { }
          await supabase.from('panels').delete().eq('id', p.id);
          toast({ title: 'Panel Removed', description: `"${p.name}" expired over 7 days ago and has been automatically deleted.`, variant: 'destructive' });
          navigate('/dashboard');
          return;
        }
      }
      setPanel(p);
    }
    setLoading(false);
  };

  const fetchVmStatus = async () => {
    if (!id || !panel) return;
    try {
      const status = await vmApi.getStatus(id);
      setVmStatus(status);
      if (status.status && status.status !== panel.status) {
        await supabase.from('panels').update({ status: status.status }).eq('id', id);
        setPanel(prev => prev ? { ...prev, status: status.status } : prev);
      }
    } catch { /* keep existing */ }
  };

  useEffect(() => {
    if (panel) {
      fetchVmStatus();
      const interval = setInterval(fetchVmStatus, 10000);
      return () => clearInterval(interval);
    }
  }, [panel?.id]);

  useEffect(() => {
    if (vmStatus?.uptime && vmStatus?.status === 'running') {
      setLiveUptime(vmStatus.uptime);
      const interval = setInterval(() => setLiveUptime(p => p + 60000), 60000);
      return () => clearInterval(interval);
    } else {
      setLiveUptime(0);
    }
  }, [vmStatus?.uptime, vmStatus?.status]);

  const handleStart = async () => {
    if (!id || !panel) return;
    setActionLoading(true);
    try {
      await supabase.from('panels').update({ status: 'deploying' }).eq('id', id);
      setPanel({ ...panel, status: 'deploying' });
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Starting deployment...', log_type: 'info' });
      await vmApi.deploy(id, panel.language);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Dependencies installed, starting app...', log_type: 'info' });
      const entryPoint = panel.entry_point || (panel.language === 'python' ? 'main.py' : 'index.js');
      const result = await vmApi.start(id, panel.language, entryPoint);
      await supabase.from('panels').update({ status: 'running' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: `Started on port ${result.port} (${entryPoint})`, log_type: 'success' });
      setPanel({ ...panel, status: 'running' });
      toast({ title: 'Panel started', description: result.message || 'Now running' });
      fetchVmStatus();
    } catch (error: any) {
      const raw = error.message || 'Failed to start';
      // Parse friendly error messages
      let friendlyMsg = raw;
      if (raw.includes('non-2xx') || raw.includes('fetch failed') || raw.includes('network')) {
        friendlyMsg = 'Could not reach the deployment server. Please try again.';
      } else if (raw.includes('ENOENT') || raw.includes('no such file')) {
        const entryPoint = panel.entry_point || (panel.language === 'python' ? 'main.py' : 'index.js');
        friendlyMsg = `Entry point "${entryPoint}" not found. Upload your code or check Startup settings.`;
      } else if (raw.includes('SyntaxError') || raw.includes('syntax error')) {
        friendlyMsg = 'Your code has a syntax error. Check the Console tab for details.';
      } else if (raw.includes('timeout') || raw.includes('timed out')) {
        friendlyMsg = 'Startup timed out. Your app may have crashed on launch. Check Console.';
      } else if (raw.includes('port') || raw.includes('EADDRINUSE')) {
        friendlyMsg = 'Port conflict — the app may already be running. Try Restart instead.';
      } else if (raw.includes('memory') || raw.includes('OOM')) {
        friendlyMsg = 'Out of memory. Consider upgrading your plan or optimizing your app.';
      } else if (raw.includes('npm') || raw.includes('pip') || raw.includes('module not found') || raw.includes('ModuleNotFoundError') || raw.includes('Cannot find module')) {
        friendlyMsg = `Dependency install failed. Ensure your ${panel.language === 'python' ? 'requirements.txt' : 'package.json'} is correct.`;
      }
      await supabase.from('panels').update({ status: 'error' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: `Error: ${friendlyMsg}`, log_type: 'error' });
      setPanel({ ...panel, status: 'error' });
      toast({ title: 'Startup Failed', description: friendlyMsg, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const handleRestart = async () => {
    if (!id || !panel) return;
    setActionLoading(true);
    try {
      await vmApi.restart(id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Panel restarted', log_type: 'info' });
      toast({ title: 'Restarted', description: 'Panel restarted successfully' });
      fetchVmStatus();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const handleStop = async () => {
    if (!id || !panel) return;
    setActionLoading(true);
    try {
      await vmApi.stop(id);
      await supabase.from('panels').update({ status: 'stopped' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Panel stopped', log_type: 'info' });
      setPanel({ ...panel, status: 'stopped' });
      toast({ title: 'Stopped', description: 'Panel stopped' });
      fetchVmStatus();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    try { await vmApi.delete(id); } catch { }
    const { error } = await supabase.from('panels').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete panel', variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Panel deleted' });
      navigate('/dashboard');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!panel) return null;

  const effectiveStatus = (vmStatus?.status ?? panel.status) as Panel['status'];
  const isRunning = effectiveStatus === 'running';
  const isDeploying = effectiveStatus === 'deploying';
  const memMB = vmStatus?.memory ? vmStatus.memory / 1024 / 1024 : 0;
  const recentRestarts = (vmStatus as any)?.restarts_recent_3h ?? 0;
  const restartLimitHit = (vmStatus as any)?.restart_limit_hit ?? false;
  const langColor = panel.language === 'nodejs' ? 'nodejs' : 'python';
  const langCode = panel.language === 'nodejs' ? 'JS' : 'PY';
  const isExpired = panel.expires_at ? new Date(panel.expires_at).getTime() < Date.now() : false;

  const statusConfig = {
    running:   { dot: 'bg-success shadow-[0_0_6px_1px_hsl(var(--success)/0.5)]', badge: 'text-success bg-success/10 border-success/25', label: 'Online' },
    deploying: { dot: 'bg-warning animate-pulse', badge: 'text-warning bg-warning/10 border-warning/25', label: 'Deploying' },
    error:     { dot: 'bg-destructive', badge: 'text-destructive bg-destructive/10 border-destructive/25', label: 'Error' },
    stopped:   { dot: 'bg-muted-foreground/40', badge: 'text-muted-foreground bg-muted/30 border-border', label: 'Offline' },
  }[effectiveStatus] ?? { dot: 'bg-muted-foreground/40', badge: 'text-muted-foreground bg-muted/30 border-border', label: 'Unknown' };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-lg border-b border-border px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/dashboard">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-mono font-black text-sm bg-${langColor}/10 border border-${langColor}/25 text-${langColor}`}>
              {langCode}
            </div>
            <div>
              <h1 className="font-semibold text-sm text-foreground leading-none">{panel.name}</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {panel.language === 'nodejs' ? 'Node.js' : 'Python'}
                {panel.expires_at && (
                  <span className={`ml-1.5 ${new Date(panel.expires_at) < new Date() ? 'text-destructive' : new Date(panel.expires_at) < new Date(Date.now() + 3 * 86400000) ? 'text-warning' : ''}`}>
                    · Expires {new Date(panel.expires_at).toLocaleDateString()}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-mono font-semibold ${statusConfig.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
            {statusConfig.label}
          </div>
        </div>
      </header>

      {/* Renewal Warning */}
      <RenewalWarning panelId={panel.id} expiresAt={panel.expires_at ?? null} />

      {/* Expired banner */}
      {isExpired && (
        <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/30">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Panel Expired</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                This panel expired on {new Date(panel.expires_at!).toLocaleDateString()}. Renew to start or run your app. It will be auto-deleted in 7 days.
              </p>
            </div>
            <Button size="sm" className="shrink-0 h-7 text-xs bg-primary" onClick={() => navigate('/pricing')}>
              Renew Now
            </Button>
          </div>
        </div>
      )}

      {/* Restart limit banner */}
      {restartLimitHit && effectiveStatus === 'stopped' && (
        <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/20">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Auto-stopped: restart limit exceeded</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your app restarted more than 10 times in 3 hours. Fix your code or upgrade your plan for more RAM.
              </p>
            </div>
            <Button size="sm" variant="outline" className="shrink-0 h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10" onClick={() => navigate('/pricing')}>
              <ShoppingCart className="w-3 h-3 mr-1" /> Upgrade
            </Button>
          </div>
        </div>
      )}

      {/* ── Action Bar ──────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-border bg-card/40">
        <div className="flex gap-2">
          {/* Start */}
          {isExpired ? (
            <Button
              size="sm"
              onClick={() => navigate('/pricing')}
              className="flex-1 bg-destructive hover:bg-destructive/90 h-9 gap-1.5 text-white"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              Renew to Start
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleStart}
              disabled={actionLoading || isRunning || isDeploying}
              className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-40 h-9 gap-1.5"
            >
              {actionLoading && !isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Start
            </Button>
          )}

          {/* Restart */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleRestart}
            disabled={actionLoading || !isRunning}
            className="flex-1 h-9 gap-1.5 disabled:opacity-40"
          >
            {actionLoading && isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Restart
          </Button>

          {/* Stop */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowStopDialog(true)}
            disabled={actionLoading || !isRunning}
            className="flex-1 h-9 gap-1.5 disabled:opacity-40 border-destructive/30 text-destructive hover:bg-destructive/10 hover:border-destructive/50"
          >
            <Square className="w-3.5 h-3.5" />
            Stop
          </Button>

          {/* Delete */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteDialog(true)}
            className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* ── Resource Metrics ────────────────────────────────────────────── */}
      {vmStatus && isRunning && (
        <div className="px-4 py-3 border-b border-border bg-card/20">
          {/* Warning: high restarts */}
          {recentRestarts > 7 && (
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-warning/10 border border-warning/25 mb-3">
              <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
              <p className="text-xs text-warning">
                <span className="font-semibold">{recentRestarts}/10 restarts</span> in the last 3 hours — auto-stop will trigger at 10.
              </p>
            </div>
          )}

          <div className="grid grid-cols-4 gap-2">
            {/* CPU */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <Cpu className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold text-foreground">{vmStatus.cpu?.toFixed(1) ?? 0}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">CPU</p>
              <MetricBar value={vmStatus.cpu ?? 0} max={100} color="bg-primary" />
            </div>

            {/* Memory */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <MemoryStick className="w-3.5 h-3.5 text-primary" />
                <span className="text-xs font-mono font-bold text-foreground">{memMB.toFixed(0)}MB</span>
              </div>
              <p className="text-[10px] text-muted-foreground">RAM</p>
              <MetricBar value={memMB} max={512} color="bg-primary" />
            </div>

            {/* Uptime */}
            <div className="bg-card border border-border rounded-xl p-3">
              <div className="flex items-center justify-between mb-0.5">
                <Clock className="w-3.5 h-3.5 text-success" />
                <span className="text-xs font-mono font-bold text-foreground">{formatUptime(liveUptime)}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Uptime</p>
              <div className="w-full h-1.5 rounded-full bg-success/20 mt-1.5">
                <div className="h-full w-full rounded-full bg-success/40 animate-pulse" />
              </div>
            </div>

            {/* Restarts */}
            <div className={`border rounded-xl p-3 ${recentRestarts > 7 ? 'bg-warning/10 border-warning/25' : 'bg-card border-border'}`}>
              <div className="flex items-center justify-between mb-0.5">
                <RotateCcw className={`w-3.5 h-3.5 ${recentRestarts > 7 ? 'text-warning' : 'text-primary'}`} />
                <span className={`text-xs font-mono font-bold ${recentRestarts > 7 ? 'text-warning' : 'text-foreground'}`}>
                  {vmStatus.restarts ?? 0}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">Restarts</p>
              <MetricBar value={recentRestarts} max={10} color={recentRestarts > 5 ? 'bg-warning' : 'bg-primary'} />
            </div>
          </div>
        </div>
      )}

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <Tabs defaultValue="console" className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-border bg-card/40 h-auto p-0 overflow-x-auto shrink-0">
          {[
            { value: 'console', icon: Terminal, label: 'Console' },
            { value: 'files', icon: FolderOpen, label: 'Files' },
            { value: 'startup', icon: Play, label: 'Startup' },
            { value: 'settings', icon: Settings, label: 'Settings' },
          ].map(({ value, icon: Icon, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="console" className="flex-1 m-0">
          <UnifiedConsole panelId={panel.id} panelStatus={effectiveStatus} />
        </TabsContent>
        <TabsContent value="files" className="flex-1 m-0">
          <FileManager panelId={panel.id} />
        </TabsContent>
        <TabsContent value="startup" className="flex-1 m-0 overflow-y-auto">
          <StartupSettings panel={panel} onUpdate={fetchPanel} />
        </TabsContent>
        <TabsContent value="settings" className="flex-1 m-0 overflow-y-auto">
          <PanelSettings panel={panel} onUpdate={fetchPanel} />
        </TabsContent>
      </Tabs>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      <AlertDialog open={showStopDialog} onOpenChange={setShowStopDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop "{panel.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will stop the panel. You can restart it anytime.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setShowStopDialog(false); handleStop(); }}
            >
              Stop Panel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{panel.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the panel and all its files. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PanelPage;

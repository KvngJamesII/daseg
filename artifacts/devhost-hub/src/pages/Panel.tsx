import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { vmApi, AppStatus } from '@/lib/vmApi';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Play, Square, Loader2, FolderOpen, Terminal,
  Settings, AlertCircle, RefreshCw, Cpu, MemoryStick, Clock,
  RotateCcw, ShoppingCart, Maximize2, Minimize2, SquareTerminal,
} from 'lucide-react';
import { FileManager } from '@/components/panel/FileManager';
import { UnifiedConsole } from '@/components/panel/UnifiedConsole';
import { InteractiveTerminal } from '@/components/panel/InteractiveTerminal';
import { StartupSettings } from '@/components/panel/StartupSettings';
import { PanelSettings } from '@/components/panel/PanelSettings';
import { RenewalWarning } from '@/components/panel/RenewalWarning';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

/* ── palette ─────────────────────────────────────────────────── */
const BG     = '#0c0c0f';
const CARD   = '#141418';
const BORDER = 'rgba(255,255,255,0.07)';
const GREEN  = '#22c55e';
const AMBER  = '#fbbf24';
const BLUE   = '#60a5fa';
const RED    = '#f87171';
const MUTED  = 'rgba(255,255,255,0.38)';
const DIM    = 'rgba(255,255,255,0.07)';

/* ── types ───────────────────────────────────────────────────── */
interface Panel {
  id: string;
  name: string;
  language: 'nodejs' | 'python';
  status: 'stopped' | 'running' | 'deploying' | 'error';
  created_at: string;
  entry_point?: string | null;
  expires_at?: string | null;
}

/* ── helpers ─────────────────────────────────────────────────── */
function formatUptime(ms: number): string {
  if (ms <= 0 || ms > 365 * 24 * 60 * 60 * 1000) return '—';
  const s = Math.floor(ms / 1000), m = Math.floor(s / 60),
        h = Math.floor(m / 60), d = Math.floor(h / 24);
  if (d > 0) return `${d}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

/* ── compact metric card ─────────────────────────────────────── */
function MetCard({ label, value, sub, color, pct, icon: Icon }: {
  label: string; value: string; sub: string;
  color: string; pct: number; icon: React.ElementType;
}) {
  return (
    <div style={{ flex: 1, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 11px 9px', position: 'relative', overflow: 'hidden', minWidth: 0 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, borderRadius: '12px 0 0 12px', background: color }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 9.5, color: MUTED, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
          <div style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.5, color: '#fff', lineHeight: 1.1, whiteSpace: 'nowrap' }}>{value}</div>
          <div style={{ fontSize: 9, color: MUTED, marginTop: 2 }}>{sub}</div>
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${color}1a`, border: `1px solid ${color}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0, marginLeft: 6 }}>
          <Icon style={{ width: 13, height: 13 }} />
        </div>
      </div>
      <div style={{ width: '100%', height: 3, borderRadius: 2, background: DIM, overflow: 'hidden', marginTop: 8 }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, borderRadius: 2, background: pct > 80 ? AMBER : color, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PAGE COMPONENT
════════════════════════════════════════════════════════════════ */
const PanelPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const [panel, setPanel]             = useState<Panel | null>(null);
  const [vmStatus, setVmStatus]       = useState<AppStatus | null>(null);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setAL]        = useState(false);
  const [showDeleteDialog, setDD]     = useState(false);
  const [showStopDialog, setSD]       = useState(false);
  const [liveUptime, setLiveUptime]   = useState(0);
  const [consoleExpanded, setCE]      = useState(false);
  const [activeTab, setActiveTab]     = useState<'console'|'files'|'terminal'|'startup'|'settings'>('console');
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading]);
  useEffect(() => { if (id && user) fetchPanel(); }, [id, user]);

  const decrementPanelSlot = async () => {
    const { data: prof } = await supabase.from('profiles').select('panels_limit').eq('id', user?.id).single();
    if (prof && prof.panels_limit > 0)
      await supabase.from('profiles').update({ panels_limit: prof.panels_limit - 1 }).eq('id', user?.id);
  };

  const fetchPanel = async () => {
    const { data, error } = await supabase.from('panels').select('*').eq('id', id).eq('user_id', user?.id).single();
    if (error || !data) {
      toast({ title: 'Error', description: 'Panel not found', variant: 'destructive' });
      navigate('/dashboard');
    } else {
      const p = data as Panel;
      if (p.expires_at) {
        const expiresAt = new Date(p.expires_at).getTime();
        if (expiresAt < Date.now() - 7 * 24 * 60 * 60 * 1000) {
          try { await vmApi.delete(p.id); } catch {}
          await supabase.from('panels').delete().eq('id', p.id);
          await decrementPanelSlot();
          toast({ title: 'Panel Removed', description: `"${p.name}" expired over 7 days ago and has been auto-deleted.`, variant: 'destructive' });
          navigate('/dashboard'); return;
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
    } catch {}
  };

  useEffect(() => {
    if (panel) { fetchVmStatus(); const t = setInterval(fetchVmStatus, 10000); return () => clearInterval(t); }
  }, [panel?.id]);

  useEffect(() => {
    if (vmStatus?.uptime && vmStatus?.status === 'running') {
      setLiveUptime(vmStatus.uptime);
      const t = setInterval(() => setLiveUptime(p => p + 60000), 60000);
      return () => clearInterval(t);
    } else { setLiveUptime(0); }
  }, [vmStatus?.uptime, vmStatus?.status]);

  const handleStart = async () => {
    if (!id || !panel) return; setAL(true);
    try {
      await supabase.from('panels').update({ status: 'deploying' }).eq('id', id);
      setPanel({ ...panel, status: 'deploying' });
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Starting deployment...', log_type: 'info' });
      await vmApi.deploy(id, panel.language);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Dependencies installed, starting app...', log_type: 'info' });
      const ep = panel.entry_point || (panel.language === 'python' ? 'main.py' : 'index.js');
      const result = await vmApi.start(id, panel.language, ep);
      await supabase.from('panels').update({ status: 'running' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: `Started on port ${result.port} (${ep})`, log_type: 'success' });
      setPanel({ ...panel, status: 'running' });
      toast({ title: 'Panel started', description: result.message || 'Now running' });
      fetchVmStatus();
    } catch (error: any) {
      const raw = error.message || 'Failed to start';
      let msg = raw;
      if (raw.includes('non-2xx') || raw.includes('fetch failed'))   msg = 'Could not reach the deployment server. Please try again.';
      else if (raw.includes('ENOENT') || raw.includes('no such file')) msg = `Entry point not found. Upload your code or check Startup settings.`;
      else if (raw.includes('SyntaxError'))  msg = 'Your code has a syntax error. Check the Console tab for details.';
      else if (raw.includes('timeout'))      msg = 'Startup timed out. Your app may have crashed on launch. Check Console.';
      else if (raw.includes('EADDRINUSE'))   msg = 'Port conflict — the app may already be running. Try Restart instead.';
      else if (raw.includes('memory'))       msg = 'Out of memory. Consider upgrading your plan.';
      else if (raw.includes('npm') || raw.includes('pip') || raw.includes('ModuleNotFoundError') || raw.includes('Cannot find module'))
        msg = `Dependency install failed. Check your ${panel.language === 'python' ? 'requirements.txt' : 'package.json'}.`;
      await supabase.from('panels').update({ status: 'error' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: `Error: ${msg}`, log_type: 'error' });
      setPanel({ ...panel, status: 'error' });
      toast({ title: 'Startup Failed', description: msg, variant: 'destructive' });
    }
    setAL(false);
  };

  const handleRestart = async () => {
    if (!id || !panel) return; setAL(true);
    try {
      await vmApi.restart(id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Panel restarted', log_type: 'info' });
      toast({ title: 'Restarted' }); fetchVmStatus();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setAL(false);
  };

  const handleStop = async () => {
    if (!id || !panel) return; setAL(true);
    try {
      await vmApi.stop(id);
      await supabase.from('panels').update({ status: 'stopped' }).eq('id', id);
      await supabase.from('panel_logs').insert({ panel_id: id, message: 'Panel stopped', log_type: 'info' });
      setPanel({ ...panel, status: 'stopped' });
      toast({ title: 'Stopped' }); fetchVmStatus();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setAL(false);
  };

  const handleDelete = async () => {
    if (!id) return;
    try { await vmApi.delete(id); } catch {}
    const { error } = await supabase.from('panels').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete panel', variant: 'destructive' });
    } else {
      await decrementPanelSlot();
      toast({ title: 'Panel deleted', description: 'The panel and its slot have been permanently removed.' });
      navigate('/dashboard');
    }
  };

  /* ── loading / not-found states ── */
  if (authLoading || loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: BG }}>
      <Loader2 style={{ width: 28, height: 28, color: GREEN, animation: 'spin 1s linear infinite' }} />
    </div>
  );
  if (!panel) return null;

  /* ── derived values ── */
  const effectiveStatus = (vmStatus?.status ?? panel.status) as Panel['status'];
  const isRunning   = effectiveStatus === 'running';
  const isDeploying = effectiveStatus === 'deploying';
  const memMB       = vmStatus?.memory ? vmStatus.memory / 1024 / 1024 : 0;
  const recentRestarts   = (vmStatus as any)?.restarts_recent_3h ?? 0;
  const restartLimitHit  = (vmStatus as any)?.restart_limit_hit ?? false;
  const isExpired   = panel.expires_at ? new Date(panel.expires_at).getTime() < Date.now() : false;
  const langCode    = panel.language === 'nodejs' ? 'JS' : 'PY';
  const langColor   = panel.language === 'nodejs' ? '#f7df1e' : '#ffde57';
  const langBg      = panel.language === 'nodejs' ? 'rgba(247,223,30,0.12)' : 'rgba(255,222,87,0.12)';
  const langBorder  = panel.language === 'nodejs' ? 'rgba(247,223,30,0.25)' : 'rgba(255,222,87,0.25)';

  const statusCfg = {
    running:   { color: GREEN,  glow: `0 0 6px ${GREEN}`,  label: 'Online',    pulse: false },
    deploying: { color: AMBER,  glow: `0 0 6px ${AMBER}`,  label: 'Deploying', pulse: true  },
    error:     { color: RED,    glow: `0 0 6px ${RED}`,     label: 'Error',     pulse: false },
    stopped:   { color: '#555', glow: 'none',               label: 'Offline',   pulse: false },
  }[effectiveStatus] ?? { color: '#555', glow: 'none', label: 'Unknown', pulse: false };

  const TABS = [
    { id: 'console',  Icon: Terminal,        label: 'Logs'     },
    { id: 'terminal', Icon: SquareTerminal,  label: 'Terminal' },
    { id: 'files',    Icon: FolderOpen,      label: 'Files'    },
    { id: 'startup',  Icon: Play,            label: 'Startup'  },
    { id: 'settings', Icon: Settings,        label: 'Settings' },
  ] as const;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ══ FULLSCREEN CONSOLE OVERLAY ══════════════════════════ */}
      {consoleExpanded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', flexDirection: 'column', background: '#0d1117' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', height: 44, borderBottom: '1px solid #21262d', background: '#161b22', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Terminal style={{ width: 14, height: 14, color: '#3fb950' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#e6edf3' }}>{panel.name}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>— console</span>
            </div>
            <button
              onClick={() => setCE(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 6, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }}
            >
              <Minimize2 style={{ width: 12, height: 12 }} /> Collapse
            </button>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <UnifiedConsole panelId={panel.id} panelStatus={effectiveStatus} />
          </div>
        </div>
      )}

      {/* ══ HEADER ════════════════════════════════════════════════ */}
      <header style={{ background: CARD, borderBottom: `1px solid ${BORDER}`, padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 50, backdropFilter: 'blur(12px)' }}>
        <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, color: MUTED, textDecoration: 'none', flexShrink: 0 }}>
          <ArrowLeft style={{ width: 14, height: 14 }} />
        </Link>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: langBg, border: `1px solid ${langBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'monospace', fontWeight: 900, fontSize: 11, color: langColor, flexShrink: 0 }}>
          {langCode}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 13.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{panel.name}</div>
          <div style={{ fontSize: 10.5, color: MUTED, marginTop: 1 }}>
            {panel.language === 'nodejs' ? 'Node.js' : 'Python'}
            {panel.expires_at && (
              <span style={{ color: isExpired ? RED : new Date(panel.expires_at) < new Date(Date.now() + 3 * 86400000) ? AMBER : MUTED, marginLeft: 6 }}>
                · Expires {new Date(panel.expires_at).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: `${statusCfg.color}18`, border: `1px solid ${statusCfg.color}30`, fontSize: 10.5, fontWeight: 700, color: statusCfg.color, flexShrink: 0 }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, boxShadow: statusCfg.glow, animation: statusCfg.pulse ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
          {statusCfg.label}
        </div>
      </header>

      {/* ══ RENEWAL WARNING ═══════════════════════════════════════ */}
      <RenewalWarning panelId={panel.id} expiresAt={panel.expires_at ?? null} />

      {/* ══ EXPIRED BANNER ════════════════════════════════════════ */}
      {isExpired && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderBottom: `1px solid rgba(239,68,68,0.2)`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle style={{ width: 15, height: 15, color: RED, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: RED, margin: 0 }}>Panel Expired</p>
            <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>
              Expired {new Date(panel.expires_at!).toLocaleDateString()}. Renew to run your app. Auto-deleted in 7 days.
            </p>
          </div>
          <button onClick={() => navigate('/pricing')} style={{ padding: '5px 12px', borderRadius: 7, background: RED, border: 'none', color: '#fff', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
            Renew Now
          </button>
        </div>
      )}

      {/* ══ RESTART LIMIT BANNER ══════════════════════════════════ */}
      {restartLimitHit && effectiveStatus === 'stopped' && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.06)', borderBottom: `1px solid rgba(239,68,68,0.15)`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <AlertCircle style={{ width: 15, height: 15, color: RED, flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: RED, margin: 0 }}>Auto-stopped: restart limit exceeded</p>
            <p style={{ fontSize: 11, color: MUTED, margin: '2px 0 0' }}>Your app restarted more than 10 times in 3 hours. Fix your code or upgrade your plan.</p>
          </div>
          <button onClick={() => navigate('/pricing')} style={{ padding: '5px 12px', borderRadius: 7, border: `1px solid rgba(239,68,68,0.3)`, background: 'transparent', color: RED, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
            <ShoppingCart style={{ width: 11, height: 11, display: 'inline', marginRight: 4 }} />Upgrade
          </button>
        </div>
      )}

      {/* ══ ACTION BAR ════════════════════════════════════════════ */}
      <div style={{ padding: '10px 14px', borderBottom: `1px solid ${BORDER}`, display: 'flex', gap: 7, background: CARD }}>
        {isExpired ? (
          <button onClick={() => navigate('/pricing')} style={{ flex: 1, height: 38, borderRadius: 10, border: 'none', background: RED, color: '#fff', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <ShoppingCart style={{ width: 13, height: 13 }} /> Renew to Start
          </button>
        ) : (
          <button onClick={handleStart} disabled={actionLoading || isRunning || isDeploying}
            style={{ flex: 1, height: 38, borderRadius: 10, border: 'none', background: (actionLoading && !isRunning) || isDeploying ? AMBER : (isRunning ? '#1e3a1e' : GREEN), color: isRunning ? '#4ade80' : '#000', fontWeight: 700, fontSize: 12.5, cursor: isRunning ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: (isRunning || isDeploying) ? 0.5 : 1, transition: 'all 0.15s' }}>
            {actionLoading && !isRunning ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Play style={{ width: 13, height: 13 }} />}
            {isDeploying ? 'Deploying…' : 'Start'}
          </button>
        )}
        <button onClick={handleRestart} disabled={actionLoading || !isRunning}
          style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid ${BORDER}`, background: 'transparent', color: isRunning ? '#fff' : MUTED, fontWeight: 600, fontSize: 12.5, cursor: isRunning ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: !isRunning ? 0.4 : 1 }}>
          {actionLoading && isRunning ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <RefreshCw style={{ width: 13, height: 13 }} />}
          Restart
        </button>
        <button onClick={() => setSD(true)} disabled={actionLoading || !isRunning}
          style={{ flex: 1, height: 38, borderRadius: 10, border: `1px solid rgba(239,68,68,0.3)`, background: 'rgba(239,68,68,0.07)', color: RED, fontWeight: 600, fontSize: 12.5, cursor: isRunning ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, opacity: !isRunning ? 0.4 : 1 }}>
          <Square style={{ width: 12, height: 12 }} /> Stop
        </button>
      </div>

      {/* ══ EQUAL-WIDTH TAB BAR (no underline slider) ═══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0 }}>
        {TABS.map(({ id: tid, Icon, label }) => {
          const active = activeTab === tid;
          return (
            <button
              key={tid}
              onClick={() => setActiveTab(tid as typeof activeTab)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                padding: '11px 2px', fontSize: 11.5, fontWeight: active ? 700 : 500,
                color: active ? GREEN : MUTED,
                background: active ? `${GREEN}0d` : 'none',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                transition: 'color 0.15s, background 0.15s',
              }}
            >
              <Icon style={{ width: 13, height: 13 }} />
              {label}
              {tid === 'console' && (
                <span
                  onClick={e => { e.stopPropagation(); setCE(true); }}
                  title="Expand console"
                  style={{ marginLeft: 1, opacity: active ? 0.45 : 0.2, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                >
                  <Maximize2 style={{ width: 10, height: 10 }} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══ TAB CONTENT ═══════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: BG }}>

        {/* Console tab — console output + metric cards below */}
        {activeTab === 'console' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <UnifiedConsole panelId={panel.id} panelStatus={effectiveStatus} />

            {/* Metric cards — only when running, inside the console tab */}
            {vmStatus && isRunning && (
              <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${BORDER}`, flexShrink: 0 }}>
                {recentRestarts > 7 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 10px', borderRadius: 9, background: `${AMBER}12`, border: `1px solid ${AMBER}25`, marginBottom: 8 }}>
                    <AlertCircle style={{ width: 12, height: 12, color: AMBER, flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 10.5, color: AMBER, margin: 0 }}><strong>{recentRestarts}/10 restarts</strong> in the last 3 hours — auto-stop triggers at 10.</p>
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <MetCard label="CPU"      value={`${vmStatus.cpu?.toFixed(1) ?? 0}%`} sub="of vCPU"   color={BLUE}  pct={vmStatus.cpu ?? 0}                   icon={Cpu} />
                    <MetCard label="RAM"      value={`${memMB.toFixed(0)} MB`}             sub="of 512 MB" color={GREEN} pct={(memMB / 512) * 100}                  icon={MemoryStick} />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <MetCard label="Uptime"   value={formatUptime(liveUptime)}             sub="running"   color={GREEN} pct={100}                                  icon={Clock} />
                    <MetCard label="Restarts" value={String(vmStatus.restarts ?? 0)}       sub="total"     color={recentRestarts > 5 ? AMBER : BLUE} pct={(recentRestarts / 10) * 100} icon={RotateCcw} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'terminal' && (
          <InteractiveTerminal
            panelId={panel.id}
            isRunning={isRunning}
            onStart={handleStart}
            actionLoading={actionLoading}
          />
        )}
        {activeTab === 'files' && <FileManager panelId={panel.id} />}
        {activeTab === 'startup' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <StartupSettings panel={panel} onUpdate={fetchPanel} />
          </div>
        )}
        {activeTab === 'settings' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <PanelSettings panel={panel} onUpdate={fetchPanel} onDeleteRequest={() => setDD(true)} />
          </div>
        )}
      </div>

      {/* ══ DIALOGS ═══════════════════════════════════════════════ */}
      <AlertDialog open={showStopDialog} onOpenChange={setSD}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Stop "{panel.name}"?</AlertDialogTitle>
            <AlertDialogDescription>This will stop the panel. You can restart it anytime.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setSD(false); handleStop(); }}>
              Stop Panel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setDD}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{panel.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the panel and burns its slot. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { setDD(false); handleDelete(); }}>
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PanelPage;

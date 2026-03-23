import React, { useState, useEffect, useRef } from 'react';
import { vmApi, FileEntry } from '@/lib/vmApi';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft, Folder, FolderOpen, Upload, Trash2,
  FilePlus, FolderPlus, RefreshCw, Save, X, ArrowLeft, Loader2,
  Download, MoreHorizontal, Check, File,
} from 'lucide-react';

interface PFile { name: string; path: string; type: 'file' | 'directory'; size: number | null; }
interface FileManagerProps { panelId: string; }

const langName: Record<string, string> = {
  py: 'Python', js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS', md: 'Markdown',
  sh: 'Shell', env: 'Env', yml: 'YAML', yaml: 'YAML', sql: 'SQL', txt: 'Plain Text',
};

/* ─── Flat badge icon used in the file tree ─────────────────── */
type BadgeCfg = { bg: string; fg: string; label: string; fontSize?: number };
const BADGE: Record<string, BadgeCfg> = {
  py:   { bg: '#2b5b84', fg: '#ffde57', label: 'PY' },
  js:   { bg: '#f7df1e', fg: '#323330', label: 'JS' },
  ts:   { bg: '#3178c6', fg: '#ffffff', label: 'TS' },
  jsx:  { bg: '#20232a', fg: '#61dafb', label: 'JSX', fontSize: 5.5 },
  tsx:  { bg: '#1a2035', fg: '#61dafb', label: 'TSX', fontSize: 5.5 },
  json: { bg: '#312e81', fg: '#c4b5fd', label: '{}' },
  html: { bg: '#e34c26', fg: '#ffffff', label: 'HTM', fontSize: 5 },
  css:  { bg: '#264de4', fg: '#ffffff', label: 'CSS' },
  scss: { bg: '#cc6699', fg: '#ffffff', label: 'SC' },
  md:   { bg: '#334155', fg: '#e2e8f0', label: 'MD' },
  sh:   { bg: '#14532d', fg: '#4ade80', label: '$' },
  env:  { bg: '#78350f', fg: '#fbbf24', label: '.E' },
  yml:  { bg: '#7f1d1d', fg: '#fca5a5', label: 'YML', fontSize: 5.5 },
  yaml: { bg: '#7f1d1d', fg: '#fca5a5', label: 'YML', fontSize: 5.5 },
  sql:  { bg: '#0c4a6e', fg: '#38bdf8', label: 'DB' },
  txt:  { bg: '#374151', fg: '#9ca3af', label: 'TXT', fontSize: 5.5 },
  toml: { bg: '#374151', fg: '#f0b429', label: 'TOM', fontSize: 5.5 },
  ini:  { bg: '#374151', fg: '#9ca3af', label: 'INI', fontSize: 5.5 },
  lock: { bg: '#292524', fg: '#f0b429', label: 'LK' },
  log:  { bg: '#14532d', fg: '#4ade80', label: 'LOG', fontSize: 5.5 },
  gitignore: { bg: '#7c3aed', fg: '#fff', label: 'GIT', fontSize: 5.5 },
  npmrc:     { bg: '#cc0000', fg: '#fff', label: 'NPM', fontSize: 5.5 },
};

function FileBadge({ name, size = 16 }: { name: string; size?: number }) {
  const dot = name.startsWith('.') && !name.includes('.', 1) ? name.slice(1) : null;
  const ext = dot ?? name.split('.').pop()?.toLowerCase() ?? '';
  const cfg = BADGE[ext];
  const h = Math.round(size * 1.25);
  if (!cfg) {
    return <File style={{ width: size, height: size, color: '#6b7280', flexShrink: 0 }} />;
  }
  const fs = cfg.fontSize ?? 6.5;
  return (
    <svg width={size} height={h} viewBox={`0 0 ${size} ${h}`} style={{ flexShrink: 0 }}>
      <rect x="0" y="0" width={size} height={h} rx="2.5" fill={cfg.bg} />
      <text
        x={size / 2} y={h * 0.73}
        textAnchor="middle"
        fontSize={fs * (size / 16)}
        fontWeight="800"
        fontFamily="monospace"
        fill={cfg.fg}
        letterSpacing="-0.5"
      >
        {cfg.label}
      </text>
    </svg>
  );
}

/* ─── Richer doc icon used only in editor title bar ─────────── */
function Doc({ bg, fold, size, children }: { bg: string; fold: string; size: number; children?: React.ReactNode }) {
  return (
    <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M2 3C2 1.9 2.9 1 4 1H13L18 6V21C18 22.1 17.1 23 16 23H4C2.9 23 2 22.1 2 21V3Z" fill={bg} />
      <path d="M13 1L18 6H14C13.45 6 13 5.55 13 5V1Z" fill={fold} />
      {children}
    </svg>
  );
}

function FileDocIcon({ name, size = 20 }: { name: string; size?: number }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  switch (ext) {
    case 'py': return <Doc bg="#2b5b84" fold="#1a3a54" size={size}><ellipse cx="8.5" cy="13.5" rx="3.5" ry="2.2" fill="#ffde57" opacity="0.9" /><ellipse cx="11.5" cy="16.5" rx="3.5" ry="2.2" fill="#4584b6" opacity="0.9" /></Doc>;
    case 'js': return <Doc bg="#2a2700" fold="#1a1800" size={size}><rect x="4" y="10" width="12" height="10" rx="1.5" fill="#f7df1e" /><text x="7.5" y="18.5" fontSize="6.5" fontWeight="900" fontFamily="monospace" fill="#323330">JS</text></Doc>;
    case 'ts': return <Doc bg="#0d1f36" fold="#061426" size={size}><rect x="4" y="10" width="12" height="10" rx="1.5" fill="#3178c6" /><text x="7.5" y="18.5" fontSize="6.5" fontWeight="900" fontFamily="monospace" fill="#fff">TS</text></Doc>;
    case 'jsx': return <Doc bg="#20232a" fold="#111316" size={size}><rect x="4" y="10" width="12" height="10" rx="1.5" fill="#61dafb" /><text x="5.5" y="18.5" fontSize="5.5" fontWeight="900" fontFamily="monospace" fill="#20232a">JSX</text></Doc>;
    case 'tsx': return <Doc bg="#1a2035" fold="#0f1322" size={size}><rect x="4" y="10" width="12" height="10" rx="1.5" fill="#61dafb" /><text x="5.5" y="18.5" fontSize="5.5" fontWeight="900" fontFamily="monospace" fill="#20232a">TSX</text></Doc>;
    case 'json': return <Doc bg="#1e1b4b" fold="#13103a" size={size}><text x="5" y="17.5" fontSize="9" fontWeight="900" fontFamily="monospace" fill="#c4b5fd">&#123;&#125;</text></Doc>;
    case 'html': return <Doc bg="#7a2a14" fold="#551e0e" size={size}><text x="5.5" y="17.5" fontSize="8" fontWeight="900" fontFamily="monospace" fill="#ff7852">&lt;/&gt;</text></Doc>;
    case 'css': return <Doc bg="#0e1f6e" fold="#091354" size={size}><rect x="5" y="11" width="10" height="2" rx="1" fill="#4b6ef5" /><rect x="5" y="14" width="8" height="2" rx="1" fill="#7c9cff" /><rect x="5" y="17" width="5" height="2" rx="1" fill="#a8c0ff" /></Doc>;
    case 'md': return <Doc bg="#2d3748" fold="#1a212e" size={size}><text x="4.5" y="16" fontSize="7" fontWeight="900" fontFamily="monospace" fill="#e2e8f0">M</text><path d="M13 13 L13 18 L11 16 M13 18 L15 16" stroke="#e2e8f0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></Doc>;
    case 'sh': return <Doc bg="#0d2b0d" fold="#071a07" size={size}><text x="4.5" y="17.5" fontSize="8" fontWeight="900" fontFamily="monospace" fill="#3fb950">$_</text></Doc>;
    default: return (
      <svg width={size} height={Math.round(size * 1.2)} viewBox="0 0 20 24" fill="none" style={{ flexShrink: 0 }}>
        <path d="M2 3C2 1.9 2.9 1 4 1H13L18 6V21C18 22.1 17.1 23 16 23H4C2.9 23 2 22.1 2 21V3Z" fill="#21262d" stroke="#484f58" strokeWidth="0.5" />
        <path d="M13 1L18 6H14C13.45 6 13 5.55 13 5V1Z" fill="#30363d" />
      </svg>
    );
  }
}

function DirIcon({ open, size = 16 }: { open?: boolean; size?: number }) {
  const FolderComp = open ? FolderOpen : Folder;
  return <FolderComp style={{ width: size, height: size, color: '#e3b341', flexShrink: 0 }} />;
}

function fmtSize(b: number | null) {
  if (b === null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

/* ─── editor lang badge colour ──────────────────────────────── */
type LangCfg = { bg: string; fg: string };
const LANG_BADGE: Record<string, LangCfg> = {
  py: { bg: '#ffde57', fg: '#2b5b84' }, js: { bg: '#f7df1e', fg: '#323330' },
  ts: { bg: '#3178c6', fg: '#fff' }, jsx: { bg: '#61dafb', fg: '#20232a' },
  tsx: { bg: '#61dafb', fg: '#20232a' }, json: { bg: '#312e81', fg: '#c4b5fd' },
  html: { bg: '#e34c26', fg: '#fff' }, css: { bg: '#264de4', fg: '#fff' },
  scss: { bg: '#cc6699', fg: '#fff' }, md: { bg: '#334155', fg: '#e2e8f0' },
  sh: { bg: '#14532d', fg: '#4ade80' },
};

export function FileManager({ panelId }: FileManagerProps) {
  const [files, setFiles]         = useState<PFile[]>([]);
  const [path, setPath]           = useState('');
  const [loading, setLoading]     = useState(true);
  const [editing, setEditing]     = useState<PFile | null>(null);
  const [code, setCode]           = useState('');
  const [saved, setSaved]         = useState('');
  const [saving, setSaving]       = useState(false);
  const [loadingFile, setLF]      = useState<string | null>(null);
  const [createMode, setCM]       = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName]     = useState('');
  const [creating, setCreating]   = useState(false);
  const [renaming, setRenaming]   = useState<PFile | null>(null);
  const [renameVal, setRenameVal] = useState('');
  const [hoveredPath, setHP]      = useState<string | null>(null);
  const [lineCount, setLC]        = useState(1);
  const [col, setCol]             = useState(1);
  const editorRef  = useRef<HTMLTextAreaElement>(null);
  const fileIn     = useRef<HTMLInputElement>(null);
  const newNameRef = useRef<HTMLInputElement>(null);
  const { toast }  = useToast();

  const draftKey = (p: string) => `fm_${panelId}_${p}`;
  const isDirty  = code !== saved;

  useEffect(() => { fetchFiles(); }, [panelId, path]);
  useEffect(() => { if (createMode) setTimeout(() => newNameRef.current?.focus(), 30); }, [createMode]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const r = await vmApi.listFiles(panelId, path);
      const mapped: PFile[] = r.files.map((f: FileEntry) => ({ name: f.name, path: f.path, type: f.type, size: f.size }));
      mapped.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(mapped);
    } catch { setFiles([]); }
    setLoading(false);
  };

  const openFile = async (f: PFile) => {
    setLF(f.path);
    try {
      const r = await vmApi.getFileContent(panelId, f.path);
      const draft = localStorage.getItem(draftKey(f.path));
      const content = draft && draft !== r.content ? draft : r.content;
      setCode(content); setSaved(r.content); setEditing(f);
      setLC(content.split('\n').length);
      if (draft && draft !== r.content) toast({ title: 'Draft restored', description: 'Unsaved changes loaded.' });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setLF(null);
  };

  const saveFile = async () => {
    if (!editing || saving || !isDirty) return;
    setSaving(true);
    try {
      await vmApi.syncFiles(panelId, [{ path: editing.path, content: code }]);
      setSaved(code);
      localStorage.removeItem(draftKey(editing.path));
      toast({ title: 'Saved', description: editing.name });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setSaving(false);
  };

  const closeEditor = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    setEditing(null); setCode(''); setSaved('');
  };

  const onCodeChange = (v: string) => {
    setCode(v); setLC(v.split('\n').length);
    if (editing) localStorage.setItem(draftKey(editing.path), v);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveFile(); return; }
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = editorRef.current!;
      const s = ta.selectionStart, end = ta.selectionEnd;
      const newVal = code.slice(0, s) + '  ' + code.slice(end);
      setCode(newVal);
      if (editing) localStorage.setItem(draftKey(editing.path), newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = s + 2; }, 0);
    }
  };

  const onCaretMove = (e: any) => {
    const ta = e.target as HTMLTextAreaElement;
    const before = ta.value.slice(0, ta.selectionStart).split('\n');
    setCol(before[before.length - 1].length + 1);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !createMode) return;
    setCreating(true);
    const fp = path ? `${path}/${newName.trim()}` : newName.trim();
    try {
      if (createMode === 'folder') await vmApi.createDirectory(panelId, fp);
      else await vmApi.syncFiles(panelId, [{ path: fp, content: '' }]);
      toast({ title: 'Created', description: newName.trim() });
      setCM(null); setNewName('');
      await fetchFiles();
      if (createMode === 'file') openFile({ name: newName.trim(), path: fp, type: 'file', size: 0 });
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    setCreating(false);
  };

  const handleRename = async () => {
    if (!renaming || !renameVal.trim()) return;
    try {
      const parts = renaming.path.split('/'); parts.pop();
      const np = [...parts, renameVal.trim()].join('/');
      if (renaming.type === 'file') {
        const r = await vmApi.getFileContent(panelId, renaming.path);
        await vmApi.syncFiles(panelId, [{ path: np, content: r.content }]);
        await vmApi.deleteFile(panelId, renaming.path);
      } else { await vmApi.createDirectory(panelId, np); }
      toast({ title: 'Renamed' });
      setRenaming(null); setRenameVal('');
      fetchFiles();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleDelete = async (f: PFile) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try { await vmApi.deleteFile(panelId, f.path); toast({ title: 'Deleted' }); fetchFiles(); }
    catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleDownload = async (f: PFile) => {
    try {
      const r = await vmApi.getFileContent(panelId, f.path);
      const b = new Blob([r.content], { type: 'text/plain' });
      const u = URL.createObjectURL(b);
      const a = document.createElement('a'); a.href = u; a.download = f.name;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fs = e.target.files; if (!fs) return;
    try {
      const toSync = await Promise.all(Array.from(fs).map(async f => ({ path: path ? `${path}/${f.name}` : f.name, content: await f.text() })));
      await vmApi.syncFiles(panelId, toSync);
      toast({ title: 'Uploaded', description: `${fs.length} file(s)` });
      fetchFiles();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    if (fileIn.current) fileIn.current.value = '';
  };

  const crumbs = path ? path.split('/').filter(Boolean) : [];
  const ext     = editing?.name.split('.').pop()?.toLowerCase() ?? '';
  const lang    = langName[ext] ?? 'Text';
  const langCfg = LANG_BADGE[ext];
  const lines   = code.split('\n');

  /* ══ FULL-SCREEN EDITOR OVERLAY ══════════════════════════════ */
  if (editing) return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      background: '#0d1117', fontFamily: 'inherit',
    }}>
      {/* Title bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 14px', borderBottom: '1px solid #21262d',
        background: '#161b22', flexShrink: 0, height: 48,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <button
            onClick={closeEditor}
            title="Back to files"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 6, border: '1px solid #30363d',
              background: 'transparent', color: '#8b949e', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 12, flexShrink: 0,
            }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
            Files
          </button>
          <div style={{ width: 1, height: 20, background: '#30363d', flexShrink: 0 }} />
          <FileDocIcon name={editing.name} size={18} />
          <span style={{
            fontFamily: '"JetBrains Mono", monospace', fontSize: 13,
            color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {editing.name}
          </span>
          {isDirty && (
            <span
              style={{ width: 8, height: 8, borderRadius: '50%', background: '#f0b429', flexShrink: 0 }}
              title="Unsaved changes"
            />
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {langCfg && (
            <span style={{
              fontSize: 10.5, padding: '2px 8px', borderRadius: 5,
              background: langCfg.bg, color: langCfg.fg,
              fontFamily: 'monospace', fontWeight: 700, letterSpacing: 0.3,
            }}>
              {lang}
            </span>
          )}
          {isDirty && (
            <button
              onClick={() => { setCode(saved); localStorage.removeItem(draftKey(editing.path)); }}
              style={{
                fontSize: 12, padding: '5px 10px', borderRadius: 6,
                border: '1px solid #30363d', background: 'transparent',
                color: '#8b949e', cursor: 'pointer',
              }}
            >
              Discard
            </button>
          )}
          <button
            onClick={saveFile}
            disabled={!isDirty || saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 13, padding: '6px 14px', borderRadius: 6, border: 'none',
              background: isDirty ? '#238636' : '#1c2128',
              color: isDirty ? '#fff' : '#484f58',
              cursor: isDirty ? 'pointer' : 'default',
              fontWeight: 600, transition: 'all 0.15s',
            }}
          >
            {saving
              ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} />
              : <Save style={{ width: 13, height: 13 }} />
            }
            Save
          </button>
        </div>
      </div>

      {/* Editor body: line numbers + textarea */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div
          aria-hidden
          style={{
            width: 52, background: '#0d1117', borderRight: '1px solid #1c2128',
            paddingTop: 16, paddingBottom: 16, paddingRight: 8,
            fontFamily: '"JetBrains Mono", monospace', fontSize: 13, lineHeight: '1.6',
            color: '#3d444d', textAlign: 'right', overflowY: 'hidden',
            userSelect: 'none', flexShrink: 0,
          }}
        >
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>
        <textarea
          ref={editorRef}
          value={code}
          onChange={e => onCodeChange(e.target.value)}
          onKeyDown={onKeyDown}
          onClick={onCaretMove}
          onKeyUp={onCaretMove}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          style={{
            flex: 1, background: '#0d1117', color: '#e6edf3',
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13.5, lineHeight: 1.6,
            padding: '16px 20px 16px 14px',
            border: 'none', outline: 'none', resize: 'none',
            overflowY: 'auto', tabSize: 2, caretColor: '#3fb950',
          }}
        />
      </div>

      {/* Status bar */}
      <div style={{
        height: 26, background: langCfg ? langCfg.bg : '#161b22',
        display: 'flex', alignItems: 'center', paddingLeft: 14,
        gap: 20, flexShrink: 0, borderTop: '1px solid #21262d',
      }}>
        <span style={{ fontSize: 11.5, color: langCfg?.fg ?? '#8b949e', fontFamily: 'monospace', fontWeight: 700 }}>{lang}</span>
        <span style={{ fontSize: 11, color: langCfg?.fg ?? '#8b949e', fontFamily: 'monospace', opacity: 0.7 }}>Ln {lineCount}  Col {col}</span>
        <span style={{ marginLeft: 'auto', paddingRight: 14, fontSize: 10.5, color: langCfg?.fg ?? '#8b949e', fontFamily: 'monospace', opacity: 0.5 }}>
          Ctrl+S  save · Tab  indent
        </span>
      </div>
    </div>
  );

  /* ══ FILE TREE VIEW ══════════════════════════════════════════ */
  return (
    <div style={{ height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderBottom: '1px solid #1c2128',
        background: '#161b22', flexShrink: 0, gap: 8,
      }}>
        {/* Breadcrumb */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0,
          fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#6b7280',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setPath('')}
            style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '2px 4px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace' }}
          >
            ~
          </button>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#374151', margin: '0 1px' }}>/</span>
              <button
                onClick={() => setPath(crumbs.slice(0, i + 1).join('/'))}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '2px 4px', borderRadius: 3, fontSize: 12, fontFamily: 'monospace',
                  color: i === crumbs.length - 1 ? '#cdd9e5' : '#6b7280',
                }}
              >
                {c}
              </button>
            </span>
          ))}
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {[
            { title: 'New file',   Icon: FilePlus,  act: () => { setCM('file');   setNewName(''); } },
            { title: 'New folder', Icon: FolderPlus, act: () => { setCM('folder'); setNewName(''); } },
            { title: 'Upload',     Icon: Upload,    act: () => fileIn.current?.click() },
            { title: 'Refresh',    Icon: RefreshCw, act: fetchFiles },
          ].map(({ title, Icon, act }) => (
            <button
              key={title} onClick={act} title={title}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28, borderRadius: 6,
                border: '1px solid #1c2128', background: 'transparent',
                color: '#6b7280', cursor: 'pointer', transition: 'color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#cdd9e5'; e.currentTarget.style.borderColor = '#30363d'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.borderColor = '#1c2128'; }}
            >
              <Icon style={{ width: 13, height: 13, animation: title === 'Refresh' && loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          ))}
        </div>
        <input ref={fileIn} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Inline create input */}
      {createMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid #1c2128', background: '#161b22' }}>
          {createMode === 'folder'
            ? <DirIcon size={15} />
            : <FileBadge name={newName || 'file'} size={14} />
          }
          <input
            ref={newNameRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCM(null); setNewName(''); } }}
            placeholder={createMode === 'folder' ? 'folder-name' : 'filename.py'}
            style={{
              flex: 1, background: '#0d1117', border: '1px solid #3fb950',
              borderRadius: 5, padding: '5px 10px',
              fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5,
              color: '#e6edf3', outline: 'none',
            }}
          />
          <button onClick={handleCreate} disabled={creating} style={{ width: 28, height: 28, borderRadius: 5, background: '#238636', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {creating ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 12, height: 12 }} />}
          </button>
          <button onClick={() => { setCM(null); setNewName(''); }} style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      {/* Inline rename input */}
      {renaming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderBottom: '1px solid #1c2128', background: '#161b22' }}>
          <span style={{ fontSize: 11.5, color: '#6b7280', fontFamily: 'monospace', flexShrink: 0 }}>Rename:</span>
          <input
            autoFocus value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setRenaming(null); setRenameVal(''); } }}
            style={{ flex: 1, background: '#0d1117', border: '1px solid #3fb950', borderRadius: 5, padding: '5px 10px', fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, color: '#e6edf3', outline: 'none' }}
          />
          <button onClick={handleRename} style={{ width: 28, height: 28, borderRadius: 5, background: '#238636', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Check style={{ width: 12, height: 12 }} />
          </button>
          <button onClick={() => { setRenaming(null); setRenameVal(''); }} style={{ width: 28, height: 28, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      {/* Back row (inside folder) */}
      {path && (
        <button
          onClick={() => { const p = path.split('/'); p.pop(); setPath(p.join('/')); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0 12px', height: 32,
            background: 'none', border: 'none',
            borderBottom: '1px solid #1c2128',
            color: '#6b7280', cursor: 'pointer',
            fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#161b22'; e.currentTarget.style.color = '#cdd9e5'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#6b7280'; }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          <span>..</span>
        </button>
      )}

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '4px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <Loader2 style={{ width: 20, height: 20, color: '#3fb950', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: '#374151', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
            <Folder style={{ width: 32, height: 32, margin: '0 auto 12px', opacity: 0.25 }} />
            <div style={{ color: '#6b7280' }}>Empty directory</div>
            <div style={{ marginTop: 6, fontSize: 11, opacity: 0.6 }}>Create a file or upload one to get started</div>
          </div>
        ) : (
          files.map(f => {
            const isHovered = hoveredPath === f.path;
            return (
              <div
                key={f.path}
                style={{
                  display: 'flex', alignItems: 'center',
                  height: 32, paddingLeft: 12, paddingRight: 8,
                  cursor: 'pointer',
                  background: isHovered ? '#161b22' : 'transparent',
                  transition: 'background 0.1s',
                  borderRadius: 4, margin: '0 4px',
                }}
                onMouseEnter={() => setHP(f.path)}
                onMouseLeave={() => setHP(null)}
                onClick={() => f.type === 'directory' ? setPath(f.path) : openFile(f)}
              >
                {/* Icon */}
                <span style={{ marginRight: 9, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                  {loadingFile === f.path
                    ? <Loader2 style={{ width: 15, height: 15, color: '#3fb950', animation: 'spin 1s linear infinite' }} />
                    : f.type === 'directory'
                      ? <DirIcon size={15} />
                      : <FileBadge name={f.name} size={14} />
                  }
                </span>

                {/* Name */}
                <span style={{
                  flex: 1,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 13,
                  color: f.type === 'directory' ? '#e3b341' : '#cdd9e5',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {f.name}
                </span>

                {/* Size (only shown on non-hover to avoid overlap) */}
                {f.type === 'file' && f.size !== null && !isHovered && (
                  <span style={{ fontSize: 10.5, color: '#374151', fontFamily: 'monospace', flexShrink: 0, marginLeft: 4 }}>
                    {fmtSize(f.size)}
                  </span>
                )}

                {/* Hover actions */}
                {isHovered && (
                  <div
                    style={{ display: 'flex', gap: 3, flexShrink: 0 }}
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setRenaming(f); setRenameVal(f.name); }}
                      title="Rename"
                      style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <MoreHorizontal style={{ width: 11, height: 11 }} />
                    </button>
                    {f.type === 'file' && (
                      <button
                        onClick={() => handleDownload(f)}
                        title="Download"
                        style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#6b7280', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Download style={{ width: 11, height: 11 }} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(f)}
                      title="Delete"
                      style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid rgba(248,81,73,0.3)', background: '#0d1117', color: '#f85149', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 style={{ width: 11, height: 11 }} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

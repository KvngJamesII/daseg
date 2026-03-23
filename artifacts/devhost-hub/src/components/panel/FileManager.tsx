import { useState, useEffect, useRef } from 'react';
import { vmApi, FileEntry } from '@/lib/vmApi';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronRight, ChevronLeft, Folder, FolderOpen, Upload, Trash2,
  FilePlus, FolderPlus, RefreshCw, Save, X, ArrowLeft, Loader2,
  Download, MoreHorizontal, Check,
} from 'lucide-react';

interface PFile { name: string; path: string; type: 'file' | 'directory'; size: number | null; }
interface FileManagerProps { panelId: string; }

/* ── Extension → icon config ─────────────────────────────── */
type IconCfg = { label: string; color: string; dot: string };
const EXT: Record<string, IconCfg> = {
  py:   { label: 'PY',   color: '#4584b6', dot: '#ffde57' },
  js:   { label: 'JS',   color: '#f7df1e', dot: '#323330' },
  ts:   { label: 'TS',   color: '#fff',    dot: '#3178c6' },
  jsx:  { label: 'JSX',  color: '#61dafb', dot: '#20232a' },
  tsx:  { label: 'TSX',  color: '#61dafb', dot: '#20232a' },
  json: { label: 'JSON', color: '#c4b5fd', dot: '#1e1b4b' },
  html: { label: 'HTML', color: '#fff',    dot: '#e34c26' },
  css:  { label: 'CSS',  color: '#fff',    dot: '#264de4' },
  scss: { label: 'SCSS', color: '#fff',    dot: '#cc6699' },
  md:   { label: 'MD',   color: '#e2e8f0', dot: '#2d3748' },
  sh:   { label: 'SH',   color: '#000',    dot: '#3fb950' },
  env:  { label: 'ENV',  color: '#000',    dot: '#f0b429' },
  yml:  { label: 'YML',  color: '#fff',    dot: '#cb171e' },
  yaml: { label: 'YAML', color: '#fff',    dot: '#cb171e' },
  sql:  { label: 'SQL',  color: '#fff',    dot: '#00b0ff' },
  txt:  { label: 'TXT',  color: '#8b949e', dot: '#21262d' },
  toml: { label: 'TOML', color: '#9b9b9b', dot: '#21262d' },
  lock: { label: 'LOCK', color: '#f0b429', dot: '#21262d' },
  ini:  { label: 'INI',  color: '#8b949e', dot: '#21262d' },
  log:  { label: 'LOG',  color: '#3fb950', dot: '#0d2b0d' },
};

const langName: Record<string, string> = {
  py: 'Python', js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX', tsx: 'TSX',
  json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS', md: 'Markdown',
  sh: 'Shell', env: 'Env', yml: 'YAML', yaml: 'YAML', sql: 'SQL', txt: 'Plain Text',
};

function FileIcon({ name, size = 20 }: { name: string; size?: number }) {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  const cfg = EXT[ext];
  const fs = size <= 20 ? 7 : 9;
  if (!cfg) return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="#484f58" strokeWidth="1.5" fill="#21262d" />
      <path d="M14 2v6h6" stroke="#484f58" strokeWidth="1.5" />
    </svg>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: 3, background: cfg.dot, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <span style={{ fontSize: fs, fontWeight: 900, fontFamily: 'monospace', color: cfg.color, letterSpacing: -0.5, lineHeight: 1 }}>{cfg.label}</span>
    </div>
  );
}

function DirIcon({ open, size = 20 }: { open?: boolean; size?: number }) {
  const FolderComp = open ? FolderOpen : Folder;
  return <FolderComp style={{ width: size, height: size, color: '#e3b341', flexShrink: 0 }} />;
}

function fmtSize(b: number | null) {
  if (b === null) return '';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

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
  const [menu, setMenu]           = useState<{ file: PFile; x: number; y: number } | null>(null);
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
  useEffect(() => { const close = () => setMenu(null); document.addEventListener('click', close); return () => document.removeEventListener('click', close); }, []);

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
      setCode(content);
      setSaved(r.content);
      setEditing(f);
      setLC(content.split('\n').length);
      if (draft && draft !== r.content) toast({ title: 'Draft restored', description: 'Unsaved changes loaded.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
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
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const closeEditor = () => {
    if (isDirty && !window.confirm('Discard unsaved changes?')) return;
    setEditing(null); setCode(''); setSaved('');
  };

  const onCodeChange = (v: string) => {
    setCode(v);
    setLC(v.split('\n').length);
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
      } else {
        await vmApi.createDirectory(panelId, np);
      }
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
      const toSync = await Promise.all(Array.from(fs).map(async f => ({
        path: path ? `${path}/${f.name}` : f.name, content: await f.text(),
      })));
      await vmApi.syncFiles(panelId, toSync);
      toast({ title: 'Uploaded', description: `${fs.length} file(s)` });
      fetchFiles();
    } catch (e: any) { toast({ title: 'Error', description: e.message, variant: 'destructive' }); }
    if (fileIn.current) fileIn.current.value = '';
  };

  const crumbs = path ? path.split('/').filter(Boolean) : [];
  const ext     = editing?.name.split('.').pop()?.toLowerCase() ?? '';
  const lang    = langName[ext] ?? 'Text';
  const extCfg  = EXT[ext];
  const lines   = code.split('\n');

  /* ══════════════════════════════════════════════════════════
     CODE EDITOR VIEW
  ══════════════════════════════════════════════════════════ */
  if (editing) return (
    <div style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', background: '#0d1117', fontFamily: 'inherit' }}>

      {/* Editor title bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', borderBottom: '1px solid #21262d', background: '#161b22', flexShrink: 0, height: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <button
            onClick={closeEditor}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} />
          </button>
          <FileIcon name={editing.name} size={18} />
          <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, color: '#e6edf3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {editing.name}
          </span>
          {isDirty && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f0b429', flexShrink: 0 }} title="Unsaved" />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {extCfg && (
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: extCfg.dot, color: extCfg.color, fontFamily: 'monospace', fontWeight: 700 }}>
              {lang}
            </span>
          )}
          {isDirty && (
            <button
              onClick={() => { setCode(saved); localStorage.removeItem(draftKey(editing.path)); }}
              style={{ fontSize: 11, padding: '4px 9px', borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', cursor: 'pointer' }}
            >
              Discard
            </button>
          )}
          <button
            onClick={saveFile}
            disabled={!isDirty || saving}
            style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '5px 12px', borderRadius: 6, border: 'none', background: isDirty ? '#238636' : '#21262d', color: isDirty ? '#fff' : '#484f58', cursor: isDirty ? 'pointer' : 'default', fontWeight: 600, transition: 'all 0.15s' }}
          >
            {saving ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 12, height: 12 }} />}
            Save
          </button>
        </div>
      </div>

      {/* Editor area: line numbers + code */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Line numbers */}
        <div
          aria-hidden
          style={{ width: 48, background: '#0d1117', borderRight: '1px solid #21262d', paddingTop: 14, paddingBottom: 14, paddingRight: 8, fontFamily: '"JetBrains Mono", monospace', fontSize: 12, lineHeight: '1.6', color: '#30363d', textAlign: 'right', overflowY: 'hidden', userSelect: 'none', flexShrink: 0 }}
        >
          {lines.map((_, i) => <div key={i}>{i + 1}</div>)}
        </div>

        {/* Textarea */}
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
          style={{ flex: 1, background: '#0d1117', color: '#e6edf3', fontFamily: '"JetBrains Mono", "Fira Code", monospace', fontSize: 13, lineHeight: 1.6, padding: '14px 16px 14px 12px', border: 'none', outline: 'none', resize: 'none', overflowY: 'auto', tabSize: 2, caretColor: '#3fb950' }}
        />
      </div>

      {/* Status bar */}
      <div style={{ height: 24, background: extCfg ? extCfg.dot : '#21262d', display: 'flex', alignItems: 'center', paddingLeft: 12, gap: 16, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: extCfg?.color ?? '#8b949e', fontFamily: 'monospace', fontWeight: 700 }}>{lang}</span>
        <span style={{ fontSize: 11, color: extCfg?.color ?? '#8b949e', fontFamily: 'monospace', opacity: 0.7 }}>Ln {lineCount}  Col {col}</span>
        <span style={{ marginLeft: 'auto', paddingRight: 12, fontSize: 10, color: extCfg?.color ?? '#8b949e', fontFamily: 'monospace', opacity: 0.55 }}>Ctrl+S  save · Tab  indent</span>
      </div>
    </div>
  );

  /* ══════════════════════════════════════════════════════════
     FILE LIST VIEW
  ══════════════════════════════════════════════════════════ */
  return (
    <div style={{ height: 'calc(100vh - 280px)', display: 'flex', flexDirection: 'column', background: '#0d1117' }}>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', borderBottom: '1px solid #21262d', background: '#161b22', flexShrink: 0, gap: 8 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: '"JetBrains Mono", monospace', fontSize: 11.5, color: '#8b949e', flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <button onClick={() => setPath('')} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer', padding: '2px 3px', borderRadius: 3, fontSize: 11.5, fontFamily: 'monospace' }}>~</button>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ color: '#30363d', margin: '0 1px' }}>/</span>
              <button
                onClick={() => setPath(crumbs.slice(0, i + 1).join('/'))}
                style={{ background: 'none', border: 'none', color: i === crumbs.length - 1 ? '#e6edf3' : '#8b949e', cursor: 'pointer', padding: '2px 3px', borderRadius: 3, fontSize: 11.5, fontFamily: 'monospace' }}
              >
                {c}
              </button>
            </span>
          ))}
        </div>

        {/* Action icons */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {[
            { title: 'New file', Icon: FilePlus,   act: () => { setCM('file');   setNewName(''); } },
            { title: 'New folder', Icon: FolderPlus, act: () => { setCM('folder'); setNewName(''); } },
            { title: 'Upload',   Icon: Upload,     act: () => fileIn.current?.click() },
            { title: 'Refresh',  Icon: RefreshCw,  act: fetchFiles },
          ].map(({ title, Icon, act }) => (
            <button key={title} onClick={act} title={title} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', cursor: 'pointer' }}>
              <Icon style={{ width: 13, height: 13, animation: title === 'Refresh' && loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
          ))}
        </div>
        <input ref={fileIn} type="file" multiple className="hidden" onChange={handleUpload} />
      </div>

      {/* Inline new name input */}
      {createMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid #21262d', background: '#161b22' }}>
          {createMode === 'folder' ? <DirIcon size={16} /> : <FileIcon name={newName || 'file'} size={16} />}
          <input
            ref={newNameRef}
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCM(null); setNewName(''); } }}
            placeholder={createMode === 'folder' ? 'folder-name' : 'filename.py'}
            style={{ flex: 1, background: '#0d1117', border: '1px solid #3fb950', borderRadius: 5, padding: '4px 9px', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#e6edf3', outline: 'none' }}
          />
          <button onClick={handleCreate} disabled={creating} style={{ width: 26, height: 26, borderRadius: 5, background: '#238636', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            {creating ? <Loader2 style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> : <Check style={{ width: 12, height: 12 }} />}
          </button>
          <button onClick={() => { setCM(null); setNewName(''); }} style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      {/* Inline rename input */}
      {renaming && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderBottom: '1px solid #21262d', background: '#161b22' }}>
          <span style={{ fontSize: 11, color: '#8b949e', fontFamily: 'monospace', flexShrink: 0 }}>Rename:</span>
          <input
            autoFocus
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') { setRenaming(null); setRenameVal(''); } }}
            style={{ flex: 1, background: '#0d1117', border: '1px solid #3fb950', borderRadius: 5, padding: '4px 9px', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, color: '#e6edf3', outline: 'none' }}
          />
          <button onClick={handleRename} style={{ width: 26, height: 26, borderRadius: 5, background: '#238636', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Check style={{ width: 12, height: 12 }} />
          </button>
          <button onClick={() => { setRenaming(null); setRenameVal(''); }} style={{ width: 26, height: 26, borderRadius: 5, border: '1px solid #30363d', background: 'transparent', color: '#8b949e', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X style={{ width: 12, height: 12 }} />
          </button>
        </div>
      )}

      {/* Back row */}
      {path && (
        <button
          onClick={() => { const p = path.split('/'); p.pop(); setPath(p.join('/')); }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: 'none', border: 'none', borderBottom: '1px solid #21262d', color: '#8b949e', cursor: 'pointer', fontFamily: '"JetBrains Mono", monospace', fontSize: 12, textAlign: 'left' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#161b22')}
          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          ..
        </button>
      )}

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <Loader2 style={{ width: 22, height: 22, color: '#3fb950', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', color: '#484f58', fontFamily: '"JetBrains Mono", monospace', fontSize: 12 }}>
            <Folder style={{ width: 36, height: 36, margin: '0 auto 12px', opacity: 0.3 }} />
            <div>Empty directory</div>
            <div style={{ marginTop: 6, opacity: 0.6, fontSize: 11 }}>Create a file or upload one to get started</div>
          </div>
        ) : (
          files.map(f => (
            <div
              key={f.path}
              style={{ display: 'flex', alignItems: 'center', padding: '0 10px', height: 34, cursor: 'pointer', position: 'relative' }}
              onMouseEnter={e => { e.currentTarget.style.background = '#161b22'; (e.currentTarget.querySelector('.actions') as HTMLElement).style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; (e.currentTarget.querySelector('.actions') as HTMLElement).style.opacity = '0'; }}
              onClick={() => f.type === 'directory' ? setPath(f.path) : openFile(f)}
            >
              {/* Icon */}
              <span style={{ marginRight: 9, flexShrink: 0 }}>
                {loadingFile === f.path
                  ? <Loader2 style={{ width: 18, height: 18, color: '#3fb950', animation: 'spin 1s linear infinite' }} />
                  : f.type === 'directory'
                    ? <DirIcon size={18} />
                    : <FileIcon name={f.name} size={18} />
                }
              </span>

              {/* Name */}
              <span style={{ flex: 1, fontFamily: '"JetBrains Mono", monospace', fontSize: 12.5, color: f.type === 'directory' ? '#e3b341' : '#c9d1d9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {f.name}
              </span>

              {/* Size */}
              {f.type === 'file' && f.size !== null && (
                <span style={{ fontSize: 10.5, color: '#484f58', fontFamily: 'monospace', marginRight: 6, flexShrink: 0 }}>
                  {fmtSize(f.size)}
                </span>
              )}

              {/* Hover actions */}
              <div
                className="actions"
                style={{ display: 'flex', gap: 3, opacity: 0, transition: 'opacity 0.1s', flexShrink: 0 }}
                onClick={e => e.stopPropagation()}
              >
                {f.type === 'file' && (
                  <button
                    onClick={() => openFile(f)}
                    title="Edit"
                    style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: 'monospace' }}
                  >
                    ✏
                  </button>
                )}
                <button
                  onClick={() => { setRenaming(f); setRenameVal(f.name); }}
                  title="Rename"
                  style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <MoreHorizontal style={{ width: 11, height: 11 }} />
                </button>
                {f.type === 'file' && (
                  <button
                    onClick={() => handleDownload(f)}
                    title="Download"
                    style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #30363d', background: '#0d1117', color: '#8b949e', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Download style={{ width: 11, height: 11 }} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(f)}
                  title="Delete"
                  style={{ width: 24, height: 24, borderRadius: 4, border: '1px solid #ff000040', background: '#0d1117', color: '#f85149', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Trash2 style={{ width: 11, height: 11 }} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

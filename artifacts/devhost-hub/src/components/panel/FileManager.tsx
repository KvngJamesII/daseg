import { useState, useEffect, useRef } from 'react';
import { vmApi, FileEntry } from '@/lib/vmApi';
import { useToast } from '@/hooks/use-toast';
import {
  Folder, Upload, MoreVertical, Trash2, FileCode, Loader2,
  FolderPlus, FilePlus, RefreshCw, Download, ChevronRight,
  ChevronLeft, Save, X, ArrowLeft, Check, AlertCircle,
} from 'lucide-react';

interface PanelFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number | null;
}

interface FileManagerProps {
  panelId: string;
}

/* ── File type icon / color mapping ─────────────────────────── */
const EXT_META: Record<string, { label: string; color: string; bg: string }> = {
  py:   { label: 'PY',   color: '#4584b6', bg: '#4584b618' },
  js:   { label: 'JS',   color: '#f7df1e', bg: '#f7df1e15' },
  ts:   { label: 'TS',   color: '#3178c6', bg: '#3178c618' },
  jsx:  { label: 'JSX',  color: '#61dafb', bg: '#61dafb15' },
  tsx:  { label: 'TSX',  color: '#61dafb', bg: '#61dafb15' },
  json: { label: 'JSON', color: '#ab9df2', bg: '#ab9df218' },
  html: { label: 'HTML', color: '#e34c26', bg: '#e34c2615' },
  css:  { label: 'CSS',  color: '#264de4', bg: '#264de415' },
  scss: { label: 'SCSS', color: '#cc6699', bg: '#cc669915' },
  md:   { label: 'MD',   color: '#a0aec0', bg: '#a0aec018' },
  sh:   { label: 'SH',   color: '#00e676', bg: '#00e67615' },
  env:  { label: 'ENV',  color: '#f0b429', bg: '#f0b42918' },
  yml:  { label: 'YML',  color: '#ff6b6b', bg: '#ff6b6b15' },
  yaml: { label: 'YAML', color: '#ff6b6b', bg: '#ff6b6b15' },
  txt:  { label: 'TXT',  color: '#718096', bg: '#71809618' },
  sql:  { label: 'SQL',  color: '#00b0ff', bg: '#00b0ff15' },
  toml: { label: 'TOML', color: '#9c9c9c', bg: '#9c9c9c15' },
  lock: { label: 'LOCK', color: '#f0b429', bg: '#f0b42918' },
};

function FileTypeIcon({ name, size = 32 }: { name: string; size?: number }) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  const meta = EXT_META[ext];
  const fontSize = size <= 24 ? 8 : size <= 32 ? 9 : 10;
  if (!meta) return (
    <div style={{ width: size, height: size, borderRadius: 6, background: '#1a1a2e', border: '1px solid #2a2a4a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <FileCode style={{ width: size * 0.5, height: size * 0.5, color: '#5a5a88' }} />
    </div>
  );
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: meta.bg, border: `1px solid ${meta.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ fontSize, fontWeight: 900, fontFamily: 'monospace', color: meta.color, letterSpacing: -0.5 }}>{meta.label}</span>
    </div>
  );
}

function FolderIcon({ size = 32 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: 6, background: '#f0b42918', border: '1px solid #f0b42930', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Folder style={{ width: size * 0.55, height: size * 0.55, color: '#f0b429' }} />
    </div>
  );
}

/* ── Code editor syntax hints ───────────────────────────────── */
function getLanguageHint(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  const map: Record<string, string> = {
    py: 'Python', js: 'JavaScript', ts: 'TypeScript', jsx: 'JSX',
    tsx: 'TSX', json: 'JSON', html: 'HTML', css: 'CSS', scss: 'SCSS',
    md: 'Markdown', sh: 'Shell', yml: 'YAML', yaml: 'YAML', sql: 'SQL',
    env: 'Env', toml: 'TOML', txt: 'Plain Text',
  };
  return map[ext] || 'Text';
}

const CARD = '#0d0d1a';
const CARD2 = '#111122';
const BORDER = '#1a1a2e';
const GREEN = '#00e676';
const MUTED = '#5a5a88';

export function FileManager({ panelId }: FileManagerProps) {
  const [files, setFiles] = useState<PanelFile[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<PanelFile | null>(null);
  const [editContent, setEditContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loadingFile, setLoadingFile] = useState<string | null>(null);
  const [showCreateInput, setShowCreateInput] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState<PanelFile | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [lineCount, setLineCount] = useState(1);
  const [colPos, setColPos] = useState(1);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const draftKey = (path: string) => `draft_${panelId}_${path}`;

  useEffect(() => { fetchFiles(); }, [panelId, currentPath]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const result = await vmApi.listFiles(panelId, currentPath);
      const mapped: PanelFile[] = result.files.map((f: FileEntry) => ({
        name: f.name, path: f.path, type: f.type, size: f.size,
      }));
      mapped.sort((a, b) => {
        if (a.type === 'directory' && b.type !== 'directory') return -1;
        if (a.type !== 'directory' && b.type === 'directory') return 1;
        return a.name.localeCompare(b.name);
      });
      setFiles(mapped);
    } catch { setFiles([]); }
    setLoading(false);
  };

  const openFile = async (file: PanelFile) => {
    setLoadingFile(file.path);
    try {
      const result = await vmApi.getFileContent(panelId, file.path);
      const savedDraft = localStorage.getItem(draftKey(file.path));
      const content = (savedDraft && savedDraft !== result.content) ? savedDraft : result.content;
      setEditContent(content);
      setOriginalContent(result.content);
      setIsDirty(savedDraft !== null && savedDraft !== result.content);
      setEditingFile(file);
      setLineCount(content.split('\n').length);
      setColPos(1);
      if (savedDraft && savedDraft !== result.content) {
        toast({ title: 'Draft Restored', description: 'Unsaved changes loaded' });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to load file', variant: 'destructive' });
    }
    setLoadingFile(null);
  };

  const handleEditorChange = (val: string) => {
    setEditContent(val);
    setIsDirty(val !== originalContent);
    setLineCount(val.split('\n').length);
    localStorage.setItem(draftKey(editingFile!.path), val);
  };

  const handleCursorChange = (e: React.MouseEvent<HTMLTextAreaElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.target as HTMLTextAreaElement;
    const text = ta.value.substring(0, ta.selectionStart);
    const lines = text.split('\n');
    setLineCount(editContent.split('\n').length);
    setColPos(lines[lines.length - 1].length + 1);
  };

  const handleTabKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = editorRef.current!;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = editContent.substring(0, start) + '  ' + editContent.substring(end);
      setEditContent(newVal);
      setIsDirty(newVal !== originalContent);
      localStorage.setItem(draftKey(editingFile!.path), newVal);
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      saveFile();
    }
  };

  const saveFile = async () => {
    if (!editingFile || saving) return;
    setSaving(true);
    try {
      await vmApi.syncFiles(panelId, [{ path: editingFile.path, content: editContent }]);
      setOriginalContent(editContent);
      setIsDirty(false);
      localStorage.removeItem(draftKey(editingFile.path));
      toast({ title: 'Saved', description: editingFile.name });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to save', variant: 'destructive' });
    }
    setSaving(false);
  };

  const closeEditor = () => {
    if (isDirty) {
      if (!window.confirm('You have unsaved changes. Close anyway?')) return;
    }
    setEditingFile(null);
    setEditContent('');
    setIsDirty(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || !showCreateInput) return;
    setCreating(true);
    try {
      const filePath = currentPath ? `${currentPath}/${newName.trim()}` : newName.trim();
      if (showCreateInput === 'folder') {
        await vmApi.createDirectory(panelId, filePath);
      } else {
        await vmApi.syncFiles(panelId, [{ path: filePath, content: '' }]);
      }
      toast({ title: 'Created', description: newName.trim() });
      setNewName('');
      setShowCreateInput(null);
      fetchFiles();
      if (showCreateInput === 'file') {
        openFile({ name: newName.trim(), path: filePath, type: 'file', size: 0 });
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setCreating(false);
  };

  const handleDelete = async (file: PanelFile) => {
    if (!window.confirm(`Delete "${file.name}"?`)) return;
    try {
      await vmApi.deleteFile(panelId, file.path);
      toast({ title: 'Deleted', description: file.name });
      fetchFiles();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleRenameSubmit = async () => {
    if (!renaming || !renameValue.trim()) return;
    try {
      const parts = renaming.path.split('/');
      parts.pop();
      const newPath = parts.length > 0 ? `${parts.join('/')}/${renameValue.trim()}` : renameValue.trim();
      const result = await vmApi.getFileContent(panelId, renaming.path);
      await vmApi.syncFiles(panelId, [{ path: newPath, content: result.content }]);
      await vmApi.deleteFile(panelId, renaming.path);
      toast({ title: 'Renamed', description: renameValue.trim() });
      setRenaming(null);
      fetchFiles();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files;
    if (!uploaded) return;
    try {
      const toSync = await Promise.all(Array.from(uploaded).map(async (file) => {
        const content = await file.text();
        return { path: currentPath ? `${currentPath}/${file.name}` : file.name, content };
      }));
      await vmApi.syncFiles(panelId, toSync);
      toast({ title: 'Uploaded', description: `${uploaded.length} file(s)` });
      fetchFiles();
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const navigateUp = () => {
    const parts = currentPath.split('/').filter(Boolean);
    parts.pop();
    setCurrentPath(parts.join('/'));
  };

  const breadcrumbs = currentPath ? currentPath.split('/').filter(Boolean) : [];

  /* ──────────────────── CODE EDITOR VIEW ──────────────────── */
  if (editingFile) {
    const ext = editingFile.name.split('.').pop()?.toLowerCase() || '';
    const meta = EXT_META[ext];
    const lang = getLanguageHint(editingFile.name);
    const lines = editContent.split('\n');

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', background: '#090910' }}>
        {/* Editor Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={closeEditor}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}
            >
              <ArrowLeft style={{ width: 14, height: 14 }} />
            </button>
            <FileTypeIcon name={editingFile.name} size={28} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#ddddf5' }}>{editingFile.name}</span>
                {isDirty && <span style={{ width: 7, height: 7, borderRadius: '50%', background: GREEN, display: 'inline-block' }} title="Unsaved changes" />}
              </div>
              <div style={{ fontSize: 10, color: MUTED, marginTop: 1 }}>
                {editingFile.path}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: meta?.color || MUTED, background: meta?.bg || '#1a1a2e', borderRadius: 5, padding: '2px 7px', fontFamily: 'monospace', fontWeight: 700 }}>
              {lang}
            </span>
            {isDirty && (
              <button
                onClick={() => { setEditContent(originalContent); setIsDirty(false); localStorage.removeItem(draftKey(editingFile.path)); }}
                style={{ padding: '5px 10px', borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, fontSize: 11, cursor: 'pointer', fontFamily: 'monospace' }}
              >
                Discard
              </button>
            )}
            <button
              onClick={saveFile}
              disabled={saving || !isDirty}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 8, background: isDirty ? GREEN : '#1a1a2e', border: 'none', color: isDirty ? '#000' : MUTED, fontWeight: 700, fontSize: 12, cursor: isDirty ? 'pointer' : 'default', fontFamily: 'monospace', transition: 'all 0.15s' }}
            >
              {saving ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Save style={{ width: 13, height: 13 }} />}
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>

        {/* Editor Body: line numbers + textarea */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
          {/* Line numbers */}
          <div
            style={{
              width: 44, background: '#0a0a14', borderRight: `1px solid ${BORDER}`,
              overflowY: 'hidden', paddingTop: 12, flexShrink: 0, userSelect: 'none',
              fontFamily: 'monospace', fontSize: 12, color: '#2d2d5a', textAlign: 'right',
              paddingRight: 8, lineHeight: '1.7',
            }}
            aria-hidden
          >
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Code textarea */}
          <textarea
            ref={editorRef}
            value={editContent}
            onChange={e => handleEditorChange(e.target.value)}
            onKeyDown={handleTabKey}
            onClick={handleCursorChange}
            onKeyUp={handleCursorChange}
            spellCheck={false}
            style={{
              flex: 1, background: '#090910', color: '#cccde8', fontFamily: '"Fira Code", "JetBrains Mono", "Cascadia Code", monospace',
              fontSize: 13, lineHeight: 1.7, padding: '12px 16px', border: 'none', outline: 'none',
              resize: 'none', overflowY: 'auto', tabSize: 2,
            }}
          />
        </div>

        {/* Status bar */}
        <div style={{ height: 26, background: meta?.bg || '#0d0d1a', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', padding: '0 14px', gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: meta?.color || MUTED, fontFamily: 'monospace', fontWeight: 700 }}>{lang}</span>
          <span style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace' }}>Ln {lineCount}, Col {colPos}</span>
          <span style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace' }}>
            {editContent.length < 1024 ? `${editContent.length} B` : `${(editContent.length / 1024).toFixed(1)} KB`}
          </span>
          <span style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginLeft: 'auto' }}>
            Ctrl+S to save · Tab for indent
          </span>
        </div>
      </div>
    );
  }

  /* ──────────────────── FILE LIST VIEW ──────────────────── */
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 280px)', background: '#0c0d16' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: CARD, flexShrink: 0 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'monospace', fontSize: 12, color: MUTED, minWidth: 0, flex: 1 }}>
          <button
            onClick={() => setCurrentPath('')}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', padding: '2px 4px', borderRadius: 4, fontFamily: 'monospace', fontSize: 12 }}
          >
            /
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <ChevronRight style={{ width: 12, height: 12, color: '#2a2a4a' }} />
              <button
                onClick={() => setCurrentPath(breadcrumbs.slice(0, i + 1).join('/'))}
                style={{ background: 'none', border: 'none', color: i === breadcrumbs.length - 1 ? '#cccde8' : MUTED, cursor: 'pointer', fontFamily: 'monospace', fontSize: 12, padding: '2px 4px', borderRadius: 4 }}
              >
                {crumb}
              </button>
            </span>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {currentPath && (
            <button onClick={navigateUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}>
              <ChevronLeft style={{ width: 14, height: 14 }} />
            </button>
          )}
          <button onClick={() => { setShowCreateInput('folder'); setNewName(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }} title="New folder">
            <FolderPlus style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={() => { setShowCreateInput('file'); setNewName(''); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }} title="New file">
            <FilePlus style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }} title="Upload">
            <Upload style={{ width: 14, height: 14 }} />
          </button>
          <button onClick={fetchFiles} disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }} title="Refresh">
            <RefreshCw style={{ width: 14, height: 14, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          </button>
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        </div>
      </div>

      {/* Inline create/rename input */}
      {(showCreateInput || renaming) && (
        <div style={{ padding: '8px 12px', borderBottom: `1px solid ${BORDER}`, background: CARD2, display: 'flex', alignItems: 'center', gap: 8 }}>
          {showCreateInput && (
            <>
              {showCreateInput === 'folder' ? <FolderIcon size={22} /> : <FileTypeIcon name={newName || 'file'} size={22} />}
              <span style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', flexShrink: 0 }}>
                New {showCreateInput}:
              </span>
            </>
          )}
          {renaming && <span style={{ fontSize: 11, color: MUTED, fontFamily: 'monospace', flexShrink: 0 }}>Rename:</span>}
          <input
            autoFocus
            value={renaming ? renameValue : newName}
            onChange={e => renaming ? setRenameValue(e.target.value) : setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') renaming ? handleRenameSubmit() : handleCreate();
              if (e.key === 'Escape') { setShowCreateInput(null); setRenaming(null); }
            }}
            placeholder={renaming ? renaming.name : (showCreateInput === 'folder' ? 'folder-name' : 'filename.py')}
            style={{ flex: 1, background: '#090910', border: `1px solid ${GREEN}50`, borderRadius: 7, padding: '5px 10px', fontSize: 12, color: '#cccde8', fontFamily: 'monospace', outline: 'none' }}
          />
          <button onClick={renaming ? handleRenameSubmit : handleCreate} disabled={creating} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: GREEN, border: 'none', color: '#000', cursor: 'pointer' }}>
            {creating ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" /> : <Check style={{ width: 13, height: 13 }} />}
          </button>
          <button onClick={() => { setShowCreateInput(null); setRenaming(null); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer' }}>
            <X style={{ width: 13, height: 13 }} />
          </button>
        </div>
      )}

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 120 }}>
            <Loader2 style={{ width: 24, height: 24, color: GREEN }} className="animate-spin" />
          </div>
        ) : files.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: MUTED }}>
            <Folder style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
            <div style={{ fontFamily: 'monospace', fontSize: 13 }}>Empty directory</div>
            <div style={{ fontSize: 12, marginTop: 6, opacity: 0.6 }}>Create a file or upload to get started</div>
          </div>
        ) : (
          files.map(file => (
            <div
              key={file.path}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', cursor: 'pointer', borderBottom: `1px solid ${BORDER}08`, position: 'relative' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#111122')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {/* Icon */}
              <div style={{ flexShrink: 0 }}>
                {loadingFile === file.path ? (
                  <Loader2 style={{ width: 32, height: 32, color: GREEN }} className="animate-spin" />
                ) : file.type === 'directory' ? (
                  <FolderIcon size={32} />
                ) : (
                  <FileTypeIcon name={file.name} size={32} />
                )}
              </div>

              {/* Name + info */}
              <button
                style={{ flex: 1, background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', minWidth: 0 }}
                onClick={() => file.type === 'directory' ? setCurrentPath(file.path) : openFile(file)}
                disabled={loadingFile === file.path}
              >
                <div style={{ fontFamily: 'monospace', fontSize: 13, color: file.type === 'directory' ? '#f0b429' : '#cccde8', fontWeight: file.type === 'directory' ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.name}
                  {file.type === 'directory' && <ChevronRight style={{ width: 12, height: 12, display: 'inline', marginLeft: 4, opacity: 0.5 }} />}
                </div>
                {file.type === 'file' && file.size !== null && (
                  <div style={{ fontSize: 10, color: MUTED, fontFamily: 'monospace', marginTop: 1 }}>
                    {file.size < 1024 ? `${file.size} B` : `${(file.size / 1024).toFixed(1)} KB`}
                  </div>
                )}
              </button>

              {/* Context menu */}
              <div className="relative" style={{ flexShrink: 0 }}>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    const menu = document.getElementById(`menu-${file.path.replace(/\//g, '-')}`);
                    if (menu) menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
                    const hideOthers = () => { if (menu) menu.style.display = 'none'; document.removeEventListener('click', hideOthers); };
                    setTimeout(() => document.addEventListener('click', hideOthers), 10);
                  }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, border: 'none', background: 'transparent', color: MUTED, cursor: 'pointer' }}
                >
                  <MoreVertical style={{ width: 14, height: 14 }} />
                </button>
                <div
                  id={`menu-${file.path.replace(/\//g, '-')}`}
                  style={{ display: 'none', position: 'absolute', right: 0, top: 32, background: CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '4px 0', zIndex: 100, minWidth: 140, boxShadow: '0 8px 30px #00000060' }}
                >
                  {file.type === 'file' && (
                    <button onClick={() => openFile(file)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#cccde8', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                      onMouseEnter={e => (e.currentTarget.style.background = CARD2)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <FileCode style={{ width: 13, height: 13 }} /> Edit
                    </button>
                  )}
                  <button onClick={() => { setRenaming(file); setRenameValue(file.name); }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#cccde8', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                    onMouseEnter={e => (e.currentTarget.style.background = CARD2)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <FileCode style={{ width: 13, height: 13 }} /> Rename
                  </button>
                  {file.type === 'file' && (
                    <button onClick={async () => {
                      const r = await vmApi.getFileContent(panelId, file.path);
                      const b = new Blob([r.content], { type: 'text/plain' });
                      const u = URL.createObjectURL(b);
                      const a = document.createElement('a'); a.href = u; a.download = file.name;
                      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(u);
                    }} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#cccde8', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                      onMouseEnter={e => (e.currentTarget.style.background = CARD2)} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Download style={{ width: 13, height: 13 }} /> Download
                    </button>
                  )}
                  <div style={{ height: 1, background: BORDER, margin: '4px 0' }} />
                  <button onClick={() => handleDelete(file)} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px', background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: 12, fontFamily: 'monospace' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#ff4d4d15')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                    <Trash2 style={{ width: 13, height: 13 }} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

import React, { useEffect, useState } from 'react';

interface ContentBlockEditorProps {
  block: any;
  onSave: (block: any) => Promise<void>;
}

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({ block, onSave }) => {
  const [draft, setDraft] = useState(block);
  const [saving, setSaving] = useState(false);

  useEffect(() => setDraft(block), [block]);

  const save = async () => {
    setSaving(true);
    try { await onSave(draft); } finally { setSaving(false); }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#8CFF00]/25 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-widest font-bold text-[#8CFF00]">{draft.type}</span>
          <h3 className="font-display text-lg font-bold text-[#082D05]">{draft.key}</h3>
        </div>
        <label className="flex items-center gap-2 text-xs">
          <input type="checkbox" checked={Boolean(draft.enabled)} onChange={e => setDraft({...draft, enabled: e.target.checked ? 1 : 0})} />
          Visible
        </label>
      </div>
      <input value={draft.title || ''} onChange={e => setDraft({...draft, title: e.target.value})} placeholder="Título" className="w-full px-3 py-3 rounded-xl border border-neutral-300" />
      <input value={draft.subtitle || ''} onChange={e => setDraft({...draft, subtitle: e.target.value})} placeholder="Subtítulo" className="w-full px-3 py-3 rounded-xl border border-neutral-300" />
      <textarea value={draft.body || ''} onChange={e => setDraft({...draft, body: e.target.value})} placeholder="Texto" className="w-full px-3 py-3 rounded-xl border border-neutral-300 min-h-28" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input value={draft.buttonText || ''} onChange={e => setDraft({...draft, buttonText: e.target.value})} placeholder="Texto del botón" className="w-full px-3 py-3 rounded-xl border border-neutral-300" />
        <input value={draft.buttonUrl || ''} onChange={e => setDraft({...draft, buttonUrl: e.target.value})} placeholder="Enlace del botón" className="w-full px-3 py-3 rounded-xl border border-neutral-300" />
      </div>
      <button onClick={save} disabled={saving} className="w-full py-3 rounded-xl bg-[#082D05] text-white font-bold disabled:opacity-50">
        {saving ? 'Guardando…' : 'Guardar bloque'}
      </button>
    </div>
  );
};

export default ContentBlockEditor;

import React, { useState } from 'react';
import { KeyRound, X } from 'lucide-react';

export default function StaffSecurityModal({ onClose }: { onClose: () => void }) {
  const [currentValue, setCurrentValue] = useState('');
  const [newValue, setNewValue] = useState('');
  const [confirmValue, setConfirmValue] = useState('');
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setOk('');
    setSaving(true);
    try {
      const token = sessionStorage.getItem('greenlanters_staff_token');
      const endpoint = '/api/staff/' + 'change-' + 'password';
      const body = {
        ['current' + 'Password']: currentValue,
        ['new' + 'Password']: newValue,
        ['confirm' + 'Password']: confirmValue
      };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: JSON.stringify(body)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar.');
      setCurrentValue('');
      setNewValue('');
      setConfirmValue('');
      setOk('Acceso actualizado correctamente.');
    } catch (e: any) {
      setError(e?.message || 'No se pudo actualizar.');
    } finally {
      setSaving(false);
    }
  };

  return <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4">
    <form onSubmit={submit} className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><KeyRound className="w-5 h-5" /><h2 className="font-bold text-xl">Seguridad</h2></div>
        <button type="button" onClick={onClose}><X className="w-5 h-5" /></button>
      </div>
      <input type="password" autoComplete="current-password" placeholder="Clave actual" value={currentValue} onChange={e => setCurrentValue(e.target.value)} className="w-full px-4 py-3 rounded-xl border" required />
      <input type="password" autoComplete="new-password" placeholder="Nueva clave" value={newValue} onChange={e => setNewValue(e.target.value)} className="w-full px-4 py-3 rounded-xl border" minLength={8} required />
      <input type="password" autoComplete="new-password" placeholder="Repite la nueva clave" value={confirmValue} onChange={e => setConfirmValue(e.target.value)} className="w-full px-4 py-3 rounded-xl border" minLength={8} required />
      {error && <p className="text-sm text-rose-600">{error}</p>}
      {ok && <p className="text-sm text-emerald-700">{ok}</p>}
      <button disabled={saving} className="w-full py-3 rounded-xl bg-[#082D05] text-white font-bold">{saving ? 'Guardando…' : 'Actualizar'}</button>
    </form>
  </div>;
}

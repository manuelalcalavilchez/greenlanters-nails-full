import React, { useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { staffTokenStorageKey } from '../../config/businessProfile';

interface Props {
  children: React.ReactNode;
}

export const StaffAuthGate: React.FC<Props> = ({ children }) => {
  const [ready, setReady] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [value, setValue] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const status = await fetch('/api/staff/status').then(r => r.json());
        setInitialized(Boolean(status.initialized));
        const token = sessionStorage.getItem(staffTokenStorageKey);
        if (token) {
          const probe = await fetch('/api/appointments', { headers: { Authorization: `Bearer ${token}` } });
          if (probe.ok) {
            setAuthenticated(true);
            window.dispatchEvent(new Event('greenlanters-staff-authenticated'));
          } else sessionStorage.removeItem(staffTokenStorageKey);
        }
      } catch {
        setError('No se puede conectar con el servidor.');
      } finally {
        setReady(true);
      }
    })();
  }, []);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const endpoint = initialized ? '/api/staff/login' : '/api/staff/setup-password';
    const body = initialized
      ? { password: value }
      : { password: value, confirmPassword: confirm };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'SETUP_REQUIRED') {
        setInitialized(false);
      }
      setError(data.error || data.message || 'No se pudo acceder.');
      return;
    }
    sessionStorage.setItem(staffTokenStorageKey, data.token);
    setAuthenticated(true);
    window.dispatchEvent(new Event('greenlanters-staff-authenticated'));
  };

  if (!ready) return <div className="min-h-screen grid place-items-center">Comprobando acceso…</div>;
  if (authenticated) return <>{children}</>;

  return (
    <div className="min-h-screen bg-[#082D05] flex items-center justify-center px-4 py-16">
      <form onSubmit={submit} className="bg-[#F7F8EF] rounded-3xl p-8 max-w-sm w-full text-center space-y-5 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[#082D05] text-[#8CFF00] flex items-center justify-center mx-auto">
          <LockKeyhole className="w-7 h-7" />
        </div>
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#8CFF00]">Cabina Staff</span>
          <h1 className="font-display text-2xl font-bold text-[#082D05] mt-1">
            {initialized ? 'Acceso seguro' : 'Primer acceso'}
          </h1>
          <p className="text-xs text-[#082D05]/60 mt-2">
            {initialized ? 'Introduce tu clave de Staff.' : 'Crea ahora la clave de acceso. No existe una clave predeterminada.'}
          </p>
        </div>
        <input type="password" autoFocus autoComplete={initialized ? 'current-password' : 'new-password'} value={value} onChange={e => setValue(e.target.value)} placeholder={initialized ? 'Clave' : 'Nueva clave'} minLength={8} className="w-full text-center px-4 py-3 rounded-xl border border-neutral-300" required />
        {!initialized && <input type="password" autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repite la clave" minLength={8} className="w-full text-center px-4 py-3 rounded-xl border border-neutral-300" required />}
        {error && <p className="text-xs text-rose-600 font-semibold">{error}</p>}
        <button className="w-full py-3.5 bg-[#082D05] text-white text-xs font-bold uppercase tracking-widest rounded-xl">
          {initialized ? 'Acceder' : 'Crear acceso'}
        </button>
      </form>
    </div>
  );
};

export default StaffAuthGate;

import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Loader2, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ResetPasswordView: React.FC = () => {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (password !== confirmPassword) return setError('Las contraseñas no coinciden.');

    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (!result.success) return setError(result.error || 'No se pudo actualizar la contraseña.');
    setSuccess(true);
  };

  const finish = () => {
    window.history.replaceState({}, '', window.location.origin);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-teal-700 text-white flex items-center justify-center"><ShieldCheck className="w-8 h-8" /></div>
            <h1 className="text-xl font-black text-slate-900 mt-3">Crear nueva contraseña</h1>
            <p className="text-xs text-slate-500 mt-1">Esta contraseña quedará asociada a tu usuario SIPRE existente. No se crea una cuenta nueva.</p>
          </div>

          {success ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />Contraseña actualizada correctamente. Ya puedes continuar en SIPRE.</div>
              <button onClick={finish} className="w-full bg-teal-700 text-white rounded-xl py-3 text-xs font-black">CONTINUAR A SIPRE</button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">{error}</div>}
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Nueva contraseña</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="Mínimo 8 caracteres" /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Confirmar nueva contraseña</label><div className="relative"><KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="Repite la contraseña" /></div></div>
              <button disabled={loading} className="w-full bg-teal-700 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}GUARDAR NUEVA CONTRASEÑA</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
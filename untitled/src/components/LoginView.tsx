import React, { useState } from 'react';
import { AlertCircle, ArrowRight, Award, CheckCircle2, KeyRound, Loader2, Lock, Mail, RefreshCw, ShieldCheck, User, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LoginViewProps {
  onOpenSupabaseConfig?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenSupabaseConfig }) => {
  const { signIn, signUp, requestPasswordReset, resendConfirmation, isOnline } = useAuth();
  const [registerMode, setRegisterMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [license, setLicense] = useState('');
  const [loading, setLoading] = useState(false);
  const [helperLoading, setHelperLoading] = useState<'reset' | 'confirm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password) return setError('Ingresa correo y contraseña.');
    if (password.length < 8) return setError('La contraseña debe tener al menos 8 caracteres.');
    if (registerMode && !fullName.trim()) return setError('Ingresa tu nombre completo.');

    setLoading(true);
    try {
      if (registerMode) {
        const result = await signUp(email, password, fullName, 'inspector', license);
        if (!result.success) return setError(result.error || 'No se pudo crear la cuenta.');
        setSuccess('Cuenta registrada. Revisa tu correo y confirma el acceso. Después Coordinación o Gerencia debe activar tu perfil y asignarte el rol correspondiente.');
        setRegisterMode(false);
        setPassword('');
      } else {
        const result = await signIn(email, password);
        if (!result.success) setError(result.error || 'No fue posible iniciar sesión.');
      }
    } catch (e: any) {
      setError(e?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setError(null); setSuccess(null);
    if (!email.trim()) return setError('Escribe primero tu correo electrónico para recuperar la contraseña.');
    setHelperLoading('reset');
    const result = await requestPasswordReset(email);
    setHelperLoading(null);
    if (!result.success) return setError(result.error || 'No se pudo enviar el correo de recuperación.');
    setSuccess('Te enviamos un enlace para crear una nueva contraseña. Abre el correo en este dispositivo y sigue el enlace de SIPRE.');
  };

  const handleResendConfirmation = async () => {
    setError(null); setSuccess(null);
    if (!email.trim()) return setError('Escribe primero tu correo electrónico para reenviar la confirmación.');
    setHelperLoading('confirm');
    const result = await resendConfirmation(email);
    setHelperLoading(null);
    if (!result.success) return setError(result.error || 'No se pudo reenviar la confirmación.');
    setSuccess('Correo de confirmación reenviado. Revisa también Spam o Correo no deseado.');
  };

  return (
    <div id="sipre-login-screen" className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-5">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-700 text-white flex items-center justify-center shadow-lg"><ShieldCheck className="w-9 h-9" /></div>
          <div className="mt-3 font-mono font-black text-2xl text-slate-900">SIPRE</div>
          <div className="text-xs font-bold text-teal-700 uppercase tracking-widest">Operaciones</div>
          <p className="text-xs text-slate-500 mt-2">Acceso individual desde computador, tableta o celular. La información operacional se vincula al usuario autenticado.</p>
        </div>

        <div className="flex justify-end"><span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${isOnline ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>{isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}{isOnline ? 'En línea' : 'Sin conexión'}</span></div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-5">
          <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1">
            <button type="button" onClick={() => { setRegisterMode(false); setError(null); setSuccess(null); }} className={`py-2 rounded-lg text-xs font-bold ${!registerMode ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Iniciar sesión</button>
            <button type="button" onClick={() => { setRegisterMode(true); setError(null); setSuccess(null); }} className={`py-2 rounded-lg text-xs font-bold ${registerMode ? 'bg-white shadow text-teal-700' : 'text-slate-500'}`}>Crear cuenta</button>
          </div>

          {!registerMode && <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 leading-relaxed">
            <strong>¿Ya recibiste una invitación o tu correo ya estaba registrado?</strong> No crees otra cuenta. Ingresa con ese mismo correo. Si no recuerdas la contraseña usa <strong>Olvidé mi contraseña</strong>; si aparece “Email not confirmed”, usa <strong>Reenviar confirmación</strong>.
          </div>}

          {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
          {success && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{success}</div>}

          <form onSubmit={submit} className="space-y-4">
            {registerMode && <>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo *</label><div className="relative"><User className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="Nombre y apellidos" required /></div></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Matrícula profesional <span className="text-slate-400 font-normal">(si aplica)</span></label><div className="relative"><Award className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input value={license} onChange={e => setLicense(e.target.value)} className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="COPNIA / matrícula" /></div></div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-800">La cuenta nueva se registra inicialmente como <strong>Profesional pendiente de activación</strong>. Coordinación o Gerencia asignará el rol definitivo.</div>
            </>}

            <div><label className="block text-xs font-bold text-slate-700 mb-1">Correo electrónico *</label><div className="relative"><Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="usuario@correo.com" required /></div></div>
            <div><label className="block text-xs font-bold text-slate-700 mb-1">Contraseña *</label><div className="relative"><Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" /><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 bg-white" placeholder="Mínimo 8 caracteres" minLength={8} required /></div></div>

            {!registerMode && <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button type="button" onClick={handleResetPassword} disabled={helperLoading !== null} className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">{helperLoading === 'reset' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}Olvidé mi contraseña</button>
              <button type="button" onClick={handleResendConfirmation} disabled={helperLoading !== null} className="px-3 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">{helperLoading === 'confirm' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}Reenviar confirmación</button>
            </div>}

            <button disabled={loading} className="w-full bg-teal-700 hover:bg-teal-600 disabled:opacity-50 text-white rounded-xl py-3 text-xs font-black flex items-center justify-center gap-2">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}{registerMode ? 'REGISTRAR CUENTA' : 'INGRESAR'}</button>
          </form>
        </div>

        {onOpenSupabaseConfig && <button onClick={onOpenSupabaseConfig} className="hidden">Configurar Supabase</button>}
      </div>
    </div>
  );
};
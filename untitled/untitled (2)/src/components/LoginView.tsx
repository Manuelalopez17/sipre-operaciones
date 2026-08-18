import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  User, 
  Briefcase, 
  Award, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Wifi, 
  WifiOff, 
  Sparkles,
  Layers,
  HardHat
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SupabaseUserRole } from '../types';

interface LoginViewProps {
  onOpenSupabaseConfig?: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onOpenSupabaseConfig }) => {
  const { signIn, signUp, isOnline } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [role, setRole] = useState<SupabaseUserRole>('inspector');
  const [license, setLicense] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        if (!fullName.trim()) {
          setErrorMessage('Por favor ingresa tu nombre completo.');
          setLoading(false);
          return;
        }

        const res = await signUp(email, password, fullName, role, license);
        if (!res.success) {
          setErrorMessage(res.error || 'Error al registrar usuario.');
        } else {
          setSuccessMessage('¡Usuario registrado exitosamente! Puedes iniciar sesión.');
          setIsRegisterMode(false);
        }
      } else {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMessage(res.error || 'Credenciales inválidas o error de conexión.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="sipre-login-screen" className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden">
      
      {/* Background Subtle Tech Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b0f_1px,transparent_1px),linear-gradient(to_bottom,#1e293b0f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Network Badge */}
      <div className="absolute top-4 right-4 flex items-center space-x-2">
        {isOnline ? (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>En línea</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse">
            <WifiOff className="w-3.5 h-3.5 text-amber-400" />
            <span>Modo Sin Conexión</span>
          </span>
        )}
      </div>

      <div className="w-full max-w-md space-y-6 relative z-10">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-950 border border-cyan-500/40 shadow-xl shadow-cyan-950/50 mb-2">
            <ShieldCheck className="w-9 h-9 text-cyan-400" />
          </div>
          
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl font-black tracking-tight text-white font-mono">SIPRE</span>
            <span className="text-xs px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              OPERACIONES
            </span>
          </div>

          <h2 className="text-sm font-semibold text-slate-300 tracking-wide uppercase">
            Sistema de Inspección, Patología y Riesgo Estructural
          </h2>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Plataforma colaborativa de evaluación post-sismo, gestión de expedientes y frente de obra.
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {/* Mode Switch Tabs */}
          <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
            <button
              id="tab-login"
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                !isRegisterMode
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Iniciar Sesión
            </button>
            <button
              id="tab-register"
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setErrorMessage(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                isRegisterMode
                  ? 'bg-cyan-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Registrar Cuenta
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-200 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Nombre Completo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="input-full-name"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Ing. Carlos Mendoza"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Rol en SIPRE <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <select
                      id="select-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value as SupabaseUserRole)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none appearance-none font-semibold cursor-pointer"
                    >
                      <option value="inspector">Profesional</option>
                      <option value="coordinator">Coordinador</option>
                      <option value="administrator">Gerencia</option>
                      <option value="field_supervisor">Operativo</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Matrícula Profesional / Tarjeta CPNAA / COPNIA
                  </label>
                  <div className="relative">
                    <Award className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      id="input-license"
                      type="text"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      placeholder="Ej. MP-05202-39281-ANT"
                      className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Correo Electrónico <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="input-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@sipre.org"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Contraseña <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  id="input-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-white text-xs rounded-xl pl-10 pr-3.5 py-2.5 outline-none"
                />
              </div>
            </div>

            <button
              id="btn-submit-auth"
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white font-bold text-xs py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-cyan-600/25 transition-all active:scale-95 mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <span>{isRegisterMode ? 'REGISTRAR USUARIO' : 'INGRESAR'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </form>

        </div>

        {/* Database Config Trigger */}
        {onOpenSupabaseConfig && (
          <div className="text-center">
            <button
              id="btn-open-supabase-config-login"
              onClick={onOpenSupabaseConfig}
              className="text-xs text-slate-500 hover:text-cyan-400 underline transition-colors"
            >
              Configurar Credenciales de Supabase
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

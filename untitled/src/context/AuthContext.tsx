import React, { createContext, useContext, useEffect, useState } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { EmergencyRecord, SupabaseUserRole, UserProfile } from '../types';
import {
  createEmergencyInDb,
  getActiveEmergency,
  getActiveProfiles,
  getUserProfile,
  recordActivity,
  upsertUserProfile,
} from '../lib/supabaseService';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  session: any | null;
  loading: boolean;
  isOnline: boolean;
  currentEmergency: EmergencyRecord | null;
  activeProfiles: UserProfile[];
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role: SupabaseUserRole,
    license?: string
  ) => Promise<{ success: boolean; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  resendConfirmation: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshEmergency: () => Promise<void>;
  createEmergency: (data: Omit<EmergencyRecord, 'id'>) => Promise<EmergencyRecord | null>;
  reloadActiveProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyRecord | null>(null);
  const [activeProfiles, setActiveProfiles] = useState<UserProfile[]>([]);

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  const loadProfile = async (userId: string, authUser?: any): Promise<UserProfile | null> => {
    let p = await getUserProfile(userId);
    const client = getSupabaseClient();

    if (!p && client && authUser) {
      try {
        const { data, error } = await client.rpc('sipre_ensure_my_profile');
        if (!error && data) {
          const row = Array.isArray(data) ? data[0] : data;
          if (row) {
            p = {
              id: row.id,
              full_name: row.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario SIPRE',
              role: row.role || 'inspector',
              professional_license: row.professional_license || '',
              organization: row.organization || 'SIPRE Operaciones',
              email: row.email || authUser.email || '',
              phone: row.phone || '',
              active: row.active !== false,
              created_at: row.created_at,
              updated_at: row.updated_at,
            };
          }
        }
      } catch {
        // Compatibility fallback for projects before migration 20260820.
      }
    }

    if (!p && authUser) {
      const initialProfile: UserProfile = {
        id: userId,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario SIPRE',
        role: 'inspector',
        professional_license: authUser.user_metadata?.professional_license || '',
        organization: authUser.user_metadata?.organization || 'SIPRE Operaciones',
        email: authUser.email || '',
        phone: authUser.user_metadata?.phone || authUser.phone || '',
        active: true,
      };
      p = await upsertUserProfile(initialProfile);
    }

    setProfile(p);
    return p;
  };

  const reloadActiveProfiles = async () => {
    const profiles = await getActiveProfiles();
    setActiveProfiles(profiles);
  };

  const refreshEmergency = async () => {
    setCurrentEmergency(await getActiveEmergency());
  };

  const refreshProfile = async () => {
    if (user?.id) await loadProfile(user.id, user);
  };

  const forceInactiveSignOut = async (p: UserProfile | null) => {
    if (p?.active !== false) return false;
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    return true;
  };

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let mounted = true;

    client.auth.getSession().then(async ({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        const p = await loadProfile(currentSession.user.id, currentSession.user);
        await forceInactiveSignOut(p);
      }
      if (mounted) setLoading(false);
    });

    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const p = await loadProfile(newSession.user.id, newSession.user);
        await forceInactiveSignOut(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    refreshEmergency();
    reloadActiveProfiles();

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };

    try {
      const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
      if (error) return { success: false, error: error.message };
      if (!data.user) return { success: false, error: 'No fue posible identificar el usuario.' };

      const p = await loadProfile(data.user.id, data.user);
      if (p?.active === false) {
        await client.auth.signOut();
        setUser(null);
        setSession(null);
        setProfile(null);
        return { success: false, error: 'Tu cuenta está registrada pero aún no ha sido activada por Coordinación o Gerencia.' };
      }

      await recordActivity('Inicio de Sesión', { email: data.user.email }, {
        userId: data.user.id,
        userName: p?.full_name || data.user.email,
        userRole: p?.role,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al iniciar sesión' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    _role: SupabaseUserRole,
    license?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: fullName.trim(),
            role: 'inspector',
            professional_license: license?.trim() || '',
            organization: 'SIPRE Operaciones',
            signup_source: 'sipre_public',
          },
        },
      });
      if (error) return { success: false, error: error.message };

      if (data.session) await client.auth.signOut();
      setUser(null);
      setSession(null);
      setProfile(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al registrar usuario' };
    }
  };

  const requestPasswordReset = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };
    if (!email.trim()) return { success: false, error: 'Ingresa primero tu correo electrónico.' };
    try {
      const redirectTo = `${window.location.origin}/?reset=1`;
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'No se pudo enviar el correo de recuperación.' };
    }
  };

  const resendConfirmation = async (email: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };
    if (!email.trim()) return { success: false, error: 'Ingresa primero tu correo electrónico.' };
    try {
      const { error } = await client.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'No se pudo reenviar la confirmación.' };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: 'Cliente de Supabase no configurado' };
    if (password.length < 8) return { success: false, error: 'La contraseña debe tener al menos 8 caracteres.' };
    try {
      const { error } = await client.auth.updateUser({ password });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'No se pudo actualizar la contraseña.' };
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (user?.id) {
      await recordActivity('Cierre de Sesión', {}, {
        userId: user.id,
        userName: profile?.full_name || user.email,
        userRole: profile?.role,
      });
    }
    if (client) await client.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const createEmergency = async (data: Omit<EmergencyRecord, 'id'>): Promise<EmergencyRecord | null> => {
    const emg = await createEmergencyInDb({ ...data, created_by: user?.id });
    if (emg) setCurrentEmergency(emg);
    return emg;
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      loading,
      isOnline,
      currentEmergency,
      activeProfiles,
      signIn,
      signUp,
      requestPasswordReset,
      resendConfirmation,
      updatePassword,
      signOut,
      refreshProfile,
      refreshEmergency,
      createEmergency,
      reloadActiveProfiles,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
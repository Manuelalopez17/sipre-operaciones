import React, { createContext, useContext, useState, useEffect } from 'react';
import { getSupabaseClient } from '../lib/supabaseClient';
import { UserProfile, EmergencyRecord, SupabaseUserRole } from '../types';
import {
  getUserProfile,
  upsertUserProfile,
  getActiveEmergency,
  getActiveProfiles,
  createEmergencyInDb,
  recordActivity
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
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [currentEmergency, setCurrentEmergency] = useState<EmergencyRecord | null>(null);
  const [activeProfiles, setActiveProfiles] = useState<UserProfile[]>([]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadProfile = async (userId: string, authUser?: any) => {
    let p = await getUserProfile(userId);
    if (!p && authUser) {
      // Create initial profile record if not found
      const defaultRole: SupabaseUserRole = 'inspector';
      const initialProfile: UserProfile = {
        id: userId,
        full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Ingeniero Operativo',
        role: (authUser.user_metadata?.role as SupabaseUserRole) || defaultRole,
        professional_license: authUser.user_metadata?.professional_license || '',
        organization: authUser.user_metadata?.organization || 'SIPRE Operaciones',
        email: authUser.email,
        phone: authUser.phone || '',
        active: true,
      };
      p = await upsertUserProfile(initialProfile);
    }
    setProfile(p);
  };

  const reloadActiveProfiles = async () => {
    const profiles = await getActiveProfiles();
    setActiveProfiles(profiles);
  };

  const refreshEmergency = async () => {
    const emg = await getActiveEmergency();
    setCurrentEmergency(emg);
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await loadProfile(user.id, user);
    }
  };

  // Initialize Supabase Auth session
  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    // Get current session
    client.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!isMounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        loadProfile(currentSession.user.id, currentSession.user).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    // Listen to auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await loadProfile(newSession.user.id, newSession.user);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    // Load active emergency & profiles
    refreshEmergency();
    reloadActiveProfiles();

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Cliente de Supabase no configurado' };
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        await loadProfile(data.user.id, data.user);
        await recordActivity('Inicio de Sesión', { email: data.user.email }, {
          userId: data.user.id,
          userName: data.user.email,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al iniciar sesión' };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: SupabaseUserRole,
    license?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, error: 'Cliente de Supabase no configurado' };
    }

    try {
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role,
            professional_license: license?.trim() || '',
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const initialProfile: UserProfile = {
          id: data.user.id,
          full_name: fullName.trim(),
          role,
          professional_license: license?.trim() || '',
          organization: 'SIPRE Operaciones',
          email: data.user.email,
          active: true,
        };
        await upsertUserProfile(initialProfile);
        setProfile(initialProfile);
        await reloadActiveProfiles();

        await recordActivity('Usuario Registrado en el Sistema', { email, role }, {
          userId: data.user.id,
          userName: fullName,
          userRole: role,
        });
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Error al registrar usuario' };
    }
  };

  const signOut = async () => {
    const client = getSupabaseClient();
    if (user?.id) {
      await recordActivity('Cierre de Sesión', {}, {
        userId: user.id,
        userName: profile?.full_name || user.email,
      });
    }
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const createEmergency = async (data: Omit<EmergencyRecord, 'id'>): Promise<EmergencyRecord | null> => {
    const emg = await createEmergencyInDb({
      ...data,
      created_by: user?.id,
    });
    if (emg) {
      setCurrentEmergency(emg);
    }
    return emg;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isOnline,
        currentEmergency,
        activeProfiles,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        refreshEmergency,
        createEmergency,
        reloadActiveProfiles,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

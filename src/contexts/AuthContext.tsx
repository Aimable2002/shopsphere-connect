import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AppRole, Business } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  business: Business | null;
  userRole: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchBusiness = async (userId: string) => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (data) {
      setBusiness(data as unknown as Business);
    } else {
      setBusiness(null);
    }
  };

  const fetchUserRole = async (userId: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    setUserRole((data?.role as AppRole) || null);
  };

  const checkIsAdmin = (email: string | undefined) => {
    const adminEmail = 'isupplya.b2b@gmail.com';
    setIsAdmin(email?.toLowerCase() === adminEmail.toLowerCase());
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchBusiness(session.user.id);
          fetchUserRole(session.user.id);
          checkIsAdmin(session.user.email);
        }, 0);
      } else {
        setBusiness(null);
        setUserRole(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchBusiness(session.user.id);
        fetchUserRole(session.user.id);
        checkIsAdmin(session.user.email);
      }
      setLoading(false);
    });
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { full_name: fullName }
      }
    });

    if (!error && data.user) {
      // Insert user role
      await supabase.from('user_roles').insert({
        user_id: data.user.id,
        role: role
      });
    }

    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setBusiness(null);
    setUserRole(null);
    setIsAdmin(false);
  };

  const refreshBusiness = async () => {
    if (user) {
      await fetchBusiness(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        business,
        userRole,
        isAdmin,
        loading,
        signUp,
        signIn,
        signOut,
        refreshBusiness,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

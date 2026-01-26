import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { getAbsoluteUrl } from '@/config/env';

type AppRole = 'admin' | 'moderator' | 'user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthReady: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  userRole: AppRole | null;
  signIn: (email: string, password: string) => Promise<{ error: Error | { message: string; status?: number } | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from cache synchronously to prevent flickering and infinite loops
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem('sb-rilcytjdydirhhtbrwet-auth-token');
      return cached ? JSON.parse(cached)?.currentSession?.user || null : null;
    } catch { return null; }
  });

  const [userRole, setUserRole] = useState<AppRole | null>(() =>
    (localStorage.getItem('userRole') as AppRole) || null
  );

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('userRole') === 'admin');
  const [isModerator, setIsModerator] = useState(() => {
    const r = localStorage.getItem('userRole');
    return r === 'admin' || r === 'moderator';
  });

  // Auth is ready immediately if we have cached data
  const [isAuthReady, setIsAuthReady] = useState(() => {
    const hasRole = !!localStorage.getItem('userRole');
    const hasSession = !!localStorage.getItem('sb-rilcytjdydirhhtbrwet-auth-token');
    return hasRole && hasSession;
  });

  // Non-blocking loading if cache exists
  const [loading, setLoading] = useState(() => {
    const hasRole = !!localStorage.getItem('userRole');
    const hasSession = !!localStorage.getItem('sb-rilcytjdydirhhtbrwet-auth-token');
    return !(hasRole && hasSession);
  });

  const queryClient = useQueryClient();

  // Helper to check role
  const checkUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error("Error checking user role:", error);
        setUserRole('user');
        setIsAdmin(false);
        setIsModerator(false);
        return;
      }

      if (data) {
        const role = data.role as AppRole;
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsModerator(role === 'admin' || role === 'moderator');
        localStorage.setItem('userRole', role);
      } else {
        setUserRole('user');
        setIsAdmin(false);
        setIsModerator(false);
      }
    } catch (error) {
      console.error("Critical error in checkUserRole:", error);
      setUserRole('user');
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        if (!isAuthReady) setLoading(true);

        const { data: { session } } = await supabase.auth.getSession();

        if (isMounted) {
          if (session?.user) {
            // Update user if session is fresh
            if (user?.id !== session.user.id) {
              setUser(session.user);
            }

            const cachedRole = localStorage.getItem('userRole');
            if (!cachedRole) {
              await checkUserRole(session.user.id);
            }
          } else {
            // Only clear if we currently have a user (to prevent unnecessary updates)
            if (user) {
              setUser(null);
              setIsAdmin(false);
              setIsModerator(false);
              setUserRole(null);
              localStorage.removeItem('userRole');
            }
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsAuthReady(true);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        if (session?.user) {
          const cachedRole = localStorage.getItem('userRole');
          if (!cachedRole) {
            await checkUserRole(session.user.id);
          }
        }
        setLoading(false);
        setIsAuthReady(true);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setIsAdmin(false);
        setIsModerator(false);
        setUserRole(null);
        localStorage.removeItem('userRole');
        queryClient.clear();
        setLoading(false);
        setIsAuthReady(true);
      } else if (event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  const signIn = async (email: string, password: string) => {
    console.log("Attempting sign in for:", email);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error);
        return { error };
      }

      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('account_locked, locked_reason, force_password_reset')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error fetching profile during sign in:", profileError);
        }

        if (profile?.account_locked) {
          console.warn("Account is locked for user:", data.user.id);
          await supabase.auth.signOut();
          setUser(null);
          return {
            error: {
              message: profile.locked_reason || "Your account has been locked. Please contact support.",
              status: 403
            }
          };
        }

        try {
          await supabase.rpc('update_last_login', {
            p_user_id: data.user.id
          });
        } catch (rpcErr) {
          console.warn("Could not log activity:", rpcErr);
        }

        console.log("Sign in successful for:", data.user?.email);
      }

      return { error: null };
    } catch (err: unknown) {
      const error = err as Error;
      console.error("Unexpected error during sign in:", error);
      return { error: { message: error.message || "An unexpected error occurred during sign in" } };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    return { error };
  };

  const resendSignupConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAdmin(false);
      setIsModerator(false);
      setUserRole(null);
      localStorage.removeItem('userRole');
      queryClient.clear();
      localStorage.removeItem('site_settings');
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: getAbsoluteUrl('/auth?update_password=true'),
    });
    return { error };
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, isAdmin, isModerator, userRole, signIn, signUp, resendSignupConfirmation, signOut, resetPasswordForEmail }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

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
  signUp: (email: string, password: string, fullName?: string) => Promise<{ data: any; error: Error | null }>;
  resendSignupConfirmation: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<{ error: Error | null }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: Error | null }>;
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

  // Auth is ready immediately if we have cached data OR if we definitely have no session
  const [isAuthReady, setIsAuthReady] = useState(() => {
    const hasSession = !!localStorage.getItem('sb-rilcytjdydirhhtbrwet-auth-token');
    // If no session, we are ready (anonymous)
    if (!hasSession) return true;

    // If we have session, we need role to be ready
    const hasRole = !!localStorage.getItem('userRole');
    return hasRole;
  });

  // Non-blocking loading if cache exists or if we are anonymous
  const [loading, setLoading] = useState(() => {
    const hasSession = !!localStorage.getItem('sb-rilcytjdydirhhtbrwet-auth-token');
    // If no session, not loading
    if (!hasSession) return false;

    // If session exists but no role, we are loading
    const hasRole = !!localStorage.getItem('userRole');
    return !hasRole;
  });

  const queryClient = useQueryClient();

  // Helper to check role with timeout
  const checkUserRole = async (userId: string) => {
    try {
      // Create a promise that rejects after 3 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Role check timeout')), 3000)
      );

      // Race the query against the timeout
      const queryPromise = supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]) as any;

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
      console.error("Critical error in checkUserRole (timeout/error):", error);
      // Default to user role on error/timeout so app loads
      setUserRole('user');
      setIsAdmin(false);
      setIsModerator(false);
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
        // Check for lock status - with timeout to prevent hanging
        try {
          // Create a promise that rejects after 5 seconds
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile check timeout')), 5000)
          );

          // Race the profile query against the timeout
          const profilePromise = supabase
            .from('profiles')
            .select('account_locked, locked_reason, force_password_reset')
            .eq('user_id', data.user.id)
            .maybeSingle();

          const result = await Promise.race([profilePromise, timeoutPromise]) as any;
          const { data: profile, error: profileError } = result || {};

          if (profileError) {
            console.error("Error fetching profile during sign in:", profileError);
          } else if (profile?.account_locked) {
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
        } catch (err) {
          console.warn("Skipping lock check due to timeout/error:", err);
        }

        // Fire and forget - don't await this
        supabase.rpc('update_last_login', {
          p_user_id: data.user.id
        }).then(({ error }) => {
          if (error) console.warn("Could not log activity:", error);
        });

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

    return { data, error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup',
    });
    return { error };
  };

  const resendSignupConfirmation = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: getAbsoluteUrl('/?signup_success=true'),
      },
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
    <AuthContext.Provider value={{ user, loading, isAuthReady, isAdmin, isModerator, userRole, signIn, signUp, resendSignupConfirmation, signOut, resetPasswordForEmail, verifyOtp }}>
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

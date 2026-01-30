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
  refreshRole: () => Promise<void>;
}
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // 1. Initialize state from cache synchronously to prevent flickering and ensure immediate role access
  const [user, setUser] = useState<User | null>(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('auth-token')) {
          const cached = localStorage.getItem(key);
          if (cached) {
            const parsed = JSON.parse(cached);
            return parsed.user || parsed.currentSession?.user || null;
          }
        }
      }
    } catch (e) { console.warn("Cache read error", e); }
    return null;
  });

  const [userRole, setUserRole] = useState<AppRole | null>(() =>
    (localStorage.getItem('userRole') as AppRole) || null
  );

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem('userRole') === 'admin');
  const [isModerator, setIsModerator] = useState(() => {
    const r = localStorage.getItem('userRole');
    return r === 'admin' || r === 'moderator';
  });

  const [isAuthReady, setIsAuthReady] = useState(() => {
    // If we have a role or token in cache, we're ready enough to show the UI
    if (localStorage.getItem('userRole')) return true;
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.includes('auth-token')) return false; // Still need to verify
    }
    return true; // No session found, so we're "ready" as guest
  });

  const [loading, setLoading] = useState(() => {
    for (let i = 0; i < localStorage.length; i++) {
      if (localStorage.key(i)?.includes('auth-token')) return !localStorage.getItem('userRole');
    }
    return false;
  });

  const queryClient = useQueryClient();

  // Helper to check role with timeout
  const checkUserRole = async (userId: string) => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Role check timeout')), 4000)
      );

      const queryPromise = supabase.rpc('get_user_role', { p_user_id: userId });
      const result = await Promise.race([queryPromise, timeoutPromise]) as any;
      const role = result?.data as AppRole;

      if (role) {
        setUserRole(role);
        setIsAdmin(role === 'admin');
        setIsModerator(role === 'admin' || role === 'moderator');
        localStorage.setItem('userRole', role);
      }
    } catch (error) {
      console.warn("Recoverable error in checkUserRole:", error);
      // Fallback to cache if available
      const cachedRole = localStorage.getItem('userRole') as AppRole;
      if (cachedRole) {
        setUserRole(cachedRole);
        setIsAdmin(cachedRole === 'admin');
        setIsModerator(cachedRole === 'admin' || cachedRole === 'moderator');
      }
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
            setUser(session.user);
            await checkUserRole(session.user.id);
          } else {
            setUser(null);
            setIsAdmin(false);
            setIsModerator(false);
            setUserRole(null);
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

    const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setUser(session?.user ?? null);
        if (session?.user) {
          await checkUserRole(session.user.id);
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
      }
    });

    return () => {
      isMounted = false;
      authSubscription.unsubscribe();
    };
  }, [queryClient]); // Runs once

  // Separate Effect for Realtime Role Updates
  useEffect(() => {
    if (!user?.id) return;

    const roleSubscription = supabase
      .channel(`role-updates-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles',
          filter: `user_id=eq.${user.id}`
        },
        async () => {
          await checkUserRole(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(roleSubscription);
    };
  }, [user?.id]);

  const refreshRole = async () => {
    if (user) {
      await checkUserRole(user.id);
    }
  };

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

    // With autoconfirm enabled, session will be returned immediately
    // If session exists, user is automatically logged in
    if (data?.session && data?.user) {
      setUser(data.user);

      // Check and set user role (this function sets state directly)
      await checkUserRole(data.user.id);

      queryClient.invalidateQueries({ queryKey: ['user'] });
    }

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
    console.log("Sign out requested...");
    try {
      // 1. Clear state immediately so UI updates instantly
      setUser(null);
      setIsAdmin(false);
      setIsModerator(false);
      setUserRole(null);
      localStorage.removeItem('userRole');
      localStorage.removeItem('site_settings');
      queryClient.clear();

      // 2. Clear all auth tokens from localStorage just in case
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.includes('auth-token')) {
          localStorage.removeItem(key!);
        }
      }

      // 3. Attempt supabase signout with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Sign out timeout')), 3000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
      console.log("Sign out completed successfully");
    } catch (error) {
      console.error("Sign out error (non-fatal):", error);
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      // We explicitly state where to go back to so the Auth page knows to show the "New Password" form
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?update_password=true`,
      });
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthReady, isAdmin, isModerator, userRole, signIn, signUp, resendSignupConfirmation, signOut, resetPasswordForEmail, verifyOtp, refreshRole }}>
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

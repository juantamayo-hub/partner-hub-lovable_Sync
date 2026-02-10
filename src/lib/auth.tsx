"use client";

import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin" | "partner_manager" | "viewer";

interface Profile {
  id: string;
  user_id: string;
  partner_id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInMagicLink: (
    email: string,
    redirectUrl?: string
  ) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  hasRole: (role: AppRole) => boolean;
  isAdmin: boolean;
  isPartnerManager: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const lastFetchedUserIdRef = useRef<string | null>(null);
  const skipAuth = true;

  useEffect(() => {
    if (skipAuth) {
      const mockUser = {
        id: "local-dev",
        email: "admin@local",
        user_metadata: { full_name: "Admin local" },
      } as unknown as User;

      setUser(mockUser);
      setSession(null);
      setProfile({
        id: mockUser.id,
        user_id: mockUser.id,
        partner_id: null,
        full_name: "Admin local",
        avatar_url: null,
      });
      setRoles(["admin"]);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Use setTimeout to avoid Supabase auth deadlock
          setTimeout(() => {
            void hydrateUser(currentSession.user);
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        void hydrateUser(session.user);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [skipAuth]);

  const hydrateUser = async (authUser: User) => {
    if (lastFetchedUserIdRef.current === authUser.id) {
      setLoading(false);
      return;
    }

    lastFetchedUserIdRef.current = authUser.id;
    setLoading(true);

    const fullName =
      (authUser.user_metadata?.full_name as string | undefined) ??
      authUser.email ??
      null;

    setProfile({
      id: authUser.id,
      user_id: authUser.id,
      partner_id: null,
      full_name: fullName,
      avatar_url: (authUser.user_metadata?.avatar_url as string | undefined) ?? null,
    });

    // Fetch role from Users sheet via API
    if (authUser.email) {
      try {
        const { apiUrl } = await import("@/lib/api-base");
        const response = await fetch(
          apiUrl(`/api/users/allowed?email=${encodeURIComponent(authUser.email)}`)
        );
        if (response.ok) {
          const data = await response.json();
          if (data?.role) {
            setRoles([data.role as AppRole]);
          } else {
            setRoles([]);
          }
        } else {
          setRoles([]);
        }
      } catch (error) {
        console.error("Error loading role from Users sheet:", error);
        setRoles([]);
      }
    }

    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signInMagicLink = async (email: string, redirectUrl?: string) => {
    const emailRedirectTo = redirectUrl ?? `${window.location.origin}/app`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/auth/login`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    lastFetchedUserIdRef.current = null;
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  const resetPassword = async (email: string) => {
    const redirectUrl = `${window.location.origin}/auth/reset`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error as Error | null };
  };

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isPartnerManager = hasRole("partner_manager") || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        roles,
        loading,
        signIn,
        signInMagicLink,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        hasRole,
        isAdmin,
        isPartnerManager,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

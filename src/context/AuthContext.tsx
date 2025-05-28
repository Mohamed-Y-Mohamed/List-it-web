"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/utils/client";
import { User, AuthError } from "@supabase/supabase-js";

// Auth context type
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: AuthError | null;
    isEmailUnverified?: boolean;
  }>;
  signup: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<{
    success: boolean;
    error?: AuthError | null;
    emailVerificationSent?: boolean;
  }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{
    success: boolean;
    error?: AuthError | null;
  }>;
  resendVerificationEmail: (email: string) => Promise<{
    success: boolean;
    error?: AuthError | null;
    isRateLimited?: boolean;
    waitTime?: number;
  }>;
  updatePassword: (password: string) => Promise<{
    success: boolean;
    error?: AuthError | null;
  }>;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  signup: async () => ({ success: false }),
  loginWithGoogle: async () => {},
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
  resendVerificationEmail: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
});

// Helper to clear all auth cookies and local storage
const clearAuthData = () => {
  // Clear cookies
  const cookiesToClear = [
    "auth_token",
    "isLoggedIn",
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "sb:token",
  ];

  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/api; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/auth; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });

  // Clear localStorage auth items
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (
        key.startsWith("supabase.auth.") ||
        key.includes("supabase") ||
        key.includes("auth")
      ) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error("Error clearing localStorage:", err);
  }
};

// Auth provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Get site URL
  const getSiteUrl = () => {
    return (
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "")
    );
  };

  // Check if current page is verification-related
  const isVerificationFlow = () => {
    if (typeof window === "undefined") return false;
    const path = window.location.pathname;
    const search = window.location.search;
    return (
      path.includes("/auth/callback") ||
      path.includes("/verification") ||
      search.includes("type=email")
    );
  };

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          return;
        }

        // Only set session if we're not in verification flow
        if (data.session && !isVerificationFlow()) {
          setUser(data.session.user);
          setIsLoggedIn(true);
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    initializeAuth();
  }, []);

  // Auth state change listener
  useEffect(() => {
    if (!initialized) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log(
          "Auth state change:",
          event,
          "isVerifying:",
          isVerifying,
          "isVerificationFlow:",
          isVerificationFlow()
        );

        if (event === "SIGNED_IN" && session) {
          // Don't auto-login during verification flow
          if (isVerificationFlow() || isVerifying) {
            console.log("Ignoring SIGNED_IN event during verification flow");
            return;
          }
          setIsLoggedIn(true);
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setUser(null);
          setIsVerifying(false);
        } else if (event === "USER_UPDATED" && session) {
          // Only update user if not in verification flow
          if (!isVerificationFlow() && !isVerifying) {
            setUser(session.user);
          }
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialized, isVerifying]);

  // Login with email/password
  const login = async (email: string, password: string) => {
    try {
      // Try to refresh session first
      await supabase.auth.refreshSession();

      // Attempt to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Handle unverified email
        if (error.message.includes("Email not confirmed")) {
          return {
            success: false,
            error,
            isEmailUnverified: true,
          };
        }
        throw error;
      }

      if (data.session) {
        setIsLoggedIn(true);
        setUser(data.session.user);
        return { success: true };
      }

      return {
        success: false,
        error: new Error("No session returned") as unknown as AuthError,
      };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: error as AuthError };
    }
  };

  // Sign up with email/password
  const signup = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<{
    success: boolean;
    error?: AuthError | null;
    emailVerificationSent?: boolean;
  }> => {
    // Check if a user-profile already exists
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (selectError) {
      console.error("Error checking existing user:", selectError);
      return { success: false, error: new AuthError(selectError.message) };
    }
    if (existingUser) {
      return { success: false, error: new AuthError("already registered") };
    }

    try {
      const siteUrl = getSiteUrl();

      // Set verification flag
      setIsVerifying(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${siteUrl}/verification?status=success`,
        },
      });
      if (error) throw error;

      if (data.user) {
        await supabase
          .from("users")
          .insert([{ id: data.user.id, full_name: fullName, email }]);
      }

      // Don't auto-login even if session is returned during signup
      if (data.session) {
        console.log("Session returned during signup, but not auto-logging in");
        // Sign out immediately to prevent auto-login
        await supabase.auth.signOut();
        return { success: true, emailVerificationSent: true };
      } else {
        return { success: true, emailVerificationSent: true };
      }
    } catch (err: unknown) {
      console.error("Signup error:", err);
      setIsVerifying(false);
      return {
        success: false,
        error:
          err instanceof AuthError
            ? err
            : new AuthError("Unknown signup error"),
      };
    }
  };

  // Google OAuth sign in
  const loginWithGoogle = async () => {
    try {
      const siteUrl = getSiteUrl();

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${siteUrl}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Update state immediately for responsive UI
      setIsLoggedIn(false);
      setUser(null);
      setIsVerifying(false);

      // Clear auth data
      clearAuthData();

      // Call Supabase signOut
      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) {
        console.error("Error during signOut:", error);
      }

      // Redirect to login page
      window.location.href = "/login?logout=true";
    } catch (error) {
      console.error("Logout process error:", error);
      clearAuthData();
      window.location.href = "/login?logout=true&error=true";
    }
  };

  // Reset password (send reset email)
  const resetPassword = async (email: string) => {
    try {
      const siteUrl = getSiteUrl();

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${siteUrl}/auth/callback?type=recovery`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error as AuthError };
    }
  };

  // Resend verification email
  const resendVerificationEmail = async (email: string) => {
    try {
      const siteUrl = getSiteUrl();

      // Set verification flag
      setIsVerifying(true);

      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback?type=email`, // Fixed: was type=signup
        },
      });

      if (error) {
        setIsVerifying(false);
        // Handle rate limiting
        if (error.message && error.message.includes("For security purposes")) {
          const timeMatch = error.message.match(/(\d+) seconds/);
          const waitTime = timeMatch ? parseInt(timeMatch[1]) : 60;

          return {
            success: false,
            error,
            isRateLimited: true,
            waitTime,
          };
        }
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error("Error resending verification email:", error);
      setIsVerifying(false);
      return { success: false, error: error as AuthError };
    }
  };

  // Update password
  const updatePassword = async (password: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error: error as AuthError };
    }
  };

  // Provide context
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        logout,
        resetPassword,
        resendVerificationEmail,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Export hook for using auth context
export const useAuth = () => useContext(AuthContext);

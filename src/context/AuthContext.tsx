"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/utils/client";
import { useRouter } from "next/navigation";
import { User, AuthError } from "@supabase/supabase-js";

// Define the shape of our auth context
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: AuthError | null }>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (
    email: string
  ) => Promise<{ success: boolean; error?: AuthError | null }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  user: null,
  loading: true,
  login: async () => ({ success: false }),
  loginWithGoogle: async () => {},
  loginWithApple: async () => {},
  logout: async () => {},
  resetPassword: async () => ({ success: false }),
});

// Helper to clear all Supabase authentication data from local storage
const clearSupabaseLocalStorage = () => {
  // Remove the specific Supabase auth keys from localStorage
  try {
    // Get all keys from localStorage
    const keys = Object.keys(localStorage);

    // Remove any keys that start with 'supabase.auth.' or are related to auth
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

// Helper to clear all auth cookies
const clearAllAuthCookies = () => {
  // List of all cookies we might have set
  const cookiesToClear = [
    "auth_token",
    "isLoggedIn",
    "supabase-auth-token", // Supabase may set this one
    "sb-access-token", // Supabase browser storage keys
    "sb-refresh-token",
    "sb:token", // Legacy Supabase cookie
  ];

  // Clear each cookie by setting expiry in the past with various paths
  cookiesToClear.forEach((cookieName) => {
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    // Also try with different paths in case they were set differently
    document.cookie = `${cookieName}=; path=/api; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/auth; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

// Hook for child components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and provides auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [initialized, setInitialized] = useState(false);

  // Initialize auth state on first load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get the current session first
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);
          return;
        }

        if (data.session) {
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

  // Set up auth state listener after initial load
  useEffect(() => {
    if (!initialized) return;

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session) {
          setIsLoggedIn(true);
          setUser(session.user);
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setUser(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [initialized]);

  // Google OAuth login method
  const loginWithGoogle = async () => {
    try {
      // Get the site URL from environment variable with a fallback
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;

      const redirectUrl = `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent("/dashboard")}`;

      console.log("Redirecting to:", redirectUrl); // Add this for debugging

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Apple OAuth login method
  const loginWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/dashboard")}`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Apple login error:", error);
      throw error;
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        setIsLoggedIn(true);
        setUser(data.session.user);

        // Navigate to dashboard
        router.push("/dashboard");

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

  // Complete logout function that ensures full session cleanup
  const logout = async () => {
    try {
      // 1. First update state for immediate UI response
      setIsLoggedIn(false);
      setUser(null);

      // 2. Clear all auth cookies first
      clearAllAuthCookies();

      // 3. Clear Supabase data from localStorage
      clearSupabaseLocalStorage();

      // 4. Call Supabase signOut with global scope
      const { error } = await supabase.auth.signOut({
        scope: "global",
      });

      if (error) {
        console.error("Error during Supabase signOut:", error);
      }

      // 5. Force a complete page reload to clear any in-memory state

      // Set a flag in sessionStorage to show we're in the middle of logging out
      // This prevents redirect loops if middleware tries to restore the session
      sessionStorage.setItem("logging_out", "true");

      // Use direct window location for a full page refresh
      window.location.href = "/login?logout=true";
    } catch (error) {
      console.error("Logout process error:", error);

      // Still try to force clear everything and redirect even if there was an error
      clearAllAuthCookies();
      clearSupabaseLocalStorage();

      // Force redirect
      window.location.href = "/login?logout=true&error=true";
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error: error as AuthError };
    }
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        user,
        loading,
        login,
        loginWithGoogle,
        loginWithApple,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

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

    // Also clear any app-specific storage
    localStorage.removeItem("list_it_email");
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
    "supabase-auth-token",
    "sb-access-token",
    "sb-refresh-token",
    "sb:token",
    "__supabase_session", // Added additional cookies that might be set
    "sb-refresh-token",
    "sb-auth-token",
  ];

  // Clear each cookie by setting expiry in the past with various paths
  cookiesToClear.forEach((cookieName) => {
    // For main path
    document.cookie = `${cookieName}=; path=/; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;

    // Try additional paths
    document.cookie = `${cookieName}=; path=/api; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; path=/auth; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    document.cookie = `${cookieName}=; max-age=0; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  });
};

// Helper to clear session storage
const clearSessionStorage = () => {
  try {
    // Clear specific items
    sessionStorage.removeItem("supabase.auth.token");
    sessionStorage.removeItem("supabase.auth.expires_at");

    // Only clear the entire session storage as a last resort
    // as it might affect other functionality
    // sessionStorage.clear();
  } catch (err) {
    console.error("Error clearing sessionStorage:", err);
  }
};

// Hook for child components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and provides auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [initialized, setInitialized] = useState<boolean>(false);
  const router = useRouter();

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
      // Get base URL without trailing slash
      const baseUrl = (
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      ).replace(/\/$/, "");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
          redirectTo: `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent("/dashboard")}`,
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
      // Get base URL without trailing slash
      const baseUrl = (
        process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      ).replace(/\/$/, "");

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent("/dashboard")}`,
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

  // Improved logout function that ensures full session cleanup
  const logout = async () => {
    try {
      console.log("Starting logout process...");

      // Immediately update UI
      setIsLoggedIn(false);
      setUser(null);

      // Mark logout attempt
      if (typeof window !== "undefined") {
        sessionStorage.setItem("logging_out", "true");
      }

      // Safely get session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn("Error fetching session during logout:", sessionError);
      }

      console.log("Session before logout:", session);

      // Only sign out if session exists
      if (session) {
        try {
          await supabase.auth.signOut(); // removes from local client only
          console.log("Signed out from Supabase (global)");
        } catch (signOutError) {
          console.error("SignOut error:", signOutError);
        }
      } else {
        console.log("No session present; skipping supabase.auth.signOut");
      }

      // Cleanup local/session storage
      if (typeof window !== "undefined") {
        clearAllAuthCookies();
        clearSupabaseLocalStorage();
        clearSessionStorage();

        // Delay to ensure async cleanup
        setTimeout(() => {
          window.location.href = "/login?logout=true";
        }, 100);
      }
    } catch (error) {
      console.error("Logout process error:", error);

      // Fallback cleanup and redirect
      if (typeof window !== "undefined") {
        clearAllAuthCookies();
        clearSupabaseLocalStorage();
        clearSessionStorage();
        window.location.href = "/login?logout=true&error=true";
      }
    }
  };

  // Reset password
  // In your AuthContext.tsx
  // AuthContext.tsx (inside your AuthProvider)
  const resetPassword = async (email: string) => {
    // 1. Grab and normalize site URL
    const rawSite =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");
    const siteUrl = rawSite.replace(/\/$/, ""); // "http://localhost:3000"

    // 2. Append the reset route
    const redirectTo = `${siteUrl}/resetPassword`; // "http://localhost:3000/resetPassword"
    console.log("🔁 resetPassword redirectTo =", redirectTo);

    // 3. Call Supabase
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) {
      console.error("❌ resetPasswordForEmail error:", error);
      return { success: false, error };
    }

    return { success: true };
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

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
import { User } from "@supabase/supabase-js";

// Define the shape of our auth context
interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: any }>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: any }>;
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

// Hook for child components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and provides auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for auth state on component mount
    const checkAuthStatus = async () => {
      try {
        // Get session from Supabase
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error getting session:", error);
          setIsLoggedIn(false);
          setUser(null);
        } else if (data.session) {
          // We have a valid session
          setIsLoggedIn(true);
          setUser(data.session.user);
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        console.error("Error in auth check:", err);
        setIsLoggedIn(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);

        if (event === "SIGNED_IN" && session) {
          setIsLoggedIn(true);
          setUser(session.user);

          // Set cookies for middleware
          document.cookie = `auth_token=${session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
          document.cookie = `isLoggedIn=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

          // Navigate to dashboard after sign in
          router.push("/dashboard");
        } else if (event === "SIGNED_OUT") {
          setIsLoggedIn(false);
          setUser(null);

          // Clear cookies
          document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
          document.cookie = "isLoggedIn=; path=/; max-age=0; SameSite=Lax";
        }
      }
    );

    checkAuthStatus();

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  // Updated Google OAuth login method
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // Remove any redirectTo parameter
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Updated Apple OAuth login method
  const loginWithApple = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        // Don't specify redirectTo for Apple either to maintain consistency
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

        // Set cookies for middleware
        document.cookie = `auth_token=${data.session.access_token}; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
        document.cookie = `isLoggedIn=true; path=/; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;

        return { success: true };
      }

      return { success: false, error: "No session returned" };
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();

      // Clear cookies
      document.cookie = "auth_token=; path=/; max-age=0; SameSite=Lax";
      document.cookie = "isLoggedIn=; path=/; max-age=0; SameSite=Lax";

      // Redirect to home page
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Reset password error:", error);
      return { success: false, error };
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

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

// Define the shape of our auth context
interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  isLoggedIn: true,
  login: () => {},
  logout: () => {},
});

// Hook for child components to get the auth context
export const useAuth = () => useContext(AuthContext);

// Provider component that wraps the app and provides auth context
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check for auth state on component mount
    const checkAuthStatus = () => {
      // Check cookie first (set by middleware)
      const cookieIsLoggedIn = document.cookie
        .split("; ")
        .find((row) => row.startsWith("isLoggedIn="))
        ?.split("=")[1];

      // Fallback to localStorage
      const storedIsLoggedIn = localStorage.getItem("isLoggedIn");

      setIsLoggedIn(cookieIsLoggedIn === "true" || storedIsLoggedIn === "true");
    };

    checkAuthStatus();

    // Listen for storage changes (for multi-tab support)
    window.addEventListener("storage", checkAuthStatus);

    return () => {
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  // Login function
  const login = () => {
    localStorage.setItem("isLoggedIn", "true");
    setIsLoggedIn(true);
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    // Redirect to home or login page
    window.location.href = "/";
  };

  // Provide the auth context to children components
  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

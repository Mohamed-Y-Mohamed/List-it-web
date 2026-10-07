"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
}

// Create a context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Check if we're on the client side before accessing window/localStorage
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage if available, otherwise default to 'light'
  const [theme, setTheme] = useState<ThemeType>("light");

  // Set mounted state once component mounts
  useEffect(() => {
    setMounted(true);

    // Get saved theme from localStorage
    const savedTheme = localStorage.getItem("theme") as ThemeType;

    // Check if user has dark mode preference in their OS
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    // Use saved theme, or OS preference, or default to light
    if (savedTheme === "dark" || savedTheme === "light") {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme("dark");
    }

    // Apply theme class to document
    document.documentElement.classList.toggle(
      "dark",
      savedTheme === "dark" || (!savedTheme && prefersDark),
    );

    // Keep following the system for as long as the user has never chosen for
    // themselves. Once they use the toggle that choice is stored and wins —
    // changing the device theme should not quietly undo it. Without this the
    // system setting was only ever read once, at first launch, so switching the
    // phone to dark mode later appeared to do nothing.
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const followSystem = (event: MediaQueryListEvent) => {
      if (localStorage.getItem("theme")) return;
      setTheme(event.matches ? "dark" : "light");
      document.documentElement.classList.toggle("dark", event.matches);
    };

    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    // Save to localStorage
    localStorage.setItem("theme", newTheme);

    // Toggle class on document
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // Return the context value with the current state and the toggle function
  const contextValue = {
    theme,
    toggleTheme,
  };

  // During SSR, provide default values
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  return useContext(ThemeContext);
};

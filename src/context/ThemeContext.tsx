"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  applySurfaceRamp,
  DEFAULT_SURFACE,
  readCustomColor,
  readSurfaceChoice,
  readThemeChoice,
  surfaceRamp,
  writeCustomColor,
  writeSurfaceChoice,
  writeThemeChoice,
  type SurfaceChoice,
} from "@/lib/surfaceTheme";

type ThemeType = "light" | "dark";

interface ThemeContextType {
  theme: ThemeType;
  toggleTheme: () => void;
  /** Which background ramp the current theme is painting. */
  surface: SurfaceChoice;
  setSurface: (choice: SurfaceChoice) => void;
  /** The custom colour saved for the current theme, if any. */
  customColor: string | null;
  /** Saves a custom colour for the current theme and switches to it. */
  setCustomColor: (hex: string) => void;
}

// Create a context with default values
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  surface: DEFAULT_SURFACE,
  setSurface: () => {},
  customColor: null,
  setCustomColor: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // Check if we're on the client side before accessing window/localStorage
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage if available, otherwise default to 'light'
  const [theme, setTheme] = useState<ThemeType>("light");

  // Set mounted state once component mounts
  useEffect(() => {
    setMounted(true);

    // The saved theme lives in a cookie so the inline script in the root layout
    // can paint it before the first frame.
    const savedTheme = readThemeChoice();

    // Check if user has dark mode preference in their OS
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;

    // Use saved theme, or OS preference, or default to light
    if (savedTheme) {
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
      if (readThemeChoice()) return;
      setTheme(event.matches ? "dark" : "light");
      document.documentElement.classList.toggle("dark", event.matches);
    };

    media.addEventListener("change", followSystem);
    return () => media.removeEventListener("change", followSystem);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);

    writeThemeChoice(newTheme);

    // Toggle class on document
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  // The chosen background for each theme, and the ramp that follows from it.
  //
  // Held here rather than in its own provider because it is a function of the
  // theme: switching to light has to repaint with the light ramp in the same pass,
  // and two providers would have meant one frame painted with the other's colours.
  const [surface, setSurfaceState] = useState<SurfaceChoice>(DEFAULT_SURFACE);

  const [customColor, setCustomColorState] = useState<string | null>(null);

  useEffect(() => {
    if (!mounted) return;
    const choice = readSurfaceChoice(theme);
    setSurfaceState(choice);
    setCustomColorState(readCustomColor(theme));
    applySurfaceRamp(surfaceRamp(theme, choice));
  }, [theme, mounted]);

  const setSurface = (choice: SurfaceChoice) => {
    setSurfaceState(choice);
    writeSurfaceChoice(theme, choice);
    applySurfaceRamp(surfaceRamp(theme, choice));
  };

  const setCustomColor = (hex: string) => {
    writeCustomColor(theme, hex);
    setCustomColorState(hex.toUpperCase());
    setSurface("custom");
  };

  // Return the context value with the current state and the toggle function
  const contextValue = {
    theme,
    toggleTheme,
    surface,
    setSurface,
    customColor,
    setCustomColor,
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

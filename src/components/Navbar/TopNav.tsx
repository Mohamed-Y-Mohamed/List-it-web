"use client";

import React, { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface TopNavigationProps {
  children?: React.ReactNode;
}

const TopNavigation: React.FC<TopNavigationProps> = ({ children }) => {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { isLoggedIn, user, logout } = useAuth();
  const isDark = theme === "dark";

  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Navigate to specified path
  const navigateTo = (path: string): void => {
    router.push(path);
    setIsMobileMenuOpen(false);
  };

  // Handle logout using auth context
  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      // Navigation to home is already handled in your auth context
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Handle clicking outside the user menu to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Node;
      const userMenu = document.getElementById("user-menu-container");

      if (isUserMenuOpen && userMenu && !userMenu.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isUserMenuOpen]);

  if (!isMounted) return null;

  return (
    <div
      className={`${isDark ? "bg-gray-100 text-gray-200" : "bg-white text-gray-800"}`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 backdrop-blur-md border-b ${
          isDark
            ? "bg-gray-900/90 border-gray-600/30 shadow-gray-900/20"
            : "bg-white/80 border-gray-300/30 shadow-gray-300/20"
        } shadow-lg`}
      >
        <div className="mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-orange-500 rounded-md mr-2 flex items-center justify-center text-white font-bold">
                  <Image
                    src="/app-icon.jpeg"
                    alt="App Icon"
                    width={32}
                    height={32}
                    className="rounded-md"
                    priority
                  />
                </div>
                <div
                  className={`text-2xl font-bold ${
                    isDark ? "text-orange-400" : "text-sky-500"
                  }`}
                >
                  LIST IT
                </div>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center space-x-4">
              <button
                onClick={() => navigateTo("/landingpage")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("/aboutus")}
                className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-full ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                    : "bg-gray-100 text-sky-500 hover:bg-gray-200"
                }`}
                aria-label={
                  isDark ? "Switch to light mode" : "Switch to dark mode"
                }
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>

              {isLoggedIn ? (
                // User menu for logged in users
                <div className="relative" id="user-menu-container">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className={`flex items-center justify-center rounded-full p-1 h-10 w-10 border ${
                      isDark
                        ? "bg-gray-800 text-orange-400 hover:bg-gray-700 border-gray-700"
                        : "bg-gray-100 text-sky-500 hover:bg-gray-200 border-gray-200"
                    }`}
                    aria-label="User menu"
                  >
                    <User size={20} />
                  </button>

                  {isUserMenuOpen && (
                    <div
                      className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                        isDark ? "bg-gray-800" : "bg-white"
                      }`}
                      role="menu"
                    >
                      {user && (
                        <div
                          className={`px-4 py-2 border-b ${isDark ? "border-gray-700 text-gray-300" : "border-gray-200 text-gray-700"}`}
                        >
                          <p className="text-sm font-semibold">
                            {user.user_metadata?.full_name || "User"}
                          </p>
                          <p className="text-xs truncate">{user.email}</p>
                        </div>
                      )}
                      <div className="py-1">
                        <button
                          onClick={() => navigateTo("/dashboard")}
                          className={`flex w-full items-center px-4 py-2 text-sm text-left ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          role="menuitem"
                        >
                          <LayoutDashboard size={16} className="mr-2" />{" "}
                          Dashboard
                        </button>
                        <button
                          onClick={handleLogout}
                          className={`flex w-full items-center px-4 py-2 text-sm text-left ${
                            isDark
                              ? "text-gray-300 hover:bg-gray-700"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                          role="menuitem"
                        >
                          <LogOut size={16} className="mr-2" /> Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Login/Register buttons for non-logged in users
                <div className="hidden lg:flex items-center space-x-2">
                  <button
                    onClick={() => navigateTo("/login")}
                    className={`rounded-md px-4 py-2 text-sm font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigateTo("/register")}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                      isDark
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    Sign up
                  </button>
                </div>
              )}

              {/* Mobile menu button - Changed to Menu/X icons */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`lg:hidden inline-flex items-center justify-center p-2 rounded-md ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="lg:hidden">
            <div
              className={`space-y-1 px-2 pb-3 pt-2 ${
                isDark ? "bg-gray-900" : "bg-white"
              }`}
            >
              <button
                onClick={() => navigateTo("/landingpage")}
                className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </button>
              <button
                onClick={() => navigateTo("/aboutus")}
                className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </button>

              {!isLoggedIn && (
                <>
                  <button
                    onClick={() => navigateTo("/login")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium ${
                      isDark
                        ? "text-gray-300 hover:text-orange-400"
                        : "text-gray-700 hover:text-orange-500"
                    }`}
                  >
                    Log in
                  </button>
                  <button
                    onClick={() => navigateTo("/register")}
                    className={`block w-full text-left rounded-md px-3 py-2 text-base font-medium text-white ${
                      isDark
                        ? "bg-orange-600 hover:bg-orange-700"
                        : "bg-orange-500 hover:bg-orange-600"
                    }`}
                  >
                    Sign up
                  </button>
                </>
              )}

              {/* Removed dashboard, profile, settings, and sign out from mobile menu */}
            </div>
          </div>
        )}
      </header>

      {children}
    </div>
  );
};

export default TopNavigation;

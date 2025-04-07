"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, Sun, Moon, User, LogOut, Settings } from "lucide-react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";

// Main NavbarWrapper component that decides which navbar to render
const NavbarWrapper = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check authentication status when component mounts
  useEffect(() => {
    // This is a placeholder - replace with your actual auth check logic
    // For example, check localStorage, cookies, or call an API
    const checkAuthStatus = () => {
      // For demo purposes, checking a localStorage value
      const authStatus = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(authStatus);
    };

    checkAuthStatus();

    // Optional: Set up an event listener for auth state changes
    window.addEventListener("storage", checkAuthStatus);

    // Clean up event listener
    return () => {
      window.removeEventListener("storage", checkAuthStatus);
    };
  }, []);

  // Return the appropriate navbar based on authentication status
  return isLoggedIn ? <LoggedInNavbar /> : <PublicNavbar />;
};

// The original public navbar with login/signup buttons
const PublicNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full ${
        isDark ? "bg-gray-900 shadow-gray-800" : "bg-white shadow-sm"
      } transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/app-icon.jpeg"
                alt="LIST Logo"
                width={32}
                height={32}
                className="rounded"
              />

              <div
                className={`text-2xl font-bold ${
                  isDark ? "text-orange-400" : "text-sky-500"
                }`}
              >
                LIST IT
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </Link>

              <Link
                href="/aboutus"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </Link>
            </div>
          </div>

          {/* Auth Buttons and Theme Toggle */}
          <div className="hidden md:flex items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`mr-4 p-2 rounded-full ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200"
              } transition-colors duration-200`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Log in
              </Link>
              <Link
                href="/register"
                className={`rounded-md ${
                  isDark
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-orange-500 hover:bg-orange-600"
                } px-4 py-2 text-sm font-medium text-white`}
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Mobile menu button and Theme Toggle */}
          <div className="flex items-center md:hidden">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`mr-2 p-2 rounded-full ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200"
              } transition-colors duration-200`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <button
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center rounded-md p-2 ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <Link
              href="/"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              Home
            </Link>
            <Link
              href="/collections"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              Collections
            </Link>
            <Link
              href="/aboutus"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              About
            </Link>
            <Link
              href="/login"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={`block rounded-md ${
                isDark
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-orange-500 hover:bg-orange-600"
              } px-3 py-2 text-base font-medium text-white`}
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

// The logged-in navbar with user icon
const LoggedInNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  // Helper function to handle logout
  const handleLogout = () => {
    // Clear authentication data
    localStorage.removeItem("isLoggedIn");

    // Refresh the page or redirect
    window.location.href = "/";
  };

  return (
    <nav
      className={`fixed top-0 z-50 w-full ${
        isDark ? "bg-gray-900 shadow-gray-800" : "bg-white shadow-sm"
      } transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/app-icon.jpeg"
                alt="LIST Logo"
                width={32}
                height={32}
                className="rounded"
              />

              <div
                className={`text-2xl font-bold ${
                  isDark ? "text-orange-400" : "text-sky-500"
                }`}
              >
                LIST IT
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                Home
              </Link>

              <Link
                href="/aboutus"
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isDark
                    ? "text-gray-300 hover:text-orange-400"
                    : "text-gray-700 hover:text-orange-500"
                }`}
              >
                About
              </Link>
            </div>
          </div>

          {/* Theme Toggle and User Profile Icon for Desktop */}
          <div className="hidden md:flex items-center">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`mr-4 p-2 rounded-full ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200"
              } transition-colors duration-200`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile Icon (replacing login/signup) */}
            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className={`flex items-center justify-center rounded-full p-1 ${
                  isDark
                    ? "bg-gray-800 text-orange-400 hover:bg-gray-700 border border-gray-700"
                    : "bg-gray-100 text-sky-500 hover:bg-gray-200 border border-gray-200"
                } h-10 w-10 transition-colors duration-200`}
                aria-label="User menu"
              >
                <User size={20} />
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg ${
                    isDark ? "bg-gray-800" : "bg-white"
                  } ring-1 ring-black ring-opacity-5 focus:outline-none`}
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="user-menu"
                >
                  <div className="py-1" role="none">
                    <Link
                      href="/profile"
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <User size={16} className="mr-2" />
                        Your Profile
                      </div>
                    </Link>
                    <Link
                      href="/settings"
                      className={`block px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <Settings size={16} className="mr-2" />
                        Settings
                      </div>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        isDark
                          ? "text-gray-300 hover:bg-gray-700"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                      role="menuitem"
                    >
                      <div className="flex items-center">
                        <LogOut size={16} className="mr-2" />
                        Sign out
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile menu button and Theme Toggle */}
          <div className="flex items-center md:hidden">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`mr-2 p-2 rounded-full ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200"
              } transition-colors duration-200`}
              aria-label={
                isDark ? "Switch to light mode" : "Switch to dark mode"
              }
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* User Profile Icon for Mobile */}
            <button
              onClick={toggleUserMenu}
              className={`mr-2 flex items-center justify-center rounded-full p-1 ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700 border border-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200 border border-gray-200"
              } h-8 w-8 transition-colors duration-200`}
              aria-label="User menu"
            >
              <User size={16} />
            </button>

            <button
              onClick={toggleMobileMenu}
              className={`inline-flex items-center justify-center rounded-md p-2 ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
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

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <Link
              href="/"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              Home
            </Link>
            <Link
              href="/collections"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              Collections
            </Link>
            <Link
              href="/aboutus"
              className={`block rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              About
            </Link>
          </div>
        </div>
      )}

      {/* Mobile user menu - shows when user icon is clicked */}
      {isUserMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <Link
              href="/profile"
              className={`flex items-center rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              <User size={16} className="mr-2" />
              Your Profile
            </Link>
            <Link
              href="/settings"
              className={`flex items-center rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              <Settings size={16} className="mr-2" />
              Settings
            </Link>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              <LogOut size={16} className="mr-2" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarWrapper;

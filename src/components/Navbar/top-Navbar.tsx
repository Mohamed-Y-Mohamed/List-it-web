"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { Menu, X, Sun, Moon, User, LogOut, Settings } from "lucide-react";

const NavbarWrapper = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const authStatus = localStorage.getItem("isLoggedIn") === "true";
      setIsLoggedIn(authStatus);
    };

    checkAuthStatus();
    window.addEventListener("storage", checkAuthStatus);
    return () => window.removeEventListener("storage", checkAuthStatus);
  }, []);

  return isLoggedIn ? <LoggedInNavbar /> : <PublicNavbar />;
};

const NavLink = ({ href, children, className }: any) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
        isDark
          ? "text-gray-300 hover:text-orange-400"
          : "text-gray-700 hover:text-orange-500"
      } ${className}`}
    >
      {children}
    </Link>
  );
};

const PublicNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <nav
      className={`fixed top-0 z-50 w-full ${
        isDark ? "bg-gray-900 shadow-gray-800" : "bg-white shadow-sm"
      } transition-colors duration-300`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
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

          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/aboutus">About</NavLink>
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
            <NavLink href="/login">Log in</NavLink>
            <Link
              href="/register"
              className={`rounded-md px-4 py-2 text-sm font-medium text-white ${
                isDark
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Sign up
            </Link>
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={toggleTheme}
              className={`mr-2 p-2 rounded-full ${
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
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
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

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <NavLink href="/">Home</NavLink>
            <NavLink href="/collections">Collections</NavLink>
            <NavLink href="/aboutus">About</NavLink>
            <NavLink href="/login">Log in</NavLink>
            <Link
              href="/signup"
              className={`block rounded-md px-3 py-2 text-base font-medium text-white ${
                isDark
                  ? "bg-orange-600 hover:bg-orange-700"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

const LoggedInNavbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
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

          <div className="hidden md:flex items-center space-x-4">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/aboutus">About</NavLink>
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
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
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
                  <div className="py-1">
                    <NavLink href="/profile">
                      <div className="flex items-center">
                        <User size={16} className="mr-2" /> Your Profile
                      </div>
                    </NavLink>
                    <NavLink href="/settings">
                      <div className="flex items-center">
                        <Settings size={16} className="mr-2" /> Settings
                      </div>
                    </NavLink>
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
          </div>

          <div className="flex md:hidden items-center">
            <button
              onClick={toggleTheme}
              className={`mr-2 p-2 rounded-full ${
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
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`mr-2 flex items-center justify-center rounded-full p-1 h-8 w-8 border ${
                isDark
                  ? "bg-gray-800 text-orange-400 hover:bg-gray-700 border-gray-700"
                  : "bg-gray-100 text-sky-500 hover:bg-gray-200 border-gray-200"
              }`}
              aria-label="User menu"
            >
              <User size={16} />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
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

      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <NavLink href="/">Home</NavLink>
            <NavLink href="/collections">Collections</NavLink>
            <NavLink href="/aboutus">About</NavLink>
          </div>
        </div>
      )}

      {isUserMenuOpen && (
        <div className="md:hidden">
          <div
            className={`space-y-1 px-2 pb-3 pt-2 ${
              isDark ? "bg-gray-900" : "bg-white"
            }`}
          >
            <NavLink href="/profile">
              <div className="flex items-center">
                <User size={16} className="mr-2" /> Your Profile
              </div>
            </NavLink>
            <NavLink href="/settings">
              <div className="flex items-center">
                <Settings size={16} className="mr-2" /> Settings
              </div>
            </NavLink>
            <button
              onClick={handleLogout}
              className={`flex w-full items-center rounded-md px-3 py-2 text-base font-medium ${
                isDark
                  ? "text-gray-300 hover:text-orange-400"
                  : "text-gray-700 hover:text-orange-500"
              }`}
            >
              <LogOut size={16} className="mr-2" /> Sign out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavbarWrapper;

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 z-50 w-full bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img
                src="/app-icon.jpeg"
                alt="LIST Logo"
                className="h-8 w-8 rounded"
              />
              <div className="text-2xl font-bold text-sky-500">LIST IT</div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link
                href="/"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500"
              >
                Home
              </Link>
              <Link
                href="/collections"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500"
              >
                something
              </Link>
              <Link
                href="/aboutus"
                className="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:text-orange-500"
              >
                About
              </Link>
            </div>
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-3">
              <Link
                href="/login"
                className="rounded-md px-4 py-2 text-sm font-medium text-gray-700 hover:text-orange-500"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
              >
                Sign up
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:text-orange-500"
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
          <div className="space-y-1 px-2 pb-3 pt-2">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-500"
            >
              Home
            </Link>
            <Link
              href="/collections"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-500"
            >
              Collections
            </Link>
            <Link
              href="/aboutus"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-500"
            >
              About
            </Link>
            <Link
              href="/login"
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:text-orange-500"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="block rounded-md bg-orange-500 px-3 py-2 text-base font-medium text-white hover:bg-orange-600"
            >
              Sign up
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

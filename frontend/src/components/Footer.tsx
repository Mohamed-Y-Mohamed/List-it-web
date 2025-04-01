"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScroll(window.scrollY >= window.innerHeight / 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <footer className="bg-gray-900 py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-sky-500">LIST IT</div>
            <p className="mt-4 max-w-xl mx-auto text-gray-400">
              Simple task management to help you stay organized and productive.
            </p>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between border-t border-gray-800 pt-8 text-gray-400 md:flex-row">
            <p>
              &copy; {new Date().getFullYear()} LIST IT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {showScroll && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-sky-500 text-white shadow-lg hover:bg-sky-600 transition-colors"
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default Footer;

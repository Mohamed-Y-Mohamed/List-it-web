"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
// import { FaApple, FaGooglePlay } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";

const Footer = () => {
  const [showScroll, setShowScroll] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === "dark";

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
      <footer
        className={`py-12 transition-all duration-300 border-t ${
          isDark
            ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 border-gray-600/30 text-white"
            : "bg-gradient-to-r from-gray-50 via-gray-100 to-gray-200 border-gray-300/30 text-gray-800"
        }`}
      >
        <div className="mx-auto max-w-7xl px-2 sm:px-3 lg:px-8">
          <div className="text-center">
            <div
              className={`text-3xl font-bold ${
                isDark ? "text-orange-400" : "text-sky-500"
              }`}
            >
              LIST IT
            </div>
            <p
              className={`mt-4 max-w-xl mx-auto ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              Simple task management to help you stay organized and productive.
            </p>

            {/* Download links */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {/* <a
                href="https://apps.apple.com/gb/app/opbr-companion/id6737994116"
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
                  isDark
                    ? "bg-blue-800 hover:bg-blue-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                <FaApple className="mr-2 text-white" size={18} />
                <span className="font-medium">App Store</span>
              </a>
              <a
                href="#"
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-all ${
                  isDark
                    ? "bg-green-800 hover:bg-green-700"
                    : "bg-green-600 hover:bg-green-700"
                } text-white`}
              >
                <FaGooglePlay className="mr-2 text-white" size={16} />
                <span className="font-medium">Google Play</span>
              </a> */}
            </div>
          </div>

          <div
            className={`mt-12 flex flex-col items-center justify-between border-t ${
              isDark ? "border-gray-800" : "border-gray-300"
            } pt-8 ${isDark ? "text-gray-400" : "text-gray-600"} md:flex-row`}
          >
            <p>
              &copy; {new Date().getFullYear()} LIST IT. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {showScroll && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-6 right-6 z-50 md:w-10 md:h-10  flex h-12 w-12 items-center justify-center rounded-full ${
            isDark
              ? "bg-orange-600 hover:bg-orange-700"
              : "bg-sky-500 hover:bg-sky-600"
          } text-white shadow-lg transition-colors`}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" />
        </button>
      )}
    </>
  );
};

export default Footer;

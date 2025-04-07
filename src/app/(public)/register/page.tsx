"use client";

import React from "react";
import { UserPlus, Mail, Lock, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { FaApple } from "react-icons/fa";
import { useTheme } from "@/context/ThemeContext";

const Signup = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div
      className={`min-h-screen pt-18 ${
        isDark ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"
      } flex justify-center transition-colors duration-300`}
    >
      <div
        className={`max-w-screen-xl m-0 sm:m-10 ${
          isDark ? "bg-gray-800" : "bg-white"
        } shadow sm:rounded-lg flex justify-center flex-1`}
      >
        <div className="flex-1 bg-[#7d7e7f] text-center hidden lg:flex">
          <div
            className="m-12 xl:m-16 w-full bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: "url('/images/signup.png')",
            }}
          ></div>
        </div>
        <div className="lg:w-1/2 xl:w-5/12 p-6 sm:p-12">
          <div>
            <Image
              src="/app-icon.jpeg"
              width={128}
              height={128}
              alt="LIST IT Logo"
              className="w-32 mx-auto rounded-full"
            />
          </div>
          <div className="mt-12 flex flex-col items-center">
            <h1
              className={`text-2xl xl:text-3xl font-extrabold ${
                isDark ? "text-gray-100" : "text-gray-900"
              }`}
            >
              Create your account
            </h1>
            <div className="w-full flex-1 mt-8">
              <div className="flex flex-col items-center">
                <button
                  className={`w-full max-w-xs font-bold shadow-sm rounded-lg py-3 ${
                    isDark
                      ? "bg-orange-900 text-gray-200"
                      : "bg-orange-100 text-gray-800"
                  } flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none hover:shadow focus:shadow-sm focus:shadow-outline`}
                >
                  <div
                    className={`${
                      isDark ? "bg-gray-800" : "bg-white"
                    } p-2 rounded-full`}
                  >
                    <svg className="w-4" viewBox="0 0 533.5 544.3">
                      <path
                        d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7 63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
                        fill="#4285f4"
                      />
                      <path
                        d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9 26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9 243.2 149.9z"
                        fill="#34a853"
                      />
                      <path
                        d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6 167.5 0 244.4l90.4-70.1z"
                        fill="#fbbc04"
                      />
                      <path
                        d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8 272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4 152.8-112.4z"
                        fill="#ea4335"
                      />
                    </svg>
                  </div>
                  <span className="ml-4">Sign up with Google</span>
                </button>

                <button
                  className={`w-full max-w-xs font-bold shadow-sm rounded-lg py-3 ${
                    isDark
                      ? "bg-sky-900 text-gray-200"
                      : "bg-sky-100 text-gray-800"
                  } flex items-center justify-center transition-all duration-300 ease-in-out focus:outline-none hover:shadow focus:shadow-sm focus:shadow-outline mt-5`}
                >
                  <div
                    className={`${
                      isDark ? "bg-gray-800" : "bg-white"
                    } p-1 rounded-full`}
                  >
                    <FaApple
                      className={`w-6 h-6 ${
                        isDark ? "text-gray-300" : "text-black"
                      }`}
                    />
                  </div>
                  <span className="ml-4">Sign up with Apple</span>
                </button>
              </div>

              <div className="my-12 border-b text-center">
                <div
                  className={`leading-none px-2 inline-block text-sm ${
                    isDark
                      ? "text-gray-400 bg-gray-800"
                      : "text-gray-600 bg-white"
                  } tracking-wide font-medium transform translate-y-1/2`}
                >
                  Or sign up with e-mail
                </div>
              </div>

              <div className="mx-auto max-w-xs">
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="text"
                    placeholder="Full Name"
                  />
                </div>
                <div className="relative mt-5">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="email"
                    placeholder="Email"
                  />
                </div>
                <div className="relative mt-5">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="password"
                    placeholder="Password"
                  />
                </div>
                <div className="relative mt-5">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    className={`w-full pl-10 pr-3 py-4 rounded-lg font-medium ${
                      isDark
                        ? "bg-gray-700 border-gray-600 placeholder-gray-400 text-gray-200 focus:border-orange-400 focus:bg-gray-600"
                        : "bg-gray-100 border-gray-200 placeholder-gray-500 text-sm focus:border-orange-500 focus:bg-white"
                    } border text-sm focus:outline-none`}
                    type="password"
                    placeholder="Confirm Password"
                  />
                </div>
                <button
                  className={`mt-5 tracking-wide font-semibold ${
                    isDark
                      ? "bg-orange-600 hover:bg-orange-700"
                      : "bg-orange-500 hover:bg-orange-600"
                  } text-white w-full py-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none`}
                >
                  <UserPlus className="w-6 h-6 -ml-2" />
                  <span className="ml-3">Sign Up</span>
                </button>
                <p
                  className={`mt-6 text-xs ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } text-center`}
                >
                  By signing up, you agree to LIST IT&apos;s{" "}
                  <a
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    }`}
                  >
                    Terms of Service
                  </a>{" "}
                  and{" "}
                  <a
                    href="#"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    }`}
                  >
                    Privacy Policy
                  </a>
                </p>
                <p
                  className={`mt-4 text-sm ${
                    isDark ? "text-gray-400" : "text-gray-600"
                  } text-center`}
                >
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className={`${
                      isDark
                        ? "text-orange-400 hover:text-orange-300"
                        : "text-orange-500 hover:text-orange-600"
                    } font-bold`}
                  >
                    Login
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;

"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

const SPLASH_DURATION_MS = 1800;

interface SplashScreenProps {
  onDone: () => void;
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone();
    }, SPLASH_DURATION_MS);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ backgroundColor: "#4f46e5" }}
    >
      <div className="flex flex-col items-center gap-6">
        <div className="rounded-2xl overflow-hidden shadow-2xl w-28 h-28">
          <Image
            src="/android-chrome-512x512.png"
            alt="List It logo"
            width={112}
            height={112}
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-white text-3xl font-bold tracking-wide">
          List It
        </h1>
        <p className="text-indigo-200 text-sm">Smart Task Management</p>
        <div className="mt-4 flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-white opacity-80 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

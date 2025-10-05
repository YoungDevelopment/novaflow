"use client";
import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export const NovaLogo = ({ className = "" }) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className={`inline-flex flex-col items-center ${className}`}>
        <div
          className="text-3xl font-black tracking-tight"
          style={{ fontFamily: "'MuseoModerno', sans-serif", fontWeight: 900 }}
        >
          <span className="text-black">N</span>
          <span className="text-red-600">O</span>
          <span className="text-black">VA</span>
        </div>
        <div
          className="tracking-wide text-black"
          style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400 }}
        >
          LABELING PRIVATE LIMITED
        </div>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=MuseoModerno:wght@100..900&family=Bebas+Neue&display=swap');
        `}</style>
      </div>
    );
  }

  const darkMode = resolvedTheme === "dark";
  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* NOVA Text */}
      <div
        className="text-3xl font-black tracking-tight"
        style={{ fontFamily: "'MuseoModerno', sans-serif", fontWeight: 900 }}
      >
        <span className={textColor}>N</span>
        <span className="text-red-600">O</span>
        <span className={textColor}>VA</span>
      </div>
      {/* LABELING PRIVATE LIMITED Text */}
      <div
        className={`tracking-wide ${textColor}`}
        style={{ fontFamily: "'Bebas Neue', sans-serif", fontWeight: 400 }}
      >
        LABELING PRIVATE LIMITED
      </div>
      {/* Font imports */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=MuseoModerno:wght@100..900&family=Bebas+Neue&display=swap');
      `}</style>
    </div>
  );
};

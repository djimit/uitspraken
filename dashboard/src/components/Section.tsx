"use client";

import { useState, useEffect } from "react";

interface SectionProps {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const COLOR_MAP: Record<string, string> = {
  blue: "bg-blue-500",
  green: "bg-green-500",
  indigo: "bg-indigo-500",
  orange: "bg-orange-500",
  purple: "bg-purple-500",
  gray: "bg-gray-400",
  amber: "bg-amber-500",
};

export default function Section({
  id,
  title,
  subtitle,
  color = "blue",
  defaultOpen = true,
  children,
}: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`section-${id}`);
      if (stored !== null) {
        setOpen(stored === "1");
      }
    } catch {}
    setMounted(true);
  }, [id]);

  function toggle() {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(`section-${id}`, next ? "1" : "0");
    } catch {}
  }

  const barColor = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <div id={id} className="scroll-mt-28">
      <button
        onClick={toggle}
        className="w-full flex items-center gap-3 pt-4 pb-2 group text-left"
        aria-expanded={open}
        aria-controls={`section-content-${id}`}
      >
        <span className={`w-1.5 h-6 ${barColor} rounded-full shrink-0`} />
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          {subtitle && (
            <p className="text-sm text-gray-400">{subtitle}</p>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-transform duration-200 shrink-0 ${
            open ? "rotate-0" : "-rotate-90"
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        id={`section-content-${id}`}
        className={`space-y-6 transition-all duration-200 ${
          mounted && !open ? "hidden" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { usePathname } from "next/navigation";

const TABS = [
  { href: "/pseudonimisering", label: "Dashboard" },
  { href: "/pseudonimisering/bevindingen", label: "Bevindingen" },
];

export default function PseudoSubNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
      {TABS.map((tab) => {
        const isActive =
          tab.href === "/pseudonimisering"
            ? pathname === "/pseudonimisering"
            : pathname.startsWith(tab.href);
        return (
          <a
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </a>
        );
      })}
    </div>
  );
}

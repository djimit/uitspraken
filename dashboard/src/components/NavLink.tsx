"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`font-medium transition-colors ${
        isActive
          ? "text-blue-900 border-b-2 border-blue-700 pb-0.5"
          : "text-gray-500 hover:text-blue-900"
      }`}
    >
      {children}
    </Link>
  );
}

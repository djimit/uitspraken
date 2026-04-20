import type { Metadata } from "next";
import "./globals.css";
import NavLink from "@/components/NavLink";

export const metadata: Metadata = {
  title: "Rechtspraak Dashboard",
  description: "Dutch Court Decisions Analytics Dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" className="text-xl font-bold text-blue-900">
              Rechtspraak Dashboard
            </a>
            <div className="flex gap-4 overflow-x-auto text-sm">
              <NavLink href="/">Overview</NavLink>
              <NavLink href="/decisions">Beslissingen</NavLink>
              <NavLink href="/judges">Rechters</NavLink>
              <NavLink href="/inhoudsindicatie">Inhoudsindicatie</NavLink>
              <NavLink href="/hoger-beroep">Hoger Beroep</NavLink>
              <NavLink href="/forensisch">Forensisch</NavLink>
              <NavLink href="/pseudonimisering">Pseudonimisering</NavLink>
              <NavLink href="/admin">Pipeline</NavLink>
            </div>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const links = [
  { href: "/", label: "Calendar" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function TopNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex items-center justify-between gap-3 rounded-full bg-app-card px-4 py-2 text-sm">
      <div className="font-semibold text-white">Structured Diary</div>
      <div className="flex gap-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              "rounded-full px-3 py-1 text-xs transition",
              pathname === link.href
                ? "bg-app-accent text-white"
                : "text-app-muted hover:text-white"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

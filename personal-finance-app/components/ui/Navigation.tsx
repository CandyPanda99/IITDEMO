"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/budgets", label: "Budgets" },
  { href: "/savings-goals", label: "Savings Goals" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className={cn("border-b bg-background")}>
      <div className="container mx-auto flex h-14 items-center px-4 gap-6">
        <Link href="/" className="font-semibold text-sm">
          Personal Finance
        </Link>
        {navLinks.map(({ href, label }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "text-sm transition-colors",
                isActive
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Receipt,
  Store,
  FileBarChart,
  Settings,
  Wallet,
  Users,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export const dashboardNavItems: {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/purchases", label: "Ledger", shortLabel: "Ledger", icon: Receipt },
  { href: "/vendors", label: "Credit Books", shortLabel: "Books", icon: Wallet },
  { href: "/reports", label: "Analytics", shortLabel: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function SidebarNav() {
  const path = usePathname();

  return (
    <div className="flex flex-1 flex-col">
      {/* Brand Header */}
      <div className="mb-6 px-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">GharKhata Pro</h2>
        <p className="text-xs text-muted-foreground">Family Ledger</p>
      </div>

      {/* Main Navigation */}
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {dashboardNavItems.map(({ href, label, icon: Icon }) => {
          const active = isActive(path, href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-[var(--gk-secondary-container)] text-white shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="mt-auto space-y-1 border-t border-border px-2 pt-4">
        <Link
          href="#"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          Help Center
        </Link>
      </div>
    </div>
  );
}

export function MobileNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card/95 backdrop-blur-lg md:hidden">
      {dashboardNavItems.slice(0, 5).map(({ href, shortLabel, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors",
              active
                ? "text-[var(--gk-secondary)]"
                : "text-muted-foreground"
            )}
          >
            <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
            {shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}

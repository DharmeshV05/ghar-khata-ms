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
  type LucideIcon,
} from "lucide-react";

export const dashboardNavItems: {
  href: string;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
}[] = [
  { href: "/dashboard", label: "Home", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/purchases", label: "Purchases", shortLabel: "Buy", icon: Receipt },
  { href: "/vendors", label: "Shops", shortLabel: "Shops", icon: Store },
  { href: "/reports", label: "Reports", shortLabel: "Reports", icon: FileBarChart },
  { href: "/settings", label: "Settings", shortLabel: "Settings", icon: Settings },
];

function isActive(path: string, href: string) {
  return path === href || path.startsWith(`${href}/`);
}

export function SidebarNav() {
  const path = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 p-2">
      {dashboardNavItems.map(({ href, label, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/60"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t bg-card/95 backdrop-blur md:hidden">
      {dashboardNavItems.map(({ href, shortLabel, icon: Icon }) => {
        const active = isActive(path, href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium",
              active ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            {shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}

import { redirect } from "next/navigation";
import Link from "next/link";
import { getHouseholdContext } from "@/lib/household";
import { Button } from "@/components/ui/button";
import { HouseholdSwitcher } from "@/components/household-switcher";
import { signOutAction } from "@/lib/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { CalculatorToggle } from "@/components/calculator/calculator-toggle";
import { DashboardCalculator } from "@/components/calculator/dashboard-calculator";
import { MobileNav, SidebarNav } from "@/components/dashboard-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/login");
  if (!ctx.householdId) redirect("/onboarding");

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-[var(--gk-surface-container-low)] md:flex">
        <div className="flex h-16 items-center border-b border-border px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight text-foreground">
            GharKhata
          </Link>
        </div>
        <div className="flex flex-1 flex-col overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Area */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-lg md:px-6">
          <div className="flex items-center gap-3">
            <HouseholdSwitcher households={ctx.households} currentId={ctx.householdId} />
          </div>
          <div className="flex items-center gap-2">
            <CalculatorToggle />
            <ThemeToggle />
            <span className="hidden text-sm text-muted-foreground md:inline">
              {ctx.userEmail}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                Sign out
              </Button>
            </form>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-6 pb-20 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <MobileNav />
      <DashboardCalculator />
    </div>
  );
}

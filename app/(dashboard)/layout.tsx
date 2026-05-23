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
    <div className="flex min-h-screen w-full">
      <aside className="hidden w-56 shrink-0 border-r bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="font-semibold tracking-tight">
            GharKhata
          </Link>
        </div>
        <SidebarNav />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 md:px-6">
          <div className="flex items-center gap-3">
            <HouseholdSwitcher households={ctx.households} currentId={ctx.householdId} />
          </div>
          <div className="flex items-center gap-2">
            <CalculatorToggle />
            <ThemeToggle />
            <span className="text-muted-foreground hidden text-sm md:inline">
              {ctx.userEmail}
            </span>
            <form action={signOutAction}>
              <Button type="submit" variant="ghost" size="sm">
                Sign out
              </Button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-20 md:px-6 md:pb-6">{children}</main>
      </div>
      <MobileNav />
      <DashboardCalculator />
    </div>
  );
}

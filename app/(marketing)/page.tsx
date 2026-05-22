import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MarketingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <span className="text-lg font-semibold tracking-tight">GharKhata</span>
          <div className="flex gap-2">
            <Link href="/login" className={cn(buttonVariants({ variant: "ghost" }))}>
              Log in
            </Link>
            <Link href="/signup" className={cn(buttonVariants())}>
              Get started
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto flex max-w-6xl flex-1 flex-col justify-center gap-10 px-4 py-16">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground">Household finance, simplified</p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Expense ledger, monthly bills, and credit — for your whole family.
          </h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            Track groceries, milk, vegetables, and month-end kirana dues in one clean dashboard. Share
            access safely with family members and settle balances with confidence.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link href="/signup" className={cn(buttonVariants({ size: "lg" }))}>
              Create free account
            </Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg", variant: "outline" }))}>
              I already have an account
            </Link>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { title: "Shared households", body: "Invite family with owner, member, or viewer roles." },
            { title: "Credit-friendly", body: "Partial payments, pending balance, and payment history." },
            { title: "Reports & export", body: "Monthly summaries, PDF, Excel, and printable statements." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border bg-card p-5 shadow-sm">
              <h2 className="font-semibold">{c.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

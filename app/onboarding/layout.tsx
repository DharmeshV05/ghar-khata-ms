import { acceptHouseholdInvite } from "@/lib/actions/households";
import { clearPendingInviteCookie, getPendingInviteToken } from "@/lib/invite";
import { getHouseholdContext } from "@/lib/household";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/login");
  if (ctx.householdId) redirect("/dashboard");

  const inviteToken = await getPendingInviteToken();
  if (inviteToken) {
    const result = await acceptHouseholdInvite(inviteToken);
    if ("ok" in result && result.ok) redirect("/dashboard");
    await clearPendingInviteCookie();
    redirect(`/onboarding?error=${encodeURIComponent(result.error ?? "Could not accept invite")}`);
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-12 max-w-lg items-center px-4">
          <span className="font-semibold tracking-tight">GharKhata</span>
        </div>
      </header>
      {children}
    </div>
  );
}

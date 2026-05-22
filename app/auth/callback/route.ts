import { acceptHouseholdInvite } from "@/lib/actions/households";
import { clearPendingInviteCookie, getPendingInviteToken } from "@/lib/invite";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const inviteToken = await getPendingInviteToken();
      if (inviteToken) {
        const result = await acceptHouseholdInvite(inviteToken);
        if ("ok" in result && result.ok) {
          next = "/dashboard";
        } else {
          await clearPendingInviteCookie();
          next = `/onboarding?error=${encodeURIComponent(result.error ?? "Could not accept invite")}`;
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

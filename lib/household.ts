import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { cache } from "react";

export type HouseholdRole = "owner" | "admin" | "member" | "viewer";

export type HouseholdSummary = {
  id: string;
  name: string;
  role: HouseholdRole;
};

/**
 * Returns the active household for the signed-in user and metadata needed for RLS-scoped queries.
 */
export type HouseholdContext = {
  userId: string;
  userEmail: string | null;
  householdId: string;
  role: HouseholdRole;
  households: HouseholdSummary[];
};

export const getHouseholdContext = cache(async function getHouseholdContext(): Promise<
  HouseholdContext | null
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_household_id")
    .eq("id", user.id)
    .single();

  const { data: members } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!members?.length) {
    return {
      userId: user.id,
      userEmail: user.email ?? null,
      householdId: "",
      role: "member",
      households: [],
    };
  }

  const ids = members.map((m) => m.household_id);
  const { data: householdRows } = await supabase.from("households").select("id, name").in("id", ids);

  const byId = new Map((householdRows ?? []).map((h) => [h.id, h.name]));

  const households: HouseholdSummary[] = members.map((m: { household_id: string; role: string }) => ({
    id: m.household_id,
    name: byId.get(m.household_id) ?? "Household",
    role: m.role as HouseholdRole,
  }));

  const defaultId = profile?.default_household_id;
  const preferred = households.find((h) => h.id === defaultId) ?? households[0];
  if (!preferred) {
    return {
      userId: user.id,
      userEmail: user.email ?? null,
      householdId: "",
      role: "member",
      households,
    };
  }

  return {
    userId: user.id,
    userEmail: user.email ?? null,
    householdId: preferred.id,
    role: preferred.role,
    households,
  };
});

export async function requireHousehold() {
  const ctx = await getHouseholdContext();
  if (!ctx) redirect("/login");
  if (!ctx.householdId) redirect("/onboarding");
  return ctx;
}

export function canEditLedger(role: HouseholdRole) {
  return role === "owner" || role === "admin" || role === "member";
}

export function canManageHousehold(role: HouseholdRole) {
  return role === "owner" || role === "admin";
}

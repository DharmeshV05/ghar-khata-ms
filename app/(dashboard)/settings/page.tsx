import { requireHousehold } from "@/lib/household";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "@/components/settings/settings-client";
import { headers } from "next/headers";

export default async function SettingsPage() {
  const ctx = await requireHousehold();
  const supabase = await createClient();

  const [{ data: members }, { data: categories }, { data: logs }] = await Promise.all([
    supabase
      .from("household_members")
      .select("user_id, role")
      .eq("household_id", ctx.householdId)
      .eq("status", "active"),
    supabase.from("categories").select("id, name").eq("household_id", ctx.householdId).order("sort_order"),
    supabase
      .from("activity_logs")
      .select("id, action, entity_type, created_at")
      .eq("household_id", ctx.householdId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const inviteBaseUrl = `${proto}://${host}`;

  return (
    <SettingsClient
      role={ctx.role}
      members={members ?? []}
      categories={categories ?? []}
      logs={logs ?? []}
      inviteBaseUrl={inviteBaseUrl}
    />
  );
}

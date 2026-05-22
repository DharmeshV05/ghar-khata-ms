"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_CATEGORY_SEED } from "@/lib/constants";
import { householdCreateSchema } from "@/lib/validations/purchase";
import { clearPendingInviteCookie } from "@/lib/invite";
import { canManageHousehold, getHouseholdContext } from "@/lib/household";

export async function acceptHouseholdInvite(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return { error: "Missing invite token" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: householdId, error } = await supabase.rpc("accept_household_invite", {
    p_token: trimmed,
  });

  if (error) return { error: error.message };

  await clearPendingInviteCookie();
  revalidatePath("/", "layout");
  return { ok: true as const, householdId: householdId as string };
}

export async function createHouseholdAndJoin(formData: FormData) {
  const raw = Object.fromEntries(formData);
  const parsed = householdCreateSchema.safeParse({ name: raw.name });
  if (!parsed.success) {
    redirect(`/onboarding?error=${encodeURIComponent("Invalid household name")}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Insert without .select(): RETURNING is subject to SELECT RLS, but membership
  // does not exist yet, so households_select_member would block the new row.
  const householdId = randomUUID();
  const { error: hErr } = await supabase
    .from("households")
    .insert({ id: householdId, name: parsed.data.name });
  if (hErr) {
    redirect(`/onboarding?error=${encodeURIComponent(hErr.message)}`);
  }

  const { error: mErr } = await supabase.from("household_members").insert({
    household_id: householdId,
    user_id: user.id,
    role: "owner",
    status: "active",
  });
  if (mErr) redirect(`/onboarding?error=${encodeURIComponent(mErr.message)}`);

  await supabase.from("profiles").update({ default_household_id: householdId }).eq("id", user.id);

  for (let i = 0; i < DEFAULT_CATEGORY_SEED.length; i++) {
    const name = DEFAULT_CATEGORY_SEED[i];
    await supabase.from("categories").insert({
      household_id: householdId,
      name,
      sort_order: i,
    });
  }

  await supabase.from("activity_logs").insert({
    household_id: householdId,
    user_id: user.id,
    action: "create",
    entity_type: "household",
    entity_id: householdId,
    metadata: { name: parsed.data.name },
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function setDefaultHousehold(householdId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: m } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("household_id", householdId)
    .eq("status", "active")
    .maybeSingle();
  if (!m) return { error: "Not a member of this household" };

  await supabase.from("profiles").update({ default_household_id: householdId }).eq("id", user.id);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function createInviteToken(formData: FormData) {
  const ctx = await getHouseholdContext();
  if (!ctx?.householdId || !canManageHousehold(ctx.role)) return { error: "Forbidden" };
  const email = (formData.get("email") as string)?.trim() || null;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("household_invites")
    .insert({
      household_id: ctx.householdId,
      email,
      role: "member",
      created_by: ctx.userId,
    })
    .select("token")
    .single();
  if (error) return { error: error.message };
  revalidatePath("/settings");
  return { ok: true as const, token: data.token };
}

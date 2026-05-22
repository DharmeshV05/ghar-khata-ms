import { cookies } from "next/headers";

export const PENDING_INVITE_COOKIE = "pending_invite";

export const PENDING_INVITE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function getPendingInviteToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PENDING_INVITE_COOKIE)?.value ?? null;
}

export async function clearPendingInviteCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_INVITE_COOKIE);
}

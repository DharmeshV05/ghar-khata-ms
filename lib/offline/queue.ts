/**
 * Phase 2 offline queue seam — purchases can be queued in IndexedDB when offline.
 * MVP: detect offline in forms and show a toast; full sync not implemented yet.
 */

export type OfflinePurchaseDraft = {
  id: string;
  payload: unknown;
  createdAt: string;
};

export async function enqueuePurchaseDraft(_draft: OfflinePurchaseDraft): Promise<void> {
  if (typeof window === "undefined") return;
  console.warn("[GharKhata] Offline queue not enabled in MVP");
}

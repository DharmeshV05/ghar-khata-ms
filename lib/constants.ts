export const PURCHASE_UNITS = [
  "KG",
  "GRAM",
  "LITER",
  "ML",
  "PIECE",
  "DOZEN",
  "PACKET",
  "BOTTLE",
] as const;

export type PurchaseUnit = (typeof PURCHASE_UNITS)[number];

export const DEFAULT_CATEGORY_SEED = [
  "Groceries",
  "Dairy",
  "Vegetables",
  "Meat & Eggs",
  "Household",
  "Bills",
  "Other",
] as const;

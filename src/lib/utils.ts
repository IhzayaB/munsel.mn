import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { nanoid } from "nanoid"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: string | number): string {
  return new Intl.NumberFormat("mn-MN").format(Number(price)) + "₮";
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = `PJ${date.getFullYear().toString().slice(-2)}${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
  const id = nanoid(8).toUpperCase();
  return `${prefix}-${id}`;
}

export function sanitizeSlug(value: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "ye", ё: "yo",
    ж: "j", з: "z", и: "i", й: "i", к: "k", л: "l", м: "m",
    н: "n", о: "o", ө: "u", п: "p", р: "r", с: "s", т: "t",
    у: "u", ү: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
    ш: "sh", щ: "sh", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  return value
    .toLowerCase()
    .trim()
    .split("")
    .map((c) => map[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_COST = 7000;

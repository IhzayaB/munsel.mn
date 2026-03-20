import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

export const FREE_SHIPPING_THRESHOLD = 50000;
export const SHIPPING_COST = 5000;

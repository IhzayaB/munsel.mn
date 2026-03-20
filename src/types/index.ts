import type { Product, ProductVariant, Category, Order, OrderItem } from "@/lib/db/schema";

export interface ProductWithVariants extends Product {
  variants: ProductVariant[];
  category: Category | null;
}

export interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: Product;
  })[];
}

export interface CartItemType {
  productId: string;
  variantId?: string;
  name: string;
  nameMn: string;
  price: number;
  size?: string;
  color?: string;
  quantity: number;
  image?: string;
}

export type Locale = "mn" | "en";

import { config } from "dotenv";
config({ path: ".env.local" });

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  users,
  categories,
  products,
  productVariants,
} from "./schema";
import bcrypt from "bcryptjs";

async function seed() {
  const connectionString = process.env.DATABASE_URL!;
  const client = postgres(connectionString);
  const db = drizzle(client);

  console.log("🌱 Seeding database...\n");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 12);
  const [adminUser] = await db
    .insert(users)
    .values({
      name: "Admin",
      email: "admin@munsel.mn",
      password: hashedPassword,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Admin user created:", adminUser?.email || "already exists");

  // Create categories
  const categoryData = [
    {
      name: "Rings",
      nameMn: "Бөгж",
      slug: "rings",
      description: "Gold and silver rings for every occasion",
      descriptionMn: "Бүх тохиолдолд тохирох алт, мөнгөн бөгж",
    },
    {
      name: "Earrings",
      nameMn: "Ээмэг",
      slug: "earrings",
      description: "Elegant earrings in gold and silver",
      descriptionMn: "Алт, мөнгөн зэрэглэлийн ээмэг",
    },
    {
      name: "Necklaces",
      nameMn: "Зүүлт",
      slug: "necklaces",
      description: "Necklaces and pendants",
      descriptionMn: "Зүүлт болон дүүжин чимэглэл",
    },
    {
      name: "Bracelets",
      nameMn: "Бугуйвч",
      slug: "bracelets",
      description: "Gold and silver bracelets",
      descriptionMn: "Алт, мөнгөн бугуйвч",
    },
    {
      name: "Sets",
      nameMn: "Иж бүрдэл",
      slug: "sets",
      description: "Matching jewelry sets",
      descriptionMn: "Хоорондоо тохирсон чимэглэлийн иж бүрдэл",
    },
  ];

  const insertedCategories = await db
    .insert(categories)
    .values(categoryData)
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${insertedCategories.length} categories created`);

  // Create products
  const productData = [
    {
      name: "Brilliant Solitaire Ring",
      nameMn: "Брилиант Солитер Бөгж",
      slug: "classic-gold-solitaire-ring",
      description: "A timeless 14k yellow gold solitaire ring featuring a round brilliant-cut stone in a classic four-prong setting. Crafted for engagements and lifelong wear.",
      descriptionMn: "14к шар алтан суурийг дөрвөн хошуугаар барьсан, тойрог тасалгааны гялалзсан чулуутай сонгодог бөгж. Гэрлэлтийн болон өдөр тутмын хэрэглээнд тохирно.",
      price: "350000",
      compareAtPrice: "420000",
      categoryId: insertedCategories[0]?.id,
      material: "14k Gold",
      materialMn: "14к алт",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=800&q=80&auto=format&fit=crop",
      ],
    },
    {
      name: "Venetian Silver Chain",
      nameMn: "Венецийн Мөнгөн Гинжин Зүүлт",
      slug: "sterling-silver-chain-necklace",
      description: "An elegant 925 sterling silver Venetian box chain, 45 cm in length. Versatile enough to wear solo or layer with pendants.",
      descriptionMn: "45 см урт 925 мөнгөн Венецийн хайрцган гинжин зүүлт. Дангаараа болон дүүжинтэй хамт өмсөхөд тохиромжтой.",
      price: "120000",
      compareAtPrice: "150000",
      categoryId: insertedCategories[2]?.id,
      material: "Sterling Silver 925",
      materialMn: "Мөнгө 925",
      featured: true,
      images: [
        "https://plus.unsplash.com/premium_photo-1673285096761-79e49ff5b760?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1674748384572-4bfba72773c4?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    {
      name: "Sculpted Gold Bracelet",
      nameMn: "Сийлбэр Хээтэй Алтан Бугуйвч",
      slug: "gold-bangle-bracelet",
      description: "An elegant gold bracelet with sculpted chain-inspired links and a polished finish. Designed to bring a refined glow to everyday looks and evening styling alike.",
      descriptionMn: "Сийлбэр мэт хэлбэртэй гинжин холбоос бүхий алтан бугуйвч. Өдөр тутмын болон үдшийн төрхөд тансаг өнгө аясыг нэмж өгнө.",
      price: "480000",
      categoryId: insertedCategories[3]?.id,
      material: "18k Gold",
      materialMn: "18к алт",
      featured: false,
      images: [
        "https://plus.unsplash.com/premium_photo-1678730056405-51c04f1a3770?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://plus.unsplash.com/premium_photo-1679768606052-be0b8a88fef1?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      ],
    },
    {
      name: "Diamond Teardrop Pendant",
      nameMn: "Диамант Дусал Зүүлт",
      slug: "diamond-pendant-necklace",
      description: "A 14k white gold chain suspending a sparkling pear-cut diamond pendant. A luxurious heirloom piece for life's most meaningful moments.",
      descriptionMn: "14к цагаан алтан гинж дээр лийр хэлбэртэй гялалзах диамант чулуутай дүүжин зүүлт. Амьдралын гол мөчид зориулсан тансаг бэлэг.",
      price: "890000",
      compareAtPrice: "1050000",
      categoryId: insertedCategories[2]?.id,
      material: "14k White Gold",
      materialMn: "14к цагаан алт",
      featured: true,
      images: [
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=800&q=80&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1535632787350-4e68ef0ac584?w=800&q=80&auto=format&fit=crop",
      ],
    },
  ];

  const insertedProducts = await db
    .insert(products)
    .values(productData)
    .onConflictDoNothing()
    .returning();

  console.log(`✅ ${insertedProducts.length} products created`);

  // Create variants for each product
  const variantData = insertedProducts.flatMap((product) => {
    const sizes = ["6", "7", "8", "9", "10", "one-size"];
    return sizes.map((size) => ({
      productId: product.id,
      size,
      color: "Gold",
      colorMn: "Алт",
      stock: Math.floor(Math.random() * 15) + 3,
    }));
  });

  const insertedVariants = await db
    .insert(productVariants)
    .values(variantData)
    .returning();

  console.log(`✅ ${insertedVariants.length} variants created`);

  console.log("\n🎉 Seed completed!\n");
  console.log("Admin login: admin@munsel.mn / admin123\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

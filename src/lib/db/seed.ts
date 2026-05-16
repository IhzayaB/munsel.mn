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
      nameMn: "Хазаар",
      slug: "bracelets",
      description: "Gold and silver bracelets",
      descriptionMn: "Алт, мөнгөн хазаар",
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
      name: "Classic Gold Solitaire Ring",
      nameMn: "Сонгодог алтан бөгж",
      slug: "classic-gold-solitaire-ring",
      description: "Timeless 14k gold solitaire ring with a brilliant-cut stone. Perfect for engagements and everyday elegance.",
      descriptionMn: "14к алтан, дуслаас огтолсон чулуутай сонгодог бөгж. Гэрлэлт болон өдөр тутмын гоёлд тохиромжтой.",
      price: "350000",
      compareAtPrice: "420000",
      categoryId: insertedCategories[0]?.id,
      material: "14k Gold",
      materialMn: "14к алт",
      ageRange: null,
      featured: true,
      images: [],
    },
    {
      name: "Rose Gold Drop Earrings",
      nameMn: "Ягаан алтан унжих ээмэг",
      slug: "rose-gold-drop-earrings",
      description: "Elegant rose gold drop earrings with delicate pearl accents. Lightweight and comfortable for all-day wear.",
      descriptionMn: "Сувдан чимэглэлтэй нарийхан ягаан алтан унжих ээмэг. Өдөр өмссөнд хөнгөн тухтай.",
      price: "180000",
      categoryId: insertedCategories[1]?.id,
      material: "18k Rose Gold",
      materialMn: "18к ягаан алт",
      ageRange: null,
      featured: true,
      images: [],
    },
    {
      name: "Sterling Silver Chain Necklace",
      nameMn: "Мөнгөн гинжин зүүлт",
      slug: "sterling-silver-chain-necklace",
      description: "Elegant 925 sterling silver chain necklace. Versatile length suitable for layering or standalone wear.",
      descriptionMn: "Элэгдэлд тэсвэртэй 925 мөнгөн гинжин зүүлт. Давхарлах эсвэл дангаараа өмсөхд тохиромжтой урт.",
      price: "120000",
      compareAtPrice: "150000",
      categoryId: insertedCategories[2]?.id,
      material: "Sterling Silver 925",
      materialMn: "Мөнгө 925",
      ageRange: null,
      featured: true,
      images: [],
    },
    {
      name: "Gold Bangle Bracelet",
      nameMn: "Алтан бугуйн хазаар",
      slug: "gold-bangle-bracelet",
      description: "Solid 18k gold bangle bracelet with a polished finish. A statement piece that elevates any outfit.",
      descriptionMn: "Гялалзсан 18к алтан бугуйн хазаар. Ямар ч хувцастай зохицох онцлох чимэглэл.",
      price: "480000",
      categoryId: insertedCategories[3]?.id,
      material: "18k Gold",
      materialMn: "18к алт",
      ageRange: null,
      featured: false,
      images: [],
    },
    {
      name: "Diamond Pendant Necklace",
      nameMn: "Адамант чулуутай дүүжин зүүлт",
      slug: "diamond-pendant-necklace",
      description: "14k white gold necklace with a sparkling diamond pendant. A luxurious gift for any special occasion.",
      descriptionMn: "14к цагаан алтан гинж дээр адамант чулуутай дүүжин. Онцгой тохиолдолд тохирох тансаг бэлэг.",
      price: "890000",
      compareAtPrice: "1050000",
      categoryId: insertedCategories[2]?.id,
      material: "14k White Gold",
      materialMn: "14к цагаан алт",
      ageRange: null,
      featured: true,
      images: [],
    },
    {
      name: "Silver Hoop Earrings",
      nameMn: "Мөнгөн дугуй ээмэг",
      slug: "silver-hoop-earrings",
      description: "Classic sterling silver hoop earrings. Lightweight and versatile for both casual and formal looks.",
      descriptionMn: "Сонгодог мөнгөн дугуй ээмэг. Өдөр тутмын болон найр наадамд тохирох.",
      price: "65000",
      categoryId: insertedCategories[1]?.id,
      material: "Sterling Silver 925",
      materialMn: "Мөнгө 925",
      ageRange: null,
      featured: false,
      images: [],
    },
    {
      name: "Gold & Silver Jewelry Set",
      nameMn: "Алт, мөнгөн чимэглэлийн иж бүрдэл",
      slug: "gold-silver-jewelry-set",
      description: "Complete jewelry set including ring, earrings, and necklace in matching gold and silver tones.",
      descriptionMn: "Тохирох алт, мөнгөн өнгөний бөгж, ээмэг, зүүлт багтсан бүрэн иж бүрдэл.",
      price: "520000",
      compareAtPrice: "680000",
      categoryId: insertedCategories[4]?.id,
      material: "Mixed Gold & Silver",
      materialMn: "Алт, мөнгө хольсон",
      ageRange: null,
      featured: true,
      images: [],
    },
    {
      name: "Twisted Gold Ring",
      nameMn: "Мушгиасан алтан бөгж",
      slug: "twisted-gold-ring",
      description: "Modern twisted design 14k gold ring. Unique texture that catches the light beautifully.",
      descriptionMn: "Орчин үеийн мушгиасан дизайн бүхий 14к алтан бөгж. Гэрлийг гоёмсог ойлгодог өвөрмөц текстур.",
      price: "290000",
      categoryId: insertedCategories[0]?.id,
      material: "14k Gold",
      materialMn: "14к алт",
      ageRange: null,
      featured: false,
      images: [],
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

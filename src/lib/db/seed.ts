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
      email: "admin@pajama.mn",
      password: hashedPassword,
      role: "admin",
    })
    .onConflictDoNothing()
    .returning();

  console.log("✅ Admin user created:", adminUser?.email || "already exists");

  // Create categories
  const categoryData = [
    {
      name: "Onesies",
      nameMn: "Комбинезон",
      slug: "onesies",
      description: "Comfortable one-piece outfits for babies",
      descriptionMn: "Нярайд зориулсан тухтай нэг хэсэгт хувцас",
    },
    {
      name: "Sleepwear",
      nameMn: "Унтлагын хувцас",
      slug: "sleepwear",
      description: "Cozy pajamas and sleep sacks",
      descriptionMn: "Зөөлөн пижама болон унтлагын уут",
    },
    {
      name: "Sets",
      nameMn: "Хослол",
      slug: "sets",
      description: "Matching top and bottom sets",
      descriptionMn: "Дээд доод хослонгууд",
    },
    {
      name: "Accessories",
      nameMn: "Дагалдах хэрэгсэл",
      slug: "accessories",
      description: "Hats, socks, bibs and more",
      descriptionMn: "Малгай, оймс, өвдөгч гэх мэт",
    },
    {
      name: "Gift Sets",
      nameMn: "Бэлэг багц",
      slug: "gift-sets",
      description: "Perfect gift bundles for newborns",
      descriptionMn: "Нярайд зориулсан бэлэг багц",
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
      name: "Soft Bamboo Onesie",
      nameMn: "Зөөлөн бамбук комбинезон",
      slug: "soft-bamboo-onesie",
      description:
        "Ultra-soft bamboo fabric onesie that is gentle on baby's skin. Features snap buttons for easy diaper changes.",
      descriptionMn:
        "Нярайн нарийн арьсанд тохирсон маш зөөлөн бамбук даавуун комбинезон. Подгузник солиход хялбар товчтой.",
      price: "39900",
      compareAtPrice: "49900",
      categoryId: insertedCategories[0]?.id,
      material: "95% Bamboo, 5% Spandex",
      materialMn: "95% Бамбук, 5% Спандекс",
      ageRange: "0-12 months",
      featured: true,
      images: [],
    },
    {
      name: "Winter Warm Fleece Pajama",
      nameMn: "Өвлийн дулаан флис пижама",
      slug: "winter-warm-fleece-pajama",
      description:
        "Keep your little one cozy during cold Mongolian winters with this warm fleece pajama set.",
      descriptionMn:
        "Монголын хүйтэн өвлийн улиралд зориулсан дулаан флис пижама хослол.",
      price: "59900",
      categoryId: insertedCategories[1]?.id,
      material: "100% Polyester Fleece",
      materialMn: "100% Полиэстер флис",
      ageRange: "6-24 months",
      featured: true,
      images: [],
    },
    {
      name: "Organic Cotton Bodysuit Set",
      nameMn: "Органик хөвөн боди хослол",
      slug: "organic-cotton-bodysuit-set",
      description:
        "Set of 3 organic cotton bodysuits in lovely pastel colors. Chemical-free and safe for newborns.",
      descriptionMn:
        "3 ширхэг органик хөвөн боди. Химийн бодисгүй, нярайд аюулгүй.",
      price: "45900",
      compareAtPrice: "59900",
      categoryId: insertedCategories[2]?.id,
      material: "100% Organic Cotton",
      materialMn: "100% Органик хөвөн",
      ageRange: "0-6 months",
      featured: true,
      images: [],
    },
    {
      name: "Cozy Sleep Sack",
      nameMn: "Тухтай унтлагын уут",
      slug: "cozy-sleep-sack",
      description:
        "Safe and warm wearable blanket for babies. TOG 2.5 rated for cold rooms.",
      descriptionMn:
        "Нярайд зориулсан аюулгүй, дулаан өмсдөг хөнжил. Хүйтэн өрөөнд тохирсон TOG 2.5 үзүүлэлттэй.",
      price: "69900",
      categoryId: insertedCategories[1]?.id,
      material: "100% Cotton outer, Polyester fill",
      materialMn: "Гадна 100% хөвөн, Дотор полиэстер дүүргэгч",
      ageRange: "0-18 months",
      featured: false,
      images: [],
    },
    {
      name: "Newborn Welcome Gift Set",
      nameMn: "Нярайн бэлэг багц",
      slug: "newborn-welcome-gift-set",
      description:
        "Beautiful gift set including onesie, booties, hat, and blanket. Perfect for baby showers.",
      descriptionMn:
        "Комбинезон, гутал, малгай, хөнжил бүхий гоёмсог бэлэг багц. Baby shower-т тохиромжтой.",
      price: "89900",
      compareAtPrice: "109900",
      categoryId: insertedCategories[4]?.id,
      material: "100% Cotton",
      materialMn: "100% Хөвөн",
      ageRange: "0-3 months",
      featured: true,
      images: [],
    },
    {
      name: "Cute Animal Print Romper",
      nameMn: "Амьтны хээтэй ромпер",
      slug: "cute-animal-print-romper",
      description:
        "Adorable romper with cute animal prints. Breathable and comfortable for everyday wear.",
      descriptionMn:
        "Амьтны хөөрхөн хээтэй ромпер. Агаар сайн нэвтрүүлдэг, өдөр тутмын хэрэглээнд тохиромжтой.",
      price: "29900",
      categoryId: insertedCategories[0]?.id,
      material: "100% Cotton",
      materialMn: "100% Хөвөн",
      ageRange: "3-12 months",
      featured: false,
      images: [],
    },
    {
      name: "Baby Sock Set (5 Pack)",
      nameMn: "Нярайн оймсны багц (5 хос)",
      slug: "baby-sock-set-5-pack",
      description:
        "Set of 5 pairs of soft cotton socks with anti-slip dots. Various cute patterns.",
      descriptionMn:
        "5 хос зөөлөн хөвөн оймс. Гулгалтаас хамгаалсан цэгтэй, янз бүрийн хөөрхөн хээтэй.",
      price: "15900",
      categoryId: insertedCategories[3]?.id,
      material: "80% Cotton, 18% Polyester, 2% Spandex",
      materialMn: "80% Хөвөн, 18% Полиэстер, 2% Спандекс",
      ageRange: "0-24 months",
      featured: false,
      images: [],
    },
    {
      name: "Summer Linen Dress",
      nameMn: "Зуны маалинган даашинз",
      slug: "summer-linen-dress",
      description:
        "Light and breezy linen dress perfect for summer. Features adjustable straps.",
      descriptionMn:
        "Зунд тохиромжтой хөнгөн маалинган даашинз. Тохируулж болдог бүстэй.",
      price: "34900",
      categoryId: insertedCategories[2]?.id,
      material: "100% Linen",
      materialMn: "100% Маалинга",
      ageRange: "6-24 months",
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
    const sizes = ["NB", "0-3M", "3-6M", "6-9M", "9-12M", "12-18M"];
    return sizes.map((size) => ({
      productId: product.id,
      size,
      color: "White",
      colorMn: "Цагаан",
      stock: Math.floor(Math.random() * 20) + 5,
    }));
  });

  const insertedVariants = await db
    .insert(productVariants)
    .values(variantData)
    .returning();

  console.log(`✅ ${insertedVariants.length} variants created`);

  console.log("\n🎉 Seed completed!\n");
  console.log("Admin login: admin@pajama.mn / admin123\n");

  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});

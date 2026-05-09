import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  // Admin kullanıcı
  const adminPass = await argon2.hash("ChangeMe123!");
  await prisma.user.upsert({
    where: { email: "admin@markala.com.tr" },
    update: {},
    create: {
      email: "admin@markala.com.tr",
      passwordHash: adminPass,
      fullName: "Markala Admin",
      role: "admin",
    },
  });

  // Test kupon
  await prisma.coupon.upsert({
    where: { code: "HOSGELDIN" },
    update: {},
    create: {
      code: "HOSGELDIN",
      type: "percentage",
      value: 10,
      minOrderAmount: 0,
      isActive: true,
    },
  });

  // 3 örnek kategori (test için minimum)
  const categories = [
    {
      slug: "kartvizit",
      name: "Kartvizit",
      shortDescription: "Premium kâğıtlarda profesyonel kartvizit baskısı",
      longDescription: "İlk izleniminizi güçlendiren kartvizitler.",
      imageUrl: "/api/mockup/kartvizit?name=Kartvizit",
      startingPrice: 89,
      productionTime: "1-2 iş günü",
      sortOrder: 1,
    },
    {
      slug: "vinil-branda-afis",
      name: "Vinil Branda Afiş",
      shortDescription: "Dış mekan dayanıklı, su geçirmez branda baskı",
      longDescription: "440 ve 510 gr branda üzerine UV dayanıklı baskı.",
      imageUrl: "/api/mockup/vinil-branda-afis?name=Vinil%20Branda",
      startingPrice: 250,
      productionTime: "2-3 iş günü",
      sortOrder: 2,
    },
    {
      slug: "kupa",
      name: "Kupa",
      shortDescription: "Promosyon ve hediye için baskılı kupa",
      longDescription: "Beyaz veya renkli kupa, sublimasyon baskı.",
      imageUrl: "/api/mockup/kupa?name=Kupa",
      startingPrice: 45,
      productionTime: "2-3 iş günü",
      sortOrder: 3,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
  }

  console.log("✅ Seed tamamlandı:", {
    admin: "admin@markala.com.tr / ChangeMe123!",
    coupon: "HOSGELDIN (%10)",
    categories: categories.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

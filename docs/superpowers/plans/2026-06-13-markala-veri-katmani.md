# Markala Admin — Veri Katmanı Canlandırma (Faz 1) — Uygulama Planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mock-first admin panelini canlı Postgres veri katmanına bağla; mevcut gerçek sayfaları NestJS API üzerinden besle; admin auth'unu API JWT ile birleştir.

**Architecture:** `apps/admin` (Next.js, server-side BFF) → `@markala/api-client` (MarkalaApiClient, per-request access token) → `apps/api` (NestJS `/api/*`, JWT + RolesGuard) → Prisma → Postgres. Tarayıcı JWT tutmaz; admin'in httpOnly cookie'si access+refresh token taşır, refresh middleware'de proaktif yapılır.

**Tech Stack:** Next.js (App Router, edge middleware), NestJS, Prisma 5, PostgreSQL 16 (docker), vitest, argon2, pnpm workspace.

**Referans spec:** `docs/superpowers/specs/2026-06-13-markala-veri-katmani-design.md`

---

## Dosya Haritası

**Yeni dosyalar:**
- `apps/api/.env` — DB + JWT konfigürasyonu (lokal)
- `apps/api/src/hero-slides/{hero-slides.module,hero-slides.controller,hero-slides.service,hero-slides.dto}.ts` + `hero-slides.service.spec.ts`
- `apps/api/src/settings/{settings.module,settings.controller,settings.service,settings.dto}.ts` + `settings.service.spec.ts`
- `apps/api/src/corporate-applications/{corporate-applications.module,.controller,.service,.dto}.ts` + `.service.spec.ts`
- `apps/api/src/stats/{stats.module,stats.controller,stats.service}.ts` + `stats.service.spec.ts`
- `apps/api/src/users/users-admin.controller.ts`
- `apps/admin/src/lib/admin-session.ts` — saf cookie/token yardımcıları (test edilir)
- `apps/admin/src/lib/admin-session.spec.ts`
- `apps/admin/vitest.config.ts`
- `apps/admin/src/app/urunler/products-client.tsx` (+ benzer client child'lar wiring sırasında)

**Değişen dosyalar:**
- `apps/api/prisma/schema.prisma` — `HeroSlide` + `SiteSetting` modelleri
- `apps/api/prisma/seed.ts` — mock-data'dan genişletilmiş seed
- `apps/api/src/app.module.ts` — yeni modüllerin kaydı
- `apps/api/src/users/{users.service,users.module}.ts` — admin liste metotları
- `packages/api-client/src/index.ts` — yeni endpoint metotları
- `apps/admin/src/lib/admin-auth.ts` — şifre fonksiyonları kaldırılır, session şekli güncellenir
- `apps/admin/src/lib/api.ts` (yeni/yenilenir) — `getAdminSession`, `getAdminApi`
- `apps/admin/src/middleware.ts` — proaktif refresh
- `apps/admin/src/app/api/auth/{login,me,logout}/route.ts` — JWT proxy
- `apps/admin/src/app/api/auth/setup-hash/route.ts` — **silinir**
- `apps/admin/src/app/giris/page.tsx` — kurulum ipucu güncellenir
- `apps/admin/.env.example` — ADMIN_PASSWORD_HASH kaldırılır
- 8 admin sayfası (Group F)

**Kapsam dışı (Faz 2):** 7 placeholder form (banner, blog, kuponlar, sss, yasal, yorumlar, kampanya-paketleri), `apps/web` migrasyonu, seed'e örnek sipariş ekleme (gerçek sipariş akışı web'den oluşur).

---

## GROUP A — Temel: DB + env + migrate + seed

### Task 1: Postgres'i ayağa kaldır + API .env

**Files:**
- Create: `apps/api/.env`

- [ ] **Step 1: Postgres + Redis container'larını başlat**

Run: `docker compose up -d postgres redis`
Expected: `Container markala-postgres Started`, `Container markala-redis Started`

- [ ] **Step 2: Postgres sağlık kontrolü**

Run: `docker compose ps`
Expected: `markala-postgres` satırında `(healthy)`

- [ ] **Step 3: `apps/api/.env` oluştur**

```bash
cat > apps/api/.env <<'EOF'
DATABASE_URL="postgresql://markala:markala@localhost:5432/markala?schema=public"
JWT_SECRET="dev-local-secret-min-32-chars-0123456789abcd"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_EXPIRES_IN="7d"
WEB_ORIGIN="http://localhost:3000,http://localhost:3001"
PORT=4000
NODE_ENV="development"
EOF
```

- [ ] **Step 4: Doğrula**

Run: `cat apps/api/.env | grep -c DATABASE_URL`
Expected: `1`

---

### Task 2: HeroSlide + SiteSetting modellerini şemaya ekle

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (dosya sonuna ekleme)

- [ ] **Step 1: İki modeli şema sonuna ekle**

`apps/api/prisma/schema.prisma` dosyasının en sonuna ekle:

```prisma
// === Anasayfa slider ===
model HeroSlide {
  id             String   @id @default(cuid())
  title          String
  subtitle       String?
  imageUrl       String   @map("image_url")
  mobileImageUrl String?  @map("mobile_image_url")
  ctaLabel       String?  @map("cta_label")
  ctaHref        String?  @map("cta_href")
  sortOrder      Int      @default(0) @map("sort_order")
  isActive       Boolean  @default(true) @map("is_active")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  @@index([isActive, sortOrder])
  @@map("hero_slides")
}

// === Site ayarları (key-value) ===
model SiteSetting {
  key       String   @id
  value     Json
  group     String
  updatedAt DateTime @updatedAt @map("updated_at")

  @@index([group])
  @@map("site_settings")
}
```

- [ ] **Step 2: Şema formatını ve geçerliliğini doğrula**

Run: `pnpm --filter @markala/api exec prisma format`
Expected: `Formatted ...schema.prisma` ve hata yok

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/schema.prisma
git commit -m "feat(api): HeroSlide + SiteSetting Prisma modelleri"
```

---

### Task 3: İlk migration'ı üret ve uygula

**Files:**
- Create: `apps/api/prisma/migrations/*` (Prisma üretir)

- [ ] **Step 1: Migration üret + uygula (DB boş → tek init migration)**

Run: `pnpm --filter @markala/api exec prisma migrate dev --name init`
Expected: `Your database is now in sync with your schema.` ve `migrations/<timestamp>_init/migration.sql` oluşur

- [ ] **Step 2: Prisma client üretildi mi doğrula**

Run: `pnpm --filter @markala/api exec prisma generate`
Expected: `Generated Prisma Client`

- [ ] **Step 3: Tabloların oluştuğunu doğrula**

Run: `docker exec markala-postgres psql -U markala -d markala -c "\dt" | grep -E "hero_slides|site_settings|products|orders"`
Expected: `hero_slides`, `site_settings`, `products`, `orders` satırları listelenir

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/migrations
git commit -m "feat(api): init migration (24+2 model)"
```

---

### Task 4: Seed'i mock-data ile genişlet

**Files:**
- Modify: `apps/api/prisma/seed.ts` (tam yeniden yaz)

- [ ] **Step 1: `seed.ts`'i yeniden yaz**

`@markala/mock-data`'dan kategori + ürün + hero slide içe aktarıp upsert eder; Hasan'ı super_admin yapar; örnek müşteriler + temel ayarlar ekler. Tüm işlemler `upsert` → idempotent.

```typescript
import { PrismaClient, Prisma } from "@prisma/client";
import * as argon2 from "argon2";
import { categories as mockCategories, products as mockProducts, heroSlides } from "@markala/mock-data";

const prisma = new PrismaClient();

async function main() {
  // === Adminler ===
  await prisma.user.upsert({
    where: { email: "admin@markala.com.tr" },
    update: {},
    create: {
      email: "admin@markala.com.tr",
      passwordHash: await argon2.hash("ChangeMe123!"),
      fullName: "Markala Admin",
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "hasansylemezz@gmail.com" },
    update: { role: "super_admin" },
    create: {
      email: "hasansylemezz@gmail.com",
      passwordHash: await argon2.hash("Markala2026!"),
      fullName: "Hasan Söylemez",
      role: "super_admin",
    },
  });

  // === Örnek müşteriler (liste/dashboard boş görünmesin) ===
  const sampleCustomers = [
    { email: "ali@firma.com", fullName: "Ali Yıldız", phone: "+905330000000" },
    { email: "mehmet@kurumsal.com", fullName: "Mehmet Kara", phone: "+905340000000", accountType: "corporate" as const, companyName: "Kara Teknoloji A.Ş." },
    { email: "zeynep@gmail.com", fullName: "Zeynep Aksoy", phone: "+905350000000" },
  ];
  for (const c of sampleCustomers) {
    await prisma.user.upsert({
      where: { email: c.email },
      update: {},
      create: { ...c, passwordHash: await argon2.hash("Customer123!"), role: "customer" },
    });
  }

  // === Kategoriler (mock-data) ===
  for (const [i, cat] of mockCategories.entries()) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        shortDescription: cat.shortDescription,
        longDescription: cat.longDescription,
        imageUrl: cat.imageUrl,
        accentColor: cat.accentColor,
        startingPrice: new Prisma.Decimal(cat.startingPrice),
        productionTime: cat.productionTime,
        sortOrder: i,
      },
    });
  }

  // === Ürünler (mock-data) — categorySlug ile bağla ===
  let productCount = 0;
  for (const p of mockProducts) {
    const category = await prisma.category.findUnique({ where: { slug: p.categorySlug } });
    if (!category) {
      console.warn(`⚠ Ürün ${p.slug} için kategori bulunamadı: ${p.categorySlug} — atlanıyor`);
      continue;
    }
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        slug: p.slug,
        name: p.name,
        categoryId: category.id,
        shortDescription: p.shortDescription,
        description: p.description,
        basePrice: new Prisma.Decimal(p.basePrice),
        startingPrice: p.startingPrice !== undefined ? new Prisma.Decimal(p.startingPrice) : null,
        productionTime: p.productionTime,
        sizeLabel: p.sizeLabel ?? null,
        images: p.images ?? [],
        badges: (p as { badges?: string[] }).badges ?? [],
        bestseller: (p as { bestseller?: boolean }).bestseller ?? false,
        parameters: ((p as { parameters?: unknown }).parameters ?? []) as Prisma.InputJsonValue,
      },
    });
    productCount++;
  }

  // === Hero slides (mock-data) ===
  for (const [i, s] of heroSlides.entries()) {
    await prisma.heroSlide.upsert({
      where: { id: s.id },
      update: {},
      create: {
        id: s.id,
        title: s.title,
        subtitle: s.description,
        imageUrl: s.productImage,
        ctaLabel: s.ctaLabel,
        ctaHref: s.ctaHref,
        sortOrder: i,
      },
    });
  }

  // === Temel site ayarları ===
  const settings: Array<{ key: string; group: string; value: Prisma.InputJsonValue }> = [
    { key: "general.siteName", group: "general", value: "Markala" },
    { key: "general.siteUrl", group: "general", value: "https://markala.com.tr" },
    { key: "general.companyName", group: "general", value: "324 Ajans" },
    { key: "general.taxOffice", group: "general", value: "Yenişehir VD" },
    { key: "general.taxNumber", group: "general", value: "4270601001" },
    { key: "seo.defaultTitle", group: "seo", value: "Markala — Matbaa & Reklam Ürünleri" },
    { key: "seo.defaultDescription", group: "seo", value: "Online matbaa ve reklam ürünleri." },
  ];
  for (const s of settings) {
    await prisma.siteSetting.upsert({
      where: { key: s.key },
      update: { value: s.value, group: s.group },
      create: s,
    });
  }

  console.log("✅ Seed tamamlandı:", {
    admins: 2,
    customers: sampleCustomers.length,
    categories: mockCategories.length,
    products: productCount,
    heroSlides: heroSlides.length,
    settings: settings.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: `@markala/mock-data`'nın api'de erişilebilir olduğunu doğrula**

Run: `grep -E "@markala/mock-data" apps/api/package.json || echo "EKSIK"`
Expected: bağımlılık satırı görünür. `EKSIK` dönerse ekle:
Run: `pnpm --filter @markala/api add @markala/mock-data@workspace:*` ve tekrar dene.

- [ ] **Step 3: Seed'i çalıştır**

Run: `pnpm --filter @markala/api prisma:seed`
Expected: `✅ Seed tamamlandı:` ve `products` > 0

- [ ] **Step 4: Veriyi DB'de doğrula**

Run: `docker exec markala-postgres psql -U markala -d markala -c "SELECT count(*) FROM products;"`
Expected: count > 0

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/seed.ts apps/api/package.json
git commit -m "feat(api): mock-data tabanlı genişletilmiş seed"
```

---

### Task 5: API ayağa kalkıyor + gerçek veri dönüyor (smoke)

- [ ] **Step 1: API'yi başlat (ayrı terminalde)**

Run: `pnpm --filter @markala/api start:dev`
Expected: `Markala API: http://localhost:4000/api` log'u; hata yok

- [ ] **Step 2: Ürün endpoint'i gerçek seed verisi dönüyor mu**

Run: `curl -s http://localhost:4000/api/products | head -c 300`
Expected: JSON array, gerçek ürün slug'ları içeriyor

- [ ] **Step 3: Login çalışıyor mu (admin JWT)**

Run: `curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"hasansylemezz@gmail.com","password":"Markala2026!"}'`
Expected: `{"accessToken":"...","user":{...,"role":"super_admin"}}`

> Not: API bu adımdan sonra çalışır halde kalmalı (sonraki task'lar onu kullanır).

---

## GROUP C — Yeni API modülleri (TDD: vitest)

> Her modül `categories` modülünü şablon alır (controller guard deseni: public GET + `@Roles("admin","super_admin")` korumalı yazma). Servis testleri PrismaService'i düz mock obje ile değiştirir (DB gerektirmez).

### Task 6: HeroSlidesModule

**Files:**
- Create: `apps/api/src/hero-slides/hero-slides.dto.ts`
- Create: `apps/api/src/hero-slides/hero-slides.service.ts`
- Test: `apps/api/src/hero-slides/hero-slides.service.spec.ts`
- Create: `apps/api/src/hero-slides/hero-slides.controller.ts`
- Create: `apps/api/src/hero-slides/hero-slides.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Failing test yaz**

`apps/api/src/hero-slides/hero-slides.service.spec.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { HeroSlidesService } from "./hero-slides.service";

function mockPrisma() {
  return {
    heroSlide: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", title: "T", sortOrder: 0, isActive: true }]),
      create: vi.fn().mockImplementation(({ data }) => Promise.resolve({ id: "new", ...data })),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
      delete: vi.fn().mockResolvedValue({ id: "a" }),
    },
  };
}

describe("HeroSlidesService", () => {
  it("findAll yalnız aktifleri sortOrder'a göre döner (default)", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.findAll(false);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    expect(res).toHaveLength(1);
  });

  it("findAll(includeInactive=true) hepsini döner", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    await svc.findAll(true);
    expect(prisma.heroSlide.findMany).toHaveBeenCalledWith({ orderBy: { sortOrder: "asc" } });
  });

  it("create dto'yu prisma'ya iletir", async () => {
    const prisma = mockPrisma();
    const svc = new HeroSlidesService(prisma as never);
    const res = await svc.create({ title: "Yeni", imageUrl: "/x.jpg" });
    expect(res.title).toBe("Yeni");
  });
});
```

- [ ] **Step 2: Test'in fail ettiğini doğrula**

Run: `pnpm --filter @markala/api exec vitest run src/hero-slides`
Expected: FAIL — `Cannot find module './hero-slides.service'`

- [ ] **Step 3: DTO yaz**

`apps/api/src/hero-slides/hero-slides.dto.ts`:

```typescript
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator";

export class CreateHeroSlideDto {
  @IsString() @MinLength(2) @MaxLength(160)
  title!: string;

  @IsString() @IsOptional() @MaxLength(280)
  subtitle?: string;

  @IsString() @MaxLength(500)
  imageUrl!: string;

  @IsString() @IsOptional() @MaxLength(500)
  mobileImageUrl?: string;

  @IsString() @IsOptional() @MaxLength(80)
  ctaLabel?: string;

  @IsString() @IsOptional() @MaxLength(500)
  ctaHref?: string;

  @IsInt() @IsOptional() @Min(0)
  sortOrder?: number;

  @IsBoolean() @IsOptional()
  isActive?: boolean;
}

export class UpdateHeroSlideDto {
  @IsString() @IsOptional() @MinLength(2) @MaxLength(160)
  title?: string;
  @IsString() @IsOptional() @MaxLength(280)
  subtitle?: string;
  @IsString() @IsOptional() @MaxLength(500)
  imageUrl?: string;
  @IsString() @IsOptional() @MaxLength(500)
  mobileImageUrl?: string;
  @IsString() @IsOptional() @MaxLength(80)
  ctaLabel?: string;
  @IsString() @IsOptional() @MaxLength(500)
  ctaHref?: string;
  @IsInt() @IsOptional() @Min(0)
  sortOrder?: number;
  @IsBoolean() @IsOptional()
  isActive?: boolean;
}
```

- [ ] **Step 4: Service yaz**

`apps/api/src/hero-slides/hero-slides.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHeroSlideDto, UpdateHeroSlideDto } from "./hero-slides.dto";

@Injectable()
export class HeroSlidesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.heroSlide.findMany({
      ...(includeInactive ? {} : { where: { isActive: true } }),
      orderBy: { sortOrder: "asc" },
    });
  }

  create(dto: CreateHeroSlideDto) {
    return this.prisma.heroSlide.create({ data: dto as Prisma.HeroSlideCreateInput });
  }

  update(id: string, dto: UpdateHeroSlideDto) {
    return this.prisma.heroSlide.update({ where: { id }, data: dto as Prisma.HeroSlideUpdateInput });
  }

  remove(id: string) {
    return this.prisma.heroSlide.delete({ where: { id } });
  }
}
```

- [ ] **Step 5: Test geçiyor mu**

Run: `pnpm --filter @markala/api exec vitest run src/hero-slides`
Expected: PASS (3 test)

- [ ] **Step 6: Controller yaz**

`apps/api/src/hero-slides/hero-slides.controller.ts`:

```typescript
import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { HeroSlidesService } from "./hero-slides.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { CreateHeroSlideDto, UpdateHeroSlideDto } from "./hero-slides.dto";

@ApiTags("hero-slides")
@Controller("hero-slides")
export class HeroSlidesController {
  constructor(private service: HeroSlidesService) {}

  @Get()
  list(@Query("includeInactive") includeInactive?: string) {
    return this.service.findAll(includeInactive === "true");
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  create(@Body() dto: CreateHeroSlideDto) {
    return this.service.create(dto);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  update(@Param("id") id: string, @Body() dto: UpdateHeroSlideDto) {
    return this.service.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  remove(@Param("id") id: string) {
    return this.service.remove(id);
  }
}
```

- [ ] **Step 7: Module yaz**

`apps/api/src/hero-slides/hero-slides.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { HeroSlidesController } from "./hero-slides.controller";
import { HeroSlidesService } from "./hero-slides.service";

@Module({
  controllers: [HeroSlidesController],
  providers: [HeroSlidesService],
})
export class HeroSlidesModule {}
```

- [ ] **Step 8: app.module.ts'e kaydet**

`apps/api/src/app.module.ts` — import ekle ve `imports` dizisine `HeroSlidesModule` ekle:

```typescript
import { HeroSlidesModule } from "./hero-slides/hero-slides.module";
// ... imports dizisinde OrdersModule'den sonra:
    HeroSlidesModule,
```

- [ ] **Step 9: Smoke — endpoint çalışıyor**

Run: `curl -s http://localhost:4000/api/hero-slides | head -c 200`
Expected: seed'lenmiş slide'ları içeren JSON array

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/hero-slides apps/api/src/app.module.ts
git commit -m "feat(api): hero-slides modülü (CRUD + admin guard)"
```

---

### Task 7: SettingsModule

**Files:**
- Create: `apps/api/src/settings/settings.dto.ts`
- Create: `apps/api/src/settings/settings.service.ts`
- Test: `apps/api/src/settings/settings.service.spec.ts`
- Create: `apps/api/src/settings/settings.controller.ts`
- Create: `apps/api/src/settings/settings.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Failing test yaz**

`apps/api/src/settings/settings.service.spec.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { SettingsService } from "./settings.service";

function mockPrisma() {
  return {
    siteSetting: {
      findMany: vi.fn().mockResolvedValue([
        { key: "general.siteName", value: "Markala", group: "general" },
      ]),
      upsert: vi.fn().mockImplementation(({ create }) => Promise.resolve(create)),
    },
  };
}

describe("SettingsService", () => {
  it("findByGroup group filtresi uygular", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    const res = await svc.findByGroup("general");
    expect(prisma.siteSetting.findMany).toHaveBeenCalledWith({ where: { group: "general" } });
    expect(res).toEqual({ "general.siteName": "Markala" });
  });

  it("findByGroup group yoksa hepsini döner", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    await svc.findByGroup();
    expect(prisma.siteSetting.findMany).toHaveBeenCalledWith({});
  });

  it("upsertMany her anahtarı upsert eder", async () => {
    const prisma = mockPrisma();
    const svc = new SettingsService(prisma as never);
    await svc.upsertMany("general", { "general.siteName": "Yeni", "general.siteUrl": "x" });
    expect(prisma.siteSetting.upsert).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm --filter @markala/api exec vitest run src/settings`
Expected: FAIL — module not found

- [ ] **Step 3: DTO yaz**

`apps/api/src/settings/settings.dto.ts`:

```typescript
import { IsObject, IsString, MinLength } from "class-validator";

export class UpsertSettingsDto {
  @IsString() @MinLength(1)
  group!: string;

  /** { "general.siteName": "Markala", ... } — değerler JSON-serileştirilebilir */
  @IsObject()
  values!: Record<string, unknown>;
}
```

- [ ] **Step 4: Service yaz**

`apps/api/src/settings/settings.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async findByGroup(group?: string): Promise<Record<string, unknown>> {
    const rows = await this.prisma.siteSetting.findMany(group ? { where: { group } } : {});
    return Object.fromEntries(rows.map((r) => [r.key, r.value]));
  }

  async upsertMany(group: string, values: Record<string, unknown>) {
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        this.prisma.siteSetting.upsert({
          where: { key },
          update: { value: value as Prisma.InputJsonValue, group },
          create: { key, value: value as Prisma.InputJsonValue, group },
        }),
      ),
    );
    return this.findByGroup(group);
  }
}
```

- [ ] **Step 5: Test geçiyor mu**

Run: `pnpm --filter @markala/api exec vitest run src/settings`
Expected: PASS (3 test)

- [ ] **Step 6: Controller yaz**

`apps/api/src/settings/settings.controller.ts`:

```typescript
import { Controller, Get, Patch, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { SettingsService } from "./settings.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { UpsertSettingsDto } from "./settings.dto";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private service: SettingsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  get(@Query("group") group?: string) {
    return this.service.findByGroup(group);
  }

  @Patch()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  upsert(@Body() dto: UpsertSettingsDto) {
    return this.service.upsertMany(dto.group, dto.values);
  }
}
```

- [ ] **Step 7: Module yaz + kaydet**

`apps/api/src/settings/settings.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { SettingsController } from "./settings.controller";
import { SettingsService } from "./settings.service";

@Module({
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
```

`apps/api/src/app.module.ts` — `import { SettingsModule } from "./settings/settings.module";` ekle ve imports dizisine `SettingsModule` ekle.

- [ ] **Step 8: Smoke (token gerektirir)**

Run:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"hasansylemezz@gmail.com","password":"Markala2026!"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
curl -s http://localhost:4000/api/settings?group=general -H "Authorization: Bearer $TOKEN" | head -c 200
```
Expected: `{"general.siteName":"Markala",...}`

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/settings apps/api/src/app.module.ts
git commit -m "feat(api): settings modülü (key-value, admin guard)"
```

---

### Task 8: CorporateApplicationsModule

**Files:**
- Create: `apps/api/src/corporate-applications/corporate-applications.dto.ts`
- Create: `apps/api/src/corporate-applications/corporate-applications.service.ts`
- Test: `apps/api/src/corporate-applications/corporate-applications.service.spec.ts`
- Create: `apps/api/src/corporate-applications/corporate-applications.controller.ts`
- Create: `apps/api/src/corporate-applications/corporate-applications.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Failing test yaz**

`apps/api/src/corporate-applications/corporate-applications.service.spec.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { CorporateApplicationsService } from "./corporate-applications.service";

function mockPrisma() {
  return {
    corporateApplication: {
      findMany: vi.fn().mockResolvedValue([{ id: "a", status: "pending", companyName: "X" }]),
      update: vi.fn().mockImplementation(({ where, data }) => Promise.resolve({ id: where.id, ...data })),
    },
  };
}

describe("CorporateApplicationsService", () => {
  it("findAll status filtresi uygular", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    await svc.findAll("pending");
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
    });
  });

  it("findAll status yoksa filtre koymaz", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    await svc.findAll();
    expect(prisma.corporateApplication.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: "desc" },
    });
  });

  it("setStatus status'u günceller", async () => {
    const prisma = mockPrisma();
    const svc = new CorporateApplicationsService(prisma as never);
    const res = await svc.setStatus("a", "approved");
    expect(res.status).toBe("approved");
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm --filter @markala/api exec vitest run src/corporate-applications`
Expected: FAIL — module not found

- [ ] **Step 3: DTO yaz**

`apps/api/src/corporate-applications/corporate-applications.dto.ts`:

```typescript
import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class SetCorporateStatusDto {
  @IsIn(["approved", "rejected", "pending"])
  status!: "approved" | "rejected" | "pending";

  @IsString() @IsOptional() @MaxLength(1000)
  reviewNote?: string;
}
```

- [ ] **Step 4: Service yaz**

`apps/api/src/corporate-applications/corporate-applications.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { CorporateStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CorporateApplicationsService {
  constructor(private prisma: PrismaService) {}

  findAll(status?: string) {
    return this.prisma.corporateApplication.findMany({
      where: status ? { status: status as CorporateStatus } : {},
      orderBy: { createdAt: "desc" },
    });
  }

  setStatus(id: string, status: "approved" | "rejected" | "pending", reviewNote?: string) {
    return this.prisma.corporateApplication.update({
      where: { id },
      data: { status: status as CorporateStatus, ...(reviewNote !== undefined && { notes: reviewNote }) },
    });
  }
}
```

- [ ] **Step 5: Test geçiyor mu**

Run: `pnpm --filter @markala/api exec vitest run src/corporate-applications`
Expected: PASS (3 test)

- [ ] **Step 6: Controller yaz**

`apps/api/src/corporate-applications/corporate-applications.controller.ts`:

```typescript
import { Controller, Get, Patch, Param, Query, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { CorporateApplicationsService } from "./corporate-applications.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { SetCorporateStatusDto } from "./corporate-applications.dto";

@ApiTags("corporate-applications")
@Controller("corporate-applications")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CorporateApplicationsController {
  constructor(private service: CorporateApplicationsService) {}

  @Get()
  list(@Query("status") status?: string) {
    return this.service.findAll(status);
  }

  @Patch(":id")
  setStatus(@Param("id") id: string, @Body() dto: SetCorporateStatusDto) {
    return this.service.setStatus(id, dto.status, dto.reviewNote);
  }
}
```

- [ ] **Step 7: Module yaz + kaydet**

`apps/api/src/corporate-applications/corporate-applications.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { CorporateApplicationsController } from "./corporate-applications.controller";
import { CorporateApplicationsService } from "./corporate-applications.service";

@Module({
  controllers: [CorporateApplicationsController],
  providers: [CorporateApplicationsService],
})
export class CorporateApplicationsModule {}
```

`apps/api/src/app.module.ts` — import + imports dizisine `CorporateApplicationsModule` ekle.

- [ ] **Step 8: Smoke**

Run:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"hasansylemezz@gmail.com","password":"Markala2026!"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
curl -s http://localhost:4000/api/corporate-applications -H "Authorization: Bearer $TOKEN"
```
Expected: `[]` (seed'de başvuru yok) — 200, hata yok

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/corporate-applications apps/api/src/app.module.ts
git commit -m "feat(api): corporate-applications modülü (liste + onay/red)"
```

---

### Task 9: Dashboard stats endpoint

**Files:**
- Create: `apps/api/src/stats/stats.service.ts`
- Test: `apps/api/src/stats/stats.service.spec.ts`
- Create: `apps/api/src/stats/stats.controller.ts`
- Create: `apps/api/src/stats/stats.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Failing test yaz**

`apps/api/src/stats/stats.service.spec.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { StatsService } from "./stats.service";

function mockPrisma() {
  return {
    order: {
      count: vi.fn().mockResolvedValue(5),
      aggregate: vi.fn().mockResolvedValue({ _sum: { total: 1200 } }),
      groupBy: vi.fn().mockResolvedValue([{ status: "uretimde", _count: 3 }]),
    },
    user: { count: vi.fn().mockResolvedValue(8) },
    corporateApplication: { count: vi.fn().mockResolvedValue(2) },
  };
}

describe("StatsService", () => {
  it("özet sayıları derler", async () => {
    const prisma = mockPrisma();
    const svc = new StatsService(prisma as never);
    const res = await svc.summary();
    expect(res.orderCount).toBe(5);
    expect(res.revenue).toBe(1200);
    expect(res.customerCount).toBe(8);
    expect(res.pendingCorporate).toBe(2);
    expect(res.ordersByStatus).toEqual([{ status: "uretimde", count: 3 }]);
  });

  it("ciro null ise 0 döner", async () => {
    const prisma = mockPrisma();
    prisma.order.aggregate = vi.fn().mockResolvedValue({ _sum: { total: null } });
    const svc = new StatsService(prisma as never);
    const res = await svc.summary();
    expect(res.revenue).toBe(0);
  });
});
```

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm --filter @markala/api exec vitest run src/stats`
Expected: FAIL — module not found

- [ ] **Step 3: Service yaz**

`apps/api/src/stats/stats.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [orderCount, revenueAgg, customerCount, pendingCorporate, byStatus] = await Promise.all([
      this.prisma.order.count({ where: { deletedAt: null } }),
      this.prisma.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "basarili", deletedAt: null } }),
      this.prisma.user.count({ where: { role: "customer" } }),
      this.prisma.corporateApplication.count({ where: { status: "pending" } }),
      this.prisma.order.groupBy({ by: ["status"], _count: true, where: { deletedAt: null } }),
    ]);

    return {
      orderCount,
      revenue: Number(revenueAgg._sum.total ?? 0),
      customerCount,
      pendingCorporate,
      ordersByStatus: byStatus.map((r) => ({ status: r.status, count: r._count })),
    };
  }
}
```

- [ ] **Step 4: Test geçiyor mu**

Run: `pnpm --filter @markala/api exec vitest run src/stats`
Expected: PASS (2 test)

- [ ] **Step 5: Controller + Module yaz**

`apps/api/src/stats/stats.controller.ts`:

```typescript
import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { StatsService } from "./stats.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("admin-stats")
@Controller("admin/stats")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class StatsController {
  constructor(private service: StatsService) {}

  @Get()
  summary() {
    return this.service.summary();
  }
}
```

`apps/api/src/stats/stats.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";

@Module({
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
```

`apps/api/src/app.module.ts` — import + imports dizisine `StatsModule` ekle.

- [ ] **Step 6: Smoke**

Run:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"hasansylemezz@gmail.com","password":"Markala2026!"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
curl -s http://localhost:4000/api/admin/stats -H "Authorization: Bearer $TOKEN"
```
Expected: `{"orderCount":0,"revenue":0,"customerCount":3,...}`

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/stats apps/api/src/app.module.ts
git commit -m "feat(api): admin dashboard stats endpoint"
```

---

### Task 10: Admin için müşteri (users) listesi

**Files:**
- Modify: `apps/api/src/users/users.service.ts` (admin metotları ekle)
- Test: `apps/api/src/users/users-admin.service.spec.ts`
- Create: `apps/api/src/users/users-admin.controller.ts`
- Modify: `apps/api/src/users/users.module.ts`

- [ ] **Step 1: Failing test yaz**

`apps/api/src/users/users-admin.service.spec.ts`:

```typescript
import { describe, it, expect, vi } from "vitest";
import { UsersService } from "./users.service";

function mockPrisma() {
  return {
    user: {
      findMany: vi.fn().mockResolvedValue([{ id: "u1", email: "a@b.c", fullName: "A", _count: { orders: 2 } }]),
      findUnique: vi.fn().mockResolvedValue({ id: "u1", email: "a@b.c" }),
    },
  };
}

describe("UsersService admin metotları", () => {
  it("listForAdmin müşterileri sayımla döner", async () => {
    const prisma = mockPrisma();
    const svc = new UsersService(prisma as never);
    const res = await svc.listForAdmin({ take: 50, skip: 0 });
    expect(prisma.user.findMany).toHaveBeenCalled();
    expect(res[0].orderCount).toBe(2);
  });

  it("getForAdmin tek kullanıcı döner", async () => {
    const prisma = mockPrisma();
    const svc = new UsersService(prisma as never);
    const res = await svc.getForAdmin("u1");
    expect(res?.id).toBe("u1");
  });
});
```

> Not: `UsersService` constructor imzasını kontrol et — `constructor(private prisma: PrismaService)` değilse testteki kurulumu ona uydur.

- [ ] **Step 2: Test fail doğrula**

Run: `pnpm --filter @markala/api exec vitest run src/users/users-admin.service.spec.ts`
Expected: FAIL — `svc.listForAdmin is not a function`

- [ ] **Step 3: Service metotlarını ekle**

`apps/api/src/users/users.service.ts` — sınıf içine ekle:

```typescript
  async listForAdmin(opts: { take?: number; skip?: number; q?: string } = {}) {
    const rows = await this.prisma.user.findMany({
      where: opts.q
        ? { OR: [{ email: { contains: opts.q, mode: "insensitive" } }, { fullName: { contains: opts.q, mode: "insensitive" } }] }
        : {},
      select: {
        id: true, email: true, fullName: true, phone: true, accountType: true,
        companyName: true, role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
    return rows.map(({ _count, ...u }) => ({ ...u, orderCount: _count.orders }));
  }

  getForAdmin(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, phone: true, accountType: true,
        companyName: true, taxOffice: true, taxNumber: true, role: true,
        corporateStatus: true, createdAt: true, lastLoginAt: true,
      },
    });
  }
```

> Not: `User` modelinde `orders` ilişki adını doğrula (`Order[]` alanı). Farklıysa `_count.select.orders` adını ona göre düzelt.

- [ ] **Step 4: Test geçiyor mu**

Run: `pnpm --filter @markala/api exec vitest run src/users/users-admin.service.spec.ts`
Expected: PASS (2 test)

- [ ] **Step 5: Admin controller yaz**

`apps/api/src/users/users-admin.controller.ts`:

```typescript
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("admin-users")
@Controller("admin/users")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class UsersAdminController {
  constructor(private service: UsersService) {}

  @Get()
  list(@Query("take") take?: string, @Query("skip") skip?: string, @Query("q") q?: string) {
    return this.service.listForAdmin({
      take: take ? parseInt(take) : undefined,
      skip: skip ? parseInt(skip) : undefined,
      q,
    });
  }

  @Get(":id")
  detail(@Param("id") id: string) {
    return this.service.getForAdmin(id);
  }
}
```

- [ ] **Step 6: Module'e controller'ı ekle**

`apps/api/src/users/users.module.ts` — `controllers` dizisine `UsersAdminController` ekle (import et).

- [ ] **Step 7: Smoke**

Run:
```bash
TOKEN=$(curl -s -X POST http://localhost:4000/api/auth/login -H "Content-Type: application/json" -d '{"email":"hasansylemezz@gmail.com","password":"Markala2026!"}' | sed -n 's/.*"accessToken":"\([^"]*\)".*/\1/p')
curl -s "http://localhost:4000/api/admin/users?take=10" -H "Authorization: Bearer $TOKEN" | head -c 300
```
Expected: müşterileri içeren JSON array, her birinde `orderCount`

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/users
git commit -m "feat(api): admin müşteri listesi endpoint'i"
```

---

## GROUP D — api-client genişletme

### Task 11: MarkalaApiClient'a yeni endpoint metotları

**Files:**
- Modify: `packages/api-client/src/index.ts`

- [ ] **Step 1: İmport ve yeni metot bloklarını ekle**

`packages/api-client/src/index.ts` — `users = {...}` bloğundan sonra, sınıf içine ekle:

```typescript
  // === Hero slides ===
  heroSlides = {
    list: (includeInactive = false) =>
      this.request<HeroSlideDto[]>("GET", "/hero-slides", undefined, { query: { includeInactive } }),
    create: (data: Partial<HeroSlideDto>) =>
      this.request<HeroSlideDto>("POST", "/hero-slides", data, { auth: true }),
    update: (id: string, data: Partial<HeroSlideDto>) =>
      this.request<HeroSlideDto>("PATCH", `/hero-slides/${id}`, data, { auth: true }),
    remove: (id: string) =>
      this.request<void>("DELETE", `/hero-slides/${id}`, undefined, { auth: true }),
  };

  // === Settings ===
  settings = {
    get: (group?: string) =>
      this.request<Record<string, unknown>>("GET", "/settings", undefined, { auth: true, query: { group } }),
    upsert: (group: string, values: Record<string, unknown>) =>
      this.request<Record<string, unknown>>("PATCH", "/settings", { group, values }, { auth: true }),
  };

  // === Corporate applications ===
  corporateApplications = {
    list: (status?: string) =>
      this.request<CorporateApplicationDto[]>("GET", "/corporate-applications", undefined, { auth: true, query: { status } }),
    setStatus: (id: string, body: { status: "approved" | "rejected" | "pending"; reviewNote?: string }) =>
      this.request<CorporateApplicationDto>("PATCH", `/corporate-applications/${id}`, body, { auth: true }),
  };

  // === Admin: users + stats ===
  adminUsers = {
    list: (opts: { take?: number; skip?: number; q?: string } = {}) =>
      this.request<AdminUserDto[]>("GET", "/admin/users", undefined, { auth: true, query: opts }),
    detail: (id: string) =>
      this.request<AdminUserDto>("GET", `/admin/users/${id}`, undefined, { auth: true }),
  };

  adminStats = () =>
    this.request<AdminStatsDto>("GET", "/admin/stats", undefined, { auth: true });
```

- [ ] **Step 2: Tip tanımlarını dosya sonuna ekle (export'lardan önce)**

```typescript
export interface HeroSlideDto {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  mobileImageUrl?: string | null;
  ctaLabel?: string | null;
  ctaHref?: string | null;
  sortOrder: number;
  isActive: boolean;
}

export interface CorporateApplicationDto {
  id: string;
  companyName: string;
  taxOffice: string;
  taxNumber: string;
  contactName: string;
  email: string;
  phone: string;
  status: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface AdminUserDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
  accountType: "individual" | "corporate";
  companyName?: string | null;
  role: "customer" | "admin" | "super_admin";
  orderCount?: number;
  createdAt: string;
}

export interface AdminStatsDto {
  orderCount: number;
  revenue: number;
  customerCount: number;
  pendingCorporate: number;
  ordersByStatus: Array<{ status: string; count: number }>;
}
```

- [ ] **Step 3: Tip kontrolü**

Run: `pnpm --filter @markala/api-client type-check` (yoksa `pnpm --filter @markala/api-client exec tsc --noEmit`)
Expected: hata yok

- [ ] **Step 4: Commit**

```bash
git add packages/api-client/src/index.ts
git commit -m "feat(api-client): hero-slides, settings, corporate-apps, admin users/stats metotları"
```

---

## GROUP E — Admin auth: HMAC → JWT (BFF)

### Task 12: Admin'e vitest + saf session yardımcıları

**Files:**
- Create: `apps/admin/vitest.config.ts`
- Modify: `apps/admin/package.json` (test script + devDeps)
- Create: `apps/admin/src/lib/admin-session.ts`
- Test: `apps/admin/src/lib/admin-session.spec.ts`

- [ ] **Step 1: vitest'i admin'e ekle**

Run: `pnpm --filter @markala/admin add -D vitest`
Expected: kurulum başarılı

- [ ] **Step 2: vitest config + test script**

`apps/admin/vitest.config.ts`:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: { environment: "node", include: ["src/**/*.spec.ts"] },
});
```

`apps/admin/package.json` — `scripts` içine ekle: `"test": "vitest run"`.

- [ ] **Step 3: Failing test yaz**

`apps/admin/src/lib/admin-session.spec.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { signSession, verifySession, getJwtExp, needsRefresh, type AdminSession } from "./admin-session";

const SECRET = "test-secret-min-32-characters-長0123456789";

// exp = 9999999999 (uzak gelecek) içeren sahte JWT (imza doğrulanmaz, sadece payload okunur)
function fakeJwt(exp: number): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(JSON.stringify({ sub: "1", exp })).toString("base64url");
  return `${header}.${payload}.sig`;
}

const session: AdminSession = {
  accessToken: fakeJwt(9999999999),
  refreshToken: "refresh-abc",
  email: "a@b.c",
  name: "A",
  role: "super_admin",
  iat: 1000,
};

describe("admin-session", () => {
  it("signSession + verifySession round-trip", async () => {
    const token = await signSession(session, SECRET);
    const back = await verifySession(token, SECRET);
    expect(back?.email).toBe("a@b.c");
    expect(back?.accessToken).toBe(session.accessToken);
  });

  it("bozuk imza null döner", async () => {
    const token = await signSession(session, SECRET);
    const tampered = token.slice(0, -2) + "xx";
    expect(await verifySession(tampered, SECRET)).toBeNull();
  });

  it("getJwtExp payload'tan exp okur", () => {
    expect(getJwtExp(fakeJwt(1700000000))).toBe(1700000000);
  });

  it("needsRefresh süresi yakın token için true", () => {
    expect(needsRefresh(fakeJwt(0))).toBe(true);
    expect(needsRefresh(fakeJwt(9999999999))).toBe(false);
  });
});
```

- [ ] **Step 4: Test fail doğrula**

Run: `pnpm --filter @markala/admin test`
Expected: FAIL — `./admin-session` bulunamadı

- [ ] **Step 5: `admin-session.ts` yaz (edge-safe, Web Crypto)**

`apps/admin/src/lib/admin-session.ts`:

```typescript
/**
 * Admin session — Web Crypto HMAC ile imzalı cookie payload'ı.
 * Payload artık API JWT'sini taşır (accessToken + refreshToken).
 * Edge runtime uyumlu (Buffer yok, atob/btoa + TextEncoder).
 */

export interface AdminSession {
  accessToken: string;   // API JWT (15dk)
  refreshToken: string;  // API mk_refresh ham değeri (30 gün)
  email: string;
  name: string;
  role: "admin" | "super_admin";
  iat: number; // saniye
}

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (let i = 0; i < arr.length; i++) s += String.fromCharCode(arr[i]!);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlDecodeToString(str: string): string {
  const pad = str.length % 4 === 0 ? "" : "=".repeat(4 - (str.length % 4));
  const b64 = (str + pad).replace(/-/g, "+").replace(/_/g, "/");
  return atob(b64);
}

async function hmac(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return b64urlEncode(sig);
}

export async function signSession(session: AdminSession, secret: string): Promise<string> {
  const payload = b64urlEncode(enc.encode(JSON.stringify(session)));
  const sig = await hmac(payload, secret);
  return `${payload}.${sig}`;
}

export async function verifySession(token: string | undefined, secret: string): Promise<AdminSession | null> {
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = await hmac(payload, secret);
  if (expected.length !== sig.length) return null;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  if (diff !== 0) return null;
  try {
    return JSON.parse(b64urlDecodeToString(payload)) as AdminSession;
  } catch {
    return null;
  }
}

/** JWT payload'ındaki exp (saniye) — imza doğrulanmaz, sadece okunur. */
export function getJwtExp(jwt: string): number | null {
  try {
    const payload = jwt.split(".")[1];
    if (!payload) return null;
    const data = JSON.parse(b64urlDecodeToString(payload)) as { exp?: number };
    return data.exp ?? null;
  } catch {
    return null;
  }
}

/** Access token 60 sn içinde dolacaksa (veya exp okunamıyorsa) refresh gerekir. */
export function needsRefresh(jwt: string, nowSeconds = Math.floor(Date.now() / 1000)): boolean {
  const exp = getJwtExp(jwt);
  if (exp === null) return true;
  return exp - nowSeconds < 60;
}

export const SESSION_COOKIE = "markala_admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 gün
```

- [ ] **Step 6: Test geçiyor mu**

Run: `pnpm --filter @markala/admin test`
Expected: PASS (4 test)

- [ ] **Step 7: Commit**

```bash
git add apps/admin/vitest.config.ts apps/admin/package.json apps/admin/src/lib/admin-session.ts apps/admin/src/lib/admin-session.spec.ts
git commit -m "feat(admin): JWT taşıyan imzalı session yardımcıları + vitest"
```

---

### Task 13: Login route'u API JWT proxy'ye çevir

**Files:**
- Modify: `apps/admin/src/app/api/auth/login/route.ts`

- [ ] **Step 1: Login route'u yeniden yaz**

`apps/admin/src/app/api/auth/login/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { signSession, SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession } from "@/lib/admin-session";

export const runtime = "nodejs"; // getSetCookie + fetch; nodejs en güvenli

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function parseRefreshFromSetCookie(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m) return decodeURIComponent(m[1]!);
  }
  return null;
}

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }
  const { email, password } = body;
  if (!email || !password) {
    return NextResponse.json({ error: "E-posta ve şifre zorunlu." }, { status: 400 });
  }

  let apiRes: Response;
  try {
    apiRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return NextResponse.json({ error: "API'ye ulaşılamadı." }, { status: 502 });
  }

  const data = (await apiRes.json().catch(() => ({}))) as {
    accessToken?: string;
    user?: { email: string; role: string };
    message?: string;
  };

  if (!apiRes.ok || !data.accessToken || !data.user) {
    return NextResponse.json({ error: data.message ?? "Giriş başarısız." }, { status: apiRes.status || 401 });
  }

  if (data.user.role !== "admin" && data.user.role !== "super_admin") {
    return NextResponse.json({ error: "Bu hesabın yönetim paneline erişim yetkisi yok." }, { status: 403 });
  }

  const refreshToken = parseRefreshFromSetCookie(apiRes.headers.getSetCookie?.() ?? []) ?? "";

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) {
    return NextResponse.json({ error: "ADMIN_SESSION_SECRET eksik/kısa." }, { status: 500 });
  }

  const session: AdminSession = {
    accessToken: data.accessToken,
    refreshToken,
    email: data.user.email,
    name: data.user.email,
    role: data.user.role as "admin" | "super_admin",
    iat: Math.floor(Date.now() / 1000),
  };
  const token = await signSession(session, secret);

  const res = NextResponse.json({ ok: true, user: { email: session.email, role: session.role } });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}
```

> Not: API login `5/dk/IP` throttle'lıdır; geliştirme sırasında çok denersen 429 görebilirsin.

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/app/api/auth/login/route.ts
git commit -m "feat(admin): login route API JWT proxy'ye çevrildi"
```

---

### Task 14: `lib/api.ts` — getAdminSession + getAdminApi

**Files:**
- Create/replace: `apps/admin/src/lib/api.ts`

- [ ] **Step 0: `server-only` paketi kurulu mu**

Run: `grep -q '"server-only"' apps/admin/package.json && echo VAR || pnpm --filter @markala/admin add server-only`
Expected: `VAR` ya da kurulum tamamlanır

- [ ] **Step 1: `lib/api.ts` yaz**

`apps/admin/src/lib/api.ts`:

```typescript
import "server-only";
import { cookies } from "next/headers";
import { MarkalaApiClient } from "@markala/api-client";
import { verifySession, SESSION_COOKIE, type AdminSession } from "./admin-session";

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/** Geçerli admin oturumunu cookie'den çöz (RSC/route handler). */
export async function getAdminSession(): Promise<AdminSession | null> {
  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, secret);
}

/**
 * Per-request typed API client. accessToken cookie'den okunur.
 * Token tazeliği middleware tarafından garanti edilir (proaktif refresh).
 */
export async function getAdminApi(): Promise<MarkalaApiClient> {
  const session = await getAdminSession();
  return new MarkalaApiClient({
    baseUrl: API_URL,
    getToken: () => session?.accessToken,
  });
}
```

> Not: `cookies()` Next 15'te `Promise` döner — `await` ile kullan. Eğer projede Next 14 ise `await`'i kaldır. Versiyonu `grep '"next"' apps/admin/package.json` ile doğrula.

- [ ] **Step 2: Tip kontrolü**

Run: `pnpm --filter @markala/admin type-check`
Expected: `lib/api.ts` kaynaklı hata yok (sayfalar henüz eski mock kullanıyorsa onlar ayrı)

- [ ] **Step 3: Commit**

```bash
git add apps/admin/src/lib/api.ts
git commit -m "feat(admin): getAdminSession + getAdminApi (server-side BFF)"
```

---

### Task 15: Middleware — doğrulama + proaktif refresh

**Files:**
- Modify: `apps/admin/src/middleware.ts`

- [ ] **Step 1: Middleware'i yeniden yaz**

`apps/admin/src/middleware.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import {
  signSession, verifySession, needsRefresh,
  SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession,
} from "@/lib/admin-session";

const PUBLIC_PATHS = ["/giris", "/api/auth/login"];
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

function parseRefreshFromSetCookie(setCookies: string[]): string | null {
  for (const c of setCookies) {
    const m = c.match(/(?:^|;\s*)mk_refresh=([^;]+)/);
    if (m) return decodeURIComponent(m[1]!);
  }
  return null;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon") || pathname === "/robots.txt") {
    return NextResponse.next();
  }
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const secret = process.env.ADMIN_SESSION_SECRET ?? "";
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token, secret);

  if (!session) {
    const url = new URL("/giris", req.url);
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Access token süresi yakınsa proaktif refresh.
  if (needsRefresh(session.accessToken)) {
    try {
      const r = await fetch(`${API_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}` },
      });
      if (r.ok) {
        const data = (await r.json()) as { accessToken: string };
        const newRefresh = parseRefreshFromSetCookie(r.headers.getSetCookie?.() ?? []) ?? session.refreshToken;
        const updated: AdminSession = { ...session, accessToken: data.accessToken, refreshToken: newRefresh };
        const newToken = await signSession(updated, secret);
        const res = NextResponse.next();
        res.cookies.set(SESSION_COOKIE, newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
          maxAge: SESSION_MAX_AGE,
        });
        return res;
      }
      // refresh başarısız → oturumu temizle
      const url = new URL("/giris", req.url);
      const res = NextResponse.redirect(url);
      res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
      return res;
    } catch {
      // API ulaşılamıyorsa mevcut (muhtemelen geçerli) token ile devam et
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

> Not: Middleware varsayılan olarak edge'de çalışır; `getSetCookie` ve `fetch` edge'de mevcut. Eğer `runtime` sorun çıkarırsa `export const config` yanına Next sürümüne göre node runtime tanımı eklenebilir.

- [ ] **Step 2: Commit**

```bash
git add apps/admin/src/middleware.ts
git commit -m "feat(admin): middleware proaktif JWT refresh"
```

---

### Task 16: me/logout/setup-hash/giris + admin-auth temizliği

**Files:**
- Modify: `apps/admin/src/app/api/auth/me/route.ts`
- Modify: `apps/admin/src/app/api/auth/logout/route.ts`
- Delete: `apps/admin/src/app/api/auth/setup-hash/route.ts`
- Modify: `apps/admin/src/app/giris/page.tsx`
- Modify: `apps/admin/src/lib/admin-auth.ts`
- Modify: `apps/admin/.env.example`

- [ ] **Step 1: me route'u yeni session'a uyarla**

`apps/admin/src/app/api/auth/me/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { email: session.email, name: session.name, role: session.role } });
}
```

- [ ] **Step 2: logout — API'ye de haber ver, cookie temizle**

`apps/admin/src/app/api/auth/logout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/admin-session";

export const runtime = "nodejs";
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export async function POST() {
  const session = await getAdminSession();
  if (session?.refreshToken) {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      headers: { Cookie: `mk_refresh=${encodeURIComponent(session.refreshToken)}` },
    }).catch(() => undefined);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
```

- [ ] **Step 3: setup-hash route'unu sil**

Run: `git rm apps/admin/src/app/api/auth/setup-hash/route.ts`
Expected: dosya silinir

- [ ] **Step 4: giris sayfasındaki kurulum ipucunu güncelle**

`apps/admin/src/app/giris/page.tsx` — alt bilgi `<div>` bloğunu (setup-hash anlatan) şununla değiştir:

```tsx
      <div className="pt-3 border-t border-paper-200 text-[11px] text-ink-500 leading-relaxed">
        <strong className="text-ink-700">Giriş:</strong> Yönetim hesabınızın e-posta ve şifresiyle giriş yapın.
        Hesap, API kullanıcı veritabanında <code className="px-1 py-0.5 rounded bg-paper-100">admin</code> veya{" "}
        <code className="px-1 py-0.5 rounded bg-paper-100">super_admin</code> rolünde olmalıdır.
      </div>
```

- [ ] **Step 5: admin-auth.ts'i sadeleştir (şifre fonksiyonlarını kaldır)**

`apps/admin/src/lib/admin-auth.ts` — `verifyCredentials`, `hashPassword`, `verifyPassword`, `AdminSession`, `signSession`, `verifySession` ve ilgili HMAC fonksiyonlarının tamamını **sil**; dosyayı tek satıra indir (geriye dönük import'ları kırmamak için yeniden export):

```typescript
// Eski HMAC env-auth kaldırıldı. Session yönetimi artık admin-session.ts'te.
export { signSession, verifySession, SESSION_COOKIE, SESSION_MAX_AGE, type AdminSession } from "./admin-session";
```

- [ ] **Step 6: Kalan eski import'ları tara**

Run: `grep -rn "verifyCredentials\|hashPassword\|setup-hash" apps/admin/src`
Expected: hiç sonuç yok (varsa düzelt)

- [ ] **Step 7: .env.example güncelle**

`apps/admin/.env.example` — `ADMIN_PASSWORD_HASH` satırını ve setup-hash talimatlarını kaldır; şunları bırak/ekle:

```bash
# Admin oturum cookie imza anahtarı (32+ karakter)
ADMIN_SESSION_SECRET=

# Backend API (server-side)
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
```

- [ ] **Step 8: Lokal `.env.local` oluştur (gerçek değerlerle)**

```bash
cat > apps/admin/.env.local <<'EOF'
ADMIN_SESSION_SECRET=dev-admin-cookie-secret-min-32-chars-0123456789
API_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=http://localhost:4000
EOF
```

- [ ] **Step 9: type-check + test**

Run: `pnpm --filter @markala/admin type-check && pnpm --filter @markala/admin test`
Expected: hata yok, testler PASS

- [ ] **Step 10: Uçtan uca login smoke**

Admin'i başlat: `pnpm --filter @markala/admin dev` → `http://localhost:3001/giris` → `hasansylemezz@gmail.com` / `Markala2026!` ile giriş.
Expected: Dashboard'a yönlenir (henüz mock veriyle); `/giris`'e geri atmaz.

- [ ] **Step 11: Commit**

```bash
git add apps/admin/src/app/api/auth apps/admin/src/app/giris apps/admin/src/lib/admin-auth.ts apps/admin/.env.example
git commit -m "feat(admin): auth akışı JWT'ye taşındı (me/logout/giris), HMAC kaldırıldı"
```

---

## GROUP F — Admin sayfalarını canlıya bağla

> **Wiring pattern (her interaktif sayfa için):**
> 1. Mevcut `"use client"` sayfa dosyasını OKU. Sunum/etkileşim JSX'i korunur.
> 2. Etkileşimli kısmı `xxx-client.tsx` olarak ayır; mock veri yerine `props` ile veri alsın (`"use client"` üstte kalır).
> 3. `page.tsx`'i **server component** yap: `getAdminApi()` ile veri çek, DB şeklini UI şekline map et, `<XxxClient data={...} />` render et.
> 4. Hata durumunda `getAdminApi` çağrısını `try/catch` ile sar; hata olursa boş veri + uyarı göster (sessiz boş liste değil).
> 5. Smoke: sayfayı tarayıcıda aç, gerçek seed verisi görünüyor mu.
>
> Salt-okuma server sayfaları (slider, dashboard) için adım 2 gerekmez — inline mock'u doğrudan `getAdminApi` çağrısıyla değiştir.

### Task 17: Kategoriler (en basit — referans)

**Files:**
- Modify: `apps/admin/src/app/kategoriler/page.tsx`

- [ ] **Step 1: Mevcut sayfayı oku**

Run: `cat apps/admin/src/app/kategoriler/page.tsx`

- [ ] **Step 2: Server component'e çevir**

Sayfa şu an `"use client"` + `import { categories } from "@markala/mock-data"`. Etkileşim yok (sadece liste + linkler). Doğrudan server component yap:
- `"use client"` satırını **kaldır**.
- `import { categories } from "@markala/mock-data";` → `import { getAdminApi } from "@/lib/api";`
- Fonksiyonu `async` yap, başına: `const api = await getAdminApi(); const categories = await api.categories.list(true);`
- Geri kalan JSX (kategori kartları, `categories.length`, `.map`) **aynen korunur** — `Category` alan adları (slug, name, shortDescription, imageUrl, startingPrice, productionTime) hem mock hem API'de aynı.
- `startingPrice` API'de string (Decimal serileştirilmiş) gelebilir → gösterimde `Number(cat.startingPrice)` kullan.

- [ ] **Step 3: type-check**

Run: `pnpm --filter @markala/admin type-check`
Expected: kategoriler kaynaklı hata yok

- [ ] **Step 4: Smoke**

Tarayıcı: `http://localhost:3001/kategoriler` → seed'lenmiş gerçek kategoriler görünür.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/kategoriler/page.tsx
git commit -m "feat(admin): kategoriler sayfası canlı API'ye bağlandı"
```

---

### Task 18: Ürünler (server wrapper + client child)

**Files:**
- Modify: `apps/admin/src/app/urunler/page.tsx`
- Create: `apps/admin/src/app/urunler/products-client.tsx`

- [ ] **Step 1: Mevcut sayfayı oku**

Run: `cat apps/admin/src/app/urunler/page.tsx`

- [ ] **Step 2: Client child oluştur**

`apps/admin/src/app/urunler/products-client.tsx`:
- Mevcut `page.tsx` içeriğinin **tamamını** taşı (üstte `"use client"` kalır).
- `import { products, categories } from "@markala/mock-data";` satırını **kaldır**.
- Bileşen imzasını şuna çevir: `export function ProductsClient({ products, categories }: { products: ProductRow[]; categories: CategoryRow[] })` ve `ProductRow`/`CategoryRow` tiplerini dosya üstünde tanımla (kullanılan alanlar: product → slug, name, categorySlug?/categoryId, basePrice, startingPrice, bestseller, isActive, images; category → slug, name).
- `export default function ProductsAdminPage()` → `export function ProductsClient(...)`.

- [ ] **Step 3: page.tsx'i server wrapper yap**

`apps/admin/src/app/urunler/page.tsx`:

```tsx
import { getAdminApi } from "@/lib/api";
import { ProductsClient } from "./products-client";

export default async function ProductsAdminPage() {
  const api = await getAdminApi();
  const [products, categories] = await Promise.all([
    api.products.list({ take: 200 }),
    api.categories.list(true),
  ]);
  return <ProductsClient products={products as never} categories={categories as never} />;
}
```

> Not: API `product.list` her üründe `category` ilişkisini içerir (`include: { category: true }`). Client'ta kategori adına erişmek için `product.category?.name` veya `product.categoryId` kullan; mock'taki `categorySlug` yerine bunu kullanacak şekilde JSX'i uyarlamayı unutma.

- [ ] **Step 4: type-check**

Run: `pnpm --filter @markala/admin type-check`
Expected: ürünler kaynaklı hata yok

- [ ] **Step 5: Smoke**

Tarayıcı: `http://localhost:3001/urunler` → gerçek ürünler, arama/filtre çalışıyor.

- [ ] **Step 6: Commit**

```bash
git add apps/admin/src/app/urunler/page.tsx apps/admin/src/app/urunler/products-client.tsx
git commit -m "feat(admin): ürünler sayfası canlı API'ye bağlandı (server/client split)"
```

---

### Task 19: Ürün detay [slug] + toplu fiyat

**Files:**
- Modify: `apps/admin/src/app/urunler/[slug]/page.tsx`
- Modify: `apps/admin/src/app/urunler/fiyat-toplu/page.tsx`

- [ ] **Step 1: Mevcut dosyaları oku**

Run: `cat "apps/admin/src/app/urunler/[slug]/page.tsx"; echo "==="; cat apps/admin/src/app/urunler/fiyat-toplu/page.tsx`

- [ ] **Step 2: [slug] sayfasını bağla**

- `import { products, categories, getProductBySlug } from "@markala/mock-data";` kaldır.
- Etkileşimli form varsa Task 18 pattern'i (server wrapper `getAdminApi().products.detail(slug)` → client child) uygula. Kaydet butonu `api.products.update(id, data)` çağıran bir **server action** veya `/urunler/[slug]` route handler üzerinden gitsin.
- Server action örneği (`app/urunler/[slug]/actions.ts`):

```typescript
"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function updateProduct(id: string, data: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.products.update(id, data as never);
  revalidatePath(`/urunler`);
}
```

- [ ] **Step 3: Toplu fiyat sayfasını bağla**

- `import { products, categories } from "@markala/mock-data";` kaldır → server wrapper ürünleri çeker, client child'a verir.
- "Uygula" işlemi her etkilenen ürün için `api.products.update(id, { basePrice })` çağıran bir server action olsun (Promise.all).

- [ ] **Step 4: type-check + smoke**

Run: `pnpm --filter @markala/admin type-check`
Tarayıcı: ürün detay açılır, fiyat güncelleme gerçek DB'yi değiştirir (sayfa yenileyince kalıcı).

- [ ] **Step 5: Commit**

```bash
git add "apps/admin/src/app/urunler/[slug]" apps/admin/src/app/urunler/fiyat-toplu
git commit -m "feat(admin): ürün detay + toplu fiyat canlı API (server actions)"
```

---

### Task 20: Siparişler + detay

**Files:**
- Modify: `apps/admin/src/app/siparisler/page.tsx`
- Modify: `apps/admin/src/app/siparisler/[no]/page.tsx`

- [ ] **Step 1: Mevcut dosyaları oku**

Run: `cat apps/admin/src/app/siparisler/page.tsx; echo "==="; cat "apps/admin/src/app/siparisler/[no]/page.tsx"`

- [ ] **Step 2: Liste sayfasını bağla**

- Inline `mockOrders` dizisini **kaldır**.
- Server wrapper: `const api = await getAdminApi(); const orders = await api.orders.listAll({ take: 100 });`
- Client child'a `orders` props ver. Alan eşleme: UI `no` → `order.orderNumber`, `customer/email` → `order.email` (veya `order.user?.fullName`), `amount` → `Number(order.total)`, `status` → `order.status` (enum değerleri: `siparis_alindi` vb. — mevcut UI'daki `tasarim-onay` gibi etiketleri API enum'una eşle).
- Durum etiketleri için bir `STATUS_LABELS: Record<string,string>` haritası ekle (API enum → Türkçe).

- [ ] **Step 3: Detay sayfasını bağla**

- Server wrapper: `api.orders.detail(id)` (route param `[no]` = orderNumber ise, listeden id bul ya da API'de orderNumber ile arama gerekir — API `detail(id)` cuid bekliyor; bu durumda liste linkini `order.id`'ye çevir, route'u `[id]` mantığıyla kullan).
- Durum değiştirme: `api.orders.updateStatus(id, { status })` çağıran server action.

> Not: Mevcut route klasörü `[no]`. API detay `id` (cuid) ile çalışır. En temizi: liste linklerini `order.id` ile oluştur ve detay sayfasında param'ı id olarak kullan (klasör adını değiştirmeye gerek yok, sadece içeriği id olarak yorumla).

- [ ] **Step 4: type-check + smoke**

Tarayıcı: `http://localhost:3001/siparisler` → seed'de sipariş yoksa boş durum görünür (doğru). Web'den/manuel sipariş oluşturulursa listede çıkar.

- [ ] **Step 5: Commit**

```bash
git add apps/admin/src/app/siparisler
git commit -m "feat(admin): siparişler + detay canlı API'ye bağlandı"
```

---

### Task 21: Müşteriler

**Files:**
- Modify: `apps/admin/src/app/musteriler/page.tsx`

- [ ] **Step 1: Mevcut dosyayı oku**

Run: `cat apps/admin/src/app/musteriler/page.tsx`

- [ ] **Step 2: Bağla**

- Inline `mockCustomers` dizisini **kaldır**.
- Server wrapper: `const api = await getAdminApi(); const customers = await api.adminUsers.list({ take: 100 });`
- Client child'a props ver. Alan eşleme: `name` → `fullName`, `type` → `accountType`, `orders` → `orderCount`, `company` → `companyName`. `totalSpent`/`vip`/`lastOrder` API'de yok → bu kolonları kaldır veya "—" göster (sessiz sahte veri gösterme).

- [ ] **Step 3: type-check + smoke**

Tarayıcı: `http://localhost:3001/musteriler` → seed müşterileri (Ali, Mehmet, Zeynep) gerçek görünür.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/musteriler/page.tsx
git commit -m "feat(admin): müşteriler sayfası canlı API'ye bağlandı"
```

---

### Task 22: Kurumsal Başvurular

**Files:**
- Modify: `apps/admin/src/app/musteriler/kurumsal-basvurular/page.tsx`

- [ ] **Step 1: Mevcut dosyayı oku**

Run: `cat "apps/admin/src/app/musteriler/kurumsal-basvurular/page.tsx"`

- [ ] **Step 2: Bağla**

- Inline mock başvuruları kaldır.
- Server wrapper: `const api = await getAdminApi(); const applications = await api.corporateApplications.list();`
- Client child'a props ver. Onayla/Reddet butonları, `api.corporateApplications.setStatus(id, { status })` çağıran server action'a bağlanır + `revalidatePath`.
- Alan eşleme: `companyName, taxOffice, taxNumber, contactName, email, phone, status, createdAt`.

- [ ] **Step 3: type-check + smoke**

Tarayıcı: seed'de başvuru yok → boş durum. (İsteğe bağlı: psql ile 1 test kaydı ekleyip onay akışını dene.)

- [ ] **Step 4: Commit**

```bash
git add "apps/admin/src/app/musteriler/kurumsal-basvurular/page.tsx"
git commit -m "feat(admin): kurumsal başvurular canlı API + onay/red akışı"
```

---

### Task 23: Slider (salt-okuma server + CRUD action)

**Files:**
- Modify: `apps/admin/src/app/slider/page.tsx`

- [ ] **Step 1: Mevcut dosyayı oku**

Run: `cat apps/admin/src/app/slider/page.tsx`

- [ ] **Step 2: Bağla**

- Inline `mockSlides` dizisini kaldır.
- Sayfa zaten server component → doğrudan: `const api = await getAdminApi(); const slides = await api.heroSlides.list(true);`
- JSX'te slide alanlarını API şekline eşle: `title, subtitle, imageUrl, ctaLabel, ctaHref, isActive, sortOrder`.
- Ekle/Düzenle/Sil etkileşimleri varsa server action'lara bağla (`api.heroSlides.create/update/remove`) + `revalidatePath("/slider")`.

- [ ] **Step 3: type-check + smoke**

Tarayıcı: `http://localhost:3001/slider` → seed'lenmiş hero slide'lar görünür.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/slider/page.tsx
git commit -m "feat(admin): slider sayfası canlı hero-slides API'ye bağlandı"
```

---

### Task 24: Ayarlar (genel / seo / api / bildirim)

**Files:**
- Modify: `apps/admin/src/app/ayarlar/genel/page.tsx`
- Modify: `apps/admin/src/app/ayarlar/seo/page.tsx`
- Modify: `apps/admin/src/app/ayarlar/bildirim/page.tsx`
- Modify: `apps/admin/src/app/ayarlar/api/page.tsx`

- [ ] **Step 1: Mevcut dosyaları oku**

Run: `for f in genel seo bildirim api; do echo "=== $f ==="; cat "apps/admin/src/app/ayarlar/$f/page.tsx"; done`

- [ ] **Step 2: Genel ayarları bağla (pattern, diğerlerine uygula)**

- `useState` başlangıç değerleri sabit string'ler → server wrapper'da `api.settings.get("general")` ile çekilip client child'a `initial` props olarak ver.
- "Kaydet" → server action `saveSettings("general", values)`:

```typescript
"use server";
import { getAdminApi } from "@/lib/api";
import { revalidatePath } from "next/cache";

export async function saveSettings(group: string, values: Record<string, unknown>) {
  const api = await getAdminApi();
  await api.settings.upsert(group, values);
  revalidatePath(`/ayarlar/${group === "general" ? "genel" : group}`);
}
```

- `genel` için anahtarlar: `general.siteName, general.siteUrl, general.companyName, general.taxOffice, general.taxNumber` (Task 4 seed ile uyumlu).
- Aynı pattern'i `seo` (group="seo") ve `bildirim` (group="notification") için uygula.
- `api` sayfası (entegrasyon anahtarları): bu sayfa hassas anahtarlar gösterir; Faz 1'de **salt-okuma** bırak (group="api" boş döner, "yakında" notu ekle) — gerçek anahtar yönetimi ayrı güvenlik işi.

- [ ] **Step 3: type-check + smoke**

Tarayıcı: `http://localhost:3001/ayarlar/genel` → seed değerleri yüklü; değiştir + kaydet → yenileyince kalıcı.

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/ayarlar
git commit -m "feat(admin): ayarlar sayfaları canlı settings API'ye bağlandı"
```

---

### Task 25: Dashboard (stats)

**Files:**
- Modify: `apps/admin/src/app/page.tsx`

- [ ] **Step 1: Mevcut dosyayı oku**

Run: `cat apps/admin/src/app/page.tsx`

- [ ] **Step 2: Bağla**

- Sabit `kpis` dizisini kaldır.
- Sayfa zaten server component → `const api = await getAdminApi(); const stats = await api.adminStats();`
- KPI kartlarını gerçek değerlerle doldur: Ciro → `stats.revenue`, Sipariş → `stats.orderCount`, Müşteri → `stats.customerCount`, Üretimde → `stats.ordersByStatus.find(s => s.status === "uretimde")?.count ?? 0`.
- `delta`/yüzde gibi karşılaştırmalı metrikler API'de yok → bunları kaldır veya statik "—" yap (sahte yüzde gösterme).

- [ ] **Step 3: type-check + smoke**

Tarayıcı: `http://localhost:3001/` → gerçek sayılar (müşteri=3, sipariş=0 vb.).

- [ ] **Step 4: Commit**

```bash
git add apps/admin/src/app/page.tsx
git commit -m "feat(admin): dashboard gerçek stats endpoint'ine bağlandı"
```

---

## GROUP G — Nihai doğrulama

### Task 26: Uçtan uca doğrulama

- [ ] **Step 1: Tüm API testleri geçiyor**

Run: `pnpm --filter @markala/api test`
Expected: tüm spec'ler PASS

- [ ] **Step 2: Admin testleri geçiyor**

Run: `pnpm --filter @markala/admin test`
Expected: PASS

- [ ] **Step 3: Workspace type-check temiz**

Run: `pnpm -r type-check`
Expected: hata yok

- [ ] **Step 4: Lint temiz**

Run: `pnpm -r lint`
Expected: hata yok (uyarılar kabul)

- [ ] **Step 5: Manuel uçtan uca akış**

API (`:4000`) + admin (`:3001`) çalışırken:
1. `/giris` → `hasansylemezz@gmail.com` / `Markala2026!` → giriş başarılı.
2. Dashboard gerçek sayıları gösteriyor.
3. Ürünler: liste gerçek; bir ürünün fiyatını değiştir → kaydet → yenile → kalıcı.
4. Kategoriler, Müşteriler, Slider, Ayarlar gerçek veri.
5. Ayarlar/genel'de bir değeri değiştir + kaydet → DB'de `site_settings` güncellendi (`docker exec markala-postgres psql -U markala -d markala -c "SELECT * FROM site_settings WHERE key='general.siteName';"`).
6. 15+ dk bekle veya access token süresini kısalt → bir sayfa gez → middleware sessizce refresh ediyor, `/giris`'e atmıyor.
7. Çıkış yap → `/giris`'e döner, korumalı sayfa açılmıyor.

- [ ] **Step 6: Spec'i tamamlandı olarak işaretle + final commit**

```bash
git add -A
git commit -m "chore: Faz 1 veri katmanı canlandırma tamamlandı"
```

---

## Açık riskler / notlar

- **API çalışır olmalı:** Admin sayfaları API'ye (`:4000`) bağımlı. Geliştirmede her ikisi de açık olmalı; prod'da `docker-compose.production.yml` zaten ikisini de ayağa kaldırıyor.
- **Decimal serileştirme:** Prisma `Decimal` alanları API JSON'unda string döner. Gösterimde `Number(...)` ile sarmalan (fiyatlar).
- **Next sürümü:** `cookies()` await'i ve middleware runtime davranışı Next 14/15 arasında değişir — Task 14/15 notlarındaki sürüm kontrollerini uygula.
- **Sessiz boşluk yok:** UI'da API'de karşılığı olmayan alanlar (totalSpent, vip, delta%) sahte değerle değil "—" / kaldırılarak gösterilir.
- **Throttle:** API login 5/dk/IP — geliştirmede tekrarlı denemede 429 normaldir.

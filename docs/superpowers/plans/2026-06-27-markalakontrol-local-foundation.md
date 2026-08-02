# markalakontrol Local Foundation + Isolation Proof — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up two new **isolated** apps (`apps/api-kontrol` NestJS + `apps/kontrol` Next.js) and a **separate local Postgres** inside the markala monorepo, with a thin end-to-end vertical slice (health check + first `Organization` read) — proving the isolation approach works before any feature work.

**Architecture:** Work in a **fresh `origin/main` clone** (the `baskisitesi` tree is 259 commits stale). Add two new apps under `apps/` that mirror existing `apps/api` / `apps/web` conventions but never touch markala's apps, packages, schema, or database. The new stack runs `kontrol (Next :3100) → api-kontrol (Nest :4100) → postgres-kontrol (:5436)`, fully parallel to markala dev (`3000 / 4000 / 5432`). Isolation is enforced structurally: separate DB container + volume, separate Prisma schema/client, separate compose file.

**Tech Stack:** pnpm 10.33.3 · Node ≥20 · NestJS 10 · Prisma 5 · Next.js 14 · PostgreSQL 16 (Docker) · TypeScript · Jest + supertest.

## Global Constraints

Every task implicitly includes these. They come from explicit user decisions (2026-06-27):

- **markala.com.tr runtime sıfır temas.** Do NOT create/modify/delete any file under `apps/web`, `apps/admin`, `apps/api`, or `apps/api/prisma/`. Do NOT open a connection to markala's database.
- **`packages/*` read-only.** New apps may only *import* existing packages (`@markala/types`, `@markala/config`). If new shared code is needed, create a NEW package `packages/kontrol-*` — never edit an existing package's source.
- **`pnpm-lock.yaml` additive only.** Adding the new apps' deps may extend the lockfile, but must NOT bump any version markala already pins. Run installs so existing resolutions stay frozen.
- **Separate database, always.** `DATABASE_URL` for api-kontrol points ONLY at `postgresql://markala:markala@localhost:5436/markalakontrol?schema=public`. Never at markala's DB.
- **Separate compose file.** Use a new `docker-compose.kontrol.yml`; do NOT edit the existing `docker-compose.yml`.
- **Ports (no collision with markala dev):** `kontrol` web = **3100**, `api-kontrol` = **4100**, `postgres-kontrol` host port = **5436**.
- **Branch + clone:** all work happens on branch `feat/markalakontrol-foundation` inside a FRESH clone (e.g. `C:\tmp\markalakontrol-dev`), never the stale `baskisitesi` working tree.
- TDD always. DRY. YAGNI. Commit after every green step.

---

### Task 1: Fresh clone, branch, and isolated Postgres

**Files:**
- Create: `docker-compose.kontrol.yml`
- Create: `docs/superpowers/plans/2026-06-27-markalakontrol-local-foundation.md` (copy this plan into the clone)

**Interfaces:**
- Produces: a running Postgres container `markala-postgres-kontrol` reachable at `localhost:5436`, db `markalakontrol`, user/pass `markala/markala`, isolated volume `markala_postgres_kontrol`. Later tasks set `DATABASE_URL=postgresql://markala:markala@localhost:5436/markalakontrol?schema=public`.

- [ ] **Step 1: Create a fresh origin/main clone and branch**

```bash
cd /c/tmp
git clone https://github.com/soylemezz33/markala.git markalakontrol-dev
cd markalakontrol-dev
git checkout -b feat/markalakontrol-foundation
```

- [ ] **Step 2: Verify you are on current origin/main (not stale)**

Run: `git rev-list --left-right --count origin/main...HEAD`
Expected: `0	0` (your branch tip equals origin/main; nothing behind).

- [ ] **Step 3: Add the isolated Postgres compose file**

Create `docker-compose.kontrol.yml`:

```yaml
# Isolated stack for markalakontrol local dev. Separate from docker-compose.yml.
# markala.com.tr is never touched by this file.
services:
  postgres-kontrol:
    image: postgres:16-alpine
    container_name: markala-postgres-kontrol
    restart: unless-stopped
    environment:
      POSTGRES_USER: markala
      POSTGRES_PASSWORD: markala
      POSTGRES_DB: markalakontrol
    ports:
      - "5436:5432"
    volumes:
      - markala_postgres_kontrol:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U markala -d markalakontrol"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  markala_postgres_kontrol:
```

- [ ] **Step 4: Bring it up and verify isolated DB connectivity**

Run:
```bash
docker compose -f docker-compose.kontrol.yml up -d
docker exec markala-postgres-kontrol pg_isready -U markala -d markalakontrol
```
Expected: `... accepting connections`. Container `markala-postgres-kontrol` listed in `docker ps` on `0.0.0.0:5436->5432/tcp`.

- [ ] **Step 5: Confirm markala dev compose is untouched**

Run: `git status docker-compose.yml`
Expected: no changes to `docker-compose.yml` (only the new `docker-compose.kontrol.yml` is untracked).

- [ ] **Step 6: Copy this plan into the clone and commit**

```bash
mkdir -p docs/superpowers/plans
# copy the plan file from baskisitesi into this clone (same relative path)
git add docker-compose.kontrol.yml docs/superpowers/plans/2026-06-27-markalakontrol-local-foundation.md
git commit -m "chore(kontrol): isolated local postgres + foundation plan"
```

---

### Task 2: Scaffold `apps/api-kontrol` (NestJS) with a DB-backed health endpoint

**Files:**
- Create: `apps/api-kontrol/package.json`
- Create: `apps/api-kontrol/tsconfig.json`
- Create: `apps/api-kontrol/nest-cli.json`
- Create: `apps/api-kontrol/jest.config.js`
- Create: `apps/api-kontrol/.env`
- Create: `apps/api-kontrol/.env.example`
- Create: `apps/api-kontrol/prisma/schema.prisma`
- Create: `apps/api-kontrol/src/main.ts`
- Create: `apps/api-kontrol/src/app.module.ts`
- Create: `apps/api-kontrol/src/prisma/prisma.service.ts`
- Create: `apps/api-kontrol/src/prisma/prisma.module.ts`
- Create: `apps/api-kontrol/src/health/health.controller.ts`
- Create: `apps/api-kontrol/src/health/health.module.ts`
- Test: `apps/api-kontrol/test/health.e2e-spec.ts`

**Interfaces:**
- Consumes: Postgres from Task 1 at `localhost:5436`.
- Produces: NestJS app on port **4100**, global prefix `api`. Endpoint `GET /api/health` → `{ status: "ok", db: true }` where `db` is verified via `prisma.$queryRaw\`SELECT 1\``. `PrismaService` (own Prisma client) exported globally for later tasks.

- [ ] **Step 1: Create the package manifest**

Create `apps/api-kontrol/package.json`:

```json
{
  "name": "@markala/api-kontrol",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start:prod": "node dist/main",
    "type-check": "tsc --noEmit",
    "test:e2e": "jest --config jest.config.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^10.4.7",
    "@nestjs/core": "^10.4.7",
    "@nestjs/config": "^3.3.0",
    "@nestjs/platform-express": "^10.4.7",
    "@prisma/client": "^5.22.0",
    "class-validator": "^0.15.1",
    "class-transformer": "^0.5.1",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@markala/config": "workspace:*",
    "@nestjs/cli": "^10.4.8",
    "@nestjs/schematics": "^10.2.3",
    "@nestjs/testing": "^10.4.7",
    "@types/express": "^5.0.0",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.0",
    "@types/supertest": "^6.0.2",
    "jest": "^29.7.0",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-node": "^10.9.2",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create tsconfig, nest-cli, jest config**

Create `apps/api-kontrol/tsconfig.json` (mirrors `apps/api` overrides):

```json
{
  "extends": "@markala/config/tsconfig.base.json",
  "compilerOptions": {
    "module": "CommonJS",
    "target": "ES2022",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "outDir": "./dist",
    "noUncheckedIndexedAccess": false,
    "strictPropertyInitialization": false,
    "isolatedModules": false
  },
  "include": ["src/**/*", "test/**/*"]
}
```

Create `apps/api-kontrol/nest-cli.json`:

```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src"
}
```

Create `apps/api-kontrol/jest.config.js`:

```javascript
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: ".",
  testRegex: ".e2e-spec.ts$",
  transform: { "^.+\\.(t|j)s$": "ts-jest" },
  testEnvironment: "node",
};
```

- [ ] **Step 3: Create env files and Prisma schema (datasource only)**

Create `apps/api-kontrol/.env`:

```bash
DATABASE_URL="postgresql://markala:markala@localhost:5436/markalakontrol?schema=public"
PORT=4100
WEB_ORIGIN="http://localhost:3100"
NODE_ENV="development"
```

Create `apps/api-kontrol/.env.example` (same keys, placeholder values):

```bash
DATABASE_URL="postgresql://markala:markala@localhost:5436/markalakontrol?schema=public"
PORT=4100
WEB_ORIGIN="http://localhost:3100"
NODE_ENV="development"
```

Create `apps/api-kontrol/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- [ ] **Step 4: Create PrismaService + PrismaModule**

Create `apps/api-kontrol/src/prisma/prisma.service.ts`:

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

Create `apps/api-kontrol/src/prisma/prisma.module.ts`:

```typescript
import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

- [ ] **Step 5: Write the failing health e2e test**

Create `apps/api-kontrol/test/health.e2e-spec.ts`:

```typescript
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Health (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/health returns ok with db:true", async () => {
    const res = await request(app.getHttpServer()).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok", db: true });
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run (from `apps/api-kontrol`): `pnpm prisma:generate && pnpm test:e2e`
Expected: FAIL — `AppModule` / health module not found (cannot compile / 404).

- [ ] **Step 7: Implement health controller + module + app module + bootstrap**

Create `apps/api-kontrol/src/health/health.controller.ts`:

```typescript
import { Controller, Get } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ status: string; db: boolean }> {
    let db = false;
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = true;
    } catch {
      db = false;
    }
    return { status: "ok", db };
  }
}
```

Create `apps/api-kontrol/src/health/health.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
```

Create `apps/api-kontrol/src/app.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), PrismaModule, HealthModule],
})
export class AppModule {}
```

Create `apps/api-kontrol/src/main.ts`:

```typescript
import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  const config = app.get(ConfigService);
  const port = config.get<number>("PORT") ?? 4100;

  app.setGlobalPrefix("api");
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors({
    origin: (config.get<string>("WEB_ORIGIN") ?? "http://localhost:3100").split(","),
    credentials: true,
  });

  await app.listen(port);
}
bootstrap();
```

- [ ] **Step 8: Install deps, regenerate, run the test to verify it passes**

Run (from repo root): `pnpm install`
Then (from `apps/api-kontrol`): `pnpm prisma:generate && pnpm test:e2e`
Expected: PASS — `GET /api/health returns ok with db:true` (requires Task 1 Postgres up on 5436).

- [ ] **Step 9: Verify lockfile additive only (markala versions unchanged)**

Run: `git diff pnpm-lock.yaml | grep -E '^\-' | grep -vE '^\-\-\-' | head`
Expected: no removals/downgrades of existing markala dependency lines (only additions). If any existing version changed, revert and reinstall with frozen resolutions.

- [ ] **Step 10: Commit**

```bash
git add apps/api-kontrol pnpm-lock.yaml
git commit -m "feat(api-kontrol): scaffold isolated NestJS app with DB-backed health endpoint"
```

---

### Task 3: First domain model (`Organization`) + migration + read endpoint

**Files:**
- Modify: `apps/api-kontrol/prisma/schema.prisma` (add `Organization` model)
- Create: `apps/api-kontrol/prisma/seed.ts`
- Modify: `apps/api-kontrol/package.json` (add `prisma.seed` config + `db:seed` script)
- Create: `apps/api-kontrol/src/organizations/organizations.service.ts`
- Create: `apps/api-kontrol/src/organizations/organizations.controller.ts`
- Create: `apps/api-kontrol/src/organizations/organizations.module.ts`
- Modify: `apps/api-kontrol/src/app.module.ts` (import `OrganizationsModule`)
- Test: `apps/api-kontrol/test/organizations.e2e-spec.ts`

**Interfaces:**
- Consumes: `PrismaService` from Task 2.
- Produces: `Organization { id, name, slug, createdAt }`. Endpoint `GET /api/organizations` → `Organization[]` ordered by `name`. Seed inserts one org `{ name: "Lisan Fen", slug: "lisan-fen" }`. Later tenancy tasks build on `Organization.id`.

- [ ] **Step 1: Add the Organization model to the schema**

In `apps/api-kontrol/prisma/schema.prisma`, append:

```prisma
model Organization {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())

  @@map("organizations")
}
```

- [ ] **Step 2: Create the migration**

Run (from `apps/api-kontrol`): `pnpm prisma migrate dev --name init_organization`
Expected: migration created under `prisma/migrations/`, applied to the `markalakontrol` DB, client regenerated.

- [ ] **Step 3: Add the seed script**

Create `apps/api-kontrol/prisma/seed.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.organization.upsert({
    where: { slug: "lisan-fen" },
    update: {},
    create: { name: "Lisan Fen", slug: "lisan-fen" },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
```

In `apps/api-kontrol/package.json`, add a `db:seed` script and Prisma seed config:

```json
  "scripts": {
    "build": "nest build",
    "dev": "nest start --watch",
    "start:prod": "node dist/main",
    "type-check": "tsc --noEmit",
    "test:e2e": "jest --config jest.config.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
```

- [ ] **Step 4: Run the seed**

Run (from `apps/api-kontrol`): `pnpm db:seed`
Expected: exits 0; one row in `organizations` (`Lisan Fen`).

- [ ] **Step 5: Write the failing organizations e2e test**

Create `apps/api-kontrol/test/organizations.e2e-spec.ts`:

```typescript
import { Test } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Organizations (e2e)", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("api");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/organizations returns the seeded Lisan Fen org", async () => {
    const res = await request(app.getHttpServer()).get("/api/organizations");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some((o: { slug: string }) => o.slug === "lisan-fen")).toBe(true);
  });
});
```

- [ ] **Step 6: Run the test to verify it fails**

Run (from `apps/api-kontrol`): `pnpm test:e2e -- organizations`
Expected: FAIL — 404 (organizations route not defined).

- [ ] **Step 7: Implement the organizations module**

Create `apps/api-kontrol/src/organizations/organizations.service.ts`:

```typescript
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.organization.findMany({ orderBy: { name: "asc" } });
  }
}
```

Create `apps/api-kontrol/src/organizations/organizations.controller.ts`:

```typescript
import { Controller, Get } from "@nestjs/common";
import { OrganizationsService } from "./organizations.service";

@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get()
  findAll() {
    return this.organizations.findAll();
  }
}
```

Create `apps/api-kontrol/src/organizations/organizations.module.ts`:

```typescript
import { Module } from "@nestjs/common";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";

@Module({
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
```

In `apps/api-kontrol/src/app.module.ts`, add `OrganizationsModule` to imports:

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthModule } from "./health/health.module";
import { OrganizationsModule } from "./organizations/organizations.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    HealthModule,
    OrganizationsModule,
  ],
})
export class AppModule {}
```

- [ ] **Step 8: Run the test to verify it passes**

Run (from `apps/api-kontrol`): `pnpm test:e2e -- organizations`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add apps/api-kontrol
git commit -m "feat(api-kontrol): Organization model, migration, seed, GET /organizations"
```

---

### Task 4: Scaffold `apps/kontrol` (Next.js) consuming api-kontrol

**Files:**
- Create: `apps/kontrol/package.json`
- Create: `apps/kontrol/next.config.mjs`
- Create: `apps/kontrol/tsconfig.json`
- Create: `apps/kontrol/tailwind.config.js`
- Create: `apps/kontrol/postcss.config.js`
- Create: `apps/kontrol/jest.config.js`
- Create: `apps/kontrol/.env.local`
- Create: `apps/kontrol/.env.example`
- Create: `apps/kontrol/src/app/layout.tsx`
- Create: `apps/kontrol/src/app/globals.css`
- Create: `apps/kontrol/src/app/page.tsx`
- Create: `apps/kontrol/src/lib/api.ts`
- Test: `apps/kontrol/src/lib/api.test.ts`

**Interfaces:**
- Consumes: api-kontrol `GET /api/organizations` (Task 3) and `GET /api/health` (Task 2) via `NEXT_PUBLIC_API_KONTROL_URL`.
- Produces: Next.js app on port **3100**. Home page server-fetches organizations and renders their names + a health badge.

- [ ] **Step 1: Create the package manifest**

Create `apps/kontrol/package.json`:

```json
{
  "name": "@markala/kontrol",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3100",
    "build": "next build",
    "start": "next start -p 3100",
    "type-check": "tsc --noEmit",
    "test": "jest"
  },
  "dependencies": {
    "@markala/types": "workspace:*",
    "next": "^14.2.18",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@markala/config": "workspace:*",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.0",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "autoprefixer": "^10.4.20",
    "jest": "^29.7.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14",
    "ts-jest": "^29.2.5",
    "typescript": "^5.6.3"
  }
}
```

- [ ] **Step 2: Create config files**

Create `apps/kontrol/next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "standalone",
  transpilePackages: ["@markala/types"],
};

export default nextConfig;
```

Create `apps/kontrol/tsconfig.json`:

```json
{
  "extends": "@markala/config/tsconfig.base.json",
  "compilerOptions": {
    "paths": { "@/*": ["./src/*"] },
    "noEmit": true,
    "allowJs": true,
    "jsx": "preserve",
    "plugins": [{ "name": "next" }]
  },
  "include": ["next-env.d.ts", "src/**/*", ".next/types/**/*.ts"]
}
```

Create `apps/kontrol/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

Create `apps/kontrol/postcss.config.js`:

```javascript
module.exports = {
  plugins: { tailwindcss: {}, autoprefixer: {} },
};
```

Create `apps/kontrol/jest.config.js`:

```javascript
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/*.test.ts"],
};
```

- [ ] **Step 3: Create env files**

Create `apps/kontrol/.env.local`:

```bash
NEXT_PUBLIC_API_KONTROL_URL=http://localhost:4100
```

Create `apps/kontrol/.env.example`:

```bash
NEXT_PUBLIC_API_KONTROL_URL=http://localhost:4100
```

- [ ] **Step 4: Write the failing api lib test**

Create `apps/kontrol/src/lib/api.test.ts`:

```typescript
import { fetchOrganizations } from "./api";

describe("fetchOrganizations", () => {
  it("calls the api-kontrol organizations endpoint and returns the list", async () => {
    const mockOrgs = [{ id: "1", name: "Lisan Fen", slug: "lisan-fen" }];
    const spy = jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(mockOrgs), { status: 200 }));

    const result = await fetchOrganizations();

    expect(spy).toHaveBeenCalledWith(
      "http://localhost:4100/api/organizations",
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(result).toEqual(mockOrgs);
    spy.mockRestore();
  });
});
```

- [ ] **Step 5: Run the test to verify it fails**

Run (from `apps/kontrol`): `pnpm test`
Expected: FAIL — `./api` has no export `fetchOrganizations`.

- [ ] **Step 6: Implement the api lib**

Create `apps/kontrol/src/lib/api.ts`:

```typescript
const API_BASE = process.env.NEXT_PUBLIC_API_KONTROL_URL ?? "http://localhost:4100";

export type KontrolOrganization = { id: string; name: string; slug: string };

export async function fetchOrganizations(): Promise<KontrolOrganization[]> {
  const res = await fetch(`${API_BASE}/api/organizations`, { cache: "no-store" });
  if (!res.ok) throw new Error(`api-kontrol organizations failed: ${res.status}`);
  return res.json();
}

export async function fetchHealth(): Promise<{ status: string; db: boolean }> {
  const res = await fetch(`${API_BASE}/api/health`, { cache: "no-store" });
  if (!res.ok) throw new Error(`api-kontrol health failed: ${res.status}`);
  return res.json();
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run (from repo root) `pnpm install`, then (from `apps/kontrol`): `pnpm test`
Expected: PASS.

- [ ] **Step 8: Create the layout, styles, and home page**

Create `apps/kontrol/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `apps/kontrol/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "markala kontrol",
  description: "Şubelerinizin tüm baskı ihtiyaçlarını tek noktadan yönetin.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>{children}</body>
    </html>
  );
}
```

Create `apps/kontrol/src/app/page.tsx`:

```tsx
import { fetchOrganizations, fetchHealth } from "@/lib/api";

export default async function HomePage() {
  const [orgs, health] = await Promise.all([fetchOrganizations(), fetchHealth()]);

  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-bold">markala kontrol</h1>
      <p className="mt-1 text-sm text-gray-500">
        api-kontrol: {health.status} · db: {health.db ? "bağlı" : "yok"}
      </p>
      <h2 className="mt-6 font-semibold">Markalar</h2>
      <ul className="mt-2 list-disc pl-5">
        {orgs.map((o) => (
          <li key={o.id}>{o.name}</li>
        ))}
      </ul>
    </main>
  );
}
```

- [ ] **Step 9: Commit**

```bash
git add apps/kontrol pnpm-lock.yaml
git commit -m "feat(kontrol): scaffold isolated Next.js app rendering api-kontrol data"
```

---

### Task 5: Dev runbook + manual end-to-end isolation verification

**Files:**
- Create: `apps/kontrol/README.md` (local runbook for the whole kontrol stack)

**Interfaces:**
- Consumes: everything from Tasks 1–4.
- Produces: documented, repeatable local startup; a verified end-to-end slice (browser → kontrol → api-kontrol → postgres-kontrol) with markala dev confirmed untouched.

- [ ] **Step 1: Write the local runbook**

Create `apps/kontrol/README.md`:

```markdown
# markalakontrol — local dev

Isolated from markala. Nothing here touches markala's apps, db, or compose.

## Start (3 terminals or background)
1. DB:   `docker compose -f docker-compose.kontrol.yml up -d`
2. API:  `cd apps/api-kontrol && pnpm prisma:generate && pnpm prisma migrate dev && pnpm db:seed && pnpm dev`  (→ http://localhost:4100/api/health)
3. Web:  `cd apps/kontrol && pnpm dev`  (→ http://localhost:3100)

## Ports
| Service | Port |
|---|---|
| kontrol (Next) | 3100 |
| api-kontrol (Nest) | 4100 |
| postgres-kontrol | 5436 |

markala dev (if ever run in parallel) uses 3000 / 4000 / 5432 — no collision.
```

- [ ] **Step 2: Bring up the full stack**

Run (from repo root):
```bash
docker compose -f docker-compose.kontrol.yml up -d
( cd apps/api-kontrol && pnpm dev ) &
( cd apps/kontrol && pnpm dev ) &
```
Expected: api-kontrol listening on 4100, kontrol on 3100.

- [ ] **Step 3: Verify the API health + data endpoints**

Run:
```bash
curl -s http://localhost:4100/api/health
curl -s http://localhost:4100/api/organizations
```
Expected: `{"status":"ok","db":true}` and a JSON array containing `Lisan Fen`.

- [ ] **Step 4: Verify the web page renders the slice**

Open `http://localhost:3100` in a browser.
Expected: heading "markala kontrol", a line `api-kontrol: ok · db: bağlı`, and a "Markalar" list containing **Lisan Fen**.

- [ ] **Step 5: Verify markala isolation (nothing markala changed)**

Run:
```bash
git status --porcelain | grep -E 'apps/(web|admin|api)/' || echo "OK: no markala app files touched"
git diff --name-only origin/main | grep -E '^apps/(web|admin|api)/' || echo "OK: no markala app files in diff"
```
Expected: both print the `OK:` line (no markala app files created/modified). The branch adds only `apps/api-kontrol`, `apps/kontrol`, `docker-compose.kontrol.yml`, `docs/`, and additive `pnpm-lock.yaml` lines.

- [ ] **Step 6: Commit**

```bash
git add apps/kontrol/README.md
git commit -m "docs(kontrol): local dev runbook + isolation verification"
```

---

## Self-Review

**Spec coverage** (against the agreed foundation goal):
- Fresh clone + branch → Task 1. ✓
- Separate Postgres container/volume, isolated, own port → Task 1. ✓
- New NestJS app mirroring `apps/api` conventions → Task 2. ✓
- Own Prisma client/schema/DB, never markala's → Tasks 2–3. ✓
- DB-backed health proof → Task 2. ✓
- First domain model + migration + read endpoint → Task 3. ✓
- New Next.js app mirroring `apps/web`, consuming api-kontrol → Task 4. ✓
- End-to-end slice rendered in browser → Tasks 4–5. ✓
- markala untouched (verified) → Task 5 Step 5; lockfile additive check → Task 2 Step 9. ✓
- Local runbook → Task 5. ✓

**Placeholder scan:** No TBD/TODO/"handle errors"/"similar to" — every code step contains complete, runnable content. ✓

**Type consistency:** `fetchOrganizations()` / `fetchHealth()` defined in Task 4 Step 6 match their usage in Task 4 Step 8 (`page.tsx`) and the test in Step 4. `Organization { id, name, slug, createdAt }` defined in Task 3 Step 1 matches `KontrolOrganization { id, name, slug }` consumed by the web (extra `createdAt` is ignored by the client, intentional). `GET /api/organizations` route (Task 3) matches the URL asserted in Task 4's test and `page.tsx`. `GET /api/health` shape `{ status, db }` (Task 2) matches `fetchHealth` and the page badge. ✓

**Out of scope (next plans):** multi-tenant `organizationId` scoping + roles, Division/Branch models, talep (request) flow + design approval + OrderStatus, merkez cari, landing page + "Hemen başvur", deployment/DNS/Cloudflare/nginx. Each becomes its own plan once this foundation is green.

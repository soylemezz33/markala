# Katkı Rehberi — Markala

Bu doküman Markala monorepo'sunda **nasıl kod yazılır, nasıl PR açılır ve hangi
kalite çıtasından geçilir** sorularının tek kaynağıdır. Mimari ve kurulum için
[`README.md`](./README.md)'ye bak; bu dosya yalnızca **çalışma disiplinini** tanımlar.

> Kısa kural: `main`'e doğrudan push **yok** · her değişiklik **PR** · PR **< ~300 LOC**
> · **Conventional Commits** · **CI yeşil** · sadece **kendi alanın**.

---

## 1. Repo Yapısı ve Katman Sınırları

```
apps/web     Next.js 14 storefront (App Router)
apps/admin   Next.js 14 yönetim paneli
apps/api     NestJS + Prisma REST API
packages/ui          Paylaşımlı UI bileşenleri
packages/types       Domain tipleri — TEK KAYNAK
packages/api-client  Type-safe REST client (web + admin)
packages/config      Tailwind preset + tsconfig.base.json
packages/mock-data   FAZ 1-2 mock JSON
```

**Bağımlılık yönü tek yönlüdür:** `apps/*` → `packages/*`. Bir paket bir app'e asla
import edemez; paketler arası döngüsel bağımlılık yasaktır.

**`@markala/types` tek doğruluk kaynağıdır.** Bir domain tipi (Order, Product, User,
status enum'ları...) birden fazla yerde elle yeniden tanımlanmaz — `@markala/types`'tan
import edilir. Aynı `interface`/`type`/enum'u iki dosyada görüyorsan, bu bir hatadır;
paylaşılan pakete taşı.

---

## 2. Branch ve Commit

### Branch ismi
```
<tip>/<alan>-<kisa-aciklama>
örn: fix/web-checkout-email-validation
     refactor/admin-format-date-extract
     docs/contributing-guide
```

### Commit mesajı — Conventional Commits (zorunlu)
```
<tip>(<scope>): <60 karakter altı özet>

<gövde: niye + ne + nasıl test edildi>
```
İzinli tipler: `feat` · `fix` · `refactor` · `docs` · `test` · `chore` · `ci` · `perf`.
Scope = etkilenen alan (`web`, `admin`, `api`, `ui`, `types`, `api-client`, `config`).

---

## 3. PR Kuralları

1. **Tek alan, küçük PR.** İdeal < ~300 LOC. Büyük iş → birden fazla odaklı PR'a böl.
2. **`main`'e doğrudan push yasak.** Her şey PR'dan geçer, CI yeşil olmadan merge yok.
3. **Şablonu doldur** (`.github/PULL_REQUEST_TEMPLATE.md`): Sorun / Çözüm / Test / Risk
   / Etki Alanı / Rollback.
4. **Routable issue anahtarı** PR başlığında veya branch'te (`AJA-123`) — issue ile
   bağlanır. PR merge'te issue'yu kapatması gerekiyorsa gövdede `Closes AJA-123`.
5. **Migration yazıldıysa** sonunda rollback adımı zorunlu (`-- ROLLBACK: ...`).
6. **Production'da `--force` push kesinlikle yasak.**

---

## 4. Kod Standardı

### TypeScript
- **Strict mode** zorunlu (`packages/config/tsconfig.base.json` devralınır:
  `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`).
- **`any` yasak.** Mecbursan `unknown` + tip daraltma (type guard) kullan. `as any`,
  `@ts-ignore`, `@ts-expect-error` ancak yorumla gerekçelendirilerek ve istisnai geçer.
- API/fetch dönüşleri tiplenmeli — `Record<string, unknown>` ve çift cast
  (`x as unknown as Y`) tip güvenliğini kırar, kaçın.
- Prisma sonuçlarını DTO'ya elle `as` ile zorlamak yerine doğru tipi kullan; enum
  alanları string cast (`status as any`) ile değil, gerçek enum tipiyle yaz.

### Naming ve dil
- **Değişken / fonksiyon / tip isimleri İngilizce.** Yorumlar Türkçe olabilir.
- Yorum **niye**yi açıklar; **ne**yi kod zaten anlatır.
- Dosya isimleri: React bileşen dosyaları `kebab-case.tsx`, Nest dosyaları
  `<feature>.<rol>.ts` (`orders.service.ts`, `orders.controller.ts`).

### Import düzeni
Üç grup, her grup arasında boş satır:
1. Dış paketler (`react`, `next`, `@nestjs/*`)
2. Workspace paketleri (`@markala/types`, `@markala/ui`, `@markala/api-client`)
3. Göreli importlar (`./`, `../`)

### Tekrar (DRY)
Aynı yardımcı fonksiyon ikinci kez kopyalanıyorsa, paylaşılan bir modüle çıkar
(`apps/<app>/src/lib/` veya `packages/ui`). `formatDate`, `escapeHtml`, status-label
tabloları gibi util'ler **tek yerde** yaşar.

### Hata yönetimi
- **Sessiz yutma yasak.** Boş `catch {}` veya yalnızca `console.log`'layan catch kabul
  edilmez — logla **ve** anlamlı bir sonuç/şekil dön.
- **Fail-closed:** belirsizlikte (DB hatası, doğrulama hatası) güvenli/kapalı tarafa düş.
- API route hata yanıtları **tutarlı bir şekle** sahip olmalı (`{ error: string }`).
- `console.log` debug için bırakılmaz; kalıcı kayıt gerekiyorsa logger kullan.

---

## 5. Lint ve Format

> **Mevcut durum (tech-debt):** Repo'da paylaşılan ESLint/Prettier konfigürasyonu
> **yok** ve CI'da **lint adımı çalışmıyor**. Aşağıdaki standart hedeftir; tooling
> PR'ı ile devreye alınana kadar bu kurallar elle gözetilir. (bkz. AJA-199 envanteri)

- **ESLint:** `next/core-web-vitals` (web/admin) + `@typescript-eslint` (api) tabanlı,
  kök seviyede paylaşılan config. `no-explicit-any`, `no-unused-vars`,
  `import/order` açık olmalı.
- **Prettier:** kök `.prettierrc` ile tek format standardı (girinti, tırnak, virgül).
  Formatla ilgili tartışmalar PR review'da değil, formatter'da çözülür.
- Devreye alındığında her app'in `lint` script'i CI'da **bloklayıcı** koşulur.

---

## 6. Test

- Yeni service/util → **unit test**. Yeni endpoint → **integration test**. Değişen
  kullanıcı akışı → **E2E** (Playwright, `apps/web`).
- Kritik path hedefi: **%85+** coverage. Negatif testler (4xx/5xx, null, boş, çok büyük
  input) atlanmaz.
- Testte gerçek müşteri verisi değil **fixture/fake** kullan.
- Çalıştırma: `pnpm --filter @markala/<paket> test`.

---

## 7. KVKK ve Güvenlik (özet checklist)

- OpenAI/Anthropic gibi dış servise ham veri gitmeden önce **PII scrub**.
- Her admin endpoint başında **auth check**; sorgularda **tenant izolasyonu**.
- Parametreli sorgu (SQL injection'a karşı), ham HTML render'da sanitize (XSS).
- Secret/API key koda gömülmez — `.env` üzerinden.
- KVKK aydınlatma metnini etkileyen değişiklik → ayrı onay.

---

## 8. Review Süreci ve Şiddet Skalası

Her PR Code Reviewer onayından geçer. Yorumlar şu skalayla etiketlenir:

| Etiket | Anlam |
|---|---|
| 🔴 **BLOCKER** | Merge edilemez. Güvenlik / KVKK / mimari ihlal. |
| 🟠 **MAJOR** | Düzeltilmeli — bu PR'da ya da hemen takip PR'ında. |
| 🟡 **MINOR** | İyileştirme önerisi; sonraki refactor'a bırakılabilir. |
| 🟢 **NIT** | Stil/küçük tartışma; yorum yeterli. |
| 💡 **TIP** | Eğitim amaçlı ipucu; aksiyon gerekmez. |

Hot-fix (production aşağıda) istisnası: tam inceleme atlanır, smoke test geçilir,
merge sonrası detaylı review yapılır.

---

## 9. Hızlı Doğrulama (PR açmadan önce)

```bash
pnpm install
pnpm type-check     # tüm paketler temiz
pnpm lint           # (devreye alınınca) temiz
pnpm --filter @markala/web test
```

Hepsi yeşilse PR aç. Değilse önce düzelt — kırık CI ile PR açma.

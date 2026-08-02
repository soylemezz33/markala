# Landing Güncelleme Raporu — 2026-06-29

**Durum:** TAMAMLANDI — commit da0f81e

**Değiştirilen dosya:** `apps/kontrol/src/app/page.tsx` (tek dosya)

**Type-check:** `pnpm --filter kontrol type-check` → TEMIZ (hata yok)

**Dokunulmayan dosyalar (garanti):**
- `apps/kontrol/src/app/(portal)/talepler/**` → staged yok
- `apps/kontrol/src/lib/portal/client.ts` → staged yok
- `apps/api-kontrol/**` → staged yok
- `markala`, `packages`, lockfile → staged yok

**Yapılan değişiklikler:**
- Hero başlık: "marka bütünlüğü + tek panel" → "baskı kaosunu tek panele bağlayın — her şubede aynı marka, merkez kontrolünde"
- Alt başlık: onaylı şablon→talep→üretim→tek teslim→tek cari→şube analizi akışı eklendi
- 2 CTA düğmesi: "Hemen başvur" + "Demo iste" (ikisi de /basvur)
- 6 değer kartı hibrit konumlamaya göre yeniden yazıldı
- Güven bölümü eklendi: "markala.com.tr'yi yıllardır işletiyoruz — üreticinin kendisiyiz"
- Alt CTA: hedef kitle notu (marka/paz. yöneticisi + CFO/operasyon)

**Endişe:** Yok. Saf metin/yapı değişikliği; hiçbir tip, API bağlantısı veya dinamik veri yok.

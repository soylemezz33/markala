# SEO İş Bölümü — 2026-08-17

Denetim sonrası görev dağılımı. Kaynak: `markala.com.tr-audit/ACTION-PLAN.md`

---

## 🤖 CLAUDE — kodla çözülür, ben yaparım

| # | İş | Durum | Görünür? |
|---|---|---|---|
| C1 ✅ | `/yasal/[slug]` metadata guard — olmayan sayfa ana sayfa başlığı + `index,follow` veriyordu | **bitti** | Hayır |
| C2 | Soft-404: sabit rotalarda gerçek 404 (`dynamicParams=false`) | ⏳ | Hayır |
| C3 ✅ | Sitemap: eksik yasal sayfalar (`iade`, `kargo`, `on-bilgilendirme`, `kullanim-kosullari`, `cerez`) | **bitti** | Hayır |
| C4 | Sitemap `lastmod` düzeltmesi — 826/897 URL aynı damgayı taşıyor | ⏳ | Hayır |
| C5 ✅ | Ana sayfadan kaldırılmış **HowTo** schema'sını sil (Google Eyl-2023'te kaldırdı) | **bitti** | Hayır |
| C6 ✅ | Uydurma `sku`/`mpn` temizliği — URL slug'ı stok kodu diye yazılmış | **bitti** | Hayır |
| C7 ✅ | `Offer.seller` → dolu Organization `@id`'sine bağla | **bitti** | Hayır |
| C8 ✅ | `LocalBusiness.areaServed` ile gerçek `/matbaa/` şehirlerini eşitle | **bitti** | Hayır |
| C9 | Eksik `BreadcrumbList`: `/hakkimizda`, `/iletisim`, `/yardim` | ⏳ | Hayır |
| C10 | `/blog` dizinine `ItemList` schema | ⏳ | Hayır |
| ~~C11~~ | ~~`robots.txt` AI bot kuralı~~ → **kod zaten doğru, sorun Cloudflare'de** (H9'a taşındı) | ➡️ H9 | — |
| C12 | Adres/isim tutarlılığı — **H2 kararı sonrası** tek kimliğe eşitle | 🔒 H2 bekliyor | Sadece adres metni |

**Görünür içerik değişikliği yok.** C12 hariç hiçbiri ziyaretçinin gördüğü hiçbir şeyi değiştirmiyor.

---

## 👤 HASAN — hesap/karar/operasyon gerektirir

| # | İş | Süre | Neden sen |
|---|---|---|---|
| H1 | **Ads faturası** | 10 dk | Ödeme yetkisi. 8 gündür kampanyalar kapalı |
| H2 | **Resmî ad + adres kararı** ⚠️ | 5 dk | Site 2 farklı kimlik gösteriyor (aşağıda) — C12 ve tüm backlink işi buna kilitli |
| ~~H3~~ ✅ | ~~ETBİS kaydı~~ — **tamamlandı 17.08.2026**, siteye işlendi (Claude) | bitti | Kayıt: 324 Ajans Bilgi Teknolojileri Ltd. Şti. |
| H4 🔄 | İSG ürün açıklamaları — **içerik Claude tarafından yazıldı**, uygulanması admin girişi istiyor | 5 dk | `scripts/isg-icerik/uygula.mjs` — aşağıya bak |
| H5 | **Google Business Profile** | 15 dk | H2 sonrası, doğru adresle |
| H6 | **Bing Webmaster** kaydı | 5 dk | ChatGPT/Copilot Bing indeksine dayanıyor |
| H7 | **Merchant Center itirazı** | H2+H3 sonrası | Düzeltmeler yapılmadan itiraz etme |
| H8 | Backlink planı uygulaması | sürekli | `docs/BACKLINK-PLANI-2026-08.md` — H2 sonrası başlar |
| H9 | **Cloudflare AI Crawl Control'ü kapat** ⚠️ | 5 dk | Aşağıya bak — Cloudflare panel erişimi bende yok |

### ⚠️ H9 — Cloudflare, kodun AI politikasını eziyor

`apps/web/src/app/robots.ts` AI botlarını **bilerek açık** bırakıyor (kod yorumu: *"Rakiplerin 5/5'i açık; görünürlük için biz de açığız"*). Ama canlı `robots.txt`'te iki ayrı blok var:

| Satır | Kaynak | İçerik |
|---|---|---|
| 29-59 | **Cloudflare** (enjekte) | `Content-Signal: ai-train=no` + `ClaudeBot`, `GPTBot`, `Google-Extended`, `Applebot-Extended`, `Amazonbot` → **`Disallow: /`** |
| 62+ | Next.js (bizim kod) | `Allow: /` — AI botları açık |

Bot kendi adına özel grubu bulunca onu uygular; yani **Cloudflare'in bloğu kazanıyor** ve `ClaudeBot` engelleniyor.

**Neden önemli:** Ölçülen tek satış (1.573 TRY) **"AI Assistant" kanalından** geldi. Bu ayar, dönüşen tek kanalı kısıtlıyor olabilir. Cloudflare panel → **AI Crawl Control / Content Signals** bölümünden kapatılmalı (panel erişimi bende yok). Kapatıldıktan sonra GA4'te "AI Assistant" kanalını izleyelim.

### ⚠️ H2 — karar bekleyen çelişki

Site şu an iki farklı kimlik gösteriyor:

| Yer | İsim | Adres |
|---|---|---|
| Ana sayfa JSON-LD | **Markala** | Çiftlikköy Mah. 32182 Sk. Astoria One No:13 İç Kapı No:61, Yenişehir |
| Footer + `/iletisim` + `/yasal/mesafeli-satis` | **324 Ajans** | Menteş Mah. 100. Yıl Cumhuriyet Cad. |

Merchant Center "Misrepresentation" askısının bir numaralı şüphelisi bu. **Hangisi resmî?** Söyle, tüm site tek kimliğe eşitlensin.

---

### 🔄 H4 — İSG içeriği hazır, uygulanmayı bekliyor

Sıralamada olan **10 İSG ürünü** için teknik özellik + kullanım alanı + SSS içeriği yazıldı (`scripts/isg-icerik/icerik.json`). Teknik özellikler ürünün **gerçek** option verisinden türetildi (ebat/malzeme/baskı) — uydurma değer yok; kullanım ve SSS her levhanın kendi tehlike bağlamına ve işaret sınıfına göre farklı.

**Yol boyunca çıkan engel çözüldü:** Ürün `content` alanının API'de **yazma yolu hiç yokmuş** — sütun ve okuma tarafı vardı, `UpdateProductDto`'da alan olmadığı için `whitelist:true` olan validation pipe gönderilen içeriği sessizce siliyordu. İSG kataloğunun boş kalmasının teknik sebebi buydu. Alan eklendi (kategorilerdeki desenin aynısı), böylece admin panelden de düzenlenebilir hale geldi.

Uygulamak için (admin bilgilerini sen ver, repoya yazma):

```bash
# önce ne olacağını gör:
ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/isg-icerik/uygula.mjs --dry
# sonra uygula:
ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/isg-icerik/uygula.mjs
```

Mevcut `content` korunur, yalnız eksik alanlar yazılır. Kalan ~800 İSG ürünü için aynı kalıp işaret sınıfı bazında çoğaltılabilir — istersen devam ederim.

---

## 🔒 Ortak karar gerektiren (senin onayınla ben yaparım)

| # | İş | Neden onay gerekiyor |
|---|---|---|
| O1 | `/urun` ve `/kategori`'de `dynamicParams=false` | Gerçek 404 verir **ama** admin'den eklenen yeni ürün, yeniden build'e kadar 404 döner. Ticari risk var — kararı sen ver |
| O2 | CSP'yi enforce moda alma | Yanlış kurgulanırsa ödeme/analytics kırılabilir. Önce report-only ihlallerini izlemek gerek |
| O3 | Kopya ürün sayfalarını birleştirme + 301 | Görünür değişiklik (`sigara-icilmez` ailesi %97-100 aynı) |
| O4 | Yeni İSG rehber/sözlük sayfaları | Yeni sayfa — mevcuda dokunmaz ama içerik üretimi |
| O5 | `http://www` tek-hop redirect | Cloudflare tarafı, panel erişimi bende yok |

---

## ✅ Sorun sanılıp sorun ÇIKMAYANLAR (düzeltme gerekmiyor)

Denetim sırasında bunları yanlış teşhis etmiştim, canlıda doğrulayınca temiz çıktılar:

- **Görseller zaten optimize.** Next.js WebP servis ediyor: 196 KB JPEG kaynak → tarayıcıya **18 KB WebP**. `srcset`, `fetchpriority="high"`, `sizes` hepsi doğru kurulmuş. *(JPEG yalnız WebP desteklemeyen eski tarayıcıya fallback olarak gidiyor — bu kaldırılmamalı, yoksa o tarayıcılarda görsel hiç görünmez.)*
- **AI alıntı botlarının bir kısmı açık.** `OAI-SearchBot`, `Claude-SearchBot`, `PerplexityBot` engelli değil ve `Google-Extended` engeli AI Overviews'ı etkilemiyor. **Ancak** `ClaudeBot` ve `GPTBot` Cloudflare tarafından engelleniyor → bkz. **H9** (kodda değil, panelde çözülür).
- **404 sayfası `noindex` veriyor** — soft-404'ler indekse girmiyor, zarar tarama bütçesiyle sınırlı (Kritik değil, Orta).
- **Schema işaretlemesi güçlü** — Product/AggregateOffer/MerchantReturnPolicy/OfferShippingDetails/LocalBusiness/FAQPage/BreadcrumbList mevcut ve hatasız.
- **Alt metinler, title/description uzunlukları, canonical'lar** — örneklemde sorun yok.

---

## Sıra

1. **H2** (adres kararı) — her şeyi kilitleyen tek madde
2. **C1, C3, C5-C8 bitti** ✅ · C2, C9, C10 sırada · C12 H2 bekliyor
3. **H1, H3** → **H7** (Merchant itirazı)
4. **H4** (İSG içerik) — en yüksek sıralama getirisi
5. **H5, H6** → **H8** (backlink)

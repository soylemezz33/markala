# Chatwoot Panel Uygulaması — markala müşteri/sipariş paneli

**Durum:** kod ana ağaca uygulandı (26.09.2026) · canlıya alma için sunucu tarafı adımları bekliyor
**Kapsam:** SALT OKUNUR. Ne Chatwoot'a ne markala'ya yazar. markala–ClickUp köprüsü kurulmadı (karar değişmedi).

## Ne yapar

Chatwoot konuşma ekranının sağ panelinde "markala" sekmesi açılır; ajan panele gitmeden müşteriyi
ve son siparişlerini görür:

- **Müşteri:** ad, tip (bireysel/kurumsal/başvuru bekliyor), e-posta, telefon, üyelik tarihi, puan
- **Kurumsal (onaylı):** cari bakiye (borç−alacak), limit, vade, iskonto, son aylık fatura
- **Son 5 sipariş:** durum + ödeme rozetleri, kalemler, kargo takip linki, prova/baskı ve müşteri
  dosyaları, fatura no, müşteri notu, son 2 iç not, "sıradaki adım" ipucu
- **Kopyala** düğmeleri (sipariş no, takip no/link, dosya URL'i) ve "Panelde aç" bağlantıları
- Kayıt yoksa: "Bu numarayla markala'da kayıt/sipariş yok" + "Panelde ara"

Chatwoot **mobil** uygulamasında dashboard app sekmesi yoktur; yalnız web.

## Nasıl çalışır

- Chatwoot iframe'e `postMessage` ile `appContext` gönderir (`contact.phone_number`,
  `conversation.inbox_id`). Sayfa açılışta `chatwoot-dashboard-app:fetch-info` ile ister.
- **Eşleşme:** telefonun son 10 hanesi (`5057417028`) → `users.phone` **ve** `orders.phone`
  (misafir siparişleri dahil), iki tarafın rakam dışı karakterleri ayıklanarak:
  `regexp_replace(phone,'[^0-9]','','g') LIKE '%…'`. 7 haneden kısa girdide DB'ye hiç gidilmez.
- **inbox filtresi:** yalnız markala hattı (`CHATWOOT_MARKALA_INBOXES`, varsayılan 5); diğer
  inbox'larda "Bu konuşma markala hattında değil" yazar.
- Soft-delete edilmiş kullanıcı/sipariş gösterilmez (`deleted_at IS NULL`).

## Kod (apps/api, NestJS)

| Dosya                                                      | İş                                                                         |
| ---------------------------------------------------------- | -------------------------------------------------------------------------- |
| `apps/api/src/chatwoot-panel/chatwoot-panel.controller.ts` | iframe sayfası + lookup ucu, anahtar doğrulama, iframe başlıkları          |
| `apps/api/src/chatwoot-panel/chatwoot-panel.service.ts`    | telefon → müşteri + siparişler (salt okunur sorgular), kargo URL kalıpları |
| `apps/api/src/chatwoot-panel/panel.html`                   | tek dosya arayüz (inline CSS/JS, koyu tema desteği)                        |
| `apps/api/src/chatwoot-panel/chatwoot-panel.module.ts`     | modül (PrismaModule @Global olduğu için ek import yok)                     |
| `apps/api/src/chatwoot-panel/*.spec.ts`                    | 15 birim testi (eşleşme, kargo linki, cari, anahtar)                       |

Uçlar (**global prefix `api` dahil**):

- `GET /api/chatwoot-panel?k=<KEY>` — iframe sayfası. `CSP: frame-ancestors <CHATWOOT_ORIGIN>`,
  `X-Frame-Options` kaldırılır, `Cross-Origin-Resource-Policy: cross-origin` (helmet varsayılanı
  `same-origin` bırakılsa tarayıcı sayfayı çapraz-origin iframe'e yüklemez), `no-store`, `noindex`.
- `GET /api/chatwoot-panel/lookup?phone=…&k=<KEY>` — JSON. Anahtar `timingSafeEqual` ile karşılaştırılır.

Yapılandırma değişiklikleri:

- `apps/api/nest-cli.json` → `compilerOptions.assets: ["chatwoot-panel/panel.html"]` + `watchAssets`
  (panel.html TS derlemesine girmez, dist'e kopyalanır). Kopyalanmazsa **boot çökmez**: dosya ilk
  istekte okunur, yalnız bu uç 500 verir ve log'a `panel.html bulunamadı` yazar.
- `apps/api/src/app.module.ts` → `ChatwootPanelModule`
- `apps/api/src/main.ts` → `GET /chatwoot-panel*` için 60/dk per-IP limit. Anahtar sızarsa
  telefon taramasıyla müşteri listesi dökülmesini yavaşlatır; meşru kullanım konuşma başına 1-2 istek.
- `docker-compose.production.yml` → api servisine `CHATWOOT_*` env'leri.

Admin panelinde iki küçük ek (bu panelin "Panelde ara" düğmesi işe yarasın diye):

- `/musteriler` ve `/siparisler` listeleri artık `?q=…` ile açılabiliyor (arama kutusu dolu gelir).
- `/musteriler` aramasında **telefon** da eşleşiyor, iki taraf rakama indirgenerek
  (`+90 505 741 70 28` kaydı `5057417028` terimiyle bulunur).

## Env

```
CHATWOOT_PANEL_KEY=            # boşsa lookup 401 → özellik kapalı (fail-closed). openssl rand -hex 24
CHATWOOT_ORIGIN=https://chat.324ajans.com
CHATWOOT_MARKALA_INBOXES=5
CHATWOOT_PANEL_ORDER_URL=https://admin.markala.com.tr/siparisler/{id}
CHATWOOT_PANEL_CUSTOMER_URL=https://admin.markala.com.tr/musteriler/{id}
CHATWOOT_PANEL_SEARCH_URL=https://admin.markala.com.tr/musteriler?q={q}
```

`{id}` sipariş/müşteri **id**'si (sipariş detay rotası `/siparisler/[no]` adını taşısa da id
bekliyor), `{q}` arama terimi. Bu üç URL compose'a **varsayılan olarak yazılamıyor**: compose
interpolasyonunda `${VAR:-default}` varsayılanı ilk `}` ile biter, URL'ler süslü parantez içeriyor →
değerler `.env.production`'dan gelmeli. Boş kalırsa yalnız "Panelde aç/ara" düğmeleri çıkmaz.

## Chatwoot tarafı

Ayarlar → Entegrasyonlar → **Panel Uygulamaları** → Yapılandır

- Ad: `markala`
- URL: `https://api.markala.com.tr/api/chatwoot-panel?k=<CHATWOOT_PANEL_KEY>`

## Doğrulama

Yapıldı (26.09.2026, yerel):

- `pnpm --filter @markala/api type-check` · `pnpm --filter @markala/admin type-check` — temiz
- `nest build` sonrası `dist/chatwoot-panel/panel.html` yerinde
- API birim testleri: 768/768 (yeni 15 test dahil)

Canlıda yapılacak (DB gerektirir, yerelde Postgres yok):

1. `https://api.markala.com.tr/api/chatwoot-panel?k=KEY&test=905057417028` — Chatwoot olmadan
   kendi telefonunla dene. Sayfa açılıyor + sipariş listeleniyorsa SQL eşleşmesi doğrulanmış olur.
2. Gerçek bir konuşmada sağ panelde sekme açılıyor mu (iframe engellenmiyor mu).

## Açık işler

- **Sunucu:** `.env.production`'a 6 env satırı + sunucudaki compose'a api servisi env blokları
  (git compose sunucudakini birebir yansıtmıyor — bkz. "Prod compose sürüklenmesi").
- **nginx:** git'teki `api.markala.com.tr` bloğu `X-Frame-Options` EKLEMİYOR (web bloğu SAMEORIGIN,
  admin bloğu DENY ekliyor) — sunucudaki dosyada da api bloğunda bu başlık olmadığı doğrulanmalı,
  yoksa iframe boş beyaz kutu görünür.
- **Kargo linkleri:** `CARRIER_URLS` kalıpları (Yurtiçi/Aras/MNG/PTT/Sürat/Hepsijet) ilk gerçek
  kargoda tıklanıp doğrulanmalı; eşleşme yoksa link üretilmez, numara yine görünür.
- **Faz 2 (isteğe bağlı):** aynı sayfa inbox 7'de ClickUp müşteri görevlerini listeleyebilir (salt okunur).

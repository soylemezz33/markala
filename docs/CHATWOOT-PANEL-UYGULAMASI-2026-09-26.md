# Chatwoot Panel Uygulaması — markala müşteri/sipariş paneli

**Durum:** CANLI (26.09.2026) · Faz 1 salt okunur + **Faz 2 işlem yapabilen panel**
**Kapsam:** Ajan Chatwoot'tan çıkmadan siparişin TAM detayını görür ve günlük işlemleri yapar. İPTAL ve İADE bilerek dışarıda — geri alınamaz işlemler admin panelinde kalır. markala–ClickUp köprüsü kurulmadı (karar değişmedi).

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

## Faz 2 — ajan girişi ve işlemler (26.09.2026)

### Neden giriş gerekti

URL'deki paylaşılan anahtar okuma için yeterli ama YAZMA için değil: o anahtarı gören herkes
sipariş durumu değiştirebilirdi ve "kim yaptı" kaydı tutulamazdı. Ajan artık iframe içinde
**kendi markala panel hesabıyla** giriş yapar; sonraki her istek normal JWT ile gider.

- `POST /api/chatwoot-panel/oturum?k=<KEY>` · gövde `{email, password}` → `{token, kullanici{ad,rol,izinler}}`
- Şifre doğrulaması `AuthService.login` (argon2 + kapatılmış hesap kapısı + zamanlama önlemi);
  **role=customer reddedilir** (müşteri hesabı panel token'ı alamaz).
- Token ömrü `CHATWOOT_PANEL_TOKEN_TTL` (varsayılan `8h`). Neden uzun: panel üçüncü taraf
  iframe'de çalışıyor, refresh cookie'si (SameSite=Lax) tarayıcıya gönderilemiyor.
- Token iframe'in `localStorage`'ında (`mk_cw_oturum`); 401 alınınca oturum düşer, giriş formu çıkar.
- Rate limit: `POST /chatwoot-panel/oturum` 5/dk (login ile aynı sıkılık).

### Panelden yapılabilenler (hepsi MEVCUT uçlar, yeni iş mantığı yok)

| İşlem                                            | Uç                                       | İzin                                              |
| ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------- |
| Durum değiştirme (7 durum)                       | `PATCH /orders/:id/status`               | `orders.tracking` + tam akış için `orders.status` |
| Kargo firma / takip no                           | `PATCH /orders/:id/tracking`             | `orders.tracking`                                 |
| İç not ekleme                                    | `POST /orders/:id/notlar`                | `orders.notes`                                    |
| Tasarım dosyası yükleme (önizleme/çalışma/baskı) | `POST /orders/:id/items/:itemId/tasarim` | `orders.design`                                   |
| Tasarımcı dosyası silme                          | `DELETE /orders/:id/tasarim/:uploadId`   | `orders.design`                                   |
| Tasarımı WhatsApp'tan onaya gönderme             | `POST /orders/:id/tasarim-onay`          | `orders.design`                                   |

Yetki sınırı **sunucuda**: RolesGuard + `@Perms`. Arayüz yalnız düğmeleri gizler
(`izinler` listesi girişte döner). Kargo rolü yalnız "Üretimde" ve "Kargoya Verildi"
işaretleyebilir (`status-yetki.ts` kuralının aynısı panelde de uygulanır) ve parasal alanları
görmez (`parasalAlanlariAyikla` yanıttan ayıklar).

### Gösterilen tam detay

`GET /orders/:id` + `GET /orders/:id/zaman-cizelgesi` + `GET /orders/:id/notlar` ile:
kalem konfigürasyon detayları (`optionDetails` — "350 gr Kuşe · mat selefon"), müşteri ve
tasarımcı dosyaları (görsellerde küçük önizleme, Drive bağlantıları), teslimat/fatura adresi
(+ VD/VKN), tutar dökümü, ödeme yöntemi/hatası, fatura no ve tipi, iç notlar ve hareket
geçmişi (durum, ödeme, kargo, fatura, bildirimler).

### Bilerek dışarıda

- **Sipariş iptali** ve **iyzico iadesi**: Chatwoot'ta düğmesi yok; "Panelde aç" ile admin panelinde yapılır.
- Fatura yeniden kesme / fatura-kesilmesin / manuel sipariş: admin panelinde.

## Açık işler

- **Sunucu:** `.env.production`'a 6 env satırı + sunucudaki compose'a api servisi env blokları
  (git compose sunucudakini birebir yansıtmıyor — bkz. "Prod compose sürüklenmesi").
- **nginx:** git'teki `api.markala.com.tr` bloğu `X-Frame-Options` EKLEMİYOR (web bloğu SAMEORIGIN,
  admin bloğu DENY ekliyor) — sunucudaki dosyada da api bloğunda bu başlık olmadığı doğrulanmalı,
  yoksa iframe boş beyaz kutu görünür.
- **Kargo linkleri:** `CARRIER_URLS` kalıpları (Yurtiçi/Aras/MNG/PTT/Sürat/Hepsijet) ilk gerçek
  kargoda tıklanıp doğrulanmalı; eşleşme yoksa link üretilmez, numara yine görünür.
- **Faz 2 (isteğe bağlı):** aynı sayfa inbox 7'de ClickUp müşteri görevlerini listeleyebilir (salt okunur).

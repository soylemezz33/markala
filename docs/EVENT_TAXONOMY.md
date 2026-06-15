# Markala Event Taxonomy

Tüm analytics event isimleri ve property kontratları bu dokümanda tanımlanır.
Kaynak: `apps/api/src/analytics/event-taxonomy.ts`

## Endpoint

```
POST /analytics/track
```

```json
{
  "eventName": "cart_item_added",
  "sessionId": "ses_abc123",
  "productId": "clxxx...",
  "properties": { ... }
}
```

- `sessionId`: Zorunlu. Anonim kullanıcılar için tarayıcı çerezinden üretilir.
- `userId`: Sunucu tarafında JWT'den otomatik doldurulur (cookie).

---

## Ürün Keşif

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `product_viewed` | Ürün detay sayfası yüklendi | `productId`, `productSlug`, `productName` |
| `product_list_viewed` | Kategori / listeleme sayfası görüntülendi | `productCount` |
| `product_searched` | Arama kutusu kullanıldı | `query`, `resultCount` |
| `category_viewed` | Kategori sayfası yüklendi | `categoryId`, `categorySlug` |

---

## Sepet

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `cart_item_added` | Sepete ekle butonu | `productId`, `productSlug`, `productName`, `quantity`, `unitPrice`, `lineTotal` |
| `cart_item_removed` | Sepetten çıkar | `productId` |
| `cart_item_quantity_changed` | Adet artır/azalt | `productId`, `previousQuantity`, `newQuantity` |
| `cart_viewed` | Sepet sayfası açıldı | `itemCount`, `cartTotal` |
| `cart_abandoned` | Sepet 30 dk güncellenmedi (backend Celery job) | `cartId`, `itemCount`, `cartTotal`, `minutesSinceLastUpdate` |

---

## Ödeme Hunisi

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `checkout_started` | Ödemeye geç butonu | `itemCount`, `cartTotal` |
| `checkout_step_completed` | Her adım tamamlandı | `step`, `stepIndex` |
| `coupon_applied` | Kupon kodu başarıyla uygulandı | `couponCode`, `discountAmount`, `couponType` |
| `coupon_rejected` | Geçersiz kupon | `couponCode`, `reason` |
| `payment_initiated` | Ödeme formu gönderildi | `cartTotal`, `paymentMethod` |
| `payment_succeeded` | iyzico callback başarılı | `orderId`, `orderNumber`, `total`, `paymentMethod` |
| `payment_failed` | iyzico callback başarısız | `reason`, `errorCode` |

---

## Sipariş

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `order_placed` | Sipariş oluşturuldu | `orderId`, `orderNumber`, `total`, `itemCount`, `hasDesignSupport` |
| `order_status_changed` | Sipariş durumu değişti | `orderId`, `orderNumber`, `previousStatus`, `newStatus` |
| `design_upload_started` | Dosya yükleme başladı | `orderId` |
| `design_upload_completed` | Dosya yükleme bitti | `orderId`, `fileName`, `fileSizeBytes` |

---

## Kullanıcı

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `user_registered` | Kayıt tamamlandı | `accountType` |
| `user_logged_in` | Giriş yapıldı | `accountType` |
| `user_logged_out` | Çıkış yapıldı | — |
| `corporate_application_submitted` | Kurumsal başvuru gönderildi | `applicationId` |

---

## UI Etkileşim

| Event | Tetikleyici | Zorunlu Properties |
|---|---|---|
| `banner_clicked` | Banner tıklandı | `bannerId`, `bannerTitle`, `location` |
| `campaign_package_viewed` | Kampanya paketi görüntülendi | `packageId`, `packageSlug` |
| `hero_slide_clicked` | Ana slider tıklandı | `slideId` |
| `blog_post_viewed` | Blog yazısı açıldı | `postId`, `postSlug` |

---

## Dönüşüm Hunisi (Standart)

```
product_viewed → cart_item_added → checkout_started → payment_initiated → order_placed
```

Adım başına dönüşüm oranı: `/analytics/funnel?startDate=...&endDate=...` (admin)

---

## Admin Endpoint'ler

| Endpoint | Açıklama |
|---|---|
| `GET /analytics/funnel` | Dönüşüm hunisi event sayıları |
| `GET /analytics/top-products` | En çok görüntülenen + sepete eklenen ürünler |
| `GET /analytics/daily-volume?event=order_placed` | Günlük event hacmi |

Tüm admin endpoint'ler JWT + admin rolü gerektirir.

---

## PII Güvenliği

- `ip_address` kolonu: sadece sunucu tarafında yazılır, frontend'e dönmez
- `user_agent`: analytics için tutulur, kullanıcıya gösterilmez
- Müşteri ismi / TC / telefon: asla `properties` içine konmaz
- KVKK kapsamında: `analytics_events` tablosu soft-delete kapsamı dışındadır; veri yasal süre boyunca tutulur

---

*Son güncelleme: 2026-06-15 — DataOps Analitik Ajanı*

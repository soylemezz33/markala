-- Maliyet snapshot'ı (2026-08-24): kâr raporu maliyeti ürünün GÜNCEL fiyat satırından
-- okuyordu; maliyet güncellenince geçmiş kâr geriye dönük değişiyordu. Artık maliyet
-- sipariş anında kaleme yazılır. null = bilinmiyor (maliyetsiz ürün / kampanya paketi).
ALTER TABLE "order_items" ADD COLUMN "cost_total" DECIMAL(10,2);

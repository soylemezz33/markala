-- Kâr marjı (2026-08-27): kategori ve ürün bazında marj çarpanı.
-- Satış = maliyet × marj. null = üst seviyeye düş (ürün → kategori → global pricing.marj).
-- Marj YALNIZ "uygula" aksiyonuyla fiyatlara yazılır; alanın kendisi fiyatı değiştirmez.
ALTER TABLE "categories" ADD COLUMN "profit_margin" DECIMAL(6,3);
ALTER TABLE "products" ADD COLUMN "profit_margin" DECIMAL(6,3);

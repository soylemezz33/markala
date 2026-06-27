-- Fiyatlama modu: "additive" (mevcut, hücre-bazlı) | "area" (m² bazlı maliyet motoru)
ALTER TABLE "products" ADD COLUMN "pricing_mode" TEXT NOT NULL DEFAULT 'additive';

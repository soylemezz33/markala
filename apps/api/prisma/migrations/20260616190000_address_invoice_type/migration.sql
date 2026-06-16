-- Adres fatura tipi (bireysel/kurumsal) + kurumsal fatura alanlari.
-- Additive nullable/defaulted kolonlar — mevcut veriyi etkilemez (geriye donuk uyumlu).
ALTER TABLE "addresses" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'individual';
ALTER TABLE "addresses" ADD COLUMN "company_name" TEXT;
ALTER TABLE "addresses" ADD COLUMN "tax_office" TEXT;
ALTER TABLE "addresses" ADD COLUMN "tax_number" TEXT;

/**
 * Yardım merkezi makale slug'ları — sitemap kapsamı için tek referans liste.
 *
 * ÖNEMLİ: Bu liste `app/yardim/[slug]/page.tsx` içindeki `articles` kaydının
 * anahtarlarıyla senkron kalmalı. Yeni bir yardım makalesi eklendiğinde slug'ı
 * buraya da ekleyin; aksi halde makale sitemap'e girmez (indekslenme kaybı).
 *
 * Not: makale içeriği hâlâ page.tsx'te tutuluyor; burada yalnız slug listesi var
 * ki sitemap.ts UI/icon import'larını page route'undan çekmek zorunda kalmasın.
 */
export const helpArticleSlugs = [
  "sss",
  "dosya-hazirlama",
  "siparis",
  "kargo",
  "iade",
  "odeme",
  "tasarim-destegi",
  "kurumsal",
] as const;

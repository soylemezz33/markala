import { describe, it, expect, vi, beforeEach } from "vitest";
import { SemanticSearchService } from "./semantic-search.service";
import type { PrismaService } from "../prisma/prisma.service";

/**
 * Sözleşme: arama artık SABİT PoC değeri DÖNMÜYOR — canlı katalog (Prisma) üzerinde
 * Türkçe-duyarlı, alan-ağırlıklı lexical skor üretir. Bu spec şunları kilitler:
 *  - alaka sıralaması (ad eşleşmesi açıklamadan ağır basar)
 *  - diakritik-bağımsızlık ("brosur" ↔ "Broşür")
 *  - eşanlam genişletme ("sticker" → "etiket")
 *  - skor 0..1 aralığı + topK limiti
 *  - anlamsız sorgu (stopword/kısa) DB'ye hiç gitmeden [] döner
 */
const CATALOG = [
  {
    id: "p1",
    name: "Kartvizit (350gr Kuşe)",
    slug: "kartvizit-350gr-kuse",
    shortDescription: "Premium kartvizit baskı",
    description: "Mat selefonlu profesyonel kartvizit",
    category: { name: "Kartvizit" },
  },
  {
    id: "p2",
    name: "Broşür A4 Katlamalı",
    slug: "brosur-a4-katlamali",
    shortDescription: "Tanıtım broşürü",
    description: "A4 katlamalı kuşe broşür baskısı",
    category: { name: "Broşür" },
  },
  {
    id: "p3",
    name: "Afiş 50x70",
    slug: "afis-50x70",
    shortDescription: "Yüksek çözünürlük afiş",
    description: "İç/dış mekan poster baskı",
    category: { name: "Afiş" },
  },
  {
    id: "p4",
    name: "Etiket Rulo",
    slug: "etiket-rulo",
    shortDescription: "Rulo etiket baskı",
    description: "Termal ve kuşe rulo etiket",
    category: { name: "Etiket" },
  },
];

function makeService() {
  const findMany = vi.fn().mockResolvedValue(CATALOG);
  const prisma = { product: { findMany } } as unknown as PrismaService;
  return { svc: new SemanticSearchService(prisma), findMany };
}

describe("SemanticSearchService.search", () => {
  let svc: SemanticSearchService;
  let findMany: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ svc, findMany } = makeService());
  });

  it("alaka sıralaması: 'kartvizit' sorgusu kartvizit ürününü en üste koyar", async () => {
    const res = await svc.search({ query: "kartvizit" });
    expect(res[0].slug).toBe("kartvizit-350gr-kuse");
    expect(res.every((r) => r.score > 0 && r.score <= 1)).toBe(true);
  });

  it("diakritik-bağımsız: 'brosur' sorgusu 'Broşür' ürününü bulur", async () => {
    const res = await svc.search({ query: "brosur" });
    expect(res.map((r) => r.slug)).toContain("brosur-a4-katlamali");
  });

  it("eşanlam: 'sticker' sorgusu 'Etiket' ürününü getirir", async () => {
    const res = await svc.search({ query: "sticker" });
    expect(res.map((r) => r.slug)).toContain("etiket-rulo");
  });

  it("skorlar azalan sırada ve 0..1 aralığında", async () => {
    const res = await svc.search({ query: "kuşe baskı" });
    expect(res.length).toBeGreaterThan(0);
    for (let i = 1; i < res.length; i++) {
      expect(res[i - 1].score).toBeGreaterThanOrEqual(res[i].score);
    }
    expect(res.every((r) => r.score >= 0 && r.score <= 1)).toBe(true);
  });

  it("topK sonuç sayısını sınırlar", async () => {
    const res = await svc.search({ query: "baskı", topK: 1 });
    expect(res).toHaveLength(1);
  });

  it("eşleşme yoksa boş dizi döner", async () => {
    const res = await svc.search({ query: "xyzzy-bulunamayan-terim" });
    expect(res).toEqual([]);
  });

  it("anlamsız sorgu (stopword/kısa) DB'ye gitmeden [] döner", async () => {
    const res = await svc.search({ query: "ve bir" });
    expect(res).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});

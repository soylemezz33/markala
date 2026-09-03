import { describe, it, expect } from "vitest";
import { musteriDosyaSatirlari, ilkDosya, MAX_TASARIM, MAX_DOSYA_PER_TASARIM } from "./musteri-dosyalari";

const U = (k: string) => `https://api.markala.com.tr/uploads/design/${k}`;
const K1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.pdf";
const K2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.png";

describe("musteriDosyaSatirlari", () => {
  it("tasarım sırasını ve dosyaları DesignUpload satırlarına çevirir, storageKey URL'den türer", () => {
    const rows = musteriDosyaSatirlari([
      { files: [{ fileName: "on.pdf", fileUrl: U(K1), fileSize: 123, mimeType: "application/pdf" }] },
      { files: [{ fileName: "arka.png", fileUrl: U(K2) + "?x=1", fileSize: "77" }] },
    ]);
    expect(rows).toEqual([
      { kind: "musteri", designIndex: 0, fileName: "on.pdf", fileUrl: U(K1), fileSize: 123, mimeType: "application/pdf", storageKey: K1 },
      { kind: "musteri", designIndex: 1, fileName: "arka.png", fileUrl: U(K2), fileSize: 77, mimeType: "application/octet-stream", storageKey: K2 },
    ]);
  });
  it("yabancı host / desen dışı URL'ler sessizce atılır; boş ad anahtarla doldurulur", () => {
    const rows = musteriDosyaSatirlari([{ files: [{ fileUrl: "https://evil.example/x.pdf" }, { fileUrl: U(K1), fileName: "  " }] }]);
    expect(rows).toHaveLength(1);
    expect(rows[0].fileName).toBe(K1);
  });
  it("sınırlar: en çok 20 tasarım, tasarım başına 10 dosya", () => {
    const cok = Array.from({ length: 25 }, () => ({ files: Array.from({ length: 12 }, () => ({ fileUrl: U(K1) })) }));
    const rows = musteriDosyaSatirlari(cok);
    expect(rows).toHaveLength(MAX_TASARIM * MAX_DOSYA_PER_TASARIM);
    expect(Math.max(...rows.map((r) => r.designIndex))).toBe(MAX_TASARIM - 1);
  });
  it("dizi değilse boş; ilkDosya geriye dönük alanları verir", () => {
    expect(musteriDosyaSatirlari(undefined)).toEqual([]);
    expect(ilkDosya([])).toBeNull();
    expect(ilkDosya(musteriDosyaSatirlari([{ files: [{ fileName: "a.pdf", fileUrl: U(K1) }] }]))).toEqual({ uploadedFileName: "a.pdf", uploadedFileUrl: U(K1) });
  });
});

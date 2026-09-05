import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { BadRequestException } from "@nestjs/common";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { StorageService } from "./storage.service";

/**
 * Müşteri tasarım dosyası — kabul edilen uzantılar (2026-09-04).
 *
 * Olay: müşteri "dosya yükleme çalışmıyor" dedi. Asıl kusur reddin kendisi DEĞİL,
 * müşteriye ULAŞMAMASIYDI (web proxy'si 400'ü 502'ye çeviriyor, Cloudflare de gövdeyi
 * kendi hata sayfasıyla değiştiriyordu). Aynı incelemede webp'in listede olmadığı
 * görüldü — müşteri dosyalarının önemli kısmı Canva/WhatsApp/telefon çıktısı webp.
 *
 * Bu testler İKİ ŞEYİ korur: webp'in açık kalması ve SVG/ZIP gibi BİLEREK dışarıda
 * bırakılmış formatların sessizce geri sızmaması.
 */
const dosya = (ad: string, mime: string) => ({
  buffer: Buffer.from("x"),
  mimetype: mime,
  originalName: ad,
});

describe("putDesign — uzantı kuralı", () => {
  let dir: string;
  let svc: StorageService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "markala-tasarim-"));
    svc = new StorageService({ get: (k: string) => (k === "UPLOAD_DIR" ? dir : undefined) } as never);
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("WEBP kabul edilir ve diske yazılır (2026-09-04 Hasan talebi)", async () => {
    const r = await svc.putDesign(dosya("tasarim.webp", "image/webp"));
    expect(r.key).toMatch(/\.webp$/);
    expect(r.fileName).toBe("tasarim.webp");
  });

  it("PNG/JPG/PDF kabul edilmeye devam eder", async () => {
    await expect(svc.putDesign(dosya("a.png", "image/png"))).resolves.toBeTruthy();
    await expect(svc.putDesign(dosya("b.jpg", "image/jpeg"))).resolves.toBeTruthy();
    await expect(svc.putDesign(dosya("c.pdf", "application/pdf"))).resolves.toBeTruthy();
  });

  it("MIME'ı bilmeyen tarayıcıdan gelen webp de kabul edilir (octet-stream)", async () => {
    // Canlıda görüldü: webp'in MIME'ı OS kaydından gelir; kaydı olmayan makinede
    // tarayıcı application/octet-stream gönderiyor ve müşteri takılıyordu.
    await expect(
      svc.putDesign(dosya("tasarim.webp", "application/octet-stream")),
    ).resolves.toBeTruthy();
  });

  it("uzantısı webp ama içeriği HTML olan dosya reddedilir", async () => {
    await expect(svc.putDesign(dosya("tasarim.webp", "text/html"))).rejects.toThrow(
      BadRequestException,
    );
  });

  it("SVG hâlâ reddedilir (XSS riski — bilerek dışarıda)", async () => {
    await expect(svc.putDesign(dosya("logo.svg", "image/svg+xml"))).rejects.toThrow(
      /Kabul edilen formatlar/,
    );
  });

  it("MÜŞTERİ yolunda ZIP/RAR reddedilir (kimliksiz uç, keyfi arşiv barındırma riski)", async () => {
    for (const ad of ["dosyalar.zip", "dosyalar.rar", "dosyalar.7z"]) {
      await expect(svc.putDesign(dosya(ad, "application/zip"))).rejects.toThrow(
        /Kabul edilen formatlar/,
      );
    }
  });

  /**
   * 2026-09-05 (Hasan): "grafikerler zip ve rar da yüklemek istedi". Ayrım kasıtlı:
   * personel yolu panel arkasında (ORDERS_DESIGN) ve dosya yalnız yetkiliye,
   * indirmeye zorlanarak servis ediliyor; müşteri yolu ise kimlik doğrulaması istemiyor.
   */
  it("PERSONEL yolunda ZIP/RAR/7Z kabul edilir", async () => {
    for (const ad of ["kaynaklar.zip", "kaynaklar.rar", "kaynaklar.7z"]) {
      await expect(
        svc.putDesign({ ...dosya(ad, "application/octet-stream"), personel: true }),
      ).resolves.toBeTruthy();
    }
  });

  it("personel yolunda bile SVG reddedilir (XSS riski arşivden bağımsız)", async () => {
    await expect(
      svc.putDesign({ ...dosya("logo.svg", "image/svg+xml"), personel: true }),
    ).rejects.toThrow(/Kabul edilen formatlar/);
  });

  it("uzantısız dosyada mesaj dosya ADINI uzantı gibi göstermez", async () => {
    // split(".").pop() noktasız adda adın kendisini döndürüyordu → '".tasarim" yüklenemiyor'
    await expect(svc.putDesign(dosya("tasarim", "application/octet-stream"))).rejects.toThrow(
      /Dosyanın uzantısı yok\. Kabul edilen formatlar/,
    );
  });

  it("ret mesajı DENENEN uzantıyı ve kabul listesini söyler", async () => {
    await expect(svc.putDesign(dosya("foto.heic", "image/heic"))).rejects.toThrow(
      /"\.heic".*PDF, AI, EPS, CDR, PSD, JPG, PNG, WEBP, TIFF/s,
    );
  });
});

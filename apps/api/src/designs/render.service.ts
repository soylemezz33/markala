import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { spawn } from "node:child_process";
import { PDFDocument } from "pdf-lib";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { StorageService } from "../storage/storage.service";
import { DesignsService } from "./designs.service";
import { runPreflight, hasBlock, type PreflightItem } from "./preflight";

const MM_TO_PT = 72 / 25.4; // 1 mm = 2.834645 pt
const MAX_PNG_BYTES = 20 * 1024 * 1024;

@Injectable()
export class RenderService {
  private readonly logger = new Logger(RenderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly designs: DesignsService,
  ) {}

  /**
   * Tasarımı baskıya-hazır PDF'e dönüştürür:
   *   client 300dpi PNG → pdf-lib (mm sayfa + bleed + TrimBox) → Ghostscript CMYK (varsa) → secure store.
   * Ghostscript yoksa/başarısızsa RGB PDF'e düşülür (matbaa RIP'i çevirir) — deploy kırılmaz.
   */
  async renderDesign(
    designId: string,
    pngBase64: string,
    owner: { userId?: string; sessionId?: string },
  ): Promise<{ ok: boolean; printFileUrl?: string; cmyk?: boolean; preflight: PreflightItem[] }> {
    const design = await this.designs.getOwned(designId, owner.userId, owner.sessionId);

    const preflight = runPreflight(design.document, {
      widthMm: design.widthMm,
      heightMm: design.heightMm,
      bleedMm: design.bleedMm,
    });
    const preflightJson = preflight as unknown as Prisma.InputJsonValue;
    if (hasBlock(preflight)) {
      await this.prisma.design.update({ where: { id: designId }, data: { status: "failed", preflight: preflightJson } });
      return { ok: false, preflight };
    }

    const png = this.decodePng(pngBase64);
    await this.prisma.design.update({ where: { id: designId }, data: { status: "rendering", preflight: preflightJson } });

    const rgbPdf = await this.buildPdf(png, design.widthMm, design.heightMm, design.bleedMm);
    let finalPdf = rgbPdf;
    let cmyk = false;
    try {
      finalPdf = await this.toCmyk(rgbPdf);
      cmyk = true;
    } catch (err) {
      this.logger.warn(`Ghostscript CMYK atlandı (RGB PDF kullanılıyor): ${(err as Error).message}`);
    }

    const stored = await this.storage.putSecure({
      buffer: finalPdf,
      originalName: "tasarim.pdf",
      mimetype: "application/pdf",
    });
    const printFileUrl = `/api/designs/${designId}/print`;
    await this.prisma.design.update({
      where: { id: designId },
      data: { status: "finalized", printFileKey: stored.key, printFileUrl, preflight: preflightJson },
    });
    return { ok: true, printFileUrl, cmyk, preflight };
  }

  /** Baskı-PDF'i indir (auth/sessionId sahiplik kontrolü getOwned'da). */
  async getPrintFile(designId: string, owner: { userId?: string; sessionId?: string }) {
    const design = await this.designs.getOwned(designId, owner.userId, owner.sessionId);
    if (!design.printFileKey) throw new BadRequestException("Bu tasarımın baskı dosyası henüz oluşturulmadı.");
    return this.storage.getSecure(design.printFileKey);
  }

  private decodePng(pngBase64: string): Buffer {
    const m = /^data:image\/png;base64,(.+)$/.exec(pngBase64.trim());
    const b64 = m ? m[1] : pngBase64.trim();
    if (!b64) throw new BadRequestException("Geçersiz PNG verisi.");
    const buf = Buffer.from(b64, "base64");
    if (buf.length === 0 || buf.length > MAX_PNG_BYTES) {
      throw new BadRequestException("PNG verisi boş veya çok büyük (20MB sınırı).");
    }
    return buf;
  }

  private async buildPdf(png: Buffer, widthMm: number, heightMm: number, bleedMm: number): Promise<Buffer> {
    const doc = await PDFDocument.create();
    const totalW = (widthMm + bleedMm * 2) * MM_TO_PT;
    const totalH = (heightMm + bleedMm * 2) * MM_TO_PT;
    const page = doc.addPage([totalW, totalH]);
    const img = await doc.embedPng(png);
    page.drawImage(img, { x: 0, y: 0, width: totalW, height: totalH });
    // Baskı kutuları: TrimBox = kesim (bleed içeri), BleedBox = tam sayfa.
    const b = bleedMm * MM_TO_PT;
    page.setBleedBox(0, 0, totalW, totalH);
    page.setTrimBox(b, b, widthMm * MM_TO_PT, heightMm * MM_TO_PT);
    const bytes = await doc.save();
    return Buffer.from(bytes);
  }

  /**
   * RGB PDF → CMYK PDF (Ghostscript CLI, ayrı süreç — event-loop bloklamaz).
   * ICC profili `ICC_PROFILE_PATH` env'i ile (matbaa onayı sonrası, örn. ISO Coated v2/FOGRA39).
   * `RENDER_CMYK=off` ile devre dışı. gs yoksa 'error' → reject → çağıran RGB'ye düşer.
   */
  private toCmyk(rgbPdf: Buffer): Promise<Buffer> {
    if (process.env.RENDER_CMYK === "off") {
      return Promise.reject(new Error("RENDER_CMYK=off"));
    }
    const icc = process.env.ICC_PROFILE_PATH;
    const args = [
      "-q",
      "-dBATCH",
      "-dNOPAUSE",
      "-dSAFER",
      "-sDEVICE=pdfwrite",
      "-dPDFSETTINGS=/prepress",
      "-dAutoRotatePages=/None",
      "-sColorConversionStrategy=CMYK",
      "-dProcessColorModel=/DeviceCMYK",
      ...(icc ? [`-sOutputICCProfile=${icc}`] : []),
      "-sOutputFile=-",
      "-",
    ];
    return new Promise<Buffer>((resolve, reject) => {
      const gs = spawn("gs", args);
      const out: Buffer[] = [];
      let errText = "";
      gs.stdout.on("data", (d: Buffer) => out.push(d));
      gs.stderr.on("data", (d: Buffer) => (errText += d.toString()));
      gs.on("error", reject);
      gs.on("close", (code) => {
        if (code === 0 && out.length) resolve(Buffer.concat(out));
        else reject(new Error(`gs exit ${code}: ${errText.slice(0, 300)}`));
      });
      gs.stdin.on("error", () => {});
      gs.stdin.write(rgbPdf);
      gs.stdin.end();
    });
  }
}

import { describe, it, expect, vi } from "vitest";
import { DriveService, driveFileUrl } from "./drive.service";

/**
 * DriveService — Drive v3 REST çağrıları mock fetch ile (2026-09-03).
 * Koruduğu garantiler: env eksikse hiçbir ağ çağrısı yok; klasör varsa yeniden açılmaz;
 * yükleme multipart gövdesinde meta + içerik doğru sırada; hata durumunda Türkçe olmayan
 * ama teşhis edilebilir mesaj (status + gövde başı).
 */

function config(vals: Record<string, string | undefined>) {
  return { get: (k: string) => vals[k] } as never;
}
const TAM = {
  GOOGLE_DRIVE_CLIENT_ID: "cid",
  GOOGLE_DRIVE_CLIENT_SECRET: "sec",
  GOOGLE_DRIVE_REFRESH_TOKEN: "rt",
  GOOGLE_DRIVE_ROOT_FOLDER_ID: "ROOT",
};

class TestDrive extends DriveService {
  calls: Array<{ url: string; init: RequestInit }> = [];
  constructor(vals: Record<string, string | undefined>, private yanitlar: Array<{ status: number; body: unknown }>) {
    super(config(vals));
    this.fetchImpl = (async (url: string, init: RequestInit = {}) => {
      this.calls.push({ url, init });
      const y = this.yanitlar.shift() ?? { status: 200, body: {} };
      return {
        ok: y.status >= 200 && y.status < 300,
        status: y.status,
        json: async () => y.body,
        text: async () => JSON.stringify(y.body),
      } as unknown as Response;
    }) as unknown as typeof fetch;
  }
  protected override async accessToken() {
    return "TOKEN";
  }
}

describe("DriveService", () => {
  it("env eksikse kapalıdır ve ağ çağrısı yapmaz", () => {
    const d = new TestDrive({ ...TAM, GOOGLE_DRIVE_REFRESH_TOKEN: undefined }, []);
    expect(d.enabled).toBe(false);
    expect(d.calls).toHaveLength(0);
  });

  it("sipariş klasörü varsa (adı sipariş numarasıyla başlıyorsa) onu döner, yeni açmaz", async () => {
    const d = new TestDrive(TAM, [{ status: 200, body: { files: [{ id: "F1", name: "MK-1 — Ali" }] } }]);
    expect(await d.ensureOrderFolder("MK-1", "Ali")).toBe("F1");
    expect(d.calls).toHaveLength(1);
    expect(d.calls[0].url).toContain("ROOT");
    expect(d.calls[0].init.headers).toMatchObject({ Authorization: "Bearer TOKEN" });
  });

  it("klasör yoksa 'MK-… — Müşteri' adıyla kök altında açar", async () => {
    const d = new TestDrive(TAM, [
      { status: 200, body: { files: [{ id: "X", name: "ali-2026-09-01" }] } }, // 'contains' eşleşse de başlamıyor → sayılmaz
      { status: 200, body: { id: "F2" } },
    ]);
    expect(await d.ensureOrderFolder("MK-2", " Veli ")).toBe("F2");
    const olustur = d.calls[1];
    expect(olustur.init.method).toBe("POST");
    expect(JSON.parse(String(olustur.init.body))).toEqual({
      name: "MK-2 — Veli",
      mimeType: "application/vnd.google-apps.folder",
      parents: ["ROOT"],
    });
  });

  it("yükleme multipart/related gövdesi meta + içerik taşır ve id/webViewLink döner", async () => {
    const d = new TestDrive(TAM, [{ status: 200, body: { id: "D9", webViewLink: "https://drive.google.com/file/d/D9/view" } }]);
    const r = await d.uploadFile({ folderId: "F1", name: "MK-1__bayrak__baski.pdf", mimeType: "application/pdf", buffer: Buffer.from("PDFDATA") });
    expect(r).toEqual({ id: "D9", webViewLink: "https://drive.google.com/file/d/D9/view" });
    const c = d.calls[0];
    expect(c.url).toContain("uploadType=multipart");
    const govde = (c.init.body as Buffer).toString();
    expect(govde).toContain('"parents":["F1"]');
    expect(govde.indexOf('"name"')).toBeLessThan(govde.indexOf("PDFDATA"));
    expect(String((c.init.headers as Record<string, string>)["Content-Type"])).toMatch(/^multipart\/related; boundary=/);
  });

  it("Drive hata dönerse status ve gövde başıyla fırlatır", async () => {
    const d = new TestDrive(TAM, [{ status: 403, body: { error: { message: "insufficientPermissions" } } }]);
    await expect(d.ensureOrderFolder("MK-3")).rejects.toThrow(/Drive GET 403: .*insufficientPermissions/);
  });

  it("silme 404'ü sessiz geçer, diğer hataları fırlatır", async () => {
    const d = new TestDrive(TAM, [{ status: 404, body: {} }, { status: 500, body: {} }]);
    await expect(d.deleteFile("yok")).resolves.toBeUndefined();
    await expect(d.deleteFile("bozuk")).rejects.toThrow("Drive DELETE 500");
  });

  it("driveFileUrl panel bağlantısını üretir", () => {
    expect(driveFileUrl("abc")).toBe("https://drive.google.com/file/d/abc/view");
  });
});

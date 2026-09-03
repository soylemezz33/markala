import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

/**
 * Google Drive aktarımı (2026-09-03, üretim ARGE Faz 4).
 *
 * NEDEN: Hasan — "tasarımcı çalışma dosyalarını panelden yüklesin, biz de bunları
 * otomatik Drive'a alalım ki sunucuya yük yapmasın". Ağır dosyalar (çalışma/baskı)
 * Drive'a gider, ÖNİZLEME JPG sunucuda kalır (panel her kartta gösterir, 2 MB sınırı var).
 *
 * KİMLİK: Workspace/servis hesabı YOK — Hasan'ın kişisel Google hesabı, "Markala-web"
 * OAuth istemcisiyle bir kez onay verdi; yenileme anahtarı env'de. google-auth-library
 * zaten bağımlılık (Google ile giriş); ağır `googleapis` paketi bilerek eklenmedi, Drive v3
 * REST üç çağrıdan ibaret (ara, klasör aç, yükle).
 *
 * KAPALI KALMA: dört env'den biri yoksa `enabled=false` — hiçbir çağrı yapılmaz, dosyalar
 * eskisi gibi sunucuda kalır. Böylece kod, env sunucuya girilmeden de güvenle deploy edilir.
 *
 * Env: GOOGLE_DRIVE_CLIENT_ID, GOOGLE_DRIVE_CLIENT_SECRET, GOOGLE_DRIVE_REFRESH_TOKEN,
 *      GOOGLE_DRIVE_ROOT_FOLDER_ID ("Gelen Sipariş Dosyaları" klasörü).
 */

const DRIVE = "https://www.googleapis.com/drive/v3";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export interface DriveUploadResult {
  id: string;
  webViewLink: string;
}

/** Drive dosya bağlantısı — panel bunu "Drive'da aç" olarak basar. */
export function driveFileUrl(id: string): string {
  return `https://drive.google.com/file/d/${id}/view`;
}

/** Drive arama sorgusunda tek tırnak kaçışı (q parametresi). */
function q(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

@Injectable()
export class DriveService {
  private readonly logger = new Logger(DriveService.name);
  readonly enabled: boolean;
  private readonly rootFolderId: string;
  private client: OAuth2Client | null = null;
  /** Testte değiştirilebilir (spec fetch'i mock'lar); prod'da Node 20 global fetch. */
  protected fetchImpl: typeof fetch = (...a) => fetch(...a);

  constructor(private config: ConfigService) {
    const id = config.get<string>("GOOGLE_DRIVE_CLIENT_ID");
    const secret = config.get<string>("GOOGLE_DRIVE_CLIENT_SECRET");
    const refresh = config.get<string>("GOOGLE_DRIVE_REFRESH_TOKEN");
    this.rootFolderId = config.get<string>("GOOGLE_DRIVE_ROOT_FOLDER_ID") ?? "";
    this.enabled = !!(id && secret && refresh && this.rootFolderId);
    if (this.enabled) {
      this.client = new OAuth2Client(id, secret);
      this.client.setCredentials({ refresh_token: refresh });
    } else {
      this.logger.log("Drive aktarımı KAPALI (GOOGLE_DRIVE_* env eksik) — dosyalar sunucuda kalır.");
    }
  }

  /** Testlerin erişim belirtecini sahteleyebilmesi için ayrı metod. */
  protected async accessToken(): Promise<string> {
    if (!this.client) throw new Error("Drive kapalı");
    const t = await this.client.getAccessToken();
    if (!t.token) throw new Error("Drive erişim belirteci alınamadı");
    return t.token;
  }

  private async api<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = await this.accessToken();
    const res = await this.fetchImpl(url, {
      ...init,
      headers: { Authorization: `Bearer ${token}`, ...(init.headers as Record<string, string> | undefined) },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Drive ${init.method ?? "GET"} ${res.status}: ${body.slice(0, 200)}`);
    }
    return (await res.json()) as T;
  }

  /**
   * Sipariş klasörü: kök altında adı sipariş numarasıyla BAŞLAYAN klasör varsa onu kullanır,
   * yoksa "MK-… — Müşteri Adı" olarak açar. Sipariş numarası anahtardır (Hasan'ın elle açtığı
   * "müşteri-adı-tarih" klasörleriyle karışmaz; müşteri adı yalnız okunabilirlik için).
   */
  async ensureOrderFolder(orderNumber: string, customerName?: string | null): Promise<string> {
    const query = `'${q(this.rootFolderId)}' in parents and mimeType = '${FOLDER_MIME}' and name contains '${q(orderNumber)}' and trashed = false`;
    const found = await this.api<{ files: Array<{ id: string; name: string }> }>(
      `${DRIVE}/files?q=${encodeURIComponent(query)}&fields=files(id,name)&pageSize=5&supportsAllDrives=true&includeItemsFromAllDrives=true`,
    );
    const eslesen = (found.files ?? []).find((f) => f.name.startsWith(orderNumber));
    if (eslesen) return eslesen.id;

    const ad = customerName?.trim() ? `${orderNumber} — ${customerName.trim().slice(0, 60)}` : orderNumber;
    const created = await this.api<{ id: string }>(`${DRIVE}/files?fields=id&supportsAllDrives=true`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: ad, mimeType: FOLDER_MIME, parents: [this.rootFolderId] }),
    });
    this.logger.log(`Drive klasörü açıldı: ${ad} (${created.id})`);
    return created.id;
  }

  /** Çok parçalı (multipart/related) yükleme — 50 MB'a kadar tek istek yeterli. */
  async uploadFile(input: { folderId: string; name: string; mimeType: string; buffer: Buffer }): Promise<DriveUploadResult> {
    const boundary = `markala-${Date.now().toString(36)}`;
    const meta = JSON.stringify({ name: input.name, parents: [input.folderId] });
    const head = Buffer.from(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${input.mimeType || "application/octet-stream"}\r\n\r\n`,
    );
    const tail = Buffer.from(`\r\n--${boundary}--`);
    const body = Buffer.concat([head, input.buffer, tail]);
    return this.api<DriveUploadResult>(UPLOAD, {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}`, "Content-Length": String(body.length) },
      body,
    });
  }

  /**
   * Tarayıcıdan DOĞRUDAN Drive'a yükleme için kesintiye dayanıklı (resumable) oturum açar
   * (2026-09-03, Hasan: "50 MB çok düşük → 1000 MB"). Cloudflare ücretsiz plan tek istekte 100 MB
   * geçirir, sunucu belleği de 1 GB'ı taşıyamaz; bu yüzden dosya sunucuya HİÇ uğramaz: burası
   * yalnız oturumu açar, panel parçaları Drive'a PUT eder, sonra API kaydı tutar (driveTamamla).
   *
   * `origin` ZORUNLU: Google, CORS'u oturum açılırken verilen Origin'e göre kurar; panel bu
   * origin'den PUT eder. Dönen değer tek kullanımlık oturum URL'si (≈1 hafta geçerli).
   */
  async createResumableSession(input: { folderId: string; name: string; mimeType: string; size: number; origin: string }): Promise<string> {
    const token = await this.accessToken();
    const res = await this.fetchImpl(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id,name,size,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json; charset=UTF-8",
          "X-Upload-Content-Type": input.mimeType || "application/octet-stream",
          "X-Upload-Content-Length": String(input.size),
          Origin: input.origin,
        },
        body: JSON.stringify({ name: input.name, parents: [input.folderId] }),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Drive resumable ${res.status}: ${body.slice(0, 200)}`);
    }
    const loc = res.headers.get("location");
    if (!loc) throw new Error("Drive resumable: Location başlığı yok");
    return loc;
  }

  /** Dosya meta verisi — tamamlanan tarayıcı yüklemesini doğrulamak için (klasör + boyut). */
  async getFileMeta(id: string): Promise<{ id: string; name: string; size: number; mimeType: string; parents: string[]; webViewLink: string }> {
    const m = await this.api<{ id: string; name: string; size?: string; mimeType: string; parents?: string[]; webViewLink: string }>(
      `${DRIVE}/files/${encodeURIComponent(id)}?fields=id,name,size,mimeType,parents,webViewLink&supportsAllDrives=true`,
    );
    return { id: m.id, name: m.name, size: Number(m.size ?? 0), mimeType: m.mimeType, parents: m.parents ?? [], webViewLink: m.webViewLink };
  }

  /** Best-effort silme; Drive'da yoksa (404) sessiz geçer. */
  async deleteFile(id: string): Promise<void> {
    const token = await this.accessToken();
    const res = await this.fetchImpl(`${DRIVE}/files/${encodeURIComponent(id)}?supportsAllDrives=true`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok && res.status !== 404) throw new Error(`Drive DELETE ${res.status}`);
  }
}

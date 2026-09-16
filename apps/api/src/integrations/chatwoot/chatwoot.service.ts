import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../../prisma/prisma.service";
import {
  CHATWOOT_NOT_ONEKI,
  icNotMetni,
  konusmaEtiketi,
  ozelNotMetni,
  whatsappKimligi,
  durumEtiketleriniUygula,
  konusmaIdNottan,
  durumNotu,
  URETIM_SONRASI,
  KAPANIS_DURUMLARI,
  panelNotuAktarilirMi,
  panelNotuChatwoota,
  type KonusmaKalemi,
} from "./chatwoot-kural";

/**
 * CHATWOOT SİPARİŞ KONUŞMASI (2026-09-15, Hasan: "sipariş gelince Chatwoot'ta otomatik konuşma
 * penceresi açılsın ve tasarım ekibi atansın, e-posta taslaklarına dokunma").
 *
 * 2 dakikalık tarama (tara) ödemesi alınmış ve henüz konuşması olmayan siparişleri bulur:
 *  1. Müşteri telefonuyla Chatwoot contact bulunur/oluşturulur (WhatsApp kimliği = 905…).
 *  2. WhatsApp gelen kutusunda (CHATWOOT_INBOX_ID) konuşma açılır, grafik tasarım takımına
 *     (CHATWOOT_TEAM_ID) atanır, sipariş no özel nitelik olarak yazılır.
 *  3. Sipariş özeti ÖZEL not olarak düşer (müşteriye GİTMEZ), dosya durumuna göre etiketlenir.
 *  4. Siparişin iç notlarına konuşma bağlantısı yazılır → panelde görünür, tekrar açılmaz.
 *
 * Müşteriye hiçbir mesaj gönderilmez; tasarımcı konuşmadan yazdığında Chatwoot 24 saat
 * penceresi dışında şablon seçtirir. Telefonu WhatsApp'a uygun olmayan (sabit hat, yabancı)
 * siparişlerde konuşma AÇILMAZ, log düşer.
 *
 * Env (sunucu compose'unda eşlenmiş): CHATWOOT_URL, CHATWOOT_ACCOUNT_ID, CHATWOOT_API_TOKEN
 * (Hasan'ın profil erişim jetonu), CHATWOOT_INBOX_ID (5 = markala WhatsApp), CHATWOOT_TEAM_ID
 * (2 = grafik tasarım). ASLA fırlatmaz — ödeme akışının içinden çağrılıyor.
 */
/** Bu tarihten önce oluşan siparişler için konuşma AÇILMAZ (geriye dönük yığılma olmasın). */
const CHATWOOT_BASLANGIC = new Date("2026-09-15T00:00:00+03:00");

@Injectable()
export class ChatwootService {
  private readonly logger = new Logger(ChatwootService.name);
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private cfg(k: string): string {
    return (this.config.get<string>(k) ?? "").trim();
  }
  isConfigured(): boolean {
    return Boolean(this.cfg("CHATWOOT_URL") && this.cfg("CHATWOOT_API_TOKEN") && this.cfg("CHATWOOT_INBOX_ID"));
  }
  private base(): string {
    return `${this.cfg("CHATWOOT_URL").replace(/\/$/, "")}/api/v1/accounts/${this.cfg("CHATWOOT_ACCOUNT_ID") || "1"}`;
  }
  private konusmaUrl(id: number): string {
    return `${this.cfg("CHATWOOT_URL").replace(/\/$/, "")}/app/accounts/${this.cfg("CHATWOOT_ACCOUNT_ID") || "1"}/conversations/${id}`;
  }

  private async api<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const res = await fetch(`${this.base()}${path}`, {
        method,
        headers: { api_access_token: this.cfg("CHATWOOT_API_TOKEN"), "content-type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) throw new Error(`Chatwoot ${method} ${path} → ${res.status}: ${text.slice(0, 200)}`);
      return (text ? JSON.parse(text) : {}) as T;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Telefonla ara; yoksa oluştur. Aynı numaralı kaydı tercih eder (arama gevşek eşleşir). */
  private async contactBul(kimlik: string, ad: string, email: string | null): Promise<number> {
    type C = { id: number; phone_number?: string | null; email?: string | null };
    const ara = async (q: string) =>
      (await this.api<{ payload?: C[] }>("GET", `/contacts/search?q=${encodeURIComponent(q)}`)).payload ?? [];
    let liste = await ara(kimlik);
    let c = liste.find((x) => String(x.phone_number ?? "").replace(/\D/g, "") === kimlik);
    if (!c && email) {
      liste = await ara(email);
      c = liste.find((x) => (x.email ?? "").toLowerCase() === email.toLowerCase());
    }
    if (c) return c.id;
    try {
      const r = await this.api<{ payload?: { contact?: C } }>("POST", "/contacts", {
        name: ad,
        phone_number: `+${kimlik}`,
        ...(email ? { email } : {}),
      });
      const id = r.payload?.contact?.id;
      if (!id) throw new Error("contact id dönmedi");
      return id;
    } catch (e) {
      // Yarış / e-posta çakışması (422): bir kez daha ara.
      liste = await ara(kimlik);
      c = liste.find((x) => String(x.phone_number ?? "").replace(/\D/g, "") === kimlik);
      if (c) return c.id;
      throw e;
    }
  }

  /** Müşterinin bu kutuda açık/bekleyen konuşması varsa (en son etkinlik) id'sini döner. */
  private async acikKonusma(contactId: number, inboxId: number): Promise<number | null> {
    type K = { id: number; inbox_id: number; status: string; last_activity_at?: number };
    const r = await this.api<{ payload?: K[] }>("GET", `/contacts/${contactId}/conversations`);
    const uygun = (r.payload ?? [])
      .filter((k) => k.inbox_id === inboxId && ["open", "pending", "snoozed"].includes(k.status))
      .sort((x, y) => (y.last_activity_at ?? 0) - (x.last_activity_at ?? 0));
    return uygun[0]?.id ?? null;
  }

  /**
   * TARAMA (2 dk): ödemesi alınmış, iptal olmamış, Chatwoot notu olmayan siparişler. "Ödeme
   * alındı" olayına doğrudan bağlanmadı çünkü ödeme üç ayrı yolda işaretleniyor (iyzico
   * callback, reconcile, havale onayı) ve ortak servis (OdemeSonrasi) henüz main'de değil.
   * Başlangıç tarihinden önceki siparişler kapsam dışı (geriye dönük konuşma açılmaz).
   */
  private taramaSuruyor = false;
  @Cron("*/2 * * * *", { name: "chatwoot-siparis-konusmasi", timeZone: "Europe/Istanbul" })
  async tara(): Promise<void> {
    if (!this.isConfigured() || this.taramaSuruyor) return;
    this.taramaSuruyor = true;
    try {
      const adaylar = await this.prisma.order.findMany({
        where: {
          paymentStatus: "basarili",
          deletedAt: null,
          status: { notIn: ["iptal_edildi", "teslim_edildi"] },
          createdAt: { gte: CHATWOOT_BASLANGIC },
          internalNotes: { none: { body: { startsWith: CHATWOOT_NOT_ONEKI } } },
        },
        select: { id: true },
        orderBy: { createdAt: "asc" },
        take: 10,
      });
      for (const o of adaylar) await this.siparisKonusmasiAc(o.id);
      await this.durumlariEsitle();
    } catch (e) {
      this.logger.error(`chatwoot tarama: ${(e as Error)?.message}`);
    } finally {
      this.taramaSuruyor = false;
    }
  }

  // ── Panel → Chatwoot durum eşitleme (2026-09-16) ──────────────────────────────────────
  /**
   * Son 20 dk'da güncellenen ve Chatwoot konuşması olan siparişler: konuşmadaki
   * custom_attributes.siparis_durum sipariş durumundan farklıysa etiket/atama/kapanış/not uygulanır.
   * Tersi yön (Chatwoot etiketi → panel) ChatwootWebhookController'da.
   */
  private async durumlariEsitle(): Promise<void> {
    const since = new Date(Date.now() - 20 * 60 * 1000);
    const onek = `${CHATWOOT_NOT_ONEKI} #`;
    const adaylar = await this.prisma.order.findMany({
      where: { updatedAt: { gte: since }, deletedAt: null, internalNotes: { some: { body: { startsWith: onek } } } },
      select: { id: true, orderNumber: true, status: true, internalNotes: { where: { body: { startsWith: onek } }, select: { body: true }, take: 1 } },
      take: 30,
    });
    for (const o of adaylar) {
      const convId = konusmaIdNottan(o.internalNotes[0]?.body);
      if (!convId) continue;
      const slug = String(o.status).replace(/_/g, "-");
      try {
        const k = await this.konusmaGetir(convId);
        if (k.custom_attributes?.siparis_durum === slug) continue;
        await this.durumUygula(convId, slug, k.labels ?? [], k.status);
        this.logger.log(`chatwoot durum eşitlendi order=${o.orderNumber} conv=${convId} → ${slug}`);
      } catch (e) {
        this.logger.warn(`chatwoot durum eşitleme order=${o.orderNumber} conv=${convId}: ${(e as Error).message}`);
      }
    }
  }

  /** Siparişin Chatwoot konuşma id'si (iç nottan). */
  async konusmaIdBul(orderId: string): Promise<number | null> {
    const n = await this.prisma.orderNote.findFirst({
      where: { orderId, body: { startsWith: `${CHATWOOT_NOT_ONEKI} #` } },
      select: { body: true },
    });
    return konusmaIdNottan(n?.body);
  }

  /** Panel iç notu → Chatwoot özel notu (2026-09-16). Hata fırlatmaz. */
  async panelNotuGonder(orderId: string, yazar: string, body: string): Promise<void> {
    if (!this.isConfigured() || !panelNotuAktarilirMi(body)) return;
    try {
      const convId = await this.konusmaIdBul(orderId);
      if (!convId) return;
      await this.api("POST", `/conversations/${convId}/messages`, { content: panelNotuChatwoota(yazar, body), message_type: "outgoing", private: true });
    } catch (e) {
      this.logger.warn(`chatwoot panel notu gönderilemedi order=${orderId}: ${(e as Error).message}`);
    }
  }

  async konusmaGetir(convId: number): Promise<{ id: number; status?: string; labels?: string[]; custom_attributes?: Record<string, unknown> }> {
    return this.api("GET", `/conversations/${convId}`);
  }

  /** custom_attributes.siparis_durum: "bu durum konuşmaya işlendi" izi (döngü koruması). */
  async durumIsaretle(convId: number, slug: string): Promise<void> {
    await this.api("POST", `/conversations/${convId}/custom_attributes`, { custom_attributes: { siparis_durum: slug } });
  }

  /** Konuşmaya durumu işler: etiket (durum dışı etiketler korunur), işaret, üretim ataması, özel not, kapanış/yeniden açma. */
  async durumUygula(convId: number, slug: string, mevcutEtiketler: string[], konusmaDurumu?: string): Promise<void> {
    await this.api("POST", `/conversations/${convId}/labels`, { labels: durumEtiketleriniUygula(mevcutEtiketler, slug) });
    await this.durumIsaretle(convId, slug);
    const uretimAjani = Number(this.cfg("CHATWOOT_URETIM_AGENT_ID"));
    if (uretimAjani && URETIM_SONRASI.includes(slug)) {
      await this.api("POST", `/conversations/${convId}/assignments`, { assignee_id: uretimAjani }).catch((e) =>
        this.logger.warn(`chatwoot üretim ataması conv=${convId}: ${(e as Error).message}`),
      );
    }
    await this.api("POST", `/conversations/${convId}/messages`, { content: durumNotu(slug), message_type: "outgoing", private: true }).catch(() => undefined);
    const kapat = KAPANIS_DURUMLARI.includes(slug);
    if (kapat && konusmaDurumu !== "resolved") {
      await this.api("POST", `/conversations/${convId}/toggle_status`, { status: "resolved" }).catch(() => undefined);
    } else if (!kapat && konusmaDurumu === "resolved") {
      await this.api("POST", `/conversations/${convId}/toggle_status`, { status: "open" }).catch(() => undefined);
    }
  }

  /** Ödeme alındı → konuşma aç. Fire-and-forget; hata yalnız loglanır. */
  async siparisKonusmasiAc(orderId: string): Promise<void> {
    if (!this.isConfigured()) return;
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true, orderNumber: true, email: true, phone: true, notes: true, paymentMethod: true,
          shippingAddressSnapshot: true,
          user: { select: { fullName: true } },
          items: {
            select: {
              productName: true, quantity: true, configurationSummary: true, needsDesignSupport: true,
              uploadedFileName: true, _count: { select: { designUploads: true } },
            },
          },
        },
      });
      if (!order) return;
      // Daha önce açıldıysa (iç notta bağlantı var) ikinci konuşma AÇMA.
      const onceki = await this.prisma.orderNote.findFirst({
        where: { orderId, body: { startsWith: CHATWOOT_NOT_ONEKI } },
        select: { id: true },
      });
      if (onceki) return;

      const kimlik = whatsappKimligi(order.phone ?? (order.shippingAddressSnapshot as { phone?: string } | null)?.phone);
      if (!kimlik) {
        this.logger.warn(`chatwoot: WhatsApp kimliği yok, konuşma açılmadı order=${order.orderNumber} tel=${order.phone ?? "-"}`);
        // Aynı öneki taşıyan not: tarama bu siparişi bir daha denemesin, panelde de sebep görünsün.
        await this.prisma.orderNote.create({
          data: { orderId, authorId: null, authorName: "Sistem", authorRole: "chatwoot", body: `${CHATWOOT_NOT_ONEKI} açılamadı: telefon WhatsApp'a uygun değil (${order.phone ?? "-"})` },
        });
        return;
      }
      const snap = (order.shippingAddressSnapshot ?? {}) as { fullName?: string; phone?: string };
      const musteriAdi = (snap.fullName || order.user?.fullName || order.email || "Müşteri").trim();
      const kalemler: KonusmaKalemi[] = order.items.map((i) => ({
        productName: i.productName,
        quantity: i.quantity,
        configurationSummary: i.configurationSummary,
        needsDesignSupport: i.needsDesignSupport,
        uploadedFileName: i.uploadedFileName,
        dosyaSayisi: i._count.designUploads,
      }));
      const panelUrl = `${this.cfg("ADMIN_PANEL_URL") || "https://admin.markala.com.tr"}/siparisler/${order.id}`;

      const contactId = await this.contactBul(kimlik, musteriAdi, order.email);
      const inboxId = Number(this.cfg("CHATWOOT_INBOX_ID"));
      const teamId = Number(this.cfg("CHATWOOT_TEAM_ID")) || undefined;
      // Müşteriyle ZATEN açık bir WhatsApp konuşması varsa (15 Eyl, Hasan: "zaten konuştuğum
      // müşteriyse?") ikinci konuşma AÇILMAZ: sipariş notu o konuşmaya düşer, takım oraya atanır.
      const mevcut = await this.acikKonusma(contactId, inboxId);
      let convId: number;
      if (mevcut) {
        convId = mevcut;
        if (teamId) {
          await this.api("POST", `/conversations/${convId}/assignments`, { team_id: teamId }).catch((e) =>
            this.logger.warn(`chatwoot takım ataması yapılamadı conv=${convId}: ${(e as Error).message}`),
          );
        }
      } else {
        const yeniKonusma = await this.api<{ id: number }>("POST", "/conversations", {
          source_id: kimlik,
          inbox_id: inboxId,
          contact_id: contactId,
          ...(teamId ? { team_id: teamId } : {}),
          status: "open",
          custom_attributes: { siparis_no: order.orderNumber },
          additional_attributes: { siparis_no: order.orderNumber, panel: panelUrl },
        });
        convId = yeniKonusma.id;
      }
      await this.api("POST", `/conversations/${convId}/messages`, {
        content: ozelNotMetni({
          orderId: order.id, orderNumber: order.orderNumber, musteriAdi, telefon: kimlik, email: order.email,
          paymentMethod: order.paymentMethod, siparisNotu: order.notes, kalemler, panelUrl,
        }),
        message_type: "outgoing",
        private: true,
      });
      await this.api("POST", `/conversations/${convId}/labels`, { labels: [konusmaEtiketi(kalemler)] }).catch((e) =>
        this.logger.warn(`chatwoot etiket yazılamadı order=${order.orderNumber}: ${(e as Error).message}`),
      );
      const url = this.konusmaUrl(convId);
      await this.prisma.orderNote.create({
        data: { orderId, authorId: null, authorName: "Sistem", authorRole: "chatwoot", body: icNotMetni(convId, url, !mevcut) },
      });
      this.logger.log(`chatwoot konuşması ${mevcut ? "mevcuda eklendi" : "açıldı"} order=${order.orderNumber} conv=${convId}`);
    } catch (e) {
      this.logger.error(`chatwoot konuşması açılamadı order=${orderId}: ${(e as Error)?.message}`);
    }
  }
}

import { Body, Controller, HttpCode, Post, Query, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../prisma/prisma.service";
import { OrdersService } from "./orders.service";
import { ChatwootService } from "../integrations/chatwoot/chatwoot.service";
import { CHATWOOT_NOT_ONEKI, CHATWOOTTAN_PANELE, durumEtiketiBul, chatwootNotuAktarilirMi, chatwootNotuPanele } from "../integrations/chatwoot/chatwoot-kural";

/**
 * CHATWOOT → PANEL (2026-09-16, Hasan: "birebir panelimle entegreli çalışsın, bir yerden çekince
 * diğer yerde de değişsin").
 *
 * Chatwoot hesap webhook'u (conversation_updated) buraya gelir. Konuşmadaki DURUM etiketi
 * (tasarim-bekleniyor / tasarim-onaylandi / uretimde) siparişin durumundan farklıysa sipariş
 * durumu güncellenir (OrdersService.updateStatus: geçiş kuralları, mailler, audit aynen işler).
 * Kargoya verildi / teslim edildi / iptal YALNIZ panelden: kargo takip no ister, mail atar, iptal
 * geri alınamaz — Chatwoot'tan yanlışlıkla tetiklenmesin (CHATWOOTTAN_PANELE).
 *
 * Döngü koruması: panel → Chatwoot eşitlemesi (ChatwootService.durumlariEsitle) etiketi yazıp
 * custom_attributes.siparis_durum'u işaretler; webhook etiket == işaretli ya da etiket ==
 * sipariş durumu ise hiçbir şey yapmaz. Kimlik: URL'deki token = CHATWOOT_WEBHOOK_SECRET.
 */
@ApiTags("integrations")
@Controller("integrations/chatwoot")
export class ChatwootWebhookController {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private orders: OrdersService,
    private chatwoot: ChatwootService,
  ) {}

  @Post("webhook")
  @HttpCode(200)
  async webhook(@Query("token") token: string | undefined, @Body() body: Record<string, unknown>) {
    const secret = (this.config.get<string>("CHATWOOT_WEBHOOK_SECRET") ?? "").trim();
    if (!secret || !token || token.length !== secret.length || !sabitZamanEsit(token, secret)) {
      throw new UnauthorizedException();
    }
    if (body?.event === "message_created") return this.ozelNot(body);
    if (body?.event !== "conversation_updated") return { ok: true, atlandi: "olay" };
    const convId = Number(body?.id);
    if (!convId) return { ok: true, atlandi: "id yok" };

    // Chatwoot 404 (silinmiş/bilinmeyen konuşma) ya da geçici ağ hatası → 200 + atlandı (webhook tekrarı gereksiz).
    let k: Awaited<ReturnType<ChatwootService["konusmaGetir"]>>;
    try {
      k = await this.chatwoot.konusmaGetir(convId);
    } catch (e) {
      return { ok: true, atlandi: "konuşma okunamadı", hata: (e as Error).message.slice(0, 120) };
    }
    const isaretli = typeof k.custom_attributes?.siparis_durum === "string" ? k.custom_attributes.siparis_durum : undefined;
    const etiket = durumEtiketiBul(k.labels ?? [], isaretli);
    if (!etiket || etiket === isaretli) return { ok: true, atlandi: "değişiklik yok" };
    if (!CHATWOOTTAN_PANELE.includes(etiket)) return { ok: true, atlandi: "yalnız panelden değişir", etiket };

    const siparisNo = typeof k.custom_attributes?.siparis_no === "string" ? k.custom_attributes.siparis_no : null;
    const order = await siparisBul(this.prisma, convId, siparisNo);
    if (!order) return { ok: true, atlandi: "sipariş yok" };

    const mevcut = String(order.status).replace(/_/g, "-");
    if (mevcut === etiket) {
      await this.chatwoot.durumIsaretle(convId, etiket).catch(() => undefined);
      return { ok: true, atlandi: "zaten o durumda" };
    }
    await this.orders.updateStatus(order.id, etiket, undefined, { actorId: null, role: "chatwoot" });
    await this.chatwoot.durumIsaretle(convId, etiket).catch(() => undefined);
    return { ok: true, uygulandi: etiket, siparis: order.orderNumber };
  }

  /**
   * Chatwoot ÖZEL notu → sipariş iç notu (2026-09-16, Hasan: "Chatwoot'a not ekledim, panele
   * düşmedi"). Müşteriye giden/gelen mesajlar ve sistemin ürettiği notlar (🧾 özet, 📦 durum,
   * 📝 panel notu) kopyalanmaz; aynı gövde 10 dk içinde tekrar gelirse (webhook tekrarı) atlanır.
   */
  private async ozelNot(body: Record<string, unknown>) {
    const priv = body?.private === true;
    const content = typeof body?.content === "string" ? body.content : "";
    if (!chatwootNotuAktarilirMi(content, priv)) return { ok: true, atlandi: "özel not değil / sistem notu" };
    const conv = body?.conversation as { id?: number; custom_attributes?: Record<string, unknown> } | undefined;
    const convId = Number(conv?.id);
    if (!convId) return { ok: true, atlandi: "konuşma id yok" };
    const siparisNo = typeof conv?.custom_attributes?.siparis_no === "string" ? conv.custom_attributes.siparis_no : null;
    const order = await siparisBul(this.prisma, convId, siparisNo);
    if (!order) return { ok: true, atlandi: "sipariş yok" };
    const sender = body?.sender as { name?: string } | undefined;
    const govde = chatwootNotuPanele(sender?.name, content);
    const tekrar = await this.prisma.orderNote.findFirst({
      where: { orderId: order.id, body: govde, createdAt: { gte: new Date(Date.now() - 10 * 60 * 1000) } },
      select: { id: true },
    });
    if (tekrar) return { ok: true, atlandi: "tekrar" };
    await this.prisma.orderNote.create({
      data: { orderId: order.id, body: govde, authorId: null, authorName: (sender?.name ?? "").trim() || "Chatwoot", authorRole: "chatwoot" },
    });
    return { ok: true, uygulandi: "not", siparis: order.orderNumber };
  }
}

/** Sipariş kaydını konuşma id'sine göre bul: siparis_no özel niteliği, yoksa iç nottaki "#id". */
async function siparisBul(prisma: PrismaService, convId: number, siparisNo: string | null) {
  return (
    (siparisNo
      ? await prisma.order.findFirst({ where: { orderNumber: siparisNo, deletedAt: null }, select: { id: true, status: true, orderNumber: true } })
      : null) ??
    (await prisma.orderNote
      .findFirst({ where: { body: { startsWith: `${CHATWOOT_NOT_ONEKI} #${convId} ` } }, select: { order: { select: { id: true, status: true, orderNumber: true } } } })
      .then((n) => n?.order ?? null))
  );
}

function sabitZamanEsit(a: string, b: string): boolean {
  let fark = 0;
  for (let i = 0; i < a.length; i++) fark |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return fark === 0;
}

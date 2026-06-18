import { Injectable, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/** Bir denetim kaydının içeriği. Boş bırakılan alanlar kaydedilmez (kolon nullable). */
export interface AuditEntry {
  /** Etkilenen varlık türü — 'Order' | 'User' | 'Product' ... */
  entityType: string;
  /** Etkilenen varlığın id'si. */
  entityId: string;
  /** Eylem — 'create' | 'update' | 'delete' | 'status_change'. */
  action: string;
  /** İşlemi yapan admin/sistem aktörü (oturum sub'ı). */
  actorId?: string | null;
  /** İşlemin öznesi olan kullanıcı (varsa — ör. profilini admin düzenlediğinde). */
  userId?: string | null;
  /** Değişiklik özeti (before/after gibi) — serbest JSON. */
  diff?: unknown;
  /** İsteğin geldiği IP (X-Forwarded-For / soket). */
  ipAddress?: string | null;
}

/**
 * Denetim (audit) kayıtlarını yazan servis — KVKK m.12 ("kim, ne zaman, neyi değiştirdi").
 *
 * Şemadaki `AuditLog` modeli bugüne dek hiç yazılmıyordu; bu servis o boşluğu kapatan
 * tek yazma noktasıdır. Admin mutasyonları (sipariş durumu, kullanıcı/ürün düzenleme)
 * bu servisi çağırarak iz bırakır.
 *
 * FAIL-SAFE TASARIM: `record` ASLA fırlatmaz. Audit yazımı, çağıran iş akışının (sipariş
 * güncelleme vb.) yan etkisidir — bir DB hıçkırığı yüzünden meşru bir iş işleminin
 * bozulmasına izin verilmez. Hata yutulur ama observability için `error` seviyesinde
 * loglanır (sessiz başarısızlık yok). (OrdersService.issueInvoiceIfNeeded ile aynı desen.)
 *
 * NOT (KVKK politikası — bu PR kapsamı dışı): saklama süresi (retention), hassas alan
 * maskeleme ve "garantili/transactional audit" gereği KVKK Sorumlusu kararına bağlıdır;
 * burada yalnızca mekanizma sağlanır.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger(AuditLogService.name);

  constructor(private prisma: PrismaService) {}

  async record(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: entry.entityType,
          entityId: entry.entityId,
          action: entry.action,
          actorId: entry.actorId ?? undefined,
          userId: entry.userId ?? undefined,
          diff: entry.diff === undefined ? undefined : (entry.diff as Prisma.InputJsonValue),
          ipAddress: entry.ipAddress ?? undefined,
        },
      });
    } catch (e) {
      this.logger.error(
        `Denetim kaydı yazılamadı (akış bozulmadı) ${entry.entityType}#${entry.entityId} ${entry.action}: ${(e as Error).message}`,
      );
    }
  }
}

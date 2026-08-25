import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";
import { Perms, PERM } from "../auth/permissions";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Müşteriye giden e-postaların log listesi (2026-08-25, Hasan: "hangi gün hangi
 * saatte hangi konulu e-posta gitmiş panelden göreyim"). Kaynak: NotificationLog —
 * mail.service her gönderimde zaten yazıyor; bu uç yalnız OKUR.
 * body alanı BİLEREK dönülmez (boş tutuluyor); metadata'dan yalnız orderNumber alınır.
 */
@ApiTags("admin")
@Controller("admin/notification-logs")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@Perms(PERM.CUSTOMERS_READ)
@ApiBearerAuth()
export class NotificationLogsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(
    @Query("take") takeRaw?: string,
    @Query("skip") skipRaw?: string,
    @Query("q") q?: string,
    @Query("status") status?: string,
  ) {
    const take = Math.min(Math.max(Number(takeRaw) || 100, 1), 500);
    const skip = Math.max(Number(skipRaw) || 0, 0);
    const where = {
      channel: "email" as const,
      ...(status && ["sent", "failed", "skipped"].includes(status) ? { status } : {}),
      ...(q?.trim()
        ? { recipient: { contains: q.trim(), mode: "insensitive" as const } }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.notificationLog.count({ where }),
      this.prisma.notificationLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        select: {
          id: true,
          createdAt: true,
          recipient: true,
          template: true,
          subject: true,
          status: true,
          metadata: true,
        },
      }),
    ]);
    return {
      total,
      rows: rows.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        recipient: r.recipient,
        template: r.template,
        subject: r.subject,
        status: r.status,
        orderNumber:
          r.metadata && typeof r.metadata === "object" && "orderNumber" in r.metadata
            ? String((r.metadata as Record<string, unknown>).orderNumber ?? "") || null
            : null,
      })),
    };
  }
}

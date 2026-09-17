import { Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../auth/jwt.guard";
import { Roles, RolesGuard } from "../../auth/roles.guard";
import { PrismaService } from "../../prisma/prisma.service";
import { TurkuazService } from "./turkuaz.service";

/**
 * Turkuaz senkron yönetimi (2026-09-17). Yalnız admin/super_admin: senkron katalog ve
 * fiyat YAZAN bir işlemdir. Gece cron'u zaten var; bu uçlar ilk kurulum ve arıza anı içindir.
 */
@ApiTags("admin-turkuaz")
@Controller("admin/turkuaz")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin", "admin")
@ApiBearerAuth()
export class TurkuazController {
  constructor(
    private turkuaz: TurkuazService,
    private prisma: PrismaService,
  ) {}

  /**
   * Senkronu elle tetikler ve ARKA PLANDA bırakır (ilk çalıştırma görsel indirme yüzünden
   * ~10 dk sürer; HTTP bekletilmez). Sonuç GET /durum'dan ve API logundan izlenir.
   */
  @Post("senkron")
  baslat(): { basladi: boolean } {
    void this.turkuaz.runSenkron().catch(() => undefined); // hata runSenkron içinde loglanır
    return { basladi: true };
  }

  /** Son senkron özeti (turkuaz.sync_ozet SiteSetting kaydı). */
  @Get("durum")
  async durum(): Promise<{ ozet: unknown; kayitSayisi: number }> {
    const [ozet, kayitSayisi] = await Promise.all([
      this.prisma.siteSetting.findUnique({ where: { key: "turkuaz.sync_ozet" } }),
      this.prisma.tedarikciUrun.count({ where: { tedarikci: "turkuaz" } }),
    ]);
    return { ozet: ozet?.value ?? null, kayitSayisi };
  }
}

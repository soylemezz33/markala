import { BadRequestException, Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateHeroSlideDto, UpdateHeroSlideDto } from "./hero-slides.dto";

/**
 * Aynı anda yayında olabilecek EN FAZLA slayt sayısı (2026-08-31 kararı).
 *
 * Neden 4: Erik Runyon'un carousel etkileşim verisinde (nd.edu, 3,7M ziyaret) tıklamaların
 * %89'u ilk slayta gidiyor ve slayt sayısı arttıkça son slaytlar neredeyse hiç görülmüyor;
 * kendi sonucu "en fazla 4, tercihen 3 öğe". Kural burada — API'de — zorlanır, çünkü panel
 * tek giriş noktası değil (doğrudan API çağrısı da yapılabiliyor).
 */
export const MAX_AKTIF_SLAYT = 4;

@Injectable()
export class HeroSlidesService {
  constructor(private prisma: PrismaService) {}

  findAll(includeInactive = false) {
    return this.prisma.heroSlide.findMany({
      ...(includeInactive ? {} : { where: { isActive: true } }),
      orderBy: { sortOrder: "asc" },
    });
  }

  /**
   * Yayına alınmak istenen slayt tavanı aşıyor mu? `haricId` güncellenen slayttır —
   * zaten aktifse kendini iki kez saymamak için sayımdan düşülür.
   */
  private async tavanKontrol(haricId?: string): Promise<void> {
    const aktif = await this.prisma.heroSlide.count({
      where: { isActive: true, ...(haricId ? { id: { not: haricId } } : {}) },
    });
    if (aktif >= MAX_AKTIF_SLAYT) {
      throw new BadRequestException(
        `Aynı anda en fazla ${MAX_AKTIF_SLAYT} slayt yayında olabilir. ` +
          `Şu an ${aktif} aktif slayt var; yenisini yayına almak için önce birini pasifleştirin.`,
      );
    }
  }

  async create(dto: CreateHeroSlideDto) {
    // isActive verilmezse Prisma varsayılanı true → yeni slayt da tavana dahil.
    if (dto.isActive !== false) await this.tavanKontrol();
    return this.prisma.heroSlide.create({ data: dto as Prisma.HeroSlideCreateInput });
  }

  async update(id: string, dto: UpdateHeroSlideDto) {
    // Yalnız PASİF → AKTİF geçişinde kontrol et. Zaten aktif bir slaydın başlığını
    // düzenlemek tavanı tetiklememeli.
    if (dto.isActive === true) {
      const mevcut = await this.prisma.heroSlide.findUnique({
        where: { id },
        select: { isActive: true },
      });
      if (mevcut && !mevcut.isActive) await this.tavanKontrol(id);
    }
    return this.prisma.heroSlide.update({ where: { id }, data: dto as Prisma.HeroSlideUpdateInput });
  }

  remove(id: string) {
    return this.prisma.heroSlide.delete({ where: { id } });
  }
}

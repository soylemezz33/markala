import { Injectable, Logger, OnModuleDestroy, OnModuleInit, BadRequestException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  PANEL_ROLES,
  PERM_LISTESI,
  PERM_META,
  permsForRole,
  rolOzellestirilmis,
  setOzelRolIzinleri,
  varsayilanIzinler,
  type Perm,
} from "../auth/permissions";

/** Rolün panelde gösterilen adı — tek yerde (arayüz de bu listeyi alır). */
export const ROL_ETIKET: Record<(typeof PANEL_ROLES)[number], { label: string; aciklama: string }> = {
  super_admin: { label: "Süper Admin", aciklama: "Her şeye erişir; yetkili ekler, rol ve izinleri düzenler. Kısıtlanamaz." },
  admin: { label: "Admin", aciklama: "Varsayılan olarak her şeye erişir; yetkili yönetimi hariç. İzinleri buradan daraltılabilir." },
  tasarimci: { label: "Grafik Tasarım", aciklama: "Sipariş içeriği, dosyalar, müşteri iletişimi, medya ve içerik." },
  muhasebe: { label: "Muhasebe", aciklama: "Para akışı, fatura/Paraşüt, cari ve fiyat güncelleme." },
  kargo: { label: "Kargo", aciklama: "Siparişi paketleyip gönderiyi açar; tutar ve ödeme görmez." },
};

/**
 * ROL İZİN SERVİSİ (2026-09-17).
 *
 * Görevi: `panel_role_permissions` tablosunu belleğe yüklemek ve permissions.ts'teki
 * senkron haritayı (setOzelRolIzinleri) beslemek. Açılışta bir kez yükler, sonra her
 * 30 sn tazeler — API tek konteyner olsa da ileride ikinci örnek açılırsa izin değişikliği
 * en geç yarım dakikada oraya da ulaşır. Yazma bu servisten geçer ve haritayı ANINDA günceller.
 *
 * DB'ye ulaşılamazsa (açılış sırasında migration gecikmesi vb.) varsayılanlarla devam eder
 * ve uyarı loglar; tazeleme döngüsü başarılı olunca harita dolar.
 */
@Injectable()
export class RolIzinService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RolIzinService.name);
  private zamanlayici: NodeJS.Timeout | null = null;
  static readonly TAZELEME_MS = 30_000;

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.yukle();
    this.zamanlayici = setInterval(() => void this.yukle(), RolIzinService.TAZELEME_MS);
    this.zamanlayici.unref?.();
  }

  onModuleDestroy() {
    if (this.zamanlayici) clearInterval(this.zamanlayici);
  }

  /** Tabloyu okuyup bellek haritasını yeniler. Hata durumunda mevcut harita korunur. */
  async yukle(): Promise<void> {
    try {
      const rows = await this.prisma.panelRolePermission.findMany();
      const harita: Record<string, Perm[]> = {};
      for (const r of rows) harita[r.role] = r.perms as Perm[];
      setOzelRolIzinleri(harita);
    } catch (e) {
      this.logger.warn(`rol_izin.yukle_basarisiz: ${(e as Error).message}`);
    }
  }

  /** Panel için tam matris: izin tanımları + her rolün mevcut/varsayılan izinleri. */
  listele() {
    return {
      izinler: PERM_META,
      roller: PANEL_ROLES.map((rol) => ({
        rol,
        label: ROL_ETIKET[rol].label,
        aciklama: ROL_ETIKET[rol].aciklama,
        izinler: permsForRole(rol),
        varsayilan: varsayilanIzinler(rol),
        kilitli: rol === "super_admin",
        ozellestirilmis: rolOzellestirilmis(rol),
      })),
    };
  }

  /**
   * Rolün izin setini panelden kaydeder. Bilinmeyen anahtar → 400; super_admin → 403.
   * Varsayılanla birebir aynı set kaydedilirse satır SİLİNİR (ozellestirilmis=false kalsın,
   * ileride kod-içi varsayılan değişirse rol onu takip etsin).
   */
  async kaydet(rol: string, izinler: string[], actorId: string, ip?: string) {
    this.rolDogrula(rol);
    const bilinmeyen = izinler.filter((p) => !(PERM_LISTESI as readonly string[]).includes(p));
    if (bilinmeyen.length) {
      throw new BadRequestException(`Bilinmeyen izin anahtarı: ${bilinmeyen.join(", ")}`);
    }
    const yeni = [...new Set(izinler)] as Perm[];
    const onceki = permsForRole(rol);
    const varsayilan = varsayilanIzinler(rol);
    const varsayilanaEsit = yeni.length === varsayilan.length && varsayilan.every((p) => yeni.includes(p));

    if (varsayilanaEsit) {
      await this.prisma.panelRolePermission.deleteMany({ where: { role: rol } });
    } else {
      await this.prisma.panelRolePermission.upsert({
        where: { role: rol },
        create: { role: rol, perms: yeni, updatedBy: actorId },
        update: { perms: yeni, updatedBy: actorId },
      });
    }
    await this.yukle();

    await this.prisma.auditLog
      .create({
        data: {
          actorId,
          entityType: "PanelRole",
          entityId: rol,
          action: "role_perms_change",
          diff: {
            eklenen: yeni.filter((p) => !onceki.includes(p)),
            kaldirilan: onceki.filter((p) => !yeni.includes(p)),
            sonuc: yeni,
            varsayilan: varsayilanaEsit,
          },
          ipAddress: ip ?? null,
        },
      })
      .catch(() => undefined);

    return { ok: true, rol, izinler: permsForRole(rol), ozellestirilmis: !varsayilanaEsit };
  }

  /** Rolü kod-içi varsayılana döndürür (satırı siler). */
  async sifirla(rol: string, actorId: string, ip?: string) {
    this.rolDogrula(rol);
    return this.kaydet(rol, varsayilanIzinler(rol), actorId, ip);
  }

  private rolDogrula(rol: string) {
    if (rol === "super_admin") {
      throw new ForbiddenException("Süper admin rolü kısıtlanamaz.");
    }
    if (!(PANEL_ROLES as readonly string[]).includes(rol)) {
      throw new BadRequestException("Bilinmeyen rol.");
    }
  }
}

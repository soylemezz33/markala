import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import type { CorporateApplication, CorporateStatus } from "@prisma/client";
import type { CreateCorporateApplicationDto } from "./corporate-applications.dto";

@Injectable()
export class CorporateApplicationsService {
  private readonly logger = new Logger(CorporateApplicationsService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  /**
   * Public B2B başvurusu — panele "pending" olarak düşer.
   * `docs` controller'da yüklenen hassas belgelerin storage key'leri (public URL DEĞİL);
   * yalnızca auth-korumalı serve endpoint'i çözer.
   */
  create(
    dto: CreateCorporateApplicationDto,
    userId?: string,
    docs?: { taxCertificateUrl?: string; signatureCircularUrl?: string },
  ) {
    return this.prisma.corporateApplication.create({
      data: {
        userId: userId ?? null,
        companyName: dto.companyName,
        taxOffice: dto.taxOffice?.trim() || "-",
        taxNumber: dto.taxNumber,
        sector: dto.sector ?? null,
        annualVolume: dto.annualVolume ?? null,
        contactName: dto.contactName,
        contactRole: dto.contactRole ?? null,
        email: dto.email,
        phone: dto.phone,
        address: dto.address?.trim() || "-",
        notes: dto.notes ?? null,
        taxCertificateUrl: docs?.taxCertificateUrl ?? null,
        signatureCircularUrl: docs?.signatureCircularUrl ?? null,
        status: "pending",
      },
    });
  }

  /**
   * Hassas belge storage key'ini sahiplik/yetki kontrolüyle çöz.
   * `requester` ya admin/super_admin olmalı ya da başvurunun sahibi (userId eşleşmeli).
   * Yetkisizde 404 (varlık sızdırmamak için), key yoksa 404.
   */
  async getDocumentKey(
    id: string,
    field: "tax" | "signature",
    requester: { userId: string; role: string },
  ): Promise<string> {
    const app = await this.prisma.corporateApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Belge bulunamadı.");
    const isAdmin = requester.role === "admin" || requester.role === "super_admin";
    const isOwner = !!app.userId && app.userId === requester.userId;
    if (!isAdmin && !isOwner) throw new NotFoundException("Belge bulunamadı.");
    const key = field === "tax" ? app.taxCertificateUrl : app.signatureCircularUrl;
    if (!key) throw new NotFoundException("Belge bulunamadı.");
    return key;
  }

  findAll(status?: string) {
    return this.prisma.corporateApplication.findMany({
      where: status ? { status: status as CorporateStatus } : undefined,
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const app = await this.prisma.corporateApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Başvuru bulunamadı.");
    return app;
  }

  /** Başvuruyu onayla/reddet; onayda bağlı kullanıcıyı kurumsal yap. */
  async review(
    id: string,
    reviewerId: string,
    status: "approved" | "rejected",
    reviewNote?: string,
  ) {
    const app = await this.prisma.corporateApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException("Başvuru bulunamadı.");

    const updated = await this.prisma.corporateApplication.update({
      where: { id },
      data: { status, reviewNote, reviewedById: reviewerId, reviewedAt: new Date() },
    });

    let inviteEmailSent: boolean | null = null;
    if (status === "approved") {
      inviteEmailSent = await this.approveAccount(app);
      if (inviteEmailSent === false) {
        this.logger.warn(
          `Kurumsal onay ${app.id} (${app.email}): davet/şifre-belirleme maili GÖNDERİLEMEDİ — müşteri giriş yapamaz, daveti yeniden gönderin.`,
        );
      }
    } else if (app.userId) {
      await this.prisma.user
        .update({ where: { id: app.userId }, data: { corporateStatus: "rejected" } })
        .catch(() => undefined);
    }

    // inviteEmailSent: true=gitti, false=gidemedi (admin uyarılmalı), null=davet gerekmedi (mevcut hesap).
    return { ...updated, inviteEmailSent };
  }

  /**
   * Onayda kurumsal hesabı hazırla: başvuruya bağlı / aynı e-postalı kullanıcı varsa onu
   * kurumsal yap; yoksa yeni hesap oluştur ve şifre-belirleme (davet) e-postası gönder —
   * böylece müşteri panele giriş yapabilir. Misafir başvurularda da çalışır (userId null).
   */
  private async approveAccount(app: CorporateApplication): Promise<boolean | null> {
    const corp = {
      accountType: "corporate" as const,
      corporateStatus: "approved" as const,
      corporateApprovedAt: new Date(),
      companyName: app.companyName,
      taxOffice: app.taxOffice,
      taxNumber: app.taxNumber,
    };

    let user =
      (app.userId ? await this.prisma.user.findUnique({ where: { id: app.userId } }) : null) ??
      (await this.prisma.user.findUnique({ where: { email: app.email } }));

    let isNew = false;
    if (user) {
      await this.prisma.user.update({ where: { id: user.id }, data: corp });
    } else {
      // Yeni kurumsal hesap — rastgele şifre (davet linkiyle belirlenecek)
      const placeholderHash = await argon2.hash(crypto.randomBytes(32).toString("hex"));
      user = await this.prisma.user.create({
        data: {
          email: app.email,
          passwordHash: placeholderHash,
          fullName: app.contactName,
          phone: app.phone,
          role: "customer",
          ...corp,
        },
      });
      isNew = true;
    }

    if (app.userId !== user.id) {
      await this.prisma.corporateApplication.update({
        where: { id: app.id },
        data: { userId: user.id },
      });
    }

    // isNew değilse davet gerekmez (null). Yeni hesapta davet mailinin gidip gitmediğini döndür →
    // review() admin yanıtına 'inviteEmailSent' koyar; mail giderse müşteri şifre belirleyip
    // giriş yapabilir, gitmezse admin görüp 'yeniden gönder' yapabilir (aksi halde sessizce erişemez).
    if (isNew) {
      return this.sendInvite(user.id, user.email, app.companyName);
    }
    return null;
  }

  /** Davet/şifre-belirleme e-postası (şifre-sıfırlama altyapısı; 7 gün geçerli). Mail sonucu döner. */
  private async sendInvite(userId: string, email: string, companyName: string): Promise<boolean> {
    const rawToken = crypto.randomBytes(48).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.passwordResetToken.updateMany({
      where: { userId, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    await this.prisma.passwordResetToken.create({ data: { userId, tokenHash, expiresAt } });
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(
      /\/$/,
      "",
    );
    const inviteUrl = `${webUrl}/sifre-sifirla?token=${rawToken}`;
    return this.mail.sendCorporateInviteEmail(email, inviteUrl, companyName);
  }
}

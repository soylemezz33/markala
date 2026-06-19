import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAddressDto, UpdateAddressDto, UpdateProfileDto, UpdateCorporateDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  /** Müşteri duyuru tercihleri (granular e-posta/SMS). Null → client varsayılanı gösterir. */
  async getNotificationPrefs(userId: string) {
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { notificationPrefs: true } });
    return u?.notificationPrefs ?? null;
  }

  async updateNotificationPrefs(
    userId: string,
    prefs: Record<string, { email?: boolean; sms?: boolean }>,
  ) {
    // KVKK: kampanya/bülten e-postası açıksa pazarlama izni de güncellenir.
    const marketingOn = Boolean(prefs?.campaigns?.email || prefs?.newsletter?.email);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPrefs: prefs as unknown as Prisma.InputJsonValue,
        marketingConsent: marketingOn,
        ...(marketingOn
          ? { marketingConsentAt: new Date(), marketingConsentSource: "bildirim-tercihleri" }
          : {}),
      },
    });
    return { ok: true };
  }

  /**
   * SECURITY (mass assignment koruması):
   * DTO sadece güvenli profil alanlarını içerir — role/corporateDiscount/corporateCreditLimit
   * vb. DTO'da yok, ValidationPipe whitelist ile düşürülür. Burada da fazladan tedbir olarak
   * sadece izin verilen alanları açıkça seçiyoruz; bilinmeyen alanlar Prisma'ya hiç gitmez.
   */
  updateProfile(userId: string, data: UpdateProfileDto) {
    const safe = {
      fullName: data.fullName,
      phone: data.phone,
      companyName: data.companyName,
      taxOffice: data.taxOffice,
      taxNumber: data.taxNumber,
    };
    return this.prisma.user.update({ where: { id: userId }, data: safe });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  createAddress(userId: string, data: CreateAddressDto) {
    const safe = {
      label: data.label,
      fullName: data.fullName,
      phone: data.phone,
      city: data.city,
      district: data.district,
      fullAddress: data.fullAddress,
      zipCode: data.zipCode,
      isDefault: data.isDefault ?? false,
      type: data.type === "corporate" ? "corporate" : "individual",
      companyName: data.type === "corporate" ? data.companyName ?? null : null,
      taxOffice: data.type === "corporate" ? data.taxOffice ?? null : null,
      taxNumber: data.type === "corporate" ? data.taxNumber ?? null : null,
    };
    return this.prisma.address.create({ data: { ...safe, userId } });
  }

  updateAddress(userId: string, id: string, data: UpdateAddressDto) {
    // SECURITY: userId scope sayesinde IDOR koruması.
    const safe: Record<string, unknown> = {};
    if (data.label !== undefined) safe.label = data.label;
    if (data.fullName !== undefined) safe.fullName = data.fullName;
    if (data.phone !== undefined) safe.phone = data.phone;
    if (data.city !== undefined) safe.city = data.city;
    if (data.district !== undefined) safe.district = data.district;
    if (data.fullAddress !== undefined) safe.fullAddress = data.fullAddress;
    if (data.zipCode !== undefined) safe.zipCode = data.zipCode;
    if (data.isDefault !== undefined) safe.isDefault = data.isDefault;
    if (data.type !== undefined) {
      safe.type = data.type === "corporate" ? "corporate" : "individual";
      // Bireysele dönerse kurumsal alanları temizle; kurumsalsa gelen değerleri yaz.
      safe.companyName = data.type === "corporate" ? data.companyName ?? null : null;
      safe.taxOffice = data.type === "corporate" ? data.taxOffice ?? null : null;
      safe.taxNumber = data.type === "corporate" ? data.taxNumber ?? null : null;
    }
    return this.prisma.address.updateMany({ where: { id, userId }, data: safe });
  }

  deleteAddress(userId: string, id: string) {
    return this.prisma.address.deleteMany({ where: { id, userId } });
  }

  async listForAdmin(opts: { take?: number; skip?: number; q?: string } = {}) {
    const rows = await this.prisma.user.findMany({
      where: opts.q
        ? { OR: [{ email: { contains: opts.q, mode: "insensitive" } }, { fullName: { contains: opts.q, mode: "insensitive" } }] }
        : {},
      select: {
        id: true, email: true, fullName: true, phone: true, accountType: true,
        companyName: true, role: true, createdAt: true,
        _count: { select: { orders: true } },
      },
      orderBy: { createdAt: "desc" },
      take: opts.take ?? 50,
      skip: opts.skip ?? 0,
    });
    return rows.map(({ _count, ...u }) => ({ ...u, orderCount: _count.orders }));
  }

  getForAdmin(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, phone: true, accountType: true,
        companyName: true, taxOffice: true, taxNumber: true, role: true,
        corporateStatus: true, corporateDiscount: true, corporateCreditLimit: true, corporatePaymentTermDays: true, createdAt: true, lastLoginAt: true,
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true, orderNumber: true, total: true, status: true,
            paymentStatus: true, createdAt: true,
          },
        },
        addresses: {
          orderBy: { isDefault: "desc" },
          select: {
            id: true, label: true, type: true, fullName: true, phone: true,
            city: true, district: true, fullAddress: true, zipCode: true,
            companyName: true, taxOffice: true, taxNumber: true, isDefault: true,
          },
        },
      },
    });
  }

  /** Admin: kurumsal müşteri ayarları (indirim oranı + kredi limiti) — müşteri başına. */
  async updateCorporateSettings(id: string, dto: UpdateCorporateDto) {
    const data: Record<string, unknown> = {};
    if (dto.corporateDiscount !== undefined) data.corporateDiscount = dto.corporateDiscount;
    if (dto.corporateCreditLimit !== undefined) data.corporateCreditLimit = dto.corporateCreditLimit;
    if (dto.corporatePaymentTermDays !== undefined) data.corporatePaymentTermDays = dto.corporatePaymentTermDays;
    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, corporateDiscount: true, corporateCreditLimit: true, corporatePaymentTermDays: true },
    });
  }
}

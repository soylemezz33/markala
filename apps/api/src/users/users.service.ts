import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAddressDto, UpdateAddressDto, UpdateProfileDto } from "./users.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
        corporateStatus: true, corporateDiscount: true, createdAt: true, lastLoginAt: true,
        orders: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true, orderNumber: true, total: true, status: true,
            paymentStatus: true, createdAt: true,
          },
        },
      },
    });
  }
}

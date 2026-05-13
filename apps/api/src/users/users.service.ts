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
}

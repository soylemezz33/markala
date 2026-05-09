import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  updateProfile(userId: string, data: { fullName?: string; phone?: string; companyName?: string; taxOffice?: string; taxNumber?: string }) {
    return this.prisma.user.update({ where: { id: userId }, data });
  }

  listAddresses(userId: string) {
    return this.prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
  }

  createAddress(userId: string, data: any) {
    return this.prisma.address.create({ data: { ...data, userId } });
  }

  updateAddress(userId: string, id: string, data: any) {
    return this.prisma.address.updateMany({ where: { id, userId }, data });
  }

  deleteAddress(userId: string, id: string) {
    return this.prisma.address.deleteMany({ where: { id, userId } });
  }
}

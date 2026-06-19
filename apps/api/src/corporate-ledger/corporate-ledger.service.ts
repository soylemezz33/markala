import { Injectable, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Cari hesap (B2B açık hesap) defteri.
 * Bakiye = borç (debit, açık-hesap siparişleri) − ödeme (credit, tahsilatlar).
 * Pozitif bakiye = müşterinin Markala'ya borcu.
 */
@Injectable()
export class CorporateLedgerService {
  constructor(private prisma: PrismaService) {}

  async getBalance(userId: string): Promise<number> {
    const grouped = await this.prisma.corporateLedgerEntry.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
    });
    let debit = 0;
    let credit = 0;
    for (const g of grouped) {
      const v = Number(g._sum.amount ?? 0);
      if (g.kind === "debit") debit = v;
      else credit = v;
    }
    return Math.round((debit - credit) * 100) / 100;
  }

  async getStatement(userId: string) {
    const [entries, balance] = await Promise.all([
      this.prisma.corporateLedgerEntry.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 200,
      }),
      this.getBalance(userId),
    ]);
    return { balance, entries };
  }

  /** Admin: tahsilat (ödeme) girişi → credit hareketi; bakiyeyi azaltır. */
  async recordPayment(userId: string, amount: number, description?: string) {
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new BadRequestException("Tahsilat tutarı 0'dan büyük olmalı.");
    }
    await this.prisma.corporateLedgerEntry.create({
      data: {
        userId,
        kind: "credit",
        amount: new Prisma.Decimal(amount),
        description: description?.trim() || "Tahsilat",
      },
    });
    return this.getStatement(userId);
  }
}

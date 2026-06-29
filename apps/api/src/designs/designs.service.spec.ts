import { describe, it, expect, vi } from "vitest";
import { BadRequestException, ForbiddenException, NotFoundException, PayloadTooLargeException } from "@nestjs/common";
import { DesignsService } from "./designs.service";
import type { PrismaService } from "../prisma/prisma.service";

function makePrisma() {
  return {
    design: {
      create: vi.fn().mockResolvedValue({ id: "d1" }),
      findFirst: vi.fn(),
      update: vi.fn().mockResolvedValue({ id: "d1" }),
      findMany: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 2 }),
    },
    designTemplate: { findMany: vi.fn().mockResolvedValue([]) },
  } as unknown as PrismaService & Record<string, any>;
}

const baseDto = { document: { v: 1 }, widthMm: 85, heightMm: 55 } as any;

describe("DesignsService", () => {
  it("misafir create → sessionId zorunlu", async () => {
    const svc = new DesignsService(makePrisma());
    await expect(svc.create(baseDto, undefined)).rejects.toBeInstanceOf(BadRequestException);
  });

  it("misafir create → sessionId saklanır, userId null", async () => {
    const prisma = makePrisma();
    await new DesignsService(prisma).create({ ...baseDto, sessionId: "s1" }, undefined);
    expect((prisma as any).design.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ sessionId: "s1", userId: null }) }),
    );
  });

  it("üye create → sessionId TUTULMAZ (hesaba bağlı)", async () => {
    const prisma = makePrisma();
    await new DesignsService(prisma).create({ ...baseDto, sessionId: "s1" }, "u1");
    expect((prisma as any).design.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "u1", sessionId: null }) }),
    );
  });

  it("getOwned → yoksa NotFound", async () => {
    const prisma = makePrisma();
    (prisma as any).design.findFirst.mockResolvedValue(null);
    await expect(new DesignsService(prisma).getOwned("x", "u1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("getOwned → sahibi değilse Forbidden", async () => {
    const prisma = makePrisma();
    (prisma as any).design.findFirst.mockResolvedValue({ id: "d1", userId: "owner", sessionId: null });
    await expect(new DesignsService(prisma).getOwned("d1", "intruder")).rejects.toBeInstanceOf(ForbiddenException);
  });

  it("getOwned → sessionId eşleşince döner", async () => {
    const prisma = makePrisma();
    const d = { id: "d1", userId: null, sessionId: "s1" };
    (prisma as any).design.findFirst.mockResolvedValue(d);
    await expect(new DesignsService(prisma).getOwned("d1", undefined, "s1")).resolves.toBe(d);
  });

  it("claim → misafir tasarımlarını userId'ye bağlar", async () => {
    const prisma = makePrisma();
    const r = await new DesignsService(prisma).claim({ sessionId: "s1" }, "u1");
    expect((prisma as any).design.updateMany).toHaveBeenCalledWith({
      where: { sessionId: "s1", userId: null, deletedAt: null },
      data: { userId: "u1", sessionId: null },
    });
    expect(r).toEqual({ claimed: 2 });
  });

  it("create → 4MB üstü document reddeder", async () => {
    const big = { blob: "x".repeat(4_000_001) };
    await expect(
      new DesignsService(makePrisma()).create({ ...baseDto, document: big, sessionId: "s1" }, undefined),
    ).rejects.toBeInstanceOf(PayloadTooLargeException);
  });
});

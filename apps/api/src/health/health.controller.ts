import { Controller, Get, HttpCode } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Res } from "@nestjs/common";
import { Response } from "express";
import { PrismaService } from "../prisma/prisma.service";

@ApiTags("health")
@Controller("health")
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check(@Res() res: Response) {
    let db: "up" | "down" = "down";
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      db = "up";
    } catch {
      db = "down";
    }

    const healthy = db === "up";
    const body = {
      status: healthy ? "ok" : "error",
      service: "markala-api",
      version: "0.1.0",
      timestamp: new Date().toISOString(),
      checks: { db },
    };

    // 503 when any check fails so UptimeRobot keyword "ok" won't match
    return res.status(healthy ? 200 : 503).json(body);
  }
}

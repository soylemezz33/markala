import { Controller, Get, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import * as net from "net";
import { PrismaService } from "../prisma/prisma.service";

type CheckStatus = "ok" | "error" | "not_configured";

@ApiTags("health")
@Controller("health")
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  /** Shallow: API process ayakta mı? Bağımlılık testi yok. Load-balancer için. */
  @Get()
  @ApiOperation({ summary: "Shallow health check — bağımlılık testi yok" })
  shallow() {
    return {
      status: "ok",
      service: "markala-api",
      version: process.env.npm_package_version ?? "0.1.0",
      uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
    };
  }

  /** Deep: DB + Redis bağlantısı test edilir. UptimeRobot / monitoring için. */
  @Get("deep")
  @ApiOperation({ summary: "Deep health check — DB + Redis ping" })
  async deep() {
    const [db, redis] = await Promise.all([this.checkDb(), this.checkRedis()]);

    const healthy = db === "ok" && redis !== "error";

    const body = {
      status: healthy ? "ok" : "degraded",
      service: "markala-api",
      version: process.env.npm_package_version ?? "0.1.0",
      uptime_seconds: Math.floor((Date.now() - this.startedAt) / 1000),
      db,
      redis,
      timestamp: new Date().toISOString(),
    };

    if (!healthy) {
      throw new HttpException(body, HttpStatus.SERVICE_UNAVAILABLE);
    }

    return body;
  }

  private async checkDb(): Promise<CheckStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return "ok";
    } catch {
      return "error";
    }
  }

  private checkRedis(): Promise<CheckStatus> {
    const url = process.env.REDIS_URL;
    if (!url) return Promise.resolve("not_configured");

    return new Promise((resolve) => {
      try {
        const parsed = new URL(url);
        const socket = net.createConnection(
          { host: parsed.hostname, port: Number(parsed.port || 6379) },
          () => socket.write("PING\r\n"),
        );
        socket.setTimeout(3000);
        socket.once("data", () => {
          socket.destroy();
          resolve("ok");
        });
        socket.once("timeout", () => {
          socket.destroy();
          resolve("error");
        });
        socket.once("error", () => resolve("error"));
      } catch {
        resolve("error");
      }
    });
  }
}

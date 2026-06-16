import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt.guard";
import { ChangePasswordDto, LoginDto, RegisterDto } from "./dtos";

/**
 * SECURITY HARDENING (auth.controller):
 *
 * - Rate limit: register 3/saat, login 5/dk, refresh 30/dk — main.ts'teki rateLimit() middleware'inde per-IP uygulanır.
 * - Refresh token httpOnly + Secure + SameSite=Lax cookie.
 *   `Strict` değil çünkü OAuth/3rd-party redirect senaryolarında session koparıyor; Lax CSRF için yeterli.
 * - Cookie parse: cookie-parser middleware yok — header'dan manuel parse ediyoruz.
 *   Bağımlılık eklemekten kaçınmak için. Eklenmek istenirse main.ts'te `app.use(cookieParser())`.
 */
@ApiTags("auth")
@Controller("auth")
export class AuthController {
  private readonly cookieName = "mk_refresh";

  constructor(private auth: AuthService, private config: ConfigService) {}

  // Brute force: register 3 deneme / saat / IP — bot kayıt seliyle DB'yi şişirmeyi engeller.
  // Rate limit main.ts'teki rateLimit() middleware'inde uygulanır.
  @Post("register")
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, {
      userAgent: req.headers["user-agent"],
      ipAddress: this.clientIp(req),
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // Brute force: login 5/dk/IP. Hatalı parola enumeration limitlenir.
  // Rate limit main.ts'teki rateLimit() middleware'inde uygulanır.
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto.email, dto.password, {
      userAgent: req.headers["user-agent"],
      ipAddress: this.clientIp(req),
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  // Refresh token akışı — 30/dk/IP yeterli (cookie kaybı olursa kullanıcı yeniden login olur).
  // Rate limit main.ts'teki rateLimit() middleware'inde uygulanır.
  @Post("refresh")
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.readRefreshCookie(req);
    const result = await this.auth.refresh(raw ?? "", {
      userAgent: req.headers["user-agent"],
      ipAddress: this.clientIp(req),
    });
    this.setRefreshCookie(res, result.refreshToken, result.refreshExpiresAt);
    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post("logout")
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const raw = this.readRefreshCookie(req);
    await this.auth.logout(raw);
    res.clearCookie(this.cookieName, this.cookieOptions(0));
    return { ok: true };
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  me(@Req() req: Request & { user: { sub: string } }) {
    return this.auth.me(req.user.sub);
  }

  // Şifre değiştirme — mevcut şifre argon2.verify ile doğrulanır; hatalıysa 401.
  @Patch("password")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async changePassword(
    @Req() req: Request & { user: { sub: string } },
    @Body() dto: ChangePasswordDto,
  ) {
    return this.auth.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }

  // === Helpers ===

  private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
    res.cookie(this.cookieName, token, {
      ...this.cookieOptions(expiresAt.getTime() - Date.now()),
      expires: expiresAt,
    });
  }

  private cookieOptions(maxAgeMs: number) {
    const isProd = (this.config.get<string>("NODE_ENV") ?? "development") === "production";
    return {
      httpOnly: true,
      secure: isProd, // dev'de http://localhost — Secure flag tarayıcıyı engeller
      sameSite: "lax" as const,
      path: "/api/auth",
      maxAge: maxAgeMs,
    };
  }

  // cookie-parser olmadan minimal header parser.
  // Format: "name=value; other=value2"
  private readRefreshCookie(req: Request): string | undefined {
    const header = req.headers.cookie;
    if (!header) return undefined;
    for (const part of header.split(";")) {
      const [k, ...v] = part.trim().split("=");
      if (k === this.cookieName) return decodeURIComponent(v.join("="));
    }
    return undefined;
  }

  private clientIp(req: Request): string | undefined {
    const xff = req.headers["x-forwarded-for"];
    if (typeof xff === "string") return xff.split(",")[0]?.trim();
    if (Array.isArray(xff)) return xff[0];
    return req.socket?.remoteAddress ?? undefined;
  }
}

import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/**
 * Opsiyonel JWT — geçerli token varsa req.user = payload, yoksa HATA FIRLATMADAN devam (misafir).
 * Tasarım aracı misafir kullanımı için: üye → userId, misafir → sessionId.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard("jwt") {
  override handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}

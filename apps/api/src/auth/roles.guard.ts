import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMS_KEY, roleHasPerm, type Perm } from "./permissions";

export const ROLES_KEY = "roles";
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException("Bu işlem için yetkiniz yok.");

    // 1) Klasik rol eşleşmesi (mevcut davranış — admin/super_admin uçları aynen çalışır).
    if (required.includes(user.role)) return true;

    // 2) İZİN TABANLI AÇILIM (2026-08-21): uç `@Perms(...)` ile açıkça işaretlenmişse,
    //    o izne sahip yeni gruplar (tasarimci/muhasebe) da geçebilir.
    //    İşaretlenmemiş uçlar KAPALI kalır — varsayılan kapalı ilkesi.
    const perms = this.reflector.getAllAndOverride<Perm[]>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (perms?.length && perms.every((p) => roleHasPerm(user.role, p))) return true;

    throw new ForbiddenException("Bu işlem için yetkiniz yok.");
  }
}

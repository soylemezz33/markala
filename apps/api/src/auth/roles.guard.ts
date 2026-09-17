import {
  Injectable,
  CanActivate,
  ExecutionContext,
  SetMetadata,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PERMS_KEY, roleHasPerm, rolJokerMi, type Perm } from "./permissions";

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

    const perms = this.reflector.getAllAndOverride<Perm[]>(PERMS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // 1) Klasik rol eşleşmesi (mevcut davranış — admin/super_admin uçları aynen çalışır).
    //    2026-09-17 istisnası: rol panelden KISITLANMIŞSA (rolJokerMi=false, bugün yalnız
    //    admin için mümkün) ve uç `@Perms` taşıyorsa, rol adı yetmez → izin aranır. `@Perms`
    //    taşımayan eski uçlar rol eşleşmesiyle açık kalır; o uçlar için izin anahtarı yok.
    if (required.includes(user.role)) {
      if (rolJokerMi(user.role) || !perms?.length) return true;
      if (perms.every((p) => roleHasPerm(user.role, p))) return true;
      throw new ForbiddenException("Bu işlem için yetkiniz yok.");
    }

    // 2) İZİN TABANLI AÇILIM (2026-08-21): uç `@Perms(...)` ile açıkça işaretlenmişse,
    //    o izne sahip yeni gruplar (tasarimci/muhasebe/kargo) da geçebilir.
    //    İşaretlenmemiş uçlar KAPALI kalır — varsayılan kapalı ilkesi.
    if (perms?.length && perms.every((p) => roleHasPerm(user.role, p))) return true;

    throw new ForbiddenException("Bu işlem için yetkiniz yok.");
  }
}

import { Module } from "@nestjs/common";
import { AdminUsersController } from "./admin-users.controller";
import { RolIzinService } from "./rol-izin.service";

// PrismaModule @Global — ayrıca import gerekmiyor.
// RolIzinService açılışta panel_role_permissions tablosunu belleğe yükler (permissions.ts
// haritası); RolesGuard ve /auth/me bu harita üzerinden çalışır.
@Module({ controllers: [AdminUsersController], providers: [RolIzinService], exports: [RolIzinService] })
export class AdminUsersModule {}

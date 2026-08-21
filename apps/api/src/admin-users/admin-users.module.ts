import { Module } from "@nestjs/common";
import { AdminUsersController } from "./admin-users.controller";

// PrismaModule @Global — ayrıca import gerekmiyor.
@Module({ controllers: [AdminUsersController] })
export class AdminUsersModule {}

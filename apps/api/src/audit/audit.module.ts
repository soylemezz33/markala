import { Global, Module } from "@nestjs/common";
import { AuditLogService } from "./audit-log.service";

/**
 * Denetim kaydı altyapısı. PrismaModule gibi @Global — herhangi bir servis/controller
 * AuditModule'ü ayrıca import etmeden AuditLogService'i enjekte edebilir.
 */
@Global()
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditModule {}

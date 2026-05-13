import { Global, Module } from "@nestjs/common";
import { EncryptionService } from "./encryption.service";

/**
 * Global EncryptionModule — EncryptionService'i tüm modüllere export eder.
 * AuthModule (2FA secret), UsersModule (hassas alanlar) içinden direkt
 * inject edilebilir.
 */
@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule {}

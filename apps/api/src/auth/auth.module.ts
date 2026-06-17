import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { ConfigService } from "@nestjs/config";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [
    MailModule,
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("JWT_SECRET");
        // SECURITY: dev-secret fallback'ı kaldırıldı; bootstrap fail-fast garantili.
        if (!secret || secret.length < 32) {
          throw new Error("JWT_SECRET must be set and at least 32 characters");
        }
        return {
          secret,
          // Default 15dk — service tarafında JWT_ACCESS_EXPIRES_IN ile override edilebilir.
          // Eski JWT_EXPIRES_IN env'i geri uyumluluk için fallback olarak okunur.
          signOptions: {
            expiresIn:
              config.get<string>("JWT_ACCESS_EXPIRES_IN") ??
              config.get<string>("JWT_EXPIRES_IN") ??
              "15m",
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}

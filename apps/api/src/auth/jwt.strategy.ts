import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const secret = config.get<string>("JWT_SECRET");
    // GÜVENLİK: "dev-secret" fallback KALDIRILDI — zayıf/varsayılan secret token taklidine açar.
    // JWT_SECRET zorunlu (main.ts bootstrap'ta da ≥32 karakter doğrulanır; burada ikinci kapı).
    if (!secret || secret.length < 32) {
      throw new Error("JWT_SECRET env var must be set (min 32 characters)");
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    return payload;
  }
}

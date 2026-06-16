import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * Liste endpoint'leri için doğrulanmış + üst sınırlı sayfalama.
 *
 * NEDEN: controller'lar `take ? parseInt(take) : undefined` kullanıyordu —
 * `?take=abc` → `parseInt` NaN → Prisma `take: NaN` → 500. Ayrıca üst sınır
 * yoktu (`?take=999999` sınırsız sorgu = DoS riski). `@Type(() => Number)` ile
 * query string'i sayıya çevrilir, geçersiz girdi temiz 400 döner.
 */
export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "take tam sayı olmalı" })
  @Min(1)
  @Max(200)
  take?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "skip tam sayı olmalı" })
  @Min(0)
  skip?: number;
}

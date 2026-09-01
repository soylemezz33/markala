import { ArrayMaxSize, IsArray, IsString, Matches } from "class-validator";

/** Slug biçimi — katalogda üretilen tek biçim. Prisma parametreli sorgu kullanır, bu yalnız hijyen. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Girişte cihazdaki (localStorage) eski favori listesini hesaba taşır.
 * Liste kullanıcı girdisi değil, tarayıcıda birikmiş slug listesi — yine de üst sınır konur.
 */
export class MergeFavoritesDto {
  @IsArray()
  @ArrayMaxSize(200)
  @IsString({ each: true })
  @Matches(SLUG_PATTERN, { each: true, message: "Geçersiz ürün slug'ı." })
  slugs!: string[];
}

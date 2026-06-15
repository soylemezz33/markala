/**
 * Query string'ten gelen `take` / `skip` sayfalama parametrelerini güvenli şekilde parse eder.
 *
 * Neden gerekli: controller'lar daha önce `take ? parseInt(take) : undefined` kullanıyordu.
 * Bunun üç sorunu vardı:
 *   1. `?take=abc` → parseInt → NaN → Prisma `take: NaN` ile 500 fırlatıyordu.
 *   2. `?take=-5` / `?skip=-10` → Prisma negatif değerde hata veriyordu.
 *   3. Üst sınır yoktu → `?take=1000000` tüm tabloyu çekerek DoS riski oluşturuyordu.
 *
 * Bu helper hepsini tek noktada, davranışı bozmadan ele alır: geçersiz/eksik değerlerde
 * güvenli varsayılana düşer, negatifleri sabitler, take'i [1, maxTake] aralığına kırpar.
 */
export interface PaginationOptions {
  /** Parametre verilmediğinde / geçersiz olduğunda kullanılacak `take`. Varsayılan 50. */
  defaultTake?: number;
  /** `take` için izin verilen üst sınır (DoS koruması). Varsayılan 500. */
  maxTake?: number;
}

export interface Pagination {
  take: number;
  skip: number;
}

/** Pozitif tam sayıya çevirir; geçersizse `null` döner. */
function toPositiveInt(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function parsePagination(
  takeRaw: string | undefined,
  skipRaw: string | undefined,
  opts: PaginationOptions = {},
): Pagination {
  const defaultTake = opts.defaultTake ?? 50;
  const maxTake = opts.maxTake ?? 500;

  const parsedTake = toPositiveInt(takeRaw);
  const take = parsedTake == null ? defaultTake : Math.min(parsedTake, maxTake);

  // skip 0 da geçerli; bu yüzden ayrı parse — negatif/geçersiz → 0.
  const parsedSkip = skipRaw == null ? NaN : Number.parseInt(skipRaw, 10);
  const skip = Number.isFinite(parsedSkip) && parsedSkip > 0 ? parsedSkip : 0;

  return { take, skip };
}

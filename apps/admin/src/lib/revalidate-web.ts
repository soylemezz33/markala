/**
 * Admin bir katalog kaydını (ürün/kategori) değiştirince storefront (markala.com.tr) ISR
 * cache'ini ANINDA temizler. Admin ile web ayrı Next app'leri olduğu için admin'in
 * revalidatePath'i web'i etkilemez → web'in /api/revalidate webhook'unu çağırırız.
 *
 * ENV (admin servisi): WEB_REVALIDATE_URL (örn. https://markala.com.tr/api/revalidate),
 *                      REVALIDATE_SECRET (web ile AYNI). Yoksa sessiz no-op (ISR 30sn devrede).
 * Best-effort: hata olsa da admin işlemi bloke olmaz.
 */
export async function revalidateStorefront(paths?: string[]): Promise<void> {
  const url = process.env.WEB_REVALIDATE_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-revalidate-secret": secret },
      body: JSON.stringify(paths ? { paths } : {}),
      cache: "no-store",
    });
  } catch {
    /* storefront tazeleme başarısız — ISR 30sn ile yine de güncellenir */
  }
}

/**
 * Sunucu-tarafı HTML sanitizasyonu — DB'den gelen (admin düzenlenebilir) HTML gövdesi için.
 *
 * Neden: yasal/[slug] page.body içeriği admin panelinden düzenlenip DB'de tutulur ve
 * `dangerouslySetInnerHTML` ile basılır. super_admin dışı kimse düzenleyemese de,
 * derinlemesine savunma (compromised hesap / kopyala-yapıştır) için render sınırında temizlenir.
 *
 * `sanitize-html` htmlparser2 tabanlıdır (jsdom GEREKTİRMEZ) → Next standalone/nft trace ile
 * sorunsuz paketlenir. isomorphic-dompurify'nin jsdom bağımlılığı burada bilinçli olarak tercih edilmedi.
 */
import sanitize from "sanitize-html";

/** Yasal/blog gibi zengin-metin içeriği için güvenli allowlist. */
export function sanitizeHtml(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "strong", "b", "em", "i", "u", "s", "small", "sup", "sub",
      "ul", "ol", "li", "blockquote", "a",
      "table", "thead", "tbody", "tr", "th", "td",
      "code", "pre", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      th: ["colspan", "rowspan", "scope"],
      td: ["colspan", "rowspan"],
      "*": ["class"],
    },
    // Yalnız güvenli şemalar; javascript:/data: XSS vektörleri düşer.
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
    // target="_blank" linklere otomatik rel=noopener (tabnabbing koruması).
    transformTags: {
      a: sanitize.simpleTransform("a", { rel: "noopener noreferrer" }, false),
    },
  });
}

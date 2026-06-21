/**
 * Markala markalı, e-posta-istemcisi-güvenli (inline CSS + tablo layout) e-posta şablonu.
 * Tüm transaksiyonel/bildirim mailleri buradan geçer → tutarlı kurumsal görünüm + UTF-8.
 *
 * Neden inline + tablo: Gmail/Outlook <style> blokları ve flex/grid'i çoğunlukla yok sayar;
 * tek güvenilir yol her elemana inline style + <table> yerleşimi. <meta charset> + DOCTYPE
 * Türkçe karakteri (ğ/ş/ı/ö/ç/ü) bütün istemcilerde garanti eder.
 */

const BRAND = "#F5B800"; // marka sarısı (brand-500)
const INK = "#1A1410"; // koyu (ink-900)
const MUTED = "#78716c";
const BORDER = "#e7e5e4";

export interface EmailLayoutOptions {
  /** Başlık (büyük, koyu) */
  title: string;
  /** Başlık altı kısa açıklama (opsiyonel) */
  intro?: string;
  /** Gövde HTML'i — çağıran taraf oluşturur (tablo, mesaj, CTA vb.) */
  bodyHtml: string;
  /** Gelen kutusu önizleme metni (gizli) */
  preheader?: string;
  /** Gövde altı küçük not (opsiyonel) */
  footnote?: string;
}

/** Markala kurumsal e-posta layout'u → tam HTML döndürür. */
export function renderEmail(opts: EmailLayoutOptions): string {
  const { title, intro, bodyHtml, preheader, footnote } = opts;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;-webkit-text-size-adjust:100%">
${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f4f4f5">${preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid ${BORDER}">
      <tr><td style="background:${BRAND};padding:22px 28px">
        <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:${INK};letter-spacing:-0.5px">Markala</span>
        <span style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${INK};opacity:0.7;margin-left:8px">matbaa &amp; reklam</span>
      </td></tr>
      <tr><td style="padding:28px 28px 4px;font-family:Arial,Helvetica,sans-serif">
        <h1 style="margin:0;font-size:20px;color:${INK};font-weight:700">${title}</h1>
        ${intro ? `<p style="margin:8px 0 0;font-size:13px;color:${MUTED};line-height:1.5">${intro}</p>` : ""}
      </td></tr>
      <tr><td style="padding:16px 28px 8px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${INK};line-height:1.6">
        ${bodyHtml}
      </td></tr>
      ${footnote ? `<tr><td style="padding:0 28px 20px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#a8a29e;line-height:1.5">${footnote}</td></tr>` : ""}
      <tr><td style="background:${INK};padding:20px 28px;font-family:Arial,Helvetica,sans-serif">
        <p style="margin:0;font-size:13px;color:#ffffff;font-weight:700">Markala</p>
        <p style="margin:6px 0 0;font-size:12px;color:#a8a29e;line-height:1.7">
          324 Ajans güvencesiyle online matbaa &amp; reklam ürünleri<br>
          <a href="https://markala.com.tr" style="color:${BRAND};text-decoration:none">markala.com.tr</a>
          &nbsp;·&nbsp; <a href="tel:+905319004102" style="color:#a8a29e;text-decoration:none">0531 900 41 02</a>
          &nbsp;·&nbsp; <a href="mailto:bilgi@markala.com.tr" style="color:#a8a29e;text-decoration:none">bilgi@markala.com.tr</a>
        </p>
      </td></tr>
    </table>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#a8a29e;margin:16px 0 0">Bu e-posta Markala sistemi tarafından otomatik gönderilmiştir.</p>
  </td></tr>
</table>
</body>
</html>`;
}

/** Etiket–değer satırı (bilgi tablosu). value HTML olabilir (escape çağıran tarafta). */
export function emailRow(label: string, valueHtml: string): string {
  return `<tr>
    <td style="padding:7px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top;width:110px">${label}</td>
    <td style="padding:7px 0;color:${INK};font-size:14px;vertical-align:top">${valueHtml}</td>
  </tr>`;
}

/** emailRow'ları saran tablo. */
export function emailTable(rowsHtml: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">${rowsHtml}</table>`;
}

/** Sarı vurgulu CTA butonu (mail-güvenli). */
export function emailButton(text: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0"><tr><td style="background:${BRAND};border-radius:8px">
    <a href="${href}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:${INK};text-decoration:none">${text}</a>
  </td></tr></table>`;
}

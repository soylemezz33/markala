import { NextRequest, NextResponse } from "next/server";
import { getContactTo, isMailConfigured, sendMail } from "@/lib/mailer";
import { renderEmail, emailRow, emailTable } from "@/lib/email-template";
import { verifyTurnstile } from "@/lib/turnstile";

// nodemailer + multipart Node.js API'lerine ihtiyaç duyar — edge runtime'da çalışmaz.
export const runtime = "nodejs";

interface CorporatePayload {
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
  sector?: string;
  annualVolume?: string;
  contactName?: string;
  contactRole?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  turnstileToken?: string;
}

const DOC_MAX_BYTES = 15 * 1024 * 1024;
const DOC_ALLOWED_EXT = new Set(["pdf", "jpg", "jpeg", "png", "webp", "tif", "tiff"]);

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Yüklenen belgeyi doğrula (boyut + uzantı). Hatalıysa kullanıcıya dönecek mesaj döner. */
function validateDoc(f: File | null): string | null {
  if (!f) return null;
  if (f.size > DOC_MAX_BYTES) return "Belge boyutu en fazla 15MB olabilir.";
  const ext = (f.name.split(".").pop() ?? "").toLowerCase();
  if (!DOC_ALLOWED_EXT.has(ext))
    return "Yalnızca PDF, JPG, PNG, WEBP veya TIFF belge yükleyebilirsiniz.";
  return null;
}

/**
 * Kurumsal (B2B) başvuru endpoint.
 * 1) Başvuru (+opsiyonel belgeler) NestJS API'ye multipart olarak iletilir → admin
 *    "Kurumsal Başvurular" listesine "pending" düşer; belgeler güvenli depolamaya alınır.
 * 2) Ayrıca CONTACT_TO adresine e-posta bildirimi gönderilir (best-effort).
 * DB kaydı SMTP'den bağımsızdır; e-posta gitmese bile başvuru panelde görünür.
 */
async function persistApplication(
  refId: string,
  payload: CorporatePayload,
  taxFile: File | null,
  sigFile: File | null,
): Promise<void> {
  const apiBase =
    process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";
  try {
    const fd = new FormData();
    for (const [k, v] of Object.entries(payload)) {
      if (v != null && v !== "") fd.append(k, String(v));
    }
    if (taxFile) fd.append("taxCertificate", taxFile, taxFile.name);
    if (sigFile) fd.append("signatureCircular", sigFile, sigFile.name);
    const res = await fetch(`${apiBase}/api/corporate-applications`, {
      method: "POST",
      body: fd, // undici multipart boundary'yi kendi koyar — Content-Type elle SET ETME
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`[kurumsal-basvuru] DB kaydı başarısız (${refId}): HTTP ${res.status}`);
    }
  } catch (err) {
    console.error(`[kurumsal-basvuru] DB kaydı hatası (${refId}):`, (err as Error).message);
  }
}

export async function POST(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";
  let body: CorporatePayload = {};
  let taxFile: File | null = null;
  let sigFile: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    let fd: FormData;
    try {
      fd = await req.formData();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
    const str = (k: string) => {
      const v = fd.get(k);
      return typeof v === "string" ? v : undefined;
    };
    body = {
      companyName: str("companyName"),
      taxOffice: str("taxOffice"),
      taxNumber: str("taxNumber"),
      sector: str("sector"),
      annualVolume: str("annualVolume"),
      contactName: str("contactName"),
      contactRole: str("contactRole"),
      email: str("email"),
      phone: str("phone"),
      address: str("address"),
      notes: str("notes"),
      turnstileToken: str("turnstileToken"),
    };
    const t = fd.get("taxCertificate");
    if (t instanceof File && t.size > 0) taxFile = t;
    const s = fd.get("signatureCircular");
    if (s instanceof File && s.size > 0) sigFile = s;
  } else {
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
    }
  }

  const {
    companyName,
    taxOffice,
    taxNumber,
    sector,
    annualVolume,
    contactName,
    contactRole,
    email,
    phone,
    address,
    notes,
  } = body;

  if (!companyName || companyName.length < 2) {
    return NextResponse.json({ error: "Firma ünvanı zorunlu." }, { status: 400 });
  }
  if (!taxNumber || taxNumber.length < 9) {
    return NextResponse.json({ error: "Geçerli vergi numarası zorunlu." }, { status: 400 });
  }
  if (!contactName || contactName.length < 2) {
    return NextResponse.json({ error: "Yetkili adı zorunlu." }, { status: 400 });
  }
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Geçerli e-posta zorunlu." }, { status: 400 });
  }
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "Geçerli telefon zorunlu." }, { status: 400 });
  }

  // Bot koruması: Turnstile doğrula (prod fail-closed) → spam persist+mail'den ÖNCE reddedilir.
  const ip =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    undefined;
  if (!(await verifyTurnstile(body.turnstileToken, ip))) {
    return NextResponse.json(
      { error: "Güvenlik doğrulaması başarısız. Sayfayı yenileyip tekrar deneyin." },
      { status: 400 },
    );
  }

  const docError = validateDoc(taxFile) ?? validateDoc(sigFile);
  if (docError) {
    return NextResponse.json({ error: docError }, { status: 400 });
  }

  const refId = `KB-${Date.now().toString(36).toUpperCase()}`;

  // DB'ye yaz (+belgeler) — SMTP durumundan bağımsız, her zaman.
  await persistApplication(
    refId,
    {
      companyName,
      taxOffice,
      taxNumber,
      sector,
      annualVolume,
      contactName,
      contactRole,
      email,
      phone,
      address,
      notes,
    },
    taxFile,
    sigFile,
  );

  const docsSummary =
    [taxFile ? "Vergi levhası" : null, sigFile ? "İmza sirküleri" : null]
      .filter(Boolean)
      .join(", ") || "Yüklenmedi (onay sürecinde talep edilecek)";

  if (!isMailConfigured()) {
    console.log(`[kurumsal-basvuru] yeni başvuru (SMTP devre dışı, mock): refId=${refId}`);
    return NextResponse.json({
      ok: true,
      refId,
      message: "Başvurunuz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.",
    });
  }

  const rows: Array<[string, string]> = [
    ["Firma Ünvanı", companyName],
    ["Vergi Dairesi / No", `${taxOffice || "-"} / ${taxNumber}`],
    ["Sektör", sector || "-"],
    ["Yıllık Hacim", annualVolume || "-"],
    ["Yetkili", `${contactName}${contactRole ? " (" + contactRole + ")" : ""}`],
    ["E-posta", email],
    ["Telefon", phone],
    ["Adres", address || "-"],
    ["Belgeler", docsSummary],
    ["Notlar", notes || "-"],
  ];

  const text = [`Yeni kurumsal başvuru (${refId})`, "", ...rows.map(([k, v]) => `${k}: ${v}`)].join(
    "\n",
  );

  const html = renderEmail({
    title: "Yeni Kurumsal (B2B) Başvuru",
    intro: `Referans: ${escapeHtml(refId)}`,
    preheader: `${escapeHtml(companyName)} — kurumsal hesap başvurusu`,
    bodyHtml: emailTable(rows.map(([k, v]) => emailRow(escapeHtml(k), escapeHtml(v))).join("")),
    footnote:
      "Belgeleri ve başvuruyu admin panelinden (Kurumsal Başvurular) değerlendirebilir; bu mesaja yanıtlayarak başvurana dönüş yapabilirsiniz.",
  });

  try {
    await sendMail({
      to: getContactTo(),
      subject: `Yeni kurumsal başvuru: ${companyName}`,
      text,
      html,
      replyTo: email,
    });
  } catch (err) {
    console.error(`[kurumsal-basvuru] mail gönderilemedi (${refId}):`, (err as Error).message);
    return NextResponse.json(
      {
        error:
          "Şu an başvurunuzu iletemedik, lütfen telefonla ulaşın veya daha sonra tekrar deneyin.",
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    refId,
    message: "Başvurunuz alındı. Satış ekibimiz en kısa sürede dönüş yapacak.",
  });
}

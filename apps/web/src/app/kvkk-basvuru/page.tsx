"use client";

import { useState } from "react";
import Link from "next/link";
import { Container, Button } from "@markala/ui";
import {
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Info,
  Trash,
  PencilSimple,
  DownloadSimple,
  Prohibit,
  Eye,
  Question,
  Scales,
  IdentificationCard,
  Paperclip,
} from "@phosphor-icons/react";
import { PhoneInput } from "@/components/forms/phone-input";

/**
 * TC Kimlik No doğrulama — Türkiye Cumhuriyeti algoritması:
 * - 11 hane, ilk hane 0 olamaz
 * - 10. hane: (tek_pozisyonlar × 7 - çift_pozisyonlar) mod 10
 * - 11. hane: (ilk 10 hanenin toplamı) mod 10
 */
function validateTcKimlik(tc: string): boolean {
  if (!/^\d{11}$/.test(tc)) return false;
  if (tc[0] === "0") return false;
  const d = tc.split("").map(Number);
  // noUncheckedIndexedAccess aktif: regex 11 haneyi garantiler, ?? 0 yalnız tip güvenliği
  const at = (i: number): number => d[i] ?? 0;
  const odd = at(0) + at(2) + at(4) + at(6) + at(8);
  const even = at(1) + at(3) + at(5) + at(7);
  const d10 = ((odd * 7) - even + 100) % 10;
  const d11 = (at(0) + at(1) + at(2) + at(3) + at(4) + at(5) + at(6) + at(7) + at(8) + at(9)) % 10;
  return at(9) === d10 && at(10) === d11;
}

const inputClass =
  "w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus:ring-2 focus:ring-brand-300/30 transition-all";

/**
 * KVKK m.11 — Veri sahibinin sahip olduğu 8 hak:
 *  a) Kişisel veri işlenip işlenmediğini öğrenme
 *  b) İşlenmişse buna ilişkin bilgi talep etme
 *  c) İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme
 *  ç) Yurt içinde veya yurt dışında aktarıldığı 3. kişileri bilme
 *  d) Eksik veya yanlış işlenmiş ise düzeltilmesini isteme
 *  e) Silinmesini veya yok edilmesini isteme
 *  f) Aktarıldığı 3. kişilere bildirilmesini isteme
 *  g) Münhasıran otomatik sistemlerle analiz edilmesi sonucu aleyhe sonuca itiraz
 *  h) Kanuna aykırı işleme nedeniyle zarara uğrarsa tazminat talep etme
 */
const rights = [
  { icon: Info, label: "Verilerimin işlenip işlenmediğini öğrenme", code: "KVKK 11/a" },
  { icon: Eye, label: "İşlenmişse buna ilişkin bilgi talep etme", code: "KVKK 11/b" },
  { icon: Question, label: "İşlenme amacını ve amacına uygun kullanım", code: "KVKK 11/c" },
  { icon: ArrowRight, label: "3. kişi aktarımları hakkında bilgi", code: "KVKK 11/ç" },
  { icon: PencilSimple, label: "Eksik / yanlış işlenmişse düzeltilmesini isteme", code: "KVKK 11/d" },
  { icon: Trash, label: "Silinmesini veya yok edilmesini isteme", code: "KVKK 11/e" },
  { icon: Prohibit, label: "Otomatik karara itiraz etme", code: "KVKK 11/g" },
  { icon: Scales, label: "Zararın giderilmesini talep etme", code: "KVKK 11/h" },
];

const requestTypes = [
  { value: "bilgi", label: "Verilerim hakkında bilgi" },
  { value: "silme", label: "Verilerimin silinmesi" },
  { value: "duzeltme", label: "Verilerimin düzeltilmesi" },
  { value: "tasima", label: "Verilerimin taşınması (export)" },
  { value: "itiraz", label: "Otomatik karara itiraz" },
  { value: "aktarim", label: "3. kişilere aktarım bilgisi" },
  { value: "diger", label: "Diğer" },
];

export default function KvkkBasvuruPage() {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const [form, setForm] = useState({
    fullName: "",
    tcKimlik: "",
    email: "",
    phone: "",
    requestType: "",
    details: "",
  });
  const [consent, setConsent] = useState(false);
  // Honeypot: insanlar tarafından görünmez, botlar doldurur → spam tespiti
  const [honeypot, setHoneypot] = useState("");

  function update<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.fullName.trim().length < 2) {
      setError("Ad soyad zorunlu.");
      return;
    }
    if (!form.email.includes("@")) {
      setError("Geçerli bir e-posta adresi girin.");
      return;
    }
    if (honeypot) return; // sessiz bot reddi
    if (form.tcKimlik && !validateTcKimlik(form.tcKimlik)) {
      setError("TC Kimlik No geçersiz. Lütfen kontrol edin.");
      return;
    }
    if (!form.requestType) {
      setError("Talep türünü seçin.");
      return;
    }
    if (form.details.trim().length < 30) {
      setError("Talep detayı en az 30 karakter olmalı.");
      return;
    }
    if (!consent) {
      setError("KVKK rıza metnini onaylamadan başvuru gönderilemez.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kvkk-basvuru", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, hasIdDocument: Boolean(fileName), _hp: honeypot }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Başvuru gönderilemedi.");
        return;
      }
      setTicketId(data.ticketId ?? null);
      setSent(true);
    } catch {
      setError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
    } finally {
      setSubmitting(false);
    }
  }

  // Schema.org Service (legal/government type)
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "KVKK Veri Sahibi Başvuru Hizmeti",
    serviceType: "Legal",
    provider: {
      "@type": "Organization",
      name: "Markala",
      url: "https://markala.com.tr",
    },
    areaServed: "TR",
    description:
      "6698 sayılı Kişisel Verilerin Korunması Kanunu 11. madde kapsamında veri sahibi başvuru kanalı.",
    audience: { "@type": "Audience", audienceType: "Veri Sahibi" },
    termsOfService: "https://markala.com.tr/yasal/kvkk",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />

      {/* Hero */}
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success/10 text-success text-xs font-semibold uppercase tracking-wider mb-4">
              <ShieldCheck size={14} weight="fill" /> KVKK 6698 — Madde 11
            </div>
            <h1 className="text-3xl md:text-5xl font-semibold text-ink-900 leading-tight">
              KVKK Veri Sahibi Başvuru Formu
            </h1>
            <p className="mt-4 text-lg text-ink-700 leading-relaxed">
              Kişisel verilerinize ilişkin yasal haklarınızı kullanmak için bu formu doldurun.
              Talebiniz <strong className="text-ink-900">en geç 30 gün</strong> içinde
              ücretsiz olarak sonuçlandırılır.
            </p>
          </div>
        </Container>
      </div>

      <Container className="py-12 md:py-16">
        <div className="grid lg:grid-cols-12 gap-10">
          {/* Sol: 8 hak listesi */}
          <aside className="lg:col-span-5">
            <div className="lg:sticky lg:top-24 space-y-4">
              <header>
                <h2 className="text-xl md:text-2xl font-semibold text-ink-900">
                  Yasal haklarınız
                </h2>
                <p className="mt-2 text-sm text-ink-700">
                  6698 sayılı KVKK&apos;nın 11. maddesi gereği veri sahibi olarak sahip olduğunuz haklar:
                </p>
              </header>

              <ul className="space-y-2.5">
                {rights.map((r) => (
                  <li
                    key={r.code}
                    className="flex items-start gap-3 p-3 rounded-lg bg-paper-50 border border-paper-200"
                  >
                    <div className="w-9 h-9 rounded-md bg-paper-100 grid place-items-center text-brand-700 flex-none">
                      <r.icon size={16} weight="bold" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink-900 leading-snug">
                        {r.label}
                      </div>
                      <div className="text-[11px] text-ink-500 font-mono mt-0.5">
                        {r.code}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="p-4 bg-paper-100 border border-paper-200 rounded-xl text-xs text-ink-700 leading-relaxed">
                <strong className="text-ink-900 block mb-1">Önemli</strong>
                Başvuru sahibinin kimliğini doğrulamak için bazı taleplerde
                <strong className="text-ink-900"> resmi kimlik fotokopisi </strong>
                istenebilir. Detaylı bilgi için{" "}
                <Link href="/yasal/kvkk" className="text-brand-700 underline font-medium">
                  KVKK Aydınlatma Metni
                </Link>
                .
              </div>
            </div>
          </aside>

          {/* Sağ: Form */}
          <section className="lg:col-span-7">
            {sent ? (
              <div className="p-10 bg-success/5 border border-success/20 rounded-xl text-center">
                <div className="w-14 h-14 mx-auto rounded-full bg-success/10 grid place-items-center text-success">
                  <CheckCircle size={28} weight="fill" />
                </div>
                <h2 className="mt-4 text-2xl font-semibold text-ink-900">
                  Başvurunuz alındı
                </h2>
                <p className="mt-2 text-ink-700 max-w-md mx-auto">
                  KVKK Veri Sorumlusu&apos;na iletildi. En geç{" "}
                  <strong className="text-ink-900">30 gün</strong> içinde e-posta ile dönüş yapılacaktır.
                </p>
                {ticketId && (
                  <code className="mt-4 inline-block px-3 py-1.5 rounded bg-paper-100 text-xs text-ink-700 font-mono">
                    Başvuru No: {ticketId}
                  </code>
                )}
                <p className="mt-4 text-xs text-ink-500">
                  Başvurunuzu takip etmek için bu numarayı saklayın.
                </p>
                <div className="mt-6">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSent(false);
                      setTicketId(null);
                      setForm({
                        fullName: "",
                        tcKimlik: "",
                        email: "",
                        phone: "",
                        requestType: "",
                        details: "",
                      });
                      setConsent(false);
                      setFileName(null);
                      setHoneypot("");
                    }}
                  >
                    Yeni Başvuru
                  </Button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={onSubmit}
                className="p-6 md:p-8 bg-paper-50 border border-paper-200 rounded-xl space-y-5"
                noValidate
              >
                {/* Honeypot — botlar bu alanı görür ve doldurur, insanlar görmez */}
                <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }}>
                  <label htmlFor="kvkk-confirm-email">E-posta tekrar (boş bırakın)</label>
                  <input
                    id="kvkk-confirm-email"
                    name="confirm_email"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <header className="pb-4 border-b border-paper-200">
                  <h2 className="text-xl md:text-2xl font-semibold text-ink-900">
                    Başvuru Bilgileri
                  </h2>
                  <p className="mt-1 text-sm text-ink-500">
                    Tüm zorunlu alanları doldurun. Talebiniz size ait olduğu doğrulandıktan sonra işleme alınır.
                  </p>
                </header>

                {error && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="px-4 py-3 rounded-lg bg-error/10 border border-error/20 text-error text-sm"
                  >
                    {error}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="kvkk-name" label="Ad Soyad" required>
                    <input
                      id="kvkk-name"
                      className={inputClass}
                      required
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      aria-required="true"
                    />
                  </Field>
                  <Field id="kvkk-tc" label="TC Kimlik No">
                    <div className="relative">
                      <IdentificationCard
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-500 pointer-events-none"
                      />
                      <input
                        id="kvkk-tc"
                        inputMode="numeric"
                        pattern="\d{11}"
                        maxLength={11}
                        placeholder="11 haneli (opsiyonel)"
                        className={`${inputClass} pl-9`}
                        value={form.tcKimlik}
                        onChange={(e) =>
                          update("tcKimlik", e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                  </Field>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <Field id="kvkk-email" label="E-posta" required>
                    <input
                      id="kvkk-email"
                      type="email"
                      className={inputClass}
                      required
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      aria-required="true"
                    />
                  </Field>
                  <PhoneInput
                    value={form.phone}
                    onChange={(v) => update("phone", v)}
                    label="Telefon"
                    inputClassName={inputClass}
                  />
                </div>

                <Field id="kvkk-type" label="Talep Türü" required>
                  <select
                    id="kvkk-type"
                    required
                    className={inputClass}
                    value={form.requestType}
                    onChange={(e) => update("requestType", e.target.value)}
                    aria-required="true"
                  >
                    <option value="">Seçin...</option>
                    {requestTypes.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field id="kvkk-details" label="Talep Detayı" required>
                  <textarea
                    id="kvkk-details"
                    required
                    rows={6}
                    minLength={30}
                    placeholder="Talebinizi açık ve detaylı yazın. Hangi verilerinize, hangi tarihte, hangi gerekçeyle işlem yapılmasını istediğinizi belirtin..."
                    className={`${inputClass} resize-none`}
                    value={form.details}
                    onChange={(e) => update("details", e.target.value)}
                    aria-required="true"
                  />
                  <span className="text-xs text-ink-500 mt-1 block">
                    {form.details.length}/30 (minimum)
                  </span>
                </Field>

                <Field id="kvkk-id" label="Kimlik Belgesi (opsiyonel)">
                  <label
                    htmlFor="kvkk-id-input"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-paper-300 bg-paper-100/40 cursor-pointer hover:bg-paper-100 transition-colors"
                  >
                    <Paperclip size={16} className="text-ink-500" />
                    <span className="text-sm text-ink-700 flex-1">
                      {fileName ?? "Kimlik fotokopisi yükle (PDF / JPG / PNG · max 5 MB)"}
                    </span>
                    {fileName && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setFileName(null);
                        }}
                        className="text-xs text-error font-medium"
                      >
                        Kaldır
                      </button>
                    )}
                  </label>
                  <input
                    id="kvkk-id-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        if (f.size > 5 * 1024 * 1024) {
                          setError("Dosya 5 MB sınırını aşıyor.");
                          return;
                        }
                        setFileName(f.name);
                      }
                    }}
                  />
                  <span className="text-xs text-ink-500 mt-1.5 block">
                    Bazı talepler (silme, düzeltme) için kimlik doğrulaması gerekebilir.
                  </span>
                </Field>

                <label className="flex items-start gap-2 text-xs text-ink-700 pt-2 border-t border-paper-200">
                  <input
                    type="checkbox"
                    required
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5"
                    aria-required="true"
                  />
                  <span className="leading-relaxed">
                    Formda yer alan bilgilerin doğru ve güncel olduğunu, başvuru sahibinin kendim olduğunu beyan ederim.{" "}
                    <Link href="/yasal/kvkk" className="underline hover:text-ink-900">
                      KVKK Aydınlatma Metni
                    </Link>
                    &apos;ni okudum ve başvurumun KVKK 13. madde çerçevesinde işlenmesine açık rıza veriyorum.
                  </span>
                </label>

                <Button
                  type="submit"
                  size="lg"
                  fullWidth
                  disabled={submitting || !consent}
                >
                  {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}{" "}
                  <ArrowRight size={16} weight="bold" />
                </Button>

                <p className="text-xs text-ink-500 text-center">
                  Başvurunuz şifreli kanal üzerinden iletilir. Yanıt süresi: en fazla 30 gün.
                </p>
              </form>
            )}
          </section>
        </div>
      </Container>
    </>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="block">
      <label htmlFor={id} className="text-sm font-medium text-ink-900">
        {label}
        {required && (
          <span className="text-error ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

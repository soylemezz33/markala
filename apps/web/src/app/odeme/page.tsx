"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Button, Price, cn } from "@markala/ui";
import { CreditCard, Check, ArrowRight, User as UserIcon, House, Truck, WhatsappLogo, Phone, Clock, ShieldCheck } from "@phosphor-icons/react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useOrdersStore } from "@/lib/orders-store";
import { generateOrderNumber } from "@/lib/format";
import { whatsappUrl, phoneUrl, MARKALA_PHONE_DISPLAY } from "@/lib/whatsapp";
import { track, trackBeginCheckout, trackPurchase } from "@/lib/analytics";
import type { Address, Order } from "@markala/types";

const SHIPPING_FEE = 79;
const VAT_RATE = 0.20;

type Step = "iletisim" | "fatura" | "teslimat" | "onay";

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const user = useAuthStore((s) => s.user);
  const addOrder = useOrdersStore((s) => s.add);

  const [step, setStep] = useState<Step>("iletisim");

  // Form state
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [accountType, setAccountType] = useState<"individual" | "corporate">("individual");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [tcNo, setTcNo] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [taxOffice, setTaxOffice] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [city, setCity] = useState("İstanbul");
  const [district, setDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedTolerance, setAcceptedTolerance] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [processing, setProcessing] = useState(false);

  const sub = subtotal();
  const shipping = sub >= 1500 ? 0 : sub > 0 ? SHIPPING_FEE : 0;
  const vat = sub * VAT_RATE;
  const total = sub + shipping;

  useEffect(() => {
    if (cartItems.length === 0 && !processing) {
      router.replace("/sepet");
    }
  }, [cartItems.length, processing, router]);

  function canProceed(): boolean {
    if (step === "iletisim") return email.includes("@") && phone.length >= 10;
    if (step === "fatura") {
      if (accountType === "individual") return fullName.length >= 3 && tcNo.length === 11;
      return companyName.length >= 2 && taxNumber.length >= 9 && taxOffice.length >= 2;
    }
    if (step === "teslimat") return city.length >= 2 && district.length >= 2 && fullAddress.length >= 10;
    return true;
  }

  function handleNext() {
    if (!canProceed()) return;
    const order: Step[] = ["iletisim", "fatura", "teslimat", "onay"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      const nextStep = order[idx + 1] ?? step;
      if (nextStep === "onay") {
        trackBeginCheckout(total, cartItems.length);
      }
      setStep(nextStep);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  /** Sipariş özetini WhatsApp mesajına çevirir. */
  function buildWhatsappMessage(orderNumber: string): string {
    const lines: string[] = [];
    lines.push("*Markala — Sipariş Talebi*");
    lines.push(`Sipariş No: ${orderNumber}`);
    lines.push("");
    cartItems.forEach((i) => {
      const lineTotal = i.configuration.totalPrice * i.quantity;
      lines.push(`• ${i.productName} — ${i.configuration.summary} ×${i.quantity} = ${lineTotal.toLocaleString("tr-TR")} ₺`);
      if (i.configuration.needsDesign) lines.push("   (tasarım desteği isteniyor)");
      if (i.configuration.uploadedFileName) lines.push(`   (dosya: ${i.configuration.uploadedFileName})`);
    });
    lines.push("");
    lines.push(`Ara toplam: ${sub.toLocaleString("tr-TR")} ₺`);
    lines.push(`Kargo: ${shipping === 0 ? "Ücretsiz" : shipping.toLocaleString("tr-TR") + " ₺"}`);
    lines.push(`*Toplam: ${total.toLocaleString("tr-TR")} ₺* (KDV dahil)`);
    lines.push("");
    lines.push(`Ad/Firma: ${accountType === "individual" ? fullName : companyName}`);
    lines.push(`Telefon: ${phone}`);
    lines.push(`E-posta: ${email}`);
    if (accountType === "corporate") {
      lines.push(`Vergi: ${taxOffice} / ${taxNumber}`);
    }
    lines.push(`Teslimat: ${fullAddress}, ${district}/${city}${zipCode ? " " + zipCode : ""}`);
    return lines.join("\n");
  }

  function buildOrder(orderNumber: string): Order {
    const address: Address = {
      id: "addr_1",
      label: "Teslimat",
      fullName: accountType === "individual" ? fullName : companyName,
      phone,
      city,
      district,
      fullAddress,
      zipCode,
      isDefault: true,
    };
    return {
      id: `ord_${Date.now().toString(36)}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      status: "siparis-alindi",
      email,
      items: cartItems.map((i) => ({
        productSlug: i.productSlug,
        productName: i.productName,
        productImage: i.productImage,
        configurationSummary: i.configuration.summary,
        unitPrice: i.configuration.totalPrice,
        quantity: i.quantity,
        lineTotal: i.configuration.totalPrice * i.quantity,
      })),
      subtotal: sub,
      shippingFee: shipping,
      discount: 0,
      vat,
      total,
      shippingAddress: address,
      billingAddress: address,
    };
  }

  function handleSubmit(channel: "whatsapp" | "phone") {
    if (!acceptedTerms || !acceptedTolerance || !acceptedKvkk) return;
    setProcessing(true);

    const orderNumber = generateOrderNumber();
    const order = buildOrder(orderNumber);

    // GA4 + Meta — kullanıcı etkileşim anında (popup engellenmesin)
    trackPurchase(orderNumber, total, cartItems.length);
    track("generate_lead", {
      method: channel === "whatsapp" ? "whatsapp_order" : "phone_order",
      currency: "TRY",
      value: total,
      items: cartItems.length,
    });

    // Ekibe sipariş bildirimi (WhatsApp'a EK kayıt kanalı). Best-effort + keepalive:
    // sayfa yönlenirken bile tamamlanır, başarısız olsa da akışı bloke etmez.
    fetch("/api/siparis-bildirim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        orderNumber,
        channel,
        customerName: accountType === "individual" ? fullName : companyName,
        email,
        phone,
        accountType,
        taxOffice,
        taxNumber,
        address: `${fullAddress}, ${district}/${city}${zipCode ? " " + zipCode : ""}`,
        items: cartItems.map((i) => ({
          name: i.productName,
          summary: i.configuration.summary,
          quantity: i.quantity,
          lineTotal: i.configuration.totalPrice * i.quantity,
          needsDesign: i.configuration.needsDesign,
          uploadedFileName: i.configuration.uploadedFileName,
        })),
        subtotal: sub,
        shipping,
        total,
      }),
    }).catch(() => {});

    if (channel === "whatsapp") {
      // Senkron aç — popup engelini önler
      window.open(whatsappUrl(buildWhatsappMessage(orderNumber)), "_blank", "noopener,noreferrer");
    } else {
      window.location.href = phoneUrl();
    }

    addOrder(order);
    clearCart();
    router.replace(`/odeme/basarili/${order.id}`);
  }

  if (cartItems.length === 0 && !processing) return null;

  const consentOk = acceptedTerms && acceptedTolerance && acceptedKvkk;

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-10">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Sipariş Talebi</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">Siparişini tamamla</h1>
          <p className="mt-2 text-ink-500 text-sm">WhatsApp veya telefonla hızlı sipariş · KDV dahil fiyatlar</p>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <Stepper step={step} />

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <Section
          id="iletisim"
            title="İletişim Bilgileri"
            icon={<UserIcon size={18} />}
            isActive={step === "iletisim"}
            isComplete={["fatura", "teslimat", "onay"].includes(step)}
            onEdit={() => setStep("iletisim")}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="E-posta" value={email} onChange={setEmail} type="email" placeholder="ornek@firma.com" />
              <Input label="Telefon" value={phone} onChange={setPhone} type="tel" placeholder="0532 ..." />
            </div>
            {!user && (
              <p className="mt-3 text-xs text-ink-500">
                Üye değil misiniz? Misafir olarak devam edin veya{" "}
                <Link href="/giris" className="text-brand-700 hover:underline">giriş yapın</Link>.
              </p>
            )}
          </Section>

          <Section
          id="fatura"
            title="Fatura Bilgileri"
            icon={<CreditCard size={18} />}
            isActive={step === "fatura"}
            isComplete={["teslimat", "onay"].includes(step)}
            onEdit={() => setStep("fatura")}
            disabled={step === "iletisim"}
          >
            <div className="inline-flex p-1 bg-paper-100 rounded mb-4">
              <button
          onClick={() => setAccountType("individual")}
                className={cn(
                  "px-4 py-1.5 text-sm rounded transition-colors",
                  accountType === "individual" ? "bg-paper-50 shadow-sm font-medium" : "text-ink-500",
                )}
              >
                Bireysel
              </button>
              <button
          onClick={() => setAccountType("corporate")}
                className={cn(
                  "px-4 py-1.5 text-sm rounded transition-colors",
                  accountType === "corporate" ? "bg-paper-50 shadow-sm font-medium" : "text-ink-500",
                )}
              >
                Kurumsal
              </button>
            </div>
            {accountType === "individual" ? (
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Ad Soyad" value={fullName} onChange={setFullName} />
                <Input label="T.C. Kimlik No" value={tcNo} onChange={setTcNo} maxLength={11} />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Input label="Firma Ünvanı" value={companyName} onChange={setCompanyName} className="sm:col-span-2" />
                <Input label="Vergi Dairesi" value={taxOffice} onChange={setTaxOffice} />
                <Input label="Vergi No" value={taxNumber} onChange={setTaxNumber} maxLength={11} />
              </div>
            )}
          </Section>

          <Section
          id="teslimat"
            title="Teslimat Adresi"
            icon={<House size={18} />}
            isActive={step === "teslimat"}
            isComplete={step === "onay"}
            onEdit={() => setStep("teslimat")}
            disabled={step === "iletisim" || step === "fatura"}
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="İl" value={city} onChange={setCity} />
              <Input label="İlçe" value={district} onChange={setDistrict} />
              <Input
          label="Adres"
                value={fullAddress}
                onChange={setFullAddress}
                placeholder="Mahalle, sokak, bina no, daire"
                className="sm:col-span-2"
                multiline
              />
              <Input label="Posta Kodu (opsiyonel)" value={zipCode} onChange={setZipCode} />
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-ink-700">
              <input
          type="checkbox"
                checked={billingSameAsShipping}
                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                className="rounded border-paper-200"
              />
              Fatura adresi teslimat adresiyle aynı
            </label>
          </Section>

          <Section
          id="onay"
            title="Onay & Sipariş"
            icon={<WhatsappLogo size={18} />}
            isActive={step === "onay"}
            isComplete={false}
            onEdit={() => setStep("onay")}
            disabled={step !== "onay"}
          >
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 text-sm text-ink-700">
                Siparişini <strong>WhatsApp</strong> veya <strong>telefon</strong> üzerinden tamamlıyoruz. Butona
                bastığında sipariş özetin WhatsApp'a aktarılır; ekibimiz ödeme (havale/EFT veya kapıda) ve üretim
                detaylarını seninle netleştirir. Kart bilgisi istemiyoruz.
              </div>

              <div className="space-y-3 pt-1">
                <label className="flex items-start gap-2 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="rounded border-paper-200 mt-0.5"
                  />
                  <span>
                    <Link href="/yasal/mesafeli-satis" className="underline hover:text-ink-900">Mesafeli Satış Sözleşmesi</Link> ve{" "}
                    <Link href="/yasal/on-bilgilendirme" className="underline hover:text-ink-900">Ön Bilgilendirme Formu</Link>'nu okudum, kabul ediyorum.
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs text-ink-700">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedTolerance}
                    onChange={(e) => setAcceptedTolerance(e.target.checked)}
                    className="rounded border-paper-200 mt-0.5"
                  />
                  <span>
                    <strong>Üretim toleransı (%1-5 fire)</strong> sektör standardını ve renk profili (CMYK)
                    nedeniyle ekran-baskı farkı olabileceğini kabul ediyorum.{" "}
                    <Link href="/yasal/mesafeli-satis" className="underline hover:text-ink-900">Detay</Link>
                  </span>
                </label>

                <label className="flex items-start gap-2 text-xs text-ink-700">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedKvkk}
                    onChange={(e) => setAcceptedKvkk(e.target.checked)}
                    className="rounded border-paper-200 mt-0.5"
                  />
                  <span>
                    <Link href="/yasal/kvkk" className="underline hover:text-ink-900">KVKK aydınlatma metnini</Link> okudum,
                    sipariş ve faturalama amacıyla kişisel verilerimin işlenmesine onay veriyorum.
                  </span>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <Button
                  size="lg"
                  fullWidth
                  onClick={() => handleSubmit("whatsapp")}
                  disabled={!consentOk || processing}
                  className="bg-[#25D366] hover:bg-[#1FB358] text-white"
                >
                  <WhatsappLogo size={20} weight="fill" /> WhatsApp ile Siparişi Tamamla
                </Button>
                <Button
                  size="lg"
                  fullWidth
                  variant="outline"
                  onClick={() => handleSubmit("phone")}
                  disabled={!consentOk || processing}
                >
                  <Phone size={18} weight="fill" /> Telefonla Sipariş — {MARKALA_PHONE_DISPLAY}
                </Button>
              </div>
              {!consentOk && (
                <p className="text-xs text-ink-500">Devam etmek için sözleşmeleri onaylayın.</p>
              )}
            </div>
          </Section>

          {step !== "onay" && (
            <div className="flex justify-end pt-4">
              <Button size="lg" onClick={handleNext} disabled={!canProceed()}>
                Devam Et <ArrowRight size={18} weight="bold" />
              </Button>
            </div>
          )}
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-24 space-y-4">
            <div className="p-5 bg-paper-50 border border-paper-200 rounded-lg">
              <h2 className="font-medium text-ink-900 mb-4">Sipariş Özeti</h2>
              <ul className="space-y-3 max-h-72 overflow-y-auto">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative w-14 h-14 rounded bg-paper-100 overflow-hidden flex-none">
                      <Image src={item.productImage} alt={item.productName} fill unoptimized
              sizes="56px" className="object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink-900 line-clamp-1">{item.productName}</p>
                      <p className="text-xs text-ink-500 line-clamp-1">{item.configuration.summary}</p>
                      <div className="mt-1 flex items-center justify-between text-xs">
                        <span className="text-ink-500">x{item.quantity}</span>
                        <Price amount={item.configuration.totalPrice * item.quantity} size="sm" className="text-ink-900" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-4 pt-4 border-t border-paper-200 space-y-2 text-sm">
                <Row label="Ara toplam" value={<Price amount={sub} className="text-ink-900" />} />
                <Row label="Kargo" value={shipping === 0 ? <span className="text-success font-medium">Ücretsiz</span> : <Price amount={shipping} />} />
                <Row label="KDV (%20)" value={<Price amount={vat} className="text-ink-500" />} muted />
                <div className="pt-3 border-t border-paper-200 flex items-baseline justify-between">
                  <span className="font-medium text-ink-900">Toplam</span>
                  <Price amount={total} size="lg" className="text-ink-900" />
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-3 gap-2 text-xs text-ink-500">
              <Trust icon={<Clock size={18} />} label="1-2 iş günü üretim" />
              <Trust icon={<Truck size={18} />} label="81 il kargo" />
              <Trust icon={<ShieldCheck size={18} />} label="KVKK uyumlu" />
            </ul>
          </div>
        </aside>
      </div>
      </Container>
    </>
  );
}

function Stepper({ step }: { step: Step }) {
  const steps: { id: Step; label: string }[] = [
    { id: "iletisim", label: "İletişim" },
    { id: "fatura", label: "Fatura" },
    { id: "teslimat", label: "Teslimat" },
    { id: "onay", label: "Onay" },
  ];
  const current = steps.findIndex((s) => s.id === step);

  return (
    <nav aria-label="Sipariş adımları" className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm">
      {steps.map((s, i) => {
        const isDone = i < current;
        const isActive = i === current;
        return (
          <div key={s.id} className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2">
              <span
          className={cn(
                  "w-7 h-7 rounded-full grid place-items-center font-medium text-xs",
                  isDone && "bg-success text-paper-50",
                  isActive && "bg-ink-900 text-paper-50",
                  !isDone && !isActive && "bg-paper-100 text-ink-500",
                )}
              >
                {isDone ? <Check size={14} weight="bold" /> : i + 1}
              </span>
              <span className={cn("hidden sm:inline", isActive ? "font-medium text-ink-900" : "text-ink-500")}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && <span className="w-8 md:w-12 h-px bg-paper-200" />}
          </div>
        );
      })}
    </nav>
  );
}

function Section({
  id,
  title,
  icon,
  isActive,
  isComplete,
  disabled,
  onEdit,
  children,
}: {
  id: Step;
  title: string;
  icon: React.ReactNode;
  isActive: boolean;
  isComplete: boolean;
  disabled?: boolean;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "p-5 md:p-6 rounded-lg border bg-paper-50 transition-all",
        isActive ? "border-ink-900" : "border-paper-200",
        disabled && "opacity-60",
      )}
    >
      <header className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 font-medium text-ink-900">
          <span className="text-ink-700">{icon}</span> {title}
        </h2>
        {isComplete && (
          <button onClick={onEdit} className="text-xs text-brand-700 hover:underline">
            Düzenle
          </button>
        )}
      </header>
      {(isActive || isComplete) && children}
    </section>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  className,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  multiline?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-medium text-ink-900">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="mt-1.5 w-full px-3 py-2 rounded border border-paper-200 text-sm focus:border-ink-900 focus:outline-none resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="mt-1.5 w-full px-3 py-2.5 rounded border border-paper-200 text-sm focus:border-ink-900 focus:outline-none"
        />
      )}
    </label>
  );
}

function Row({ label, value, muted }: { label: React.ReactNode; value: React.ReactNode; muted?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between ${muted ? "text-ink-500" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Trust({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center gap-1 p-3 bg-paper-50 border border-paper-200 rounded text-center">
      <span className="text-ink-700">{icon}</span>
      <span>{label}</span>
    </li>
  );
}

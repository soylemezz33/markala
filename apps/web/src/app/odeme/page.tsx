"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Button, Price, cn } from "@markala/ui";
import { ShieldCheck, CreditCard, Lock, Check, ArrowRight, User as UserIcon, House, Truck } from "@phosphor-icons/react";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useOrdersStore } from "@/lib/orders-store";
import { generateOrderNumber } from "@/lib/format";
import type { Address, Order } from "@markala/types";

const SHIPPING_FEE = 79;
const VAT_RATE = 0.20;

type Step = "iletisim" | "fatura" | "teslimat" | "odeme";

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
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [installments, setInstallments] = useState(1);
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
    const order: Step[] = ["iletisim", "fatura", "teslimat", "odeme"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      setStep(order[idx + 1] ?? step);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePay() {
    if (!acceptedTerms || !acceptedTolerance || !acceptedKvkk) return;
    if (cardNumber.length < 16 || cardCvv.length < 3) return;
    setProcessing(true);

    // Mock 3D secure latency
    setTimeout(() => {
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

      const order: Order = {
        id: `ord_${Date.now().toString(36)}`,
        orderNumber: generateOrderNumber(),
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

      addOrder(order);
      clearCart();
      router.replace(`/odeme/basarili/${order.id}`);
    }, 1800);
  }

  if (cartItems.length === 0 && !processing) return null;

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-10">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">Çıkış</p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">Siparişi tamamla</h1>
          <p className="mt-2 text-ink-500 text-sm">3D Secure güvenli ödeme · KDV dahil fiyatlar</p>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <Stepper step={step} />

      <div className="mt-8 grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-4">
          <Section
          id="iletisim"
            title="İletişim Bilgileri"
            icon={<UserIcon size={18} />}
            isActive={step === "iletisim"}
            isComplete={["fatura", "teslimat", "odeme"].includes(step)}
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
            isComplete={["teslimat", "odeme"].includes(step)}
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
            isComplete={step === "odeme"}
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
          id="odeme"
            title="Ödeme"
            icon={<Lock size={18} />}
            isActive={step === "odeme"}
            isComplete={false}
            onEdit={() => setStep("odeme")}
            disabled={step !== "odeme"}
          >
            <div className="space-y-3">
              <Input
          label="Kart Numarası"
                value={cardNumber}
                onChange={(v) => setCardNumber(v.replace(/\D/g, "").slice(0, 16))}
                placeholder="•••• •••• •••• ••••"
                maxLength={16}
              />
              <Input label="Kart Üzerindeki İsim" value={cardName} onChange={setCardName} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Son Kullanım" value={cardExpiry} onChange={setCardExpiry} placeholder="AA/YY" maxLength={5} />
                <Input label="CVV" value={cardCvv} onChange={(v) => setCardCvv(v.replace(/\D/g, "").slice(0, 4))} maxLength={4} type="password" />
              </div>

              <div>
                <label className="text-sm font-medium text-ink-900">Taksit</label>
                <select
          value={installments}
                  onChange={(e) => setInstallments(parseInt(e.target.value))}
                  className="mt-1.5 w-full px-3 py-2.5 rounded border border-paper-200 text-sm bg-paper-50 focus:border-ink-900 focus:outline-none"
                >
                  <option value={1}>Tek Çekim — <Pricing amount={total} /></option>
                  <option value={3}>3 Taksit — <Pricing amount={total / 3} />/ay</option>
                  <option value={6}>6 Taksit — <Pricing amount={total / 6} />/ay</option>
                  <option value={9}>9 Taksit — <Pricing amount={total / 9} />/ay</option>
                </select>
              </div>

              <div className="mt-4 pt-4 border-t border-paper-200 space-y-3">
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
            </div>
          </Section>

          <div className="flex justify-end pt-4">
            {step !== "odeme" ? (
              <Button size="lg" onClick={handleNext} disabled={!canProceed()}>
                Devam Et <ArrowRight size={18} weight="bold" />
              </Button>
            ) : (
              <Button size="lg" onClick={handlePay} disabled={!acceptedTerms || !acceptedTolerance || !acceptedKvkk || cardNumber.length < 16 || processing}>
                {processing ? "İşleniyor..." : (
                  <>
                    <Lock size={18} weight="bold" /> {`${total.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺ Öde`}
                  </>
                )}
              </Button>
            )}
          </div>
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
              <Trust icon={<ShieldCheck size={18} />} label="3D Secure" />
              <Trust icon={<CreditCard size={18} />} label="iyzico" />
              <Trust icon={<Lock size={18} />} label="SSL" />
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
    { id: "odeme", label: "Ödeme" },
  ];
  const current = steps.findIndex((s) => s.id === step);

  return (
    <nav aria-label="Ödeme adımları" className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm">
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
    <li className="flex flex-col items-center gap-1 p-3 bg-paper-50 border border-paper-200 rounded">
      <span className="text-ink-700">{icon}</span>
      <span>{label}</span>
    </li>
  );
}

function Pricing({ amount }: { amount: number }) {
  return <>{amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })} ₺</>;
}

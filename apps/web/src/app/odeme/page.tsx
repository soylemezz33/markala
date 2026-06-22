"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Container, Button, Price, cn } from "@markala/ui";
import {
  CreditCard,
  Check,
  ArrowRight,
  User as UserIcon,
  House,
  Truck,
  WhatsappLogo,
  Lock,
  Clock,
  ShieldCheck,
  Buildings,
  Wallet,
} from "@phosphor-icons/react";
import { IlIlceSelect } from "@/components/forms/il-ilce-select";
import { PhoneInput } from "@/components/forms/phone-input";
import { useCartStore } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useOrdersStore } from "@/lib/orders-store";
import { apiClient, withRefresh } from "@/lib/api";
import { generateOrderNumber } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { track, trackBeginCheckout } from "@/lib/analytics";
import { track as trackVisitor } from "@/lib/visitor-analytics";
import type { Address, Order } from "@markala/types";

const SHIPPING_FEE = 79;
/** Ara toplam bu tutarın üstündeyse kargo ücretsiz (backend ile aynı). */
const FREE_SHIPPING_THRESHOLD = 750;
const VAT_RATE = 0.2;
/** Gösterilen tahmini indirim; gerçek indirim sipariş oluşturulurken sunucuda hesaplanıp tahsil edilir. */
const KNOWN_COUPONS: Record<string, number> = { HOSGELDIN: 0.1 };

type Step = "iletisim" | "fatura" | "teslimat" | "onay";

export default function CheckoutPage() {
  const router = useRouter();
  const cartItems = useCartStore((s) => s.items);
  const subtotal = useCartStore((s) => s.subtotal);
  const clearCart = useCartStore((s) => s.clear);
  const couponCode = useCartStore((s) => s.couponCode);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const user = useAuthStore((s) => s.user);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
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
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedTolerance, setAcceptedTolerance] = useState(false);
  const [acceptedKvkk, setAcceptedKvkk] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  // Backend'den doğrulanmış kupon (gerçek indirim) — client tahmini (KNOWN_COUPONS) yerine.
  const [couponInfo, setCouponInfo] = useState<{
    code: string;
    discount: number;
    freeShipping: boolean;
  } | null>(null);
  // Ödeme yolu seçimi — kart (iyzico) veya cari (açık hesap). Cari yalnız kurumsal üyeye sunulur;
  // "approved" şartını backend doğrular (uygun değilse anlaşılır hata döner, payError'da gösterilir).
  const [paymentMethod, setPaymentMethod] = useState<"iyzico" | "cari">("iyzico");
  // Kullanıcının hesabında kayıtlı adresleri — giriş yapmışsa çekilir, seçilebilir + varsayılan otomatik dolar.
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Kupon ANINDA backend'de doğrulanır → gerçek geçerlilik (tarih/min-tutar/ilk-sipariş/limit)
  // + gerçek indirim tutarı. Tüm DB kuponları çalışır (yalnız HOSGELDIN değil); geçersizde
  // net sebep gösterilir. Backend hata verirse KNOWN_COUPONS ile zarif fallback.
  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError(null);
    if (!code || sub <= 0) return;
    setCouponChecking(true);
    try {
      const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(
        /\/$/,
        "",
      );
      const res = await fetch(`${apiBase}/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal: sub, email: email || undefined }),
      });
      const data = await res.json().catch(() => null);
      if (data && data.valid) {
        setCouponInfo({
          code: data.code,
          discount: Number(data.discount) || 0,
          freeShipping: Boolean(data.freeShipping),
        });
        setCoupon(code);
        setCouponInput("");
      } else if (data && data.reason) {
        setCouponInfo(null);
        setCouponError(data.reason);
      } else {
        // Backend ulaşılamadı → bilinen kupon için zarif fallback (gerçek indirim siparişte kesinleşir).
        if (KNOWN_COUPONS[code]) {
          setCoupon(code);
          setCouponInput("");
        } else setCouponError("Kupon şu an kontrol edilemedi, lütfen tekrar deneyin.");
      }
    } catch {
      if (KNOWN_COUPONS[code]) {
        setCoupon(code);
        setCouponInput("");
      } else setCouponError("Kupon şu an kontrol edilemedi, lütfen tekrar deneyin.");
    } finally {
      setCouponChecking(false);
    }
  }

  /**
   * Kayıtlı bir adresi forma uygula — teslimat (il/ilçe/adres/posta) + telefon, ve adres
   * faturalama tipi taşıyorsa (kurumsal/bireysel) fatura alanlarını da doldurur. Hem manuel
   * seçimde hem de mount'ta varsayılan adres için kullanılır.
   */
  function applyAddress(a: Address) {
    setSelectedAddressId(a.id);
    setCity(a.city);
    setDistrict(a.district);
    setFullAddress(a.fullAddress);
    setZipCode(a.zipCode ?? "");
    if (a.phone) setPhone(a.phone);
    if (a.type === "corporate") {
      setAccountType("corporate");
      if (a.companyName) setCompanyName(a.companyName);
      if (a.taxOffice) setTaxOffice(a.taxOffice);
      if (a.taxNumber) setTaxNumber(a.taxNumber);
    } else if (a.fullName) {
      setFullName(a.fullName);
    }
  }

  // Onaylı kurumsal müşteri SADECE açık hesap (cari) ile sipariş verir — kart seçeneği gösterilmez.
  // Bireysel ve onaysız kurumsal → kart (iyzico). corporateStatus /auth/me'den gelir; backend de
  // cari'yi "approved kurumsal + kredi limiti" ile ayrıca zorlar.
  const isApprovedCorporate = Boolean(
    user && user.accountType === "corporate" && user.corporateStatus === "approved",
  );

  const sub = subtotal();
  // İndirim önceliği: backend-doğrulanmış couponInfo (gerçek tutar) → yoksa KNOWN_COUPONS tahmini
  // (sayfa yenilenince couponInfo local state kaybolur ama couponCode store'da kalır; gerçek
  // indirim her hâlükârda siparişte backend'de yeniden hesaplanıp tahsil edilir).
  const backendCoupon = couponInfo && couponInfo.code === couponCode ? couponInfo : null;
  const appliedCoupon =
    couponCode && (backendCoupon || KNOWN_COUPONS[couponCode]) ? couponCode : null;
  const discount = backendCoupon
    ? backendCoupon.discount
    : appliedCoupon
      ? sub * (KNOWN_COUPONS[appliedCoupon] ?? 0)
      : 0;
  // Kurumsal oransal indirim — yalnız GİRİŞ YAPMIŞ + onaylı kurumsal üyeye gösterilir/uygulanır.
  // Backend ile aynı formül (subtotal × yüzde); gerçek indirim siparişte yine sunucuda kesinleşir,
  // bu yalnızca önizleme. "approved" değilse 0 → indirim hiç uygulanmaz (sipariş tarafıyla tutarlı).
  const corpPct =
    user && user.accountType === "corporate" && user.corporateStatus === "approved"
      ? Number(user.corporateDiscount ?? 0) || 0
      : 0;
  const corpDiscount = corpPct > 0 ? Math.round(sub * corpPct) / 100 : 0;
  const subAfterDiscount = Math.max(0, sub - discount - corpDiscount);
  // Kargo eşiği İNDİRİM ÖNCESİ ara toplama göre — sepet ekranı VE backend ile birebir aynı
  // (aksi halde kuponlu siparişte sepet "ücretsiz" derken ödeme 79₺ ekleyebiliyordu).
  // free_shipping kuponu (backend doğruladıysa) kargoyu sıfırlar.
  const shipping =
    backendCoupon?.freeShipping || sub >= FREE_SHIPPING_THRESHOLD ? 0 : sub > 0 ? SHIPPING_FEE : 0;
  const vat = subAfterDiscount - subAfterDiscount / (1 + VAT_RATE); // KDV DAHİL fiyat → içindeki KDV payı (üstüne eklenmez)
  const total = subAfterDiscount + shipping;

  useEffect(() => {
    if (cartItems.length === 0 && !processing) {
      router.replace("/sepet");
    }
  }, [cartItems.length, processing, router]);

  // Sipariş GİRİŞ ZORUNLU — misafir checkout kapatıldı (14ef581: HOSGELDIN istismarı + her
  // siparişin hesaba bağlanması). Bootstrap (refresh) bitene kadar bekle (kalıcı user anında
  // gelir; oturum gerçekten yoksa user null kalır) → /giris'e yönlendir, giriş sonrası dön.
  // Sepet Zustand persist ile korunur.
  useEffect(() => {
    if (!isBootstrapping && !user && !processing) {
      router.replace(`/giris?next=${encodeURIComponent("/odeme")}`);
    }
  }, [isBootstrapping, user, processing, router]);

  // Ödeme yolu hesap tipine göre SABİTLENİR: onaylı kurumsal → cari, diğer herkes → kart.
  // (Seçim kutusu yok; kurumsal=sadece cari, bireysel=sadece kart.)
  useEffect(() => {
    setPaymentMethod(isApprovedCorporate ? "cari" : "iyzico");
  }, [isApprovedCorporate]);

  // begin_checkout: checkout sayfasına ilk girildiğinde ateşlenir (GA4 spec gereği),
  // son adımda değil. Effect mount'ta bir kez çalışır.
  useEffect(() => {
    trackBeginCheckout(total, cartItems.length);
    // Birinci-parti izleme (consent yoksa no-op; SSR güvenli)
    trackVisitor("begin_checkout", { type: "begin_checkout", value: total });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // sadece mount'ta — dependency array boş bırakılması kasıtlı

  // Profil bilgilerinden otomatik doldur: iletişim (alan BOŞSA — auth bootstrap mount'tan sonra
  // gelirse useState init'i kaçırabilir) + fatura (profilde firma bilgisi varsa "Kurumsal" + doldur).
  // Kayıtlı kurumsal adres sonradan (async) gelirse onun fatura bilgisi daha özeldir, bunu geçer.
  useEffect(() => {
    if (!user) return;
    setEmail((v) => v || user.email || "");
    setPhone((v) => v || user.phone || "");
    setFullName((v) => v || user.fullName || "");
    if (user.companyName) {
      setAccountType("corporate");
      setCompanyName((v) => v || user.companyName || "");
      setTaxOffice((v) => v || user.taxOffice || "");
      setTaxNumber((v) => v || user.taxNumber || "");
    }
  }, [user]);

  // Giriş yapmış kullanıcının kayıtlı adreslerini çek; varsa varsayılanı (yoksa ilkini)
  // otomatik forma uygula (Hasan: "adres seçebilsin, otomatik adres gelsin").
  useEffect(() => {
    if (!user) return;
    let active = true;
    withRefresh(() => apiClient.users.listAddresses())
      .then((addrs) => {
        if (!active || !addrs?.length) return;
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) applyAddress(def);
      })
      .catch(() => {
        /* adres çekilemezse manuel giriş akışı bozulmadan devam eder */
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  function canProceed(): boolean {
    if (step === "iletisim") return email.includes("@") && phone.length >= 10;
    if (step === "fatura") {
      if (accountType === "individual") return fullName.length >= 3 && tcNo.length === 11;
      return companyName.length >= 2 && taxNumber.length >= 9 && taxOffice.length >= 2;
    }
    if (step === "teslimat")
      return city.length >= 2 && district.length >= 2 && fullAddress.length >= 10;
    return true;
  }

  function handleNext() {
    if (!canProceed()) return;
    const order: Step[] = ["iletisim", "fatura", "teslimat", "onay"];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) {
      const next = order[idx + 1] ?? step;
      setStep(next);
      // Sayfayı en tepeye (hero'ya) FIRLATMA — yeni adım bölümünü yumuşakça görünür yap.
      // Önceki window.scrollTo({top:0}) uzun formda "yukarı atıyor" hissi veriyordu.
      requestAnimationFrame(() =>
        document.getElementById(next)?.scrollIntoView({ behavior: "smooth", block: "start" }),
      );
    }
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
      discount,
      vat,
      total,
      shippingAddress: address,
      billingAddress: address,
    };
  }

  /**
   * Siparişi KALICI olarak backend DB'ye yazar → orderId döner (fiyat sunucuda yeniden hesaplanır).
   * Giriş yapmışsa access token iletilir → sipariş HESABA bağlanır (siparişlerim'de görünür).
   * `paymentMethod`: "cari" gönderilirse backend onaylı kurumsal + kredi limiti şartını zorlar.
   * Başarısızsa { ok:false, error } döner; çağıran payError gösterir.
   */
  async function saveOrder(opts: { channel: string; paymentMethod?: "iyzico" | "cari" }): Promise<{
    ok?: boolean;
    orderId?: string;
    orderNumber?: string;
    paymentNonce?: string;
    error?: string;
  } | null> {
    // Oturum açıksa siparişi yazmadan ÖNCE token'ı tazele — 15dk access token checkout sırasında
    // dolmuş olabilir; bayat token authed çağrıyı 401'e düşürür ve proxy siparişi sessizce MİSAFİR
    // yapar (→ kurumsal indirim + cari uygulanmaz). Oturumsuz misafirde mevcut davranış korunur.
    const token = user
      ? await useAuthStore.getState().ensureFreshToken()
      : useAuthStore.getState().accessToken;
    // 20sn timeout — yanıt gelmezse isteği iptal et; kullanıcıyı belirsiz "Yönlendiriliyor…"
    // ekranında sonsuz bırakma. Sunucu fiyatı yeniden hesaplar, 20sn makul üst sınır.
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch("/api/siparis-kaydet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          email,
          phone,
          customerName: accountType === "individual" ? fullName : companyName,
          city,
          district,
          fullAddress,
          zipCode,
          channel: opts.channel,
          accountType,
          taxOffice,
          taxNumber,
          couponCode: appliedCoupon ?? undefined,
          paymentMethod: opts.paymentMethod,
          items: cartItems.map((i) => ({
            productSlug: i.productSlug,
            configuration: i.configuration,
            quantity: i.quantity,
          })),
        }),
        signal: ctrl.signal,
      });
      return (await res.json()) as {
        ok?: boolean;
        orderId?: string;
        orderNumber?: string;
        paymentNonce?: string;
        error?: string;
      };
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") {
        return {
          ok: false,
          error: "Bağlantı zaman aşımı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
        };
      }
      return { ok: false, error: "Sunucuya ulaşılamadı. Lütfen tekrar deneyin." };
    } finally {
      window.clearTimeout(timer);
    }
  }

  /**
   * Kredi/banka kartı ile öde: (1) siparişi backend'e kalıcı yaz (sunucu fiyatı yeniden
   * hesaplar), (2) iyzico Checkout Form başlat, (3) iyzico hosted ödeme sayfasına yönlen.
   * Kart bilgisi iyzico'da girilir — bizim sitemize girilmez (PCI kapsamı dışı, 3D Secure).
   * Ödeme sonucu iyzico → backend callback → /odeme/basarili veya /odeme/hata.
   */
  async function handlePayWithCard() {
    if (!consentOk || processing) return;
    setPayError(null);
    setProcessing(true);

    // GA4 — kullanıcı ödeme adımına geçti (purchase başarı sayfasında ateşlenir)
    track("add_payment_info", {
      currency: "TRY",
      value: total,
      items: cartItems.length,
      payment_type: "credit_card",
    });

    try {
      // 1) Siparişi KALICI olarak backend DB'ye yaz → orderId al
      const saveRes = await saveOrder({ channel: "kart", paymentMethod: "iyzico" });

      if (!saveRes?.ok || !saveRes.orderId) {
        setProcessing(false);
        setPayError(
          saveRes?.error
            ? `Sipariş oluşturulamadı: ${saveRes.error}`
            : "Sipariş oluşturulamadı. Lütfen bilgileri kontrol edip tekrar deneyin.",
        );
        return;
      }

      // Başarı sayfası store'dan okusun diye siparişi backend id'siyle ekle. Sepet ödeme
      // BAŞARILI olunca (başarı sayfasında) temizlenir — başarısızlıkta sepet korunur.
      const order = buildOrder(saveRes.orderNumber ?? generateOrderNumber());
      order.id = saveRes.orderId;
      addOrder(order);

      // 2) iyzico ödemesini başlat → hosted ödeme sayfasına yönlen
      // paymentNonce: sipariş yanıtında gelir, ödeme başlatma IDOR korumasında zorunlu.
      const payRes = await fetch("/api/odeme-baslat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: saveRes.orderId,
          paymentNonce: saveRes.paymentNonce,
          identityNumber: accountType === "individual" ? tcNo : undefined,
        }),
      })
        .then((r) => r.json())
        .catch(() => null);

      if (payRes?.ok && payRes.paymentPageUrl) {
        // Sipariş oluştu + ödeme başlatıldı → sepeti boşalt. Ödeme tamamlanmazsa müşteri
        // "Siparişlerim → Ödeme Yap" ile devam eder (sipariş "Ödeme Bekliyor" olarak durur).
        clearCart();
        window.location.href = payRes.paymentPageUrl; // iyzico'ya yönlendiriliyor
        return;
      }

      setProcessing(false);
      setPayError(
        payRes?.error
          ? `Ödeme başlatılamadı: ${payRes.error}`
          : "Ödeme başlatılamadı. Lütfen birkaç dakika sonra tekrar deneyin.",
      );
    } catch {
      setProcessing(false);
      setPayError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  /**
   * Açık hesaba yaz (cari): kurumsal müşteri ödemeyi anında yapmaz; tutar cari hesabına
   * borç olarak işlenir (vade backend'deki corporatePaymentTermDays'e göre). Online ödeme yok.
   * Backend "approved kurumsal + kredi limiti" şartını doğrular; uygun değilse 400 + mesaj döner.
   */
  async function handlePlaceOnAccount() {
    if (!consentOk || processing || !isApprovedCorporate) return;
    setPayError(null);
    setProcessing(true);

    try {
      const saveRes = await saveOrder({ channel: "cari", paymentMethod: "cari" });

      if (!saveRes?.ok || !saveRes.orderId) {
        setProcessing(false);
        setPayError(
          saveRes?.error
            ? `Sipariş oluşturulamadı: ${saveRes.error}`
            : "Sipariş oluşturulamadı. Açık hesap yalnızca onaylı kurumsal müşteriler içindir.",
        );
        return;
      }

      // Sipariş başarıyla oluştu → başarı sayfası store'dan okusun. Cari'de online ödeme yok,
      // o yüzden sepeti hemen boşaltıp başarı sayfasına yönlendiriyoruz (?method=cari → doğru mesaj).
      const order = buildOrder(saveRes.orderNumber ?? generateOrderNumber());
      order.id = saveRes.orderId;
      addOrder(order);
      clearCart();
      router.push(`/odeme/basarili/${saveRes.orderId}?method=cari`);
    } catch {
      setProcessing(false);
      setPayError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  if (cartItems.length === 0 && !processing) return null;
  // Giriş zorunlu: oturum yoksa formu hiç gösterme (yukarıdaki effect /giris'e yönlendirir);
  // bootstrap sürerken de bekle — yanlışlıkla giriş ekranını flaşlamayalım.
  if (!user && !processing) return null;

  const consentOk = acceptedTerms && acceptedTolerance && acceptedKvkk;

  return (
    <>
      <div className="bg-paper-100 border-b border-paper-200">
        <Container className="py-8 md:py-10">
          <p className="text-sm text-brand-700 font-semibold uppercase tracking-wider">
            Sipariş Talebi
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-semibold text-ink-900">
            Siparişini tamamla
          </h1>
          <p className="mt-2 text-ink-500 text-sm">
            Güvenli kredi/banka kartı ile ödeme (3D Secure) · KDV dahil fiyatlar
          </p>
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
                <Input
                  label="E-posta"
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="ornek@firma.com"
                  required
                />
                <PhoneInput value={phone} onChange={setPhone} label="Telefon" required />
              </div>
              {user && (
                <p className="mt-3 text-xs text-ink-500">
                  <strong className="text-ink-900">{user.email}</strong> olarak giriş yaptınız —
                  siparişiniz hesabınıza bağlanacak.
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
                    accountType === "individual"
                      ? "bg-paper-50 shadow-sm font-medium"
                      : "text-ink-500",
                  )}
                >
                  Bireysel
                </button>
                <button
                  onClick={() => setAccountType("corporate")}
                  className={cn(
                    "px-4 py-1.5 text-sm rounded transition-colors",
                    accountType === "corporate"
                      ? "bg-paper-50 shadow-sm font-medium"
                      : "text-ink-500",
                  )}
                >
                  Kurumsal
                </button>
              </div>
              {accountType === "individual" ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input label="Ad Soyad" value={fullName} onChange={setFullName} required />
                  <Input
                    label="T.C. Kimlik No"
                    value={tcNo}
                    onChange={setTcNo}
                    maxLength={11}
                    required
                  />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Firma Ünvanı"
                    value={companyName}
                    onChange={setCompanyName}
                    className="sm:col-span-2"
                    required
                  />
                  <Input label="Vergi Dairesi" value={taxOffice} onChange={setTaxOffice} required />
                  <Input
                    label="Vergi No"
                    value={taxNumber}
                    onChange={setTaxNumber}
                    maxLength={11}
                    required
                  />
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
              {savedAddresses.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-ink-900 mb-2">Kayıtlı adreslerim</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {savedAddresses.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => applyAddress(a)}
                        className={cn(
                          "text-left p-3 rounded-lg border text-sm transition-all",
                          selectedAddressId === a.id
                            ? "border-ink-900 bg-ink-900/[0.03] ring-1 ring-ink-900/10"
                            : "border-paper-200 bg-paper-50 hover:border-ink-300",
                        )}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="font-medium text-ink-900 truncate">
                            {a.label}
                            {a.isDefault && (
                              <span className="ml-1.5 text-[11px] font-normal text-brand-700">
                                · Varsayılan
                              </span>
                            )}
                          </span>
                          {selectedAddressId === a.id && (
                            <Check size={14} weight="bold" className="text-ink-900 flex-none" />
                          )}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-500 line-clamp-2">
                          {a.district}/{a.city} · {a.fullAddress}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAddressId(null);
                        setCity("");
                        setDistrict("");
                        setFullAddress("");
                        setZipCode("");
                      }}
                      className="rounded-lg border border-dashed border-paper-300 p-3 text-left text-sm text-ink-500 hover:border-ink-400 hover:text-ink-700"
                    >
                      + Yeni adres gir
                    </button>
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-3">
                <IlIlceSelect
                  il={city}
                  ilce={district}
                  onIlChange={setCity}
                  onIlceChange={setDistrict}
                  required
                  className="sm:col-span-2 grid sm:grid-cols-2 gap-3"
                />
                <Input
                  label="Adres"
                  value={fullAddress}
                  onChange={setFullAddress}
                  placeholder="Mahalle, sokak, bina no, daire"
                  className="sm:col-span-2"
                  multiline
                  required
                />
                <Input
                  label="Posta Kodu (opsiyonel)"
                  value={zipCode}
                  onChange={setZipCode}
                  maxLength={10}
                />
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
              title="Onay & Ödeme"
              icon={<CreditCard size={18} />}
              isActive={step === "onay"}
              isComplete={false}
              onEdit={() => setStep("onay")}
              disabled={step !== "onay"}
            >
              <div className="space-y-4">
                {/* TKHK 6502 m.55/1-c — cayma hakkı istisnası, sipariş öncesi yazılı bildirim zorunluluğu */}
                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-900">
                  <p className="font-semibold mb-1">⚠️ Cayma Hakkı Hakkında Önemli Bilgi</p>
                  <p>
                    Sipariş verdiğiniz ürünler <strong>kişiye özel üretim matbaa ürünüdür</strong>{" "}
                    (kartvizit, branda, kaşe, plaket vb.). 6502 Sayılı TKHK m.55/1-c gereğince
                    tüketicinin istekleri doğrultusunda hazırlanan ürünlerde{" "}
                    <strong>cayma hakkı kullanılamaz</strong>. Üretim hatası veya teslimat hasarı
                    halinde ücretsiz değişim hakkı saklıdır.{" "}
                    <Link href="/yasal/iade" className="underline font-medium hover:text-amber-700">
                      Detaylı bilgi →
                    </Link>
                  </p>
                </div>

                {/* Ödeme yolu hesap tipine göre sabit: onaylı kurumsal → cari, bireysel → kart.
                    Seçim kutusu yok; aşağıdaki bilgi kutusu + buton paymentMethod'a göre değişir. */}
                {isApprovedCorporate && (
                  <div className="flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-ink-700">
                    <Buildings size={18} weight="bold" className="flex-none text-brand-700" />
                    <span>
                      Kurumsal hesabınızda ödemeler <strong>açık hesap (cari)</strong> üzerinden
                      yürür. Borcunuzu dilediğinizde{" "}
                      <Link href="/hesabim/cari-hesabim" className="underline font-medium hover:text-ink-900">
                        Cari Hesabım
                      </Link>{" "}
                      sayfasından kartla ödeyebilirsiniz.
                    </span>
                  </div>
                )}

                {paymentMethod === "cari" ? (
                  <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 text-sm text-ink-700">
                    Bu sipariş <strong>açık hesabınıza (cari)</strong> borç olarak işlenecek; şimdi
                    online ödeme yapmazsınız. Tutar, anlaşılan vade süresine göre cari hesabınıza
                    yansır ve{" "}
                    <Link
                      href="/hesabim/cari-hesabim"
                      className="underline font-medium hover:text-ink-900"
                    >
                      Cari Hesabım
                    </Link>{" "}
                    sayfasından takip edilir. Açık hesap yalnızca{" "}
                    <strong>onaylı kurumsal müşteriler</strong> içindir ve kredi limitiniz dahilinde
                    kullanılabilir.
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-brand-50 border border-brand-200 text-sm text-ink-700">
                    Ödemeni <strong>kredi/banka kartı</strong> ile güvenle yapıyorsun. "Kartla
                    Güvenli Öde" butonuna bastığında iyzico'nun güvenli ödeme sayfasına
                    yönlendirilirsin; kart bilgilerin <strong>iyzico tarafında</strong> girilir,
                    sitemizde saklanmaz. Tüm kartlarda <strong>3D Secure</strong> ve taksit
                    seçenekleri mevcuttur.
                  </div>
                )}

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
                      <Link href="/yasal/mesafeli-satis" className="underline hover:text-ink-900">
                        Mesafeli Satış Sözleşmesi
                      </Link>{" "}
                      ve{" "}
                      <Link href="/yasal/on-bilgilendirme" className="underline hover:text-ink-900">
                        Ön Bilgilendirme Formu
                      </Link>
                      'nu okudum, kabul ediyorum.
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
                      <strong>Üretim toleransı (%1-5 fire)</strong> sektör standardını ve renk
                      profili (CMYK) nedeniyle ekran-baskı farkı olabileceğini kabul ediyorum.{" "}
                      <Link href="/yasal/mesafeli-satis" className="underline hover:text-ink-900">
                        Detay
                      </Link>
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
                      <Link href="/yasal/kvkk" className="underline hover:text-ink-900">
                        KVKK aydınlatma metnini
                      </Link>{" "}
                      okudum, sipariş ve faturalama amacıyla kişisel verilerimin işlenmesine onay
                      veriyorum.
                    </span>
                  </label>
                </div>

                <div className="pt-2 space-y-3">
                  {paymentMethod === "cari" ? (
                    <>
                      <Button
                        size="lg"
                        fullWidth
                        onClick={handlePlaceOnAccount}
                        disabled={!consentOk || processing}
                      >
                        <Wallet size={18} weight="fill" />{" "}
                        {processing
                          ? "Sipariş oluşturuluyor…"
                          : `Açık Hesaba Yaz — ${total.toLocaleString("tr-TR")} ₺`}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                        <Buildings size={14} /> Kurumsal açık hesap · Online ödeme yapılmaz · Vade
                        dahilinde
                      </div>
                    </>
                  ) : (
                    <>
                      <Button
                        size="lg"
                        fullWidth
                        onClick={handlePayWithCard}
                        disabled={!consentOk || processing}
                      >
                        <Lock size={18} weight="fill" />{" "}
                        {processing
                          ? "Yönlendiriliyor…"
                          : `Kartla Güvenli Öde — ${total.toLocaleString("tr-TR")} ₺`}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 rounded-md border border-success/20 bg-success/[0.06] px-3 py-2 text-xs text-ink-600">
                        <ShieldCheck size={14} weight="fill" className="flex-none text-success" />
                        256-bit SSL · iyzico 3D Secure · Kart bilgisi sitemizde saklanmaz
                      </div>
                    </>
                  )}
                  {payError && <p className="text-sm text-red-600 text-center">{payError}</p>}
                  {!consentOk && (
                    <p className="text-xs text-ink-500 text-center">
                      Ödemeye geçmek için sözleşmeleri onaylayın.
                    </p>
                  )}
                  <p className="text-center text-xs text-ink-500 pt-1">
                    Sorun mu yaşıyorsun?{" "}
                    <a
                      href={whatsappUrl("Merhaba, sipariş/ödeme konusunda yardım almak istiyorum.")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#1FB358] hover:underline font-medium inline-flex items-center gap-1"
                    >
                      <WhatsappLogo size={13} weight="fill" /> WhatsApp'tan iletişime geç
                    </a>
                  </p>
                </div>
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
                        <Image
                          src={item.productImage}
                          alt={item.productName}
                          fill
                          sizes="56px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink-900 line-clamp-1">
                          {item.productName}
                        </p>
                        <p className="text-xs text-ink-500 line-clamp-1">
                          {item.configuration.summary}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-xs">
                          <span className="text-ink-500">x{item.quantity}</span>
                          <Price
                            amount={item.configuration.totalPrice * item.quantity}
                            size="sm"
                            className="text-ink-900"
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-paper-200 space-y-2 text-sm">
                  <Row label="Ara toplam" value={<Price amount={sub} className="text-ink-900" />} />
                  {discount > 0 && (
                    <Row
                      label={`Kupon (${appliedCoupon})`}
                      value={<Price amount={-discount} className="text-success" />}
                    />
                  )}
                  {corpDiscount > 0 && (
                    <Row
                      label={`Kurumsal indirim (%${corpPct})`}
                      value={<Price amount={-corpDiscount} className="text-success" />}
                    />
                  )}
                  <Row
                    label="Kargo"
                    value={
                      shipping === 0 ? (
                        <span className="text-success font-medium">Ücretsiz</span>
                      ) : (
                        <Price amount={shipping} />
                      )
                    }
                  />
                  <Row
                    label="KDV (%20 dahil)"
                    value={<Price amount={vat} className="text-ink-500" />}
                    muted
                  />
                  <div className="pt-3 border-t border-paper-200 flex items-baseline justify-between">
                    <span className="font-medium text-ink-900">Toplam</span>
                    <Price amount={total} size="lg" className="text-ink-900" />
                  </div>
                </div>

                {/* Promosyon / kupon kodu — sepette girilmemişse burada da girilebilir */}
                <div className="mt-4 pt-4 border-t border-paper-200">
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-success font-medium">
                        ✓ {appliedCoupon} kuponu uygulandı
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setCoupon(null);
                          setCouponError(null);
                        }}
                        className="text-xs text-ink-500 hover:text-error underline"
                      >
                        kaldır
                      </button>
                    </div>
                  ) : (
                    <>
                      <label className="block text-xs font-medium text-ink-700 mb-1.5">
                        Promosyon kodu
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(null);
                          }}
                          placeholder="Kupon kodu"
                          className="flex-1 px-3 py-2 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
                        />
                        <Button
                          variant="outline"
                          size="md"
                          onClick={handleApplyCoupon}
                          disabled={!couponInput.trim() || couponChecking}
                        >
                          {couponChecking ? "Kontrol…" : "Uygula"}
                        </Button>
                      </div>
                      {couponError && <p className="mt-1.5 text-xs text-error">{couponError}</p>}
                      <p className="mt-1.5 text-[11px] text-ink-500">
                        Yeni müşteriler:{" "}
                        <code className="font-mono bg-paper-100 px-1 rounded">HOSGELDIN</code>
                      </p>
                    </>
                  )}
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
    <nav
      aria-label="Sipariş adımları"
      className="flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm"
    >
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
              <span
                className={cn(
                  "hidden sm:inline",
                  isActive ? "font-medium text-ink-900" : "text-ink-500",
                )}
              >
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
      id={id}
      className={cn(
        // scroll-mt: adım değişiminde scrollIntoView sticky header altında kalmasın.
        "scroll-mt-28 p-5 md:p-6 rounded-lg border bg-paper-50 transition-all",
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
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  return (
    <label className={cn("block", className)}>
      <span className="text-sm font-medium text-ink-900">
        {label}
        {required && (
          <span className="text-error" aria-hidden="true">
            {" *"}
          </span>
        )}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-required={required ? "true" : undefined}
          rows={3}
          className="mt-1.5 w-full px-3 py-2 rounded border border-paper-200 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30 resize-none"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          required={required}
          aria-required={required ? "true" : undefined}
          className="mt-1.5 w-full px-3 py-2.5 rounded border border-paper-200 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
        />
      )}
    </label>
  );
}

function Row({
  label,
  value,
  muted,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  muted?: boolean;
}) {
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


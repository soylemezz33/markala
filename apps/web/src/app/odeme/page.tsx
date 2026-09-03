"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  Bank,
} from "@phosphor-icons/react";
import { IlIlceSelect } from "@/components/forms/il-ilce-select";
import { PhoneInput, toNationalPhone } from "@/components/forms/phone-input";
import { useCartStore, itemUnitCount } from "@/lib/cart-store";
import { useAuthStore } from "@/lib/auth-store";
import { useOrdersStore } from "@/lib/orders-store";
import { apiClient, withRefresh } from "@/lib/api";
import { adresKaydiSorulsunMu } from "./adres-kaydet-kurali";
import { generateOrderNumber } from "@/lib/format";
import { BANKA_HESABI, HAVALE_INDIRIM_YUZDE } from "@/lib/company";
import { whatsappUrl } from "@/lib/whatsapp";
import { readAttribution } from "@/lib/attribution";
import { track, trackBeginCheckout } from "@/lib/analytics";
import { track as trackVisitor } from "@/lib/visitor-analytics";
import type { Address, Order } from "@markala/types";
import { VAT_RATE } from "@/lib/vat";
/** Gösterilen tahmini indirim; gerçek indirim sipariş oluşturulurken sunucuda hesaplanıp tahsil edilir. */
const KNOWN_COUPONS: Record<string, number> = { HOSGELDIN: 0.1 };

/** Sipariş POST'u için idempotency TUZU — randomUUID yoksa (çok eski tarayıcı) zaman+rastgele. */
const newIdempotencyKey = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `idk-${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** djb2 — payload parmak izi (kriptografik olması gerekmez; tuzla birlikte çakışma pratikte imkânsız). */
const djb2 = (s: string): string => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36) + "-" + s.length.toString(36);
};

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
  // Misafir checkout: oturum yoksa giriş duvarına yönlendirmek yerine (14ef581 geri alındı — en
  // büyük satış engeliydi: reklam harcamasına karşı 0 satış) kullanıcı "misafir olarak devam et"
  // ile checkout'a geçer. HOSGELDIN kuponu misafire kapalı kalır (istismar önlemi — bkz.
  // appliedCoupon hesabı + handleApplyCoupon).
  const [guestMode, setGuestMode] = useState(false);

  // Form state
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [accountType, setAccountType] = useState<"individual" | "corporate">("individual");
  const [fullName, setFullName] = useState(user?.fullName ?? "");
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
  const [paymentMethod, setPaymentMethod] = useState<"iyzico" | "cari" | "havale">("iyzico");
  // Kullanıcının hesabında kayıtlı adresleri — giriş yapmışsa çekilir, seçilebilir + varsayılan otomatik dolar.
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  /**
   * "Bu adresi bir sonraki siparişim için kaydet" (2026-09-03, Hasan istedi).
   * Varsayılan AÇIK: kullanıcı kendi adresini kendi hesabına kaydediyor, bir dahaki
   * siparişte tek tıkla seçebilsin diye. İstemeyene tek tık kapatma imkânı var.
   */
  const [adresiKaydet, setAdresiKaydet] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  // Sadakat puanı — yalnız program AÇIKSA (LOYALTY_ENABLED) ve giriş yapılmışsa sunulur.
  // enabled=false → hiçbir puan UI'ı görünmez, redeemPoints gönderilmez (checkout değişmez).
  const [loyalty, setLoyalty] = useState<{ enabled: boolean; balance: number; redeemPerTl: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  /** Kargo ayarları /settings/shipping'ten çekilir; API hatasında 79/1500 fallback korunur. */
  const [shippingConfig, setShippingConfig] = useState({ fee: 79, freeThreshold: 1500 });
  useEffect(() => {
    apiClient.settings.shipping().then(setShippingConfig).catch(() => {});
  }, []);

  // Sadakat puan durumu — giriş yapmış kullanıcı için (program kapalıysa enabled=false döner).
  useEffect(() => {
    if (isBootstrapping || !user) {
      setLoyalty(null);
      return;
    }
    let cancelled = false;
    withRefresh(() => apiClient.loyalty.me())
      .then((d) => {
        if (!cancelled) setLoyalty({ enabled: d.enabled, balance: d.balance, redeemPerTl: d.redeemPerTl });
      })
      .catch(() => {
        if (!cancelled) setLoyalty(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, isBootstrapping]);

  // Sayfa yenilenince couponInfo (local) kaybolur ama couponCode store'da kalır → DB kuponu
  // (HOSGELDIN dışı) sessizce düşerdi. Mount'ta store'daki kuponu backend'de bir kez yeniden
  // doğrula → gerçek indirim geri gelsin ve siparişe gönderilsin.
  useEffect(() => {
    const s = subtotal();
    if (!couponCode || s <= 0 || couponInfo) return;
    // Misafirde HOSGELDIN'i yeniden doğrulama — üyeye özel (appliedCoupon zaten dışlar).
    if (couponCode === "HOSGELDIN" && !user) return;
    const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "https://api.markala.com.tr").replace(/\/$/, "");
    fetch(`${apiBase}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, subtotal: s }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d && d.valid) setCouponInfo({ code: d.code, discount: Number(d.discount) || 0, freeShipping: Boolean(d.freeShipping) });
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [couponCode, user]);

  // Kupon ANINDA backend'de doğrulanır → gerçek geçerlilik (tarih/min-tutar/ilk-sipariş/limit)
  // + gerçek indirim tutarı. Tüm DB kuponları çalışır (yalnız HOSGELDIN değil); geçersizde
  // net sebep gösterilir. Backend hata verirse KNOWN_COUPONS ile zarif fallback.
  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    setCouponError(null);
    if (!code || sub <= 0) return;
    // HOSGELDIN yalnız üyelere — misafirde kupon defalarca kullanılıyordu (14ef581 kök nedeni).
    if (code === "HOSGELDIN" && !user) {
      setCouponError("Bu kupon sadece üye girişiyle kullanılabilir.");
      return;
    }
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

  /** Misafir olarak devam et — seçim ekranından çağrılır; checkout formunu açar + ölçüm atar. */
  function startGuest() {
    track("checkout_guest_start", {});
    trackVisitor("checkout_guest_start", { type: "checkout_guest_start" });
    setGuestMode(true);
  }

  /** Sorunun ne zaman gösterileceği — kural + testleri: adres-kaydet-kurali.ts */
  const adresKaydiSorulsun = adresKaydiSorulsunMu({
    girisYapildi: Boolean(user),
    form: { city, district, fullAddress },
    kayitliAdresler: savedAddresses,
  });

  /**
   * Adresi hesaba kaydet — SİPARİŞ BAŞARIYLA OLUŞTUKTAN SONRA çağrılır.
   * Adım geçişinde kaydetmiyoruz: sepeti yarıda bırakan kullanıcının adres
   * defterini kirletmek doğru olmaz.
   * Hata sipariş akışını BOZMAZ (fire-and-forget) — adres kaydı ikincil bir kolaylık.
   */
  async function adresiHesabaKaydet() {
    if (!adresKaydiSorulsun || !adresiKaydet) return;
    // Etiket adres listesinde ayırt edici olsun; DTO 2-40 karakter istiyor.
    const etiket = (district || city).slice(0, 40) || "Adresim";
    try {
      await withRefresh(() =>
        apiClient.users.createAddress({
          label: etiket,
          fullName: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          district: district.trim(),
          fullAddress: fullAddress.trim(),
          ...(zipCode.trim() ? { zipCode: zipCode.trim() } : {}),
          // İlk adresse varsayılan yap — sonraki siparişte otomatik dolsun.
          isDefault: savedAddresses.length === 0,
        }),
      );
    } catch {
      /* adres kaydedilemedi — sipariş tamamlandı, sessiz geç */
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
  // HOSGELDIN yalnız GİRİŞ YAPMIŞ üyeye: misafirde (user yok) önizlemede bile uygulanmaz —
  // backend zaten reddeder; "sözde indirim" gösterip bait-and-switch yapmayalım (14ef581 istismarı).
  const hosgeldinBlocked = couponCode === "HOSGELDIN" && !user;
  // İndirim önceliği: backend-doğrulanmış couponInfo (gerçek tutar) → yoksa KNOWN_COUPONS tahmini
  // (sayfa yenilenince couponInfo local state kaybolur ama couponCode store'da kalır; gerçek
  // indirim her hâlükârda siparişte backend'de yeniden hesaplanıp tahsil edilir).
  const backendCoupon =
    couponInfo && couponInfo.code === couponCode && !hosgeldinBlocked ? couponInfo : null;
  const appliedCoupon =
    couponCode && !hosgeldinBlocked && (backendCoupon || KNOWN_COUPONS[couponCode]) ? couponCode : null;
  const discount = backendCoupon
    ? backendCoupon.discount
    : appliedCoupon
      ? sub * (KNOWN_COUPONS[appliedCoupon] ?? 0)
      : 0;
  // Kurumsal oransal indirim — yalnız GİRİŞ YAPMIŞ + onaylı kurumsal üyeye gösterilir/uygulanır.
  // Backend ile aynı formül (subtotal × yüzde); gerçek indirim siparişte yine sunucuda kesinleşir,
  // bu yalnızca önizleme. "approved" değilse 0 → indirim hiç uygulanmaz (sipariş tarafıyla tutarlı).
  // FORM'daki accountType'a bakılır: kullanıcı formda "bireysel"e geçerse indirim sıfırlanır (görsel tutarlılık).
  const corpPct =
    user && user.accountType === "corporate" && user.corporateStatus === "approved" && accountType === "corporate"
      ? Number(user.corporateDiscount ?? 0) || 0
      : 0;
  const corpDiscount = corpPct > 0 ? Math.round(sub * corpPct) / 100 : 0;

  // === Sadakat puanı harcama (önizleme; gerçek indirim siparişte sunucuda yeniden doğrulanır) ===
  // Sunucu kuralıyla aynı sınır: bakiye (tam TL), ara toplamın %50'si ve kupon/kurumsal sonrası
  // kalan tutar. enabled=false ise tüm değerler 0 → puan UI'ı gizli, checkout değişmez.
  const loyaltyOn = Boolean(loyalty?.enabled && user);
  const redeemPerTl = loyalty?.redeemPerTl ?? 100;
  // Havale/EFT indirimi — sunucudaki formülün BİREBİR aynısı (orders.service.ts):
  // kupon ve kurumsal indirim düşüldükten SONRA kalan tutarın %5'i. Yalnız önizleme;
  // gerçek indirim siparişte sunucuda yeniden hesaplanır (client'a güvenilmez).
  const havaleDiscount =
    paymentMethod === "havale"
      ? Math.round((sub - discount - corpDiscount) * HAVALE_INDIRIM_YUZDE) / 100
      : 0;

  const roomBeforeRedeem = Math.max(0, sub - discount - corpDiscount - havaleDiscount);
  const maxRedeemTl = loyaltyOn
    ? Math.min(
        Math.floor(sub * 0.5),
        Math.floor(roomBeforeRedeem),
        Math.floor((loyalty?.balance ?? 0) / redeemPerTl),
      )
    : 0;
  const maxRedeemPoints = Math.max(0, maxRedeemTl * redeemPerTl);
  const redeemApplied = Math.max(0, Math.min(redeemPoints, maxRedeemPoints));
  const redeemTl = redeemApplied / redeemPerTl;

  const subAfterDiscount = Math.max(0, sub - discount - corpDiscount - havaleDiscount - redeemTl);
  // Kargo eşiği İNDİRİM ÖNCESİ ara toplama göre — sepet ekranı VE backend ile birebir aynı
  // (aksi halde kuponlu siparişte sepet "ücretsiz" derken ödeme 79₺ ekleyebiliyordu).
  // free_shipping kuponu (backend doğruladıysa) kargoyu sıfırlar.
  const shipping =
    backendCoupon?.freeShipping || sub >= shippingConfig.freeThreshold ? 0 : sub > 0 ? shippingConfig.fee : 0;
  const vat = subAfterDiscount - subAfterDiscount / (1 + VAT_RATE); // KDV DAHİL fiyat → içindeki KDV payı (üstüne eklenmez)
  const total = subAfterDiscount + shipping;

  useEffect(() => {
    if (cartItems.length === 0 && !processing) {
      router.replace("/sepet");
    }
  }, [cartItems.length, processing, router]);

  // Misafir checkout AÇIK (14ef581 giriş duvarı geri alındı — funnel'ın en büyük drop-off'uydu:
  // Meta reklam harcamasına karşı 0 satış). Oturum yoksa YÖNLENDİRME YOK; kullanıcı seçim
  // ekranından "misafir olarak devam et" der (→ guestMode) ya da üye girişi yapar. Bootstrap
  // bitene kadar bekle ki seçim ekranını kalıcı oturumluya boşuna flaşlamayalım. HOSGELDIN
  // istismarı ayrıca engellenir: kupon misafire kapalı (appliedCoupon + handleApplyCoupon).
  useEffect(() => {
    if (!isBootstrapping && !user && !processing && !guestMode) {
      // Ölçüm: kaç oturumsuz kullanıcı seçim ekranıyla karşılaşıyor (funnel drop-off analizi).
      // Consent yoksa track zaten sessizce yutar.
      track("checkout_login_wall", {});
    }
  }, [isBootstrapping, user, processing, guestMode]);

  // Onaylı kurumsal → her zaman cari (açık hesap). Diğer herkes kart ile havale
  // arasında SEÇİM YAPAR; seçim burada ezilmemeli (eskiden koşulsuz "iyzico"ya
  // çekiliyordu, havale seçimi bir sonraki render'da kayboluyordu).
  useEffect(() => {
    setPaymentMethod((prev) =>
      isApprovedCorporate ? "cari" : prev === "cari" ? "iyzico" : prev,
    );
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

  /**
   * Adımdaki eksik/hatalı alanlar. 2026-08-18 UX düzeltmesi: eskiden `canProceed()` yalnız
   * true/false döndürüyor ve "Devam Et" SESSİZCE pasif kalıyordu — kullanıcı hangi alanın
   * sorunlu olduğunu anlayamıyordu (hiçbir alan hata göstermiyor, sayfada <form> olmadığı
   * için tarayıcının kendi "bu alanı doldurun" balonu da hiç çalışmıyor). Artık alan alan
   * sebep dönüyor; buton hep TIKLANABİLİR, tıklanınca eksikler gösterilip ilk hatalı alana
   * gidiliyor. Eşikler bilerek GEVŞEK — amaç kullanıcıyı elemek değil, teslimatı mümkün kılmak.
   */
  type FieldIssue = { field: string; message: string };

  function stepIssues(s: Step = step): FieldIssue[] {
    const out: FieldIssue[] = [];
    if (s === "iletisim") {
      // Gevşek e-posta kontrolü: yalnız bariz yazım hatasını yakalar (a@b gibi eksik alan adı).
      if (!/.+@.+\..+/.test(email.trim()))
        out.push({ field: "email", message: "E-posta adresini kontrol edin (ornek@firma.com)" });
      // Telefon '+90XXXXXXXXXX' saklanır; ulusal kısım 10 hane olmalı — kargo için zorunlu.
      if (toNationalPhone(phone).length !== 10)
        out.push({ field: "phone", message: "Telefon numarasını 10 haneli girin (5XX XXX XX XX)" });
    }
    if (s === "fatura") {
      if (accountType === "individual") {
        if (fullName.trim().length < 2) out.push({ field: "fullName", message: "Ad soyad girin" });
      } else {
        if (companyName.trim().length < 2)
          out.push({ field: "companyName", message: "Firma unvanı girin" });
        if (taxNumber.replace(/\D/g, "").length < 10)
          out.push({ field: "taxNumber", message: "Vergi/TC kimlik numarasını girin" });
        if (taxOffice.trim().length < 2)
          out.push({ field: "taxOffice", message: "Vergi dairesi girin" });
      }
    }
    if (s === "teslimat") {
      if (city.trim().length < 2 || district.trim().length < 2)
        out.push({ field: "city", message: "İl ve ilçe seçin" });
      // Eşik 10 → 8: kısa ama geçerli adresler ("Barbaros M. No 7") elenmesin.
      if (fullAddress.trim().length < 8)
        out.push({
          field: "fullAddress",
          message: "Adresi biraz daha ayrıntılı yazın (mahalle, sokak, bina/daire no)",
        });
    }
    return out;
  }

  /**
   * Ödemeden ÖNCE tüm adımları doğrular. Kullanıcı "Düzenle" ile geri dönüp bir alanı
   * boşaltırsa son adıma kadar gelebiliyordu; eskiden bu durumda yalnız backend'den gelen
   * genel "Sipariş oluşturulamadı" mesajı görünüyordu (hangi alan olduğu belirsiz).
   * Artık eksik varsa ilgili ADIMA dönülüp eksikler gösteriliyor.
   */
  function guardAllSteps(): boolean {
    for (const s of ["iletisim", "fatura", "teslimat"] as Step[]) {
      if (stepIssues(s).length > 0) {
        setStep(s);
        setShowIssues(true);
        requestAnimationFrame(() =>
          document.getElementById(s)?.scrollIntoView({ behavior: "smooth", block: "start" }),
        );
        return false;
      }
    }
    return true;
  }

  /** Kullanıcı "Devam Et"e bastıysa hatalar gösterilir; öncesinde form sessiz kalır. */
  const [showIssues, setShowIssues] = useState(false);
  const issues = stepIssues();
  const issueOf = (field: string) =>
    showIssues ? issues.find((i) => i.field === field)?.message : undefined;

  // Adım değişince hata gösterimi sıfırlanır (yeni adım baştan "temiz" başlasın).
  useEffect(() => {
    setShowIssues(false);
  }, [step]);

  function handleNext() {
    const found = stepIssues();
    if (found.length > 0) {
      // Sessizce durma: eksikleri göster + ilk hatalı alana götür ve odakla.
      setShowIssues(true);
      const first = found[0]?.field;
      if (first) {
        requestAnimationFrame(() => {
          const el = document.querySelector<HTMLElement>(`[data-field="${first}"]`);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
          el?.querySelector<HTMLElement>("input, textarea, select")?.focus({ preventScroll: true });
        });
      }
      return;
    }
    setShowIssues(false);
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
  // Çift sipariş koruması: anahtar = mountTuzu + PAYLOAD parmak izi. Aynı payload'lı retry
  // (timeout sonrası tekrar "Ödeme Yap") aynı anahtarı üretir → API mevcut siparişi döner,
  // ikinci sipariş oluşmaz. Payload DEĞİŞİRSE (adres düzeltildi, kupon/yöntem değişti) anahtar
  // da değişir → bayat siparişin sessizce dönmesi engellenir (review bulgusu 2026-08-01).
  // Başarılı siparişten sonra tuz yenilenir (bilinçli ikinci sipariş her durumda yeni anahtar).
  const idemSaltRef = useRef<string>(newIdempotencyKey());

  async function saveOrder(opts: { channel: string; paymentMethod?: "iyzico" | "cari" | "havale" }): Promise<{
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
      const body = JSON.stringify({
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
        redeemPoints: redeemApplied > 0 ? redeemApplied : undefined,
        paymentMethod: opts.paymentMethod,
        // Sipariş kaynağı (gclid/gbraid/wbraid/utm) — iniş anında yakalanır, çerez onayından
        // BAĞIMSIZ. `_gcl_aw` çerezi onay verilmeyince hiç yazılmadığı için siparişlerin
        // kaynağı bilinmiyordu (2026-08-18 denetimi). Route'ta çerez > body > referer sırası.
        attribution: readAttribution() ?? undefined,
        items: cartItems.map((i) => ({
          productSlug: i.productSlug,
          configuration: i.configuration,
          quantity: i.quantity,
        })),
      });
      const res = await fetch("/api/siparis-kaydet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": `${idemSaltRef.current}-${djb2(body)}`,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
        signal: ctrl.signal,
      });
      const parsed = (await res.json()) as {
        ok?: boolean;
        orderId?: string;
        orderNumber?: string;
        paymentNonce?: string;
        error?: string;
      };
      // NOT: tuz BURADA yenilenMEZ (2026-08-26 UX denetimi #2 düzeltmesi).
      // Eskiden sipariş DB'ye yazılır yazılmaz tuz yenileniyordu; iyzico başlatma hata verip
      // müşteri "tekrar dene" dediğinde anahtar değiştiği için İKİNCİ bir "ödeme bekliyor"
      // siparişi açılıyordu (21 Ağustos'taki ikili bekleyen siparişlerin sebebi). Artık tuz
      // yalnız ödeme GERÇEKTEN başladığında (iyzico'ya yönlenirken) ya da cari sipariş
      // tamamlandığında yenilenir → aynı payload'lı retry mevcut siparişi geri getirir.
      return parsed;
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
    if (!guardAllSteps()) return; // eksik alan → ilgili adıma dön, sebebi göster
    setPayError(null);
    setProcessing(true);

    // GA4 — kullanıcı ödeme adımına geçti (purchase başarı sayfasında ateşlenir).
    // NOT: GA4'te `items` DİZİ bekler — sayı gönderilirse alan çöpe gider; adet num_items'ta.
    track("add_payment_info", {
      currency: "TRY",
      value: total,
      num_items: cartItems.length,
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

      // Sipariş oluştu → adres kaydı (istenmişse). Fire-and-forget: hata akışı bozmaz.
      void adresiHesabaKaydet();
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
          // TC alanı checkout'tan kaldırıldı (324ajans gibi frictionless) → her zaman undefined;
          // backend iyzico "kimlik yok" sentinel'i 11111111111 kullanır.
          identityNumber: undefined,
        }),
      })
        .then((r) => r.json())
        .catch(() => null);

      if (payRes?.ok && payRes.paymentPageUrl) {
        // Ödeme GERÇEKTEN başladı → bundan sonraki (bilinçli) sipariş yeni anahtar alsın.
        // Tuz yenilemesinin doğru yeri burası; sipariş yazımı değil (bkz. saveOrder notu).
        idemSaltRef.current = newIdempotencyKey();
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
    if (!guardAllSteps()) return; // eksik alan → ilgili adıma dön, sebebi göster
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

      // Sipariş oluştu → adres kaydı (istenmişse). Fire-and-forget: hata akışı bozmaz.
      void adresiHesabaKaydet();
      // Sipariş başarıyla oluştu → başarı sayfası store'dan okusun. Cari'de online ödeme yok,
      // o yüzden sepeti hemen boşaltıp başarı sayfasına yönlendiriyoruz (?method=cari → doğru mesaj).
      const order = buildOrder(saveRes.orderNumber ?? generateOrderNumber());
      order.id = saveRes.orderId;
      addOrder(order);
      // Cari sipariş TAMAMLANDI → sonraki sipariş yeni anahtar alsın (bkz. saveOrder notu).
      idemSaltRef.current = newIdempotencyKey();
      clearCart();
      router.push(`/odeme/basarili/${saveRes.orderId}?method=cari`);
    } catch {
      setProcessing(false);
      setPayError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  /**
   * Havale/EFT ile sipariş ver: online ödeme YOK — sipariş paymentStatus="beklemede"
   * açılır, müşteri başarı sayfasında IBAN + sipariş numarasını görür ve parayı
   * gönderir. Admin ekstreden eşleştirip "ödeme geldi" işaretler.
   * Akış cari ile aynı (ikisi de kartsız), ayrı tutulmasının sebebi indirim ve mesaj.
   */
  async function handlePlaceHavale() {
    if (!consentOk || processing || isApprovedCorporate) return;
    if (!guardAllSteps()) return;
    setPayError(null);
    setProcessing(true);

    try {
      const saveRes = await saveOrder({ channel: "havale", paymentMethod: "havale" });

      if (!saveRes?.ok || !saveRes.orderId) {
        setProcessing(false);
        setPayError(
          saveRes?.error
            ? `Sipariş oluşturulamadı: ${saveRes.error}`
            : "Sipariş oluşturulamadı. Lütfen tekrar deneyin.",
        );
        return;
      }

      // Sipariş oluştu → adres kaydı (istenmişse). Fire-and-forget: hata akışı bozmaz.
      void adresiHesabaKaydet();
      const order = buildOrder(saveRes.orderNumber ?? generateOrderNumber());
      order.id = saveRes.orderId;
      addOrder(order);
      idemSaltRef.current = newIdempotencyKey();
      clearCart();
      router.push(`/odeme/basarili/${saveRes.orderId}?method=havale`);
    } catch {
      setProcessing(false);
      setPayError("Bir hata oluştu. Lütfen tekrar deneyin.");
    }
  }

  if (cartItems.length === 0 && !processing) return null;
  // Auth bootstrap sürerken bekle — kalıcı oturum anında gelebilir; seçim ekranını boşuna flaşlama.
  if (isBootstrapping && !user && !processing) return null;
  // Misafir checkout: oturum yok + misafir modu seçilmedi → giriş/üyelik/misafir seçim ekranı
  // (login duvarı yerine). "Misafir olarak devam et" → guestMode true → aşağıdaki form açılır.
  if (!user && !guestMode && !processing) return <GuestGate total={total} onGuest={startGuest} />;

  const consentOk = acceptedTerms && acceptedTolerance && acceptedKvkk;

  // WhatsApp yardım mesajı — misafir modda iletişim bilgilerini önceden doldur (temsilci siparişi
  // hızlı tamamlasın); üye modda genel yardım metni.
  const waMessage = !user
    ? [
        "Merhaba, misafir olarak sipariş vermek istiyorum.",
        fullName ? `Ad Soyad: ${fullName}` : null,
        phone ? `Telefon: ${phone}` : null,
        email ? `E-posta: ${email}` : null,
        `Sepet tutarı: ${total.toLocaleString("tr-TR")} ₺`,
      ]
        .filter(Boolean)
        .join("\n")
    : "Merhaba, sipariş/ödeme konusunda yardım almak istiyorum.";

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
                  name="email"
                  error={issueOf("email")}
                  value={email}
                  onChange={setEmail}
                  type="email"
                  placeholder="ornek@firma.com"
                  autoComplete="email"
                  inputMode="email"
                  required
                />
                <div data-field="phone">
                  <PhoneInput value={phone} onChange={setPhone} label="Telefon" required />
                  {issueOf("phone") && (
                    <span className="mt-1 block text-xs font-medium text-error">
                      {issueOf("phone")}
                    </span>
                  )}
                </div>
              </div>
              {user ? (
                <p className="mt-3 text-xs text-ink-500">
                  <strong className="text-ink-900">{user.email}</strong> olarak giriş yaptınız,
                  siparişiniz hesabınıza bağlanacak.
                </p>
              ) : (
                <p className="mt-3 text-xs text-ink-500">
                  Misafir olarak devam ediyorsun.{" "}
                  <Link
                    href={`/giris?next=${encodeURIComponent("/odeme")}`}
                    className="font-medium text-brand-700 hover:underline"
                  >
                    Üye girişi
                  </Link>{" "}
                  yaparsan HOSGELDIN indirimi ve sipariş takibi açılır.
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
                <div className="grid gap-3">
                  <Input
                    label="Ad Soyad"
                    name="fullName"
                    error={issueOf("fullName")}
                    value={fullName}
                    onChange={setFullName}
                    autoComplete="name"
                    required
                  />
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input
                    label="Firma Ünvanı"
                    name="companyName"
                    error={issueOf("companyName")}
                    value={companyName}
                    onChange={setCompanyName}
                    className="sm:col-span-2"
                    autoComplete="organization"
                    required
                  />
                  <Input
                    label="Vergi Dairesi"
                    name="taxOffice"
                    error={issueOf("taxOffice")}
                    value={taxOffice}
                    onChange={setTaxOffice}
                    required
                  />
                  <Input
                    label="Vergi No"
                    name="taxNumber"
                    error={issueOf("taxNumber")}
                    value={taxNumber}
                    onChange={setTaxNumber}
                    maxLength={11}
                    inputMode="numeric"
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
                <div data-field="city" className="sm:col-span-2">
                  <IlIlceSelect
                    il={city}
                    ilce={district}
                    onIlChange={setCity}
                    onIlceChange={setDistrict}
                    required
                    className="grid sm:grid-cols-2 gap-3"
                  />
                  {issueOf("city") && (
                    <span className="mt-1 block text-xs font-medium text-error">
                      {issueOf("city")}
                    </span>
                  )}
                </div>
                <Input
                  label="Adres"
                  name="fullAddress"
                  error={issueOf("fullAddress")}
                  hint="Mahalle, sokak/cadde, bina ve daire no"
                  value={fullAddress}
                  onChange={setFullAddress}
                  placeholder="Örn. Barbaros Mah. 1234 Sk. No:7 D:3"
                  className="sm:col-span-2"
                  autoComplete="street-address"
                  multiline
                  required
                />
                <Input
                  label="Posta Kodu (opsiyonel)"
                  value={zipCode}
                  onChange={setZipCode}
                  maxLength={10}
                  autoComplete="postal-code"
                  inputMode="numeric"
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

              {/*
                ADRESİ KAYDET (2026-09-03, Hasan: "onay ve ödeme adımına geçmeden
                adresinizi bir sonraki siparişiniz için kaydedelim mi sorusunu soralım").
                Yalnız GİRİŞLİ kullanıcıya ve adres hesapta YOKSA görünür — kayıtlı bir
                adres seçildiğinde sormak, her siparişte aynı adresin kopyasını üretirdi.
                Kayıt, sipariş BAŞARIYLA oluştuktan sonra yapılır.
              */}
              {adresKaydiSorulsun && (
                <label className="mt-3 flex items-start gap-2 rounded-lg border border-paper-200 bg-paper-100/60 px-3 py-2.5 text-sm text-ink-700">
                  <input
                    type="checkbox"
                    checked={adresiKaydet}
                    onChange={(e) => setAdresiKaydet(e.target.checked)}
                    className="mt-0.5 rounded border-paper-200"
                  />
                  <span>
                    <strong className="font-medium text-ink-900">
                      Bu adresi bir sonraki siparişim için kaydet
                    </strong>
                    <span className="block text-xs text-ink-500">
                      Hesabınıza kaydedilir; sonraki siparişlerde tek tıkla seçebilirsiniz.
                      Adreslerinizi Hesabım &rsaquo; Adreslerim&apos;den yönetebilirsiniz.
                    </span>
                  </span>
                </label>
              )}
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

                {/*
                  Ödeme yöntemi seçimi — yalnız kartlı akışta gösterilir.
                  Onaylı kurumsal müşteri açık hesapla (cari) çalışır, seçim görmez.
                */}
                {!isApprovedCorporate && (
                  <div className="pt-2">
                    <div className="text-sm font-medium text-ink-900 mb-2">Ödeme yöntemi</div>
                    <div className="grid gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("iyzico")}
                        aria-pressed={paymentMethod === "iyzico"}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          paymentMethod === "iyzico"
                            ? "border-brand-500 bg-brand-50/60"
                            : "border-paper-200 hover:border-ink-300"
                        }`}
                      >
                        <Lock size={18} weight="fill" className="mt-0.5 flex-none text-brand-700" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-900">
                            Kredi / banka kartı
                          </span>
                          <span className="block text-xs text-ink-500">
                            3D Secure ile anında onay, sipariş hemen üretime girer.
                          </span>
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod("havale")}
                        aria-pressed={paymentMethod === "havale"}
                        className={`flex items-start gap-3 rounded-lg border p-3 text-left transition-colors ${
                          paymentMethod === "havale"
                            ? "border-brand-500 bg-brand-50/60"
                            : "border-paper-200 hover:border-ink-300"
                        }`}
                      >
                        <Bank size={18} weight="fill" className="mt-0.5 flex-none text-brand-700" />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-900">
                            Havale / EFT{" "}
                            <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-bold text-success">
                              %{HAVALE_INDIRIM_YUZDE} indirim
                            </span>
                          </span>
                          <span className="block text-xs text-ink-500">
                            IBAN sipariş sonunda gösterilir. Ödemeniz hesabımıza geçince üretime
                            alınır.
                          </span>
                        </span>
                      </button>
                    </div>
                  </div>
                )}

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
                          : `Açık Hesaba Yaz - ${total.toLocaleString("tr-TR")} ₺`}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 text-xs text-ink-500">
                        <Buildings size={14} /> Kurumsal açık hesap · Online ödeme yapılmaz · Vade
                        dahilinde
                      </div>
                    </>
                  ) : paymentMethod === "havale" ? (
                    <>
                      <Button
                        size="lg"
                        fullWidth
                        onClick={handlePlaceHavale}
                        disabled={!consentOk || processing}
                      >
                        <Bank size={18} weight="fill" />{" "}
                        {processing
                          ? "Sipariş oluşturuluyor…"
                          : `Havale ile Sipariş Ver - ${total.toLocaleString("tr-TR")} ₺`}
                      </Button>
                      <div className="rounded-md border border-paper-200 bg-paper-50 px-3 py-2 text-xs text-ink-600">
                        Siparişi verdiğinizde IBAN ve sipariş numaranız gösterilir. Açıklamaya
                        sipariş numaranızı yazın; ödemeniz onaylandığında üretime alınır.
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
                          : `Kartla Güvenli Öde - ${total.toLocaleString("tr-TR")} ₺`}
                      </Button>
                      <div className="flex items-center justify-center gap-1.5 rounded-md border border-success/20 bg-success/[0.06] px-3 py-2 text-xs text-ink-600">
                        <ShieldCheck size={14} weight="fill" className="flex-none text-success" />
                        256-bit SSL · iyzico 3D Secure · Kart bilgisi sitemizde saklanmaz
                      </div>
                    </>
                  )}
                  {payError && <p role="alert" className="text-sm text-red-600 text-center">{payError}</p>}
                  {!consentOk && (
                    <p className="text-xs text-ink-500 text-center">
                      Ödemeye geçmek için sözleşmeleri onaylayın.
                    </p>
                  )}
                  <p className="text-center text-xs text-ink-500 pt-1">
                    Sorun mu yaşıyorsun?{" "}
                    <a
                      href={whatsappUrl(waMessage)}
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

            {/* 2026-08-18: Buton artık PASİF DEĞİL. Eskiden eksik alan varsa sessizce
                devre dışı kalıyor, kullanıcı sebebini göremiyordu. Şimdi tıklanabilir;
                eksik varsa hem liste gösterilir hem ilk hatalı alana gidilir. */}
            {step !== "onay" && (
              <div className="pt-4">
                {showIssues && issues.length > 0 && (
                  <div
                    role="alert"
                    className="mb-3 rounded-lg border border-error/30 bg-error/5 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-ink-900">
                      Devam etmek için {issues.length} alanı tamamlayın:
                    </p>
                    <ul className="mt-1.5 space-y-1">
                      {issues.map((i) => (
                        <li key={i.field} className="text-sm text-ink-700 flex items-start gap-1.5">
                          <span className="text-error leading-5">•</span>
                          {i.message}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button size="lg" onClick={handleNext}>
                    Devam Et <ArrowRight size={18} weight="bold" />
                  </Button>
                </div>
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
                          {/* Gösterim: parça adedi (set × tiraj) */}
                          <span className="text-ink-500">x{item.quantity * itemUnitCount(item)}</span>
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
                  {havaleDiscount > 0 && (
                    <Row
                      label={`Havale indirimi (%${HAVALE_INDIRIM_YUZDE})`}
                      value={<Price amount={-havaleDiscount} className="text-success" />}
                    />
                  )}
                  {redeemApplied > 0 && (
                    <Row
                      label={`Puan indirimi (${redeemApplied.toLocaleString("tr-TR")} puan)`}
                      value={<Price amount={-redeemTl} className="text-success" />}
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
                  <div className="pt-3 border-t border-paper-200">
                    <div className="flex items-baseline justify-between">
                      <span className="font-medium text-ink-900">Toplam</span>
                      <Price amount={total} size="lg" className="text-ink-900" />
                    </div>
                    {/* KDV toplanabilir satır DEĞİL bilgi notu — sepetle aynı desen (2026-08-12). */}
                    <p className="mt-1 text-xs text-ink-500 text-right">
                      Fiyatlara %20 KDV dahildir (KDV tutarı: <Price amount={vat} size="sm" className="text-ink-500" />)
                    </p>
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
                      {user ? (
                        <p className="mt-1.5 text-[11px] text-ink-500">
                          Yeni müşteriler:{" "}
                          <code className="font-mono bg-paper-100 px-1 rounded">HOSGELDIN</code>
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[11px] text-ink-500">
                          <Link
                            href={`/giris?next=${encodeURIComponent("/odeme")}`}
                            className="font-medium text-brand-700 hover:underline"
                          >
                            Üye girişi
                          </Link>{" "}
                          yapınca{" "}
                          <code className="font-mono bg-paper-100 px-1 rounded">HOSGELDIN</code> ile
                          %10 indirim.
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* Sadakat puanı kullan — yalnız program açık + kullanılabilir puan varsa */}
                {loyaltyOn && maxRedeemPoints > 0 && (
                  <div className="mt-4 pt-4 border-t border-paper-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-ink-700">Puanlarımı kullan</label>
                      <span className="text-[11px] text-ink-500">
                        {(loyalty?.balance ?? 0).toLocaleString("tr-TR")} puan · en fazla{" "}
                        {maxRedeemPoints.toLocaleString("tr-TR")}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={maxRedeemPoints}
                        step={redeemPerTl}
                        value={redeemApplied || ""}
                        onChange={(e) =>
                          setRedeemPoints(Math.max(0, Math.floor(Number(e.target.value) || 0)))
                        }
                        placeholder="0"
                        className="flex-1 px-3 py-2 rounded border border-paper-200 bg-paper-50 text-ink-900 text-sm focus:border-ink-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/30"
                      />
                      <Button
                        variant="outline"
                        size="md"
                        onClick={() => setRedeemPoints(maxRedeemPoints)}
                        disabled={redeemApplied >= maxRedeemPoints}
                      >
                        Tümü
                      </Button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-[11px] text-ink-500">
                        {redeemPerTl} puan = 1 TL · en fazla sepetin %50'si
                      </p>
                      {redeemApplied > 0 && (
                        <button
                          type="button"
                          onClick={() => setRedeemPoints(0)}
                          className="text-xs text-ink-500 hover:text-error underline"
                        >
                          kaldır
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <ul className="grid grid-cols-3 gap-2 text-xs text-ink-500">
                <Trust icon={<Clock size={18} />} label="2-3 iş günü üretim" />
                <Trust icon={<Truck size={18} />} label="81 ile kargo" />
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
  autoComplete,
  inputMode,
  error,
  name,
  hint,
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
  autoComplete?: string;
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal" | "search" | "url" | "none";
  /** Doldurulmamış/hatalıysa gösterilecek mesaj (2026-08-18: sessiz doğrulama kaldırıldı). */
  error?: string;
  /** stepIssues() alan anahtarı — hatalı alana kaydırma/odaklama için. */
  name?: string;
  /** Hata olmadan da gösterilen yardımcı ipucu (beklentiyi önden söyler). */
  hint?: string;
}) {
  return (
    <label className={cn("block", className)} data-field={name}>
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
          aria-invalid={error ? "true" : undefined}
          autoComplete={autoComplete}
          rows={3}
          className={cn(
            "mt-1.5 w-full px-3 py-2 rounded border text-sm focus:outline-none focus-visible:ring-2 resize-none",
            error
              ? "border-error focus:border-error focus-visible:ring-error/25"
              : "border-paper-200 focus:border-ink-900 focus-visible:ring-brand-300/30",
          )}
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
          aria-invalid={error ? "true" : undefined}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={cn(
            "mt-1.5 w-full px-3 py-2.5 rounded border text-sm focus:outline-none focus-visible:ring-2",
            error
              ? "border-error focus:border-error focus-visible:ring-error/25"
              : "border-paper-200 focus:border-ink-900 focus-visible:ring-brand-300/30",
          )}
        />
      )}
      {error ? (
        <span className="mt-1 block text-xs font-medium text-error">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-ink-500">{hint}</span>
      ) : null}
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

/**
 * Misafir/üye seçim ekranı — login duvarının yerine (14ef581 geri alındı). Birincil CTA
 * "Misafir olarak devam et" (marka: sarı hap, funnel sürtünmesini kaldırır); üye girişi
 * ikincil (outline) — HOSGELDIN + sipariş takibi avantajıyla teşvik edilir.
 */
function GuestGate({ total, onGuest }: { total: number; onGuest: () => void }) {
  const nextParam = encodeURIComponent("/odeme");
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
            Nasıl devam etmek istediğini seç · KDV dahil fiyatlar
          </p>
        </Container>
      </div>

      <Container className="py-10 md:py-14">
        <div className="mx-auto max-w-md">
          <div className="rounded-lg border border-paper-200 bg-paper-50 p-6 md:p-8">
            {/* Birincil CTA — sarı hap (marka §6): funnel'ın en büyük engelini kaldırır. */}
            <Button size="lg" fullWidth onClick={onGuest}>
              Misafir olarak devam et <ArrowRight size={18} weight="bold" />
            </Button>
            <p className="mt-2 text-center text-xs text-ink-500">
              Hesap açmadan, tek adımda sipariş ver.
            </p>

            <div className="my-5 flex items-center gap-3 text-xs text-ink-500">
              <span className="h-px flex-1 bg-paper-200" />
              veya
              <span className="h-px flex-1 bg-paper-200" />
            </div>

            {/* İkincil — üye girişi (outline; mor dolgu YASAK). */}
            <Link href={`/giris?next=${nextParam}`} className="block">
              <Button size="lg" variant="outline" fullWidth>
                <UserIcon size={18} /> Üye Girişi Yap
              </Button>
            </Link>
            <p className="mt-3 text-center text-sm text-ink-700">
              Hesabın yok mu?{" "}
              <Link
                href={`/kayit?next=${nextParam}`}
                className="font-medium text-brand-700 hover:underline"
              >
                Üye Ol
              </Link>
            </p>
            <div className="mt-4 rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-center text-xs text-ink-700">
              Üye girişi: <strong>HOSGELDIN</strong> ile ilk siparişine %10 indirim + sipariş takibi
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-ink-500">
            Sepet tutarı:{" "}
            <strong className="text-ink-900">{total.toLocaleString("tr-TR")} ₺</strong>
          </p>

          <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-ink-500">
            <ShieldCheck size={14} weight="fill" className="flex-none text-success" />
            256-bit SSL · iyzico 3D Secure ile güvenli ödeme
          </p>
        </div>
      </Container>
    </>
  );
}


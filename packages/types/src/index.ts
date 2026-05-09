export type BadgeKind = "yeni" | "firsat" | "hizli-sevkiyat" | "cok-satilan" | "tukenmek-uzere";

export interface SeoMeta {
  /** <title> içeriği */
  title?: string;
  /** <meta description> içeriği — 150-160 karakter ideal */
  description?: string;
  /** Schema/structured-data için ek anahtar kelimeler */
  keywords?: string[];
  /** Open Graph görseli (yoksa default kullanılır) */
  ogImage?: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface SpecItem {
  label: string;
  value: string;
}

export interface Category {
  slug: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  imageUrl: string;
  /** Bu kategoriyi vurgulamak için kullanılan marka tonunda renk (CSS hex) */
  accentColor?: string;
  startingPrice: number;
  productionTime: string;
  productCount: number;
  /** SEO için H1 altında uzun, organik metin */
  seoIntro?: string;
  /** Kategoriye dair "neden Markala" özellikleri */
  features?: string[];
  /** Kategoriye dair sık sorulan sorular — FAQ schema için */
  faqs?: FaqItem[];
  /** Kategoriye özel meta */
  seo?: SeoMeta;
}

export interface ProductOption {
  id: string;
  label: string;
  /** Bu seçenek seçilince taban fiyata eklenecek tutar (TL) */
  priceModifier: number;
  /** Bu seçenek seçilince taban fiyatı çarpan oranı (örn. 1.2 = %20 zam) */
  priceMultiplier?: number;
}

export type ParameterKind =
  | "radio"
  | "select"
  | "quantity"
  | "checkbox-group"
  | "dimension"
  | "matrix";

/** 2 boyutlu fiyat matrisi — satır = ebat / paket, sütun = adet */
export interface MatrixAxis {
  /** Eşsiz id (örn. "a4", "1000") */
  id: string;
  /** Birincil etiket (örn. "A4") */
  label: string;
  /** İkincil küçük etiket (örn. "21x30 cm") */
  sublabel?: string;
  /** Görsel gruplama (örn. "EKO", "LAK", "VIP") */
  group?: string;
}

export interface MatrixCell {
  /** Eşsiz hücre id'si — `${rowId}-${colId}` */
  id: string;
  rowId: string;
  colId: string;
  /** SKU / katalog kodu (örn. "ELI3", "CYP") */
  code?: string;
  /** KDV dahil sabit toplam fiyat (TL) */
  price: number;
  /** Hücre açıklaması (popover veya kart altı) */
  note?: string;
  /** "En çok tercih edilen" gibi rozet */
  badge?: string;
}

/**
 * Alan-bazlı (m²) ürünler için ek seçenek (vinil branda, folyo vb).
 * VinilTürk modelinden uyarlandı.
 */
export interface DimensionExtra {
  id: string;
  label: string;
  /** Sabit ek ücret (TL) */
  flatFee?: number;
  /** Çevre × m fiyatı (TL/m) — kolon dikiş gibi */
  perimeterPricePerM?: number;
  /** Sadece alan < 1m² olduğunda otomatik uygulanır (kullanıcı seçmez) */
  autoBelow1Sqm?: boolean;
}

export interface ProductParameter {
  id: string;
  label: string;
  kind: ParameterKind;
  required: boolean;
  /** "checkbox-group" hariç bir seçenek listesi gerektirir */
  options?: ProductOption[];
  /** "quantity" tipi için preset adetler */
  quantityPresets?: number[];
  /** "quantity" tipi için adet başına TL */
  unitPrice?: number;
  defaultOptionId?: string;

  // === "dimension" tipi için (en + boy → alan/çevre) ===
  /** TL / m² — temel birim fiyat */
  pricePerSqm?: number;
  /** Min en/boy (cm), default 30 */
  minDimension?: number;
  /** Max en/boy (cm), default 500 */
  maxDimension?: number;
  /** Default en (cm) */
  defaultWidth?: number;
  /** Default boy (cm) */
  defaultHeight?: number;
  /** Ek seçenekler — kullanıcı seçer (kolon dikiş, germe vb.) veya otomatik (1m² altı) */
  extras?: DimensionExtra[];

  // === "matrix" tipi için (örn. ebat × adet sabit fiyat tablosu) ===
  /** Satırlar (genelde ebat ya da paket) */
  rows?: MatrixAxis[];
  /** Sütunlar (genelde adet) */
  cols?: MatrixAxis[];
  /** Hücreler — her bir kombinasyon için sabit toplam fiyat */
  cells?: MatrixCell[];
  /** Default seçili hücre id (yoksa ilk hücre) */
  defaultCellId?: string;
  /** Üstte gösterilecek not (örn. "Tek Ebat 82x52 mm — Çift Yön Renkli") */
  matrixNote?: string;
}

export interface Product {
  slug: string;
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  /** Listeleme sayfasında "X TL'den başlayan fiyatlarla" için */
  startingPrice?: number;
  productionTime: string;
  /** Listeleme sayfasında ürün altında gösterilen ebat etiketi (örn. "85x55 cm") */
  sizeLabel?: string;
  images: string[];
  badges?: BadgeKind[];
  parameters: ProductParameter[];
  rating?: { average: number; count: number };
  /** Bu ürün anasayfada öne çıkacak mı (bestseller) */
  bestseller?: boolean;
  /** "Tasarım", "Üretim", "Kullanım" başlıklarıyla maddeler */
  features?: string[];
  /** Bu ürün hangi kullanım senaryolarında uygundur */
  useCases?: string[];
  /** Teknik özellik tablosu */
  specifications?: SpecItem[];
  /** Ürüne özel sık sorulan sorular */
  faqs?: FaqItem[];
  /** Ürünle birlikte sıkça sipariş edilen ek ürün slug'ları */
  relatedSlugs?: string[];
  /** Per-product SEO override (yoksa otomatik üretilir) */
  seo?: SeoMeta;
  /** Marka — JSON-LD Product için */
  brand?: string;
  /** GTIN/MPN gibi tanımlar (mock olarak slug üzerinden üretilir) */
  sku?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  company: string;
  rating: number;
  comment: string;
  productCategory?: string;
}

export interface ConfiguratorSelection {
  parameterId: string;
  optionId?: string;
  quantity?: number;
  checkedOptionIds?: string[];
}

export interface Brand {
  name: string;
  logoUrl: string;
}

export interface CampaignBanner {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  tone: "dark" | "brand" | "muted";
}

// === Kampanya Bundle paketleri ===

export interface CampaignBundleItem {
  quantity: number;
  productName: string;
  productSlug?: string;
  note?: string;
}

export type CampaignBundleCategory = "esnaf" | "kurumsal" | "etkinlik" | "acilis" | "promosyon";

export interface CampaignBundle {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  contents: CampaignBundleItem[];
  /** Tek tek alındığında ne tutardı */
  originalPrice: number;
  /** Paket fiyatı (indirimli) */
  bundlePrice: number;
  imageUrl: string;
  badge: string;
  /** "Son 12 paket" gibi vurgu */
  highlight?: string;
  category: CampaignBundleCategory;
  isActive: boolean;
  designSupport: boolean;
  sortOrder: number;
}

// === Sepet & Sipariş ===

/** Tek bir konfigüratör değeri — radio (string) / checkbox (string[]) / quantity (number) / dimension (object) */
export type ConfiguratorSelectionValue =
  | string
  | string[]
  | number
  | { width: number; height: number; extras: string[] };

export interface CartItemConfiguration {
  /** Konfigüratör seçimleri — paramId → seçim değeri */
  selections: Record<string, ConfiguratorSelectionValue>;
  /** Insanca okunabilir özet (sepet satırında görünür) */
  summary: string;
  /** Sepete eklenirken hesaplanan toplam fiyat */
  totalPrice: number;
  /** Tasarım desteği istendi mi */
  needsDesign: boolean;
  /** Yüklenen tasarım dosyası adı (mock için sadece dosya adı) */
  uploadedFileName?: string;
}

export interface CartItem {
  /** Eşsiz satır id'si — aynı ürünün farklı konfigleri ayrı satır */
  id: string;
  productSlug: string;
  productName: string;
  productImage: string;
  configuration: CartItemConfiguration;
  quantity: number;
}

// === User ===

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  /** "Bireysel" veya "Kurumsal" hesap */
  accountType: "individual" | "corporate";
  /** Kurumsalsa */
  companyName?: string;
  taxOffice?: string;
  taxNumber?: string;
}

export interface Address {
  id: string;
  label: string; // "Ev", "İş", vb.
  fullName: string;
  phone: string;
  city: string;
  district: string;
  fullAddress: string;
  zipCode?: string;
  isDefault: boolean;
}

// === Order ===

export type OrderStatus =
  | "siparis-alindi"
  | "tasarim-bekleniyor"
  | "tasarim-onayindi"
  | "uretimde"
  | "kargoya-verildi"
  | "teslim-edildi"
  | "iptal-edildi";

export interface OrderItem {
  productSlug: string;
  productName: string;
  productImage: string;
  configurationSummary: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export type TrackingEventStatus =
  | "siparis-alindi"
  | "siparis-onaylandi"
  | "uretimde"
  | "kalite-kontrol"
  | "paketlendi"
  | "kargoya-verildi"
  | "transfer-merkezinde"
  | "dagitima-cikti"
  | "teslim-edildi"
  | "teslim-edilemedi";

export interface TrackingEvent {
  status: TrackingEventStatus;
  label: string;
  description?: string;
  location?: string;
  timestamp: string; // ISO
  /** Tamamlandı mı, aktif mi, beklemede mi */
  state: "done" | "active" | "pending";
}

export interface Order {
  id: string;
  orderNumber: string;
  createdAt: string; // ISO
  status: OrderStatus;
  /** Misafir veya kayıtlı müşteri e-postası — kargo takip sayfasında doğrulama için */
  email?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discount: number;
  vat: number;
  total: number;
  shippingAddress: Address;
  billingAddress: Address;
  /** Mock kargo takip no */
  trackingNumber?: string;
  trackingCarrier?: string;
}

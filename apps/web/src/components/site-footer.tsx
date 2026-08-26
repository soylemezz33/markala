"use client";

import Link from "next/link";
import { Container } from "@markala/ui";
import {
  InstagramLogo,
  LinkedinLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { openCookieSettings } from "@/components/cookie-consent";

/**
 * Site footer — 2026-08-08 yenileme: koyu (marka charcoal) zemin + amber/cyan
 * gradient aksan şeridi; ödeme yöntemleri metin yerine marka-renkli logolarla.
 * "Hizmet Bölgeleri" (7 il local-SEO link bloğu) KALDIRILDI (kullanıcı kararı —
 * footer'ı uzatıyordu; /matbaa/* sayfaları yaşamaya ve sitemap'te kalmaya devam eder).
 */
export function SiteFooter() {
  return (
    <footer className="bg-[#191722] text-paper-100 mt-16">
      {/* Marka aksan şeridi — amber → cyan gradient */}
      <div
        aria-hidden
        className="h-1 bg-gradient-to-r from-brand-500 via-[#FF7A59] to-[#00D9FF]"
      />

      <Container className="py-14 md:py-16 grid md:grid-cols-12 gap-10 md:gap-12">
        {/* Logo + tagline + sosyal */}
        <div className="md:col-span-3">
          {/* Logonun koyu ögeleri koyu zeminde kaybolur → açık zeminli çip içinde */}
          <Link
            href="/"
            className="inline-block bg-paper-50 rounded-xl px-3.5 py-2.5 shadow-sm"
            aria-label="Markala — ana sayfa"
          >
            <img
              src="/markala-logo.svg"
              alt="markala.com.tr"
              width={113}
              height={38}
              className="h-9 w-auto"
            />
          </Link>
          <p className="mt-4 text-sm text-paper-100/70 leading-relaxed">
            Kartvizitten brandaya tüm baskı işleriniz — 324 Ajans güvencesiyle.
          </p>
          <div className="mt-5 flex items-center gap-2">
            <SocialLink href="https://instagram.com/markala.com.tr" label="Instagram"><InstagramLogo size={18} /></SocialLink>
            <SocialLink href="https://www.linkedin.com/company/324ajans" label="LinkedIn"><LinkedinLogo size={18} /></SocialLink>
            <SocialLink href="https://wa.me/905319004102" label="WhatsApp"><WhatsappLogo size={18} /></SocialLink>
          </div>
        </div>

        <FooterColumn title="Kurumsal">
          <FooterLink href="/hakkimizda">Hakkımızda</FooterLink>
          <FooterLink href="/referanslar">Referanslarımız</FooterLink>
          <FooterLink href="/portfolio">Portfolyo</FooterLink>
          <FooterLink href="/iletisim">İletişim</FooterLink>
          <FooterLink href="/iletisim#teklif">Teklif Al</FooterLink>
        </FooterColumn>

        <FooterColumn title="Müşteriler için">
          <FooterLink href="/hesabim">Hesabım</FooterLink>
          <FooterLink href="/sepet">Sepetim</FooterLink>
          <FooterLink href="/favorilerim">Favorilerim</FooterLink>
          <FooterLink href="/kargo-takip">Kargo Takip</FooterLink>
          <FooterLink href="/kampanyalar">İndirimli Paketler</FooterLink>
          <FooterLink href="/kurumsal">Kurumsal Hesap (B2B)</FooterLink>
          <FooterLink href="/kurumsal/basvuru">Kurumsal Başvuru</FooterLink>
          <FooterLink href="/yasal/kullanim-kosullari">Kullanım Şartları</FooterLink>
          <FooterLink href="/yasal/gizlilik">Gizlilik İlkesi ve KVKK</FooterLink>
          <FooterLink href="/kvkk-basvuru">KVKK Başvuru Formu</FooterLink>
        </FooterColumn>

        <FooterColumn title="Araçlar & Rehberler">
          <FooterLink href="/hizmetler/tasarim-destegi">Ücretsiz Tasarım Desteği</FooterLink>
          <FooterLink href="/numune-talebi">Ücretsiz Numune Kutusu</FooterLink>
          <FooterLink href="/hizmetler/toplu-baski">Toplu Baskı</FooterLink>
          <FooterLink href="/rehber/sablonlar">Ücretsiz Baskı Şablonları</FooterLink>
          <FooterLink href="/fiyat-listesi">Fiyat Listesi</FooterLink>
          <FooterLink href="/sozluk">Matbaa Sözlüğü</FooterLink>
          <FooterLink href="/blog">Blog & Rehberler</FooterLink>
          <FooterLink href="/yardim/dosya-hazirlama">Dosya Hazırlama Rehberi</FooterLink>
          <FooterLink href="/yardim/sss">Sıkça Sorulanlar</FooterLink>
          <FooterLink href="/yardim/iade">İade & Değişim</FooterLink>
        </FooterColumn>

        <FooterColumn title="Destek">
          <FooterLink href="/yardim">Yardım Merkezi</FooterLink>
          <FooterLink href="https://wa.me/905319004102" external>WhatsApp Destek</FooterLink>
          <FooterMailLink email="merhaba@markala.com.tr" />
          <FooterLink href="tel:+903244333351" external>0324 433 33 51</FooterLink>
          {/* KEP tebligat adresi — PTT KEP başvurusu tamamlandığında aktif edilecek */}
          {/* <FooterLink href="mailto:324ajans@hs01.kep.tr" external>KEP: 324ajans@hs01.kep.tr</FooterLink> */}
          <FooterLink href="/kvkk-basvuru">KVKK Başvuru Formu</FooterLink>
        </FooterColumn>
      </Container>

      {/* Güven + ödeme — koyu zeminde beyaz logo çipleri */}
      <div className="border-t border-white/10">
        <Container className="py-5 flex flex-wrap items-center justify-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <TrustBadge>SSL Sertifikalı</TrustBadge>
            <Link
              href="/kvkk-basvuru"
              className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-paper-100/80 font-medium hover:border-brand-400 hover:text-brand-300 transition-colors"
            >
              KVKK Uyumlu
            </Link>
            <TrustBadge>1-2 İş Günü Üretim</TrustBadge>
            <TrustBadge>81 İle Kargo</TrustBadge>
            {/* ETBİS kaydı tamamlandı (17.08.2026). Rozet, Ticaret Bakanlığı'nın bu siteye
                özel resmî sorgulama sonucuna linklenir — ziyaretçi kaydı doğrulayabilir. */}
            <a
              href="https://etbis.ticaret.gov.tr/tr/SiteSorgulamaSonuc?siteId=6c81d5f8-88a6-4899-8443-bc9f102db393"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded transition-colors hover:text-brand-700"
            >
              <TrustBadge>ETBİS Kayıtlı</TrustBadge>
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-paper-100/60 mr-1">Güvenli ödeme:</span>
            <VisaLogo />
            <MastercardLogo />
            <TroyLogo />
            <IyzicoLogo />
            <SecureBadge />
          </div>
        </Container>
      </div>

      {/* Ticari künye — kurumsal alıcının "kimden alıyorum?" sorusuna görünür cevap. */}
      <div className="border-t border-white/10">
        <Container className="py-4 text-xs text-paper-100/50 leading-relaxed">
          {/* Unvan, ETBİS kaydındaki resmî hâliyle yazılır — eskiden "ve Ticaret Limited
              Şirketi" kısmı eksikti. Kimlik bilgisinin site genelinde tutarlı olması
              Merchant Center'ın "Misrepresentation" değerlendirmesinde doğrudan bakılan
              kriterlerden biri (2026-08 denetimi). */}
          <span className="font-medium text-paper-100/80">
            324 Ajans Bilgi Teknolojileri Reklam Pazarlama ve Ticaret Limited Şirketi
          </span>
          {" · "}Menteş Mah. 100. Yıl Cumhuriyet Cad. No:59/A Yenişehir / Mersin
          {" · "}
          <Link href="tel:+903244333351" className="hover:text-paper-50">0324 433 33 51</Link>
          {" · "}
          <CfSafeHtml html={`<a href="mailto:merhaba@markala.com.tr" class="hover:text-paper-50">merhaba@markala.com.tr</a>`} />
          {" · "}KEP: <CfSafeHtml html="324ajans@hs03.kep.tr" />
          {" · "}
          <a
            href="https://etbis.ticaret.gov.tr/tr/SiteSorgulamaSonuc?siteId=6c81d5f8-88a6-4899-8443-bc9f102db393"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-paper-50 underline decoration-dotted underline-offset-2"
          >
            ETBİS kayıtlıdır (doğrula)
          </a>
        </Container>
      </div>

      {/* Alt bant — telif + yasal linkler */}
      <div className="border-t border-white/10">
        <Container className="py-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-paper-100/60">
          <div className="flex flex-wrap items-center gap-2">
            <span>Her hakkı saklıdır © {new Date().getFullYear()}</span>
            <Link href="/" className="text-brand-400 font-medium hover:underline">Markala.com.tr</Link>
            <span className="hidden md:inline mx-2">·</span>
            <span>324 Ajans alt markası</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/yasal/mesafeli-satis" className="hover:text-paper-50">Mesafeli Satış</Link>
            <Link href="/yasal/on-bilgilendirme" className="hover:text-paper-50">Ön Bilgilendirme</Link>
            <Link href="/yasal/cerez" className="hover:text-paper-50">Çerez Politikası</Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-paper-100/60 hover:text-paper-50 underline underline-offset-2 cursor-pointer"
            >
              Çerez Tercihlerim
            </button>
            <Link href="/yasal/iade" className="hover:text-paper-50">İade & İptal</Link>
            <Link href="/yasal/kargo" className="hover:text-paper-50">Kargolama</Link>
            <Link href="/kvkk-basvuru" className="hover:text-paper-50">KVKK Başvuru</Link>
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      {/* h4→h3: sayfada h3 olmadan h4 başlık sırası atlıyordu (PSI heading-order). Görsel aynı. */}
      <h3 className="text-paper-50 font-semibold text-sm mb-4 font-sans">{title}</h3>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

/**
 * E-POSTA + HİDRASYON (2026-08-26) — sitedeki en pahalı sessiz hataydı.
 *
 * Cloudflare'in "Email Address Obfuscation" özelliği, Next.js'in ürettiği HTML'i EDGE'DE
 * değiştiriyor: düz e-posta metnini `<span class="__cf_email__" data-cfemail="…">` haline
 * getirip bir çözücü script ekliyor. Tarayıcıdaki React ise kendi çıktısını (düz e-posta)
 * bekliyor; DOM tutmayınca React #418/#423 verip **tüm ağacı sıfırdan istemcide çiziyordu**
 * — yani her sayfa yüklemesinde sunucu render'ı çöpe gidiyor, ana iş parçacığı boşuna
 * yoruluyordu. Yerelde görünmez (yalnız Cloudflare arkasında olur), üretimde her sayfada vardı.
 *
 * Çözüm iki katmanlı — Cloudflare ayarına DOKUNMADAN (spam koruması korunur):
 *  1. `<!--email_off-->` işaretleri: Cloudflare'in dokümanlı "burayı değiştirme" yöntemi.
 *  2. dangerouslySetInnerHTML: React bu düğümün içeriğini hidrasyonda KARŞILAŞTIRMAZ →
 *     ayar ileride değişse/işaret çalışmasa bile hidrasyon bir daha kırılmaz.
 *
 * İçerik derleme-zamanı sabiti (kullanıcı girdisi yok) → XSS riski yok.
 */
function CfSafeHtml({ html }: { html: string }) {
  return <span dangerouslySetInnerHTML={{ __html: `<!--email_off-->${html}<!--email_on-->` }} />;
}

/** Footer listesinde e-posta bağlantısı — bkz. CfSafeHtml notu. */
function FooterMailLink({ email }: { email: string }) {
  return (
    <li>
      <CfSafeHtml
        html={`<a href="mailto:${email}" class="text-paper-100/70 hover:text-brand-300 transition-colors">${email}</a>`}
      />
    </li>
  );
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const cls = "text-paper-100/70 hover:text-brand-300 transition-colors";
  return (
    <li>
      {external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className={cls}>{children}</a>
      ) : (
        <Link href={href} className={cls}>{children}</Link>
      )}
    </li>
  );
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center bg-white/8 border border-white/15 text-paper-100 hover:bg-brand-500 hover:border-brand-500 hover:text-ink-900 transition-colors"
    >
      {children}
    </a>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded-full border border-white/15 bg-white/5 text-paper-100/80 font-medium">
      {children}
    </span>
  );
}

/* === Ödeme marka logoları ===
 * Harici görsel yok (CSP/self-contained) — marka renkli, beyaz çipli hafif SVG/tipografik
 * işaretler. Koyu zeminde beyaz çip, markaların kendi tanınır renklerini taşır. */

function PayChip({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex items-center justify-center h-7 min-w-[52px] px-2.5 rounded-md bg-white shadow-sm"
    >
      {children}
    </span>
  );
}

function VisaLogo() {
  return (
    <PayChip label="Visa">
      <span className="font-sans italic font-extrabold text-[13px] tracking-tight text-[#1A1F71] leading-none select-none">
        VISA
      </span>
    </PayChip>
  );
}

function MastercardLogo() {
  return (
    <PayChip label="Mastercard">
      <svg width="34" height="20" viewBox="0 0 34 20" aria-hidden="true">
        <circle cx="13" cy="10" r="8.5" fill="#EB001B" />
        <circle cx="21" cy="10" r="8.5" fill="#F79E1B" />
        <path
          d="M17 3.4a8.5 8.5 0 0 1 0 13.2 8.5 8.5 0 0 1 0-13.2Z"
          fill="#FF5F00"
        />
      </svg>
    </PayChip>
  );
}

function TroyLogo() {
  return (
    <PayChip label="Troy">
      <span className="font-sans font-extrabold text-[13px] tracking-tight text-[#00B5E2] leading-none select-none lowercase">
        troy
      </span>
    </PayChip>
  );
}

function IyzicoLogo() {
  return (
    <PayChip label="iyzico ile öde">
      <span className="font-sans font-extrabold text-[13px] tracking-tight text-[#1E64FF] leading-none select-none lowercase">
        iyzico
      </span>
    </PayChip>
  );
}

function SecureBadge() {
  return (
    <span
      role="img"
      aria-label="3D Secure"
      className="inline-flex items-center gap-1 h-7 px-2.5 rounded-md bg-white/10 border border-white/15"
    >
      <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden="true">
        <path
          d="M5.5 0 11 2v4.1c0 3.2-2.3 5.8-5.5 6.9C2.3 11.9 0 9.3 0 6.1V2L5.5 0Z"
          fill="#22C55E"
        />
        <path d="m4.8 8.1-1.7-1.7.8-.8.9.9 2.3-2.3.8.8-3.1 3.1Z" fill="#fff" />
      </svg>
      <span className="text-[10px] font-bold text-paper-100/90 leading-none">3D Secure</span>
    </span>
  );
}

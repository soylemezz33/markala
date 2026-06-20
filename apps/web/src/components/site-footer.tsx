"use client";

import Link from "next/link";
import { Container } from "@markala/ui";
import {
  InstagramLogo,
  LinkedinLogo,
  WhatsappLogo,
} from "@phosphor-icons/react/dist/ssr";
import { openCookieSettings } from "@/components/cookie-consent";

export function SiteFooter() {
  return (
    <footer className="bg-paper-100 border-t border-paper-200 mt-16">
      <Container className="py-14 md:py-20 grid md:grid-cols-12 gap-10 md:gap-12">
        {/* Logo + tagline + sosyal */}
        <div className="md:col-span-3">
          <Link href="/" className="inline-block">
            <span className="text-2xl font-serif font-semibold tracking-tight text-ink-900">
              Markala<span className="text-brand-500">.</span>
              <span className="text-sm text-ink-500 font-sans font-normal ml-1">com.tr</span>
            </span>
          </Link>
          <p className="mt-4 text-sm text-ink-700 leading-relaxed">
            markala.com.tr'yi sosyal medyada takip edin.
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
          <FooterLink href="/iletisim">İletişim</FooterLink>
          <FooterLink href="/iletisim#teklif">Teklif Al</FooterLink>
          <FooterLink href="/blog">Blog</FooterLink>
        </FooterColumn>

        <FooterColumn title="Müşteriler için">
          <FooterLink href="/hesabim">Hesabım</FooterLink>
          <FooterLink href="/sepet">Sepetim</FooterLink>
          <FooterLink href="/favorilerim">Favorilerim</FooterLink>
          <FooterLink href="/kargo-takip">Kargo Takip</FooterLink>
          <FooterLink href="/kampanyalar">Kampanyalar</FooterLink>
          <FooterLink href="/kurumsal">Kurumsal Hesap (B2B)</FooterLink>
          <FooterLink href="/kurumsal/basvuru">Kurumsal Başvuru</FooterLink>
          <FooterLink href="/yasal/kullanim-kosullari">Kullanım Şartları</FooterLink>
          <FooterLink href="/yasal/gizlilik">Gizlilik İlkesi ve KVKK</FooterLink>
          <FooterLink href="/kvkk-basvuru">KVKK Başvuru Formu</FooterLink>
        </FooterColumn>

        <FooterColumn title="Araçlar & Rehberler">
          <FooterLink href="/hizmetler/tasarim-destegi">Ücretsiz Tasarım Desteği</FooterLink>
          <FooterLink href="/hizmetler/toplu-baski">Toplu Baskı</FooterLink>
          <FooterLink href="/hizmetler/acil-baski">Acil Baskı</FooterLink>
          <FooterLink href="/fiyat-listesi">Fiyat Listesi</FooterLink>
          <FooterLink href="/sozluk">Matbaa Sözlüğü</FooterLink>
          <FooterLink href="/yardim/dosya-hazirlama">Dosya Hazırlama Rehberi</FooterLink>
          <FooterLink href="/yardim/sss">Sıkça Sorulanlar</FooterLink>
          <FooterLink href="/yardim/iade">İade & Değişim</FooterLink>
        </FooterColumn>

        <FooterColumn title="Destek">
          <FooterLink href="/yardim">Yardım Merkezi</FooterLink>
          <FooterLink href="https://wa.me/905319004102" external>WhatsApp Destek</FooterLink>
          <FooterLink href="mailto:merhaba@markala.com.tr" external>merhaba@markala.com.tr</FooterLink>
          <FooterLink href="tel:+903244333351" external>0324 433 33 51</FooterLink>
          {/* KEP tebligat adresi — PTT KEP başvurusu tamamlandığında aktif edilecek */}
          {/* <FooterLink href="mailto:324ajans@hs01.kep.tr" external>KEP: 324ajans@hs01.kep.tr</FooterLink> */}
          <FooterLink href="/kvkk-basvuru">KVKK Başvuru Formu</FooterLink>
        </FooterColumn>
      </Container>

      {/* Alt bant — telif + yasal linkler */}
      <div className="border-t border-paper-200">
        <Container className="py-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs text-ink-500">
          <div className="flex flex-wrap items-center gap-2">
            <span>Her hakkı saklıdır © {new Date().getFullYear()}</span>
            <Link href="/" className="text-brand-700 font-medium hover:underline">Markala.com.tr</Link>
            <span className="hidden md:inline mx-2">·</span>
            <span className="text-ink-500/80">324 Ajans alt markası</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/yasal/mesafeli-satis" className="hover:text-ink-900">Mesafeli Satış</Link>
            <Link href="/yasal/on-bilgilendirme" className="hover:text-ink-900">Ön Bilgilendirme</Link>
            <Link href="/yasal/cerez" className="hover:text-ink-900">Çerez Politikası</Link>
            <button
              type="button"
              onClick={openCookieSettings}
              className="text-ink-500 hover:text-ink-900 underline underline-offset-2 cursor-pointer"
            >
              Çerez Tercihlerim
            </button>
            <Link href="/yasal/iade" className="hover:text-ink-900">İade & İptal</Link>
            <Link href="/yasal/kargo" className="hover:text-ink-900">Kargolama</Link>
            <Link href="/kvkk-basvuru" className="hover:text-ink-900">KVKK Başvuru</Link>
          </div>
        </Container>
      </div>

      {/* Hizmet bölgeleri — Local SEO internal linking */}
      <div className="border-t border-paper-200 bg-paper-50">
        <Container className="py-8">
          <div className="text-xs uppercase tracking-wider text-ink-500 font-semibold mb-4">
            Hizmet Bölgeleri
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-x-4 gap-y-2 text-sm">
            <FooterCityLink href="/matbaa/mersin">Mersin Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/antalya">Antalya Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/adana">Adana Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/sanliurfa">Şanlıurfa Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/hatay">Hatay Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/osmaniye">Osmaniye Matbaa</FooterCityLink>
            <FooterCityLink href="/matbaa/gaziantep">Gaziantep Matbaa</FooterCityLink>
          </div>
          <div className="mt-3 text-xs text-ink-500">
            Mersin ilçeleri:{" "}
            <Link href="/matbaa/mersin/tarsus" className="hover:text-ink-900 underline">Tarsus</Link>
            {" · "}
            <Link href="/matbaa/mersin/yenisehir" className="hover:text-ink-900 underline">Yenişehir</Link>
            {" · "}
            <Link href="/matbaa/mersin/akdeniz" className="hover:text-ink-900 underline">Akdeniz</Link>
            {" · "}
            <Link href="/matbaa/mersin/toroslar" className="hover:text-ink-900 underline">Toroslar</Link>
            {" · "}
            <Link href="/matbaa/mersin/mezitli" className="hover:text-ink-900 underline">Mezitli</Link>
            {" · "}
            <Link href="/matbaa/mersin/erdemli" className="hover:text-ink-900 underline">Erdemli</Link>
            {" · "}
            <Link href="/matbaa/mersin/silifke" className="hover:text-ink-900 underline">Silifke</Link>
            {" · "}
            <Link href="/matbaa/mersin/anamur" className="hover:text-ink-900 underline">Anamur</Link>
          </div>
        </Container>
      </div>

      {/* Güven rozetleri */}
      <div className="border-t border-paper-200 bg-paper-50">
        <Container className="py-4 flex flex-wrap items-center justify-center md:justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-ink-500">
            <TrustBadge>SSL Sertifikalı</TrustBadge>
            <Link href="/kvkk-basvuru" className="px-2.5 py-1 rounded border border-paper-200 bg-paper-50 text-ink-700 font-medium hover:border-brand-300 hover:text-brand-700 transition-colors">
              KVKK Uyumlu
            </Link>
            <TrustBadge>1-2 İş Günü Üretim</TrustBadge>
            <TrustBadge>81 İl Kargo</TrustBadge>
            {/* ETBİS rozeti — ETBİS kaydı tamamlandığında etbis.gtb.gov.tr'den resmi rozet kodu alınacak */}
            {/* <a href="https://etbis.gtb.gov.tr" target="_blank" rel="noopener noreferrer"><TrustBadge>ETBİS Kayıtlı</TrustBadge></a> */}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
            <span>Ödeme:</span>
            <PaymentBrand label="Kredi / Banka Kartı" />
            <PaymentBrand label="3D Secure" />
            <PaymentBrand label="iyzico" />
          </div>
        </Container>
      </div>
    </footer>
  );
}

function FooterCityLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-ink-700 hover:text-ink-900 hover:underline transition-colors"
    >
      {children}
    </Link>
  );
}

function FooterColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="md:col-span-2">
      <h4 className="text-ink-900 font-medium text-sm mb-4 font-sans">{title}</h4>
      <ul className="space-y-2.5 text-sm">{children}</ul>
    </div>
  );
}

function FooterLink({ href, external, children }: { href: string; external?: boolean; children: React.ReactNode }) {
  const cls = "text-ink-700 hover:text-ink-900 hover:underline transition-colors";
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
      className="w-9 h-9 rounded-full flex items-center justify-center bg-paper-50 border border-paper-200 text-ink-700 hover:bg-brand-500 hover:border-brand-500 hover:text-ink-900 transition-colors"
    >
      {children}
    </a>
  );
}

function TrustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2.5 py-1 rounded border border-paper-200 bg-paper-50 text-ink-700 font-medium">{children}</span>
  );
}

function PaymentBrand({ label }: { label: string }) {
  return (
    <span className="px-2 py-0.5 rounded border border-paper-200 bg-paper-50 text-ink-700 font-mono text-[10px] font-bold tracking-tight">{label}</span>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kurumsal Baskı Çözümleri | Markala',
  description: 'Şirketiniz için toplu baskı hizmetleri. Kartvizit, broşür, katalog, afiş ve daha fazlası. %10-30 toplu indirim, e-arşiv fatura, 81 ile teslimat.',
  openGraph: {
    title: 'Kurumsal Baskı Çözümleri | Markala',
    description: 'Şirketiniz için toplu baskı hizmetleri. %10-30 toplu indirim, e-arşiv fatura.',
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

const advantages = [
  { icon: '💰', title: '%10–30 Toplu İndirim', desc: '500 adet ve üzeri siparişlerde otomatik indirim uygulanır.' },
  { icon: '🧾', title: 'E-Arşiv Fatura', desc: 'Her siparişe yasal e-arşiv fatura. KDV\'li ya da KDV\'siz.' },
  { icon: '🚚', title: 'Anlaşmalı Kargo', desc: 'Büyük siparişlerde kargo ücreti iade. Türkiye geneli 81 ile.' },
  { icon: '⚡', title: 'Öncelikli Üretim', desc: 'Kurumsal siparişler üretim kuyruğunda öncelik kazanır.' },
  { icon: '📦', title: 'Özel Ambalaj', desc: 'Logolu kutu ve ambalaj seçeneği. Kurumsal hediye paketi.' },
  { icon: '🤝', title: 'Özel Hesap Yöneticisi', desc: 'Büyük hesaplara ayrılmış iletişim hattı ve destek.' },
];

const services = [
  { icon: '💼', name: 'Kartvizit', desc: '500–10.000 adet, tek veya çift taraflı' },
  { icon: '📄', name: 'Broşür', desc: 'A4, A5, üçlü katlama, 50 gr\'a kadar kağıt' },
  { icon: '📚', name: 'Katalog', desc: 'Dikişli veya spiralli, renk tutarlılığı garantili' },
  { icon: '🖼️', name: 'Afiş & Poster', desc: 'A0\'a kadar, matt veya parlak selefon' },
  { icon: '🏷️', name: 'Etiket', desc: 'Rulo veya tabaka, özel kesim seçeneği' },
  { icon: '📦', name: 'Ambalaj', desc: 'Kutulama, wrap, kurumsal hediye seti' },
];

const steps = [
  { n: '1', title: 'Teklif İste', desc: 'WhatsApp veya form aracılığıyla ürün, adet ve teslimat tarihinizi bildirin.' },
  { n: '2', title: 'Tasarım Gönder', desc: 'Hazır tasarımınızı veya brief\'inizi paylaşın. Gerekirse ücretsiz şablon sunuyoruz.' },
  { n: '3', title: 'Teslim Al', desc: '81 ile anlaşmalı kargo ile kapınıza. Fatura ile birlikte.' },
];

const faqs = [
  { q: 'Minimum sipariş adeti nedir?', a: 'Kurumsal fiyatlandırma için minimum 500 adet önerilir. Daha küçük adetler için standart fiyatlar geçerlidir.' },
  { q: 'Fatura kesiyor musunuz?', a: 'Evet, tüm siparişlere e-arşiv fatura kesilir. Şirket bilgilerinizi bildirmeniz yeterlidir.' },
  { q: 'Dosya formatı olarak ne göndermeliyim?', a: 'CMYK renk modunda PDF (baskıya hazır) tercih edilir. Tasarımınız yoksa AI veya PSD\'yi de değerlendiririz.' },
  { q: 'Kargo süresi ne kadar?', a: 'Üretim 2-5 iş günü, kargo 1-2 iş günüdür. Acil siparişler için iletişime geçin.' },
  { q: 'Kurumsal anlaşma yapabilir miyiz?', a: 'Evet. Yıllık hacme göre özel fiyatlandırma ve öncelikli hizmet anlaşmaları yapılabilir.' },
];

const WHATSAPP = 'https://wa.me/905300000000?text=Merhaba%2C%20kurumsal%20bask%C4%B1%20teklifi%20almak%20istiyorum.';

export default function KurumsalPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#4B3AA0] text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Kurumsal Baskı Çözümleri</h1>
        <p className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-purple-100">
          Şirketinizin ihtiyaçlarına özel toplu baskı hizmetleri. Toplu indirim, e-arşiv fatura ve öncelikli üretim ile yanınızdayız.
        </p>
        <a
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#FFB91C] text-[#1a1a2e] font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-400 transition"
        >
          WhatsApp&apos;tan Teklif Al
        </a>
      </section>

      {/* Advantages */}
      <section className="py-16 px-4 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Kurumsal Avantajlar</h2>
        <p className="text-center text-gray-500 mb-10">Markala kurumsal müşterileri için özel ayrıcalıklar</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {advantages.map((a) => (
            <div key={a.title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="text-4xl mb-3">{a.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{a.title}</h3>
              <p className="text-gray-500 text-sm">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Hizmetlerimiz</h2>
          <p className="text-center text-gray-500 mb-10">Kurumsal siparişe uygun tüm baskı ürünleri</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {services.map((s) => (
              <div key={s.name} className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="text-3xl mb-2">{s.icon}</div>
                <h3 className="font-semibold text-gray-800 text-sm">{s.name}</h3>
                <p className="text-gray-400 text-xs mt-1">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-2 text-gray-900">Nasıl Çalışır?</h2>
        <p className="text-center text-gray-500 mb-10">Üç adımda kurumsal sipariş</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s) => (
            <div key={s.n} className="text-center">
              <div className="w-12 h-12 rounded-full bg-[#4B3AA0] text-white font-bold text-xl flex items-center justify-center mx-auto mb-4">
                {s.n}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Min order */}
      <section className="py-10 px-4 bg-[#4B3AA0] text-white text-center">
        <p className="text-lg">
          <span className="font-bold">Minimum sipariş:</span> 500 adet ve üzeri siparişlerde kurumsal fiyatlandırma aktif olur.
        </p>
        <p className="text-purple-200 text-sm mt-1">Daha küçük adetler için standart fiyatlarımız geçerlidir.</p>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900">Sık Sorulan Sorular</h2>
        <div className="space-y-4">
          {faqs.map((f) => (
            <details key={f.q} className="bg-white border border-gray-200 rounded-xl p-5 group">
              <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                {f.q}
                <span className="text-[#4B3AA0] ml-2 group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="text-gray-600 mt-3 text-sm">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 px-4 text-center bg-gray-50">
        <h2 className="text-2xl font-bold mb-4 text-gray-900">Kurumsal Teklifinizi Alın</h2>
        <p className="text-gray-500 mb-8 max-w-xl mx-auto">
          Ürün, adet ve teslimat tarihinizi bildirin — size özel fiyat ve üretim planı hazırlayalım.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href={WHATSAPP}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#FFB91C] text-[#1a1a2e] font-bold py-3 px-8 rounded-full text-lg hover:bg-yellow-400 transition"
          >
            WhatsApp&apos;tan Teklif Al
          </a>
          <Link
            href="/iletisim"
            className="inline-block border-2 border-[#4B3AA0] text-[#4B3AA0] font-bold py-3 px-8 rounded-full text-lg hover:bg-purple-50 transition"
          >
            Form ile İletişim
          </Link>
        </div>
      </section>
    </main>
  );
}

'use client';

import { useState, type FormEvent } from 'react';

const konular = [
  'Genel Bilgi',
  'Sipariş Takibi',
  'Kurumsal Fiyatlandırma',
  'Tasarım Yardımı',
  'Teknik Sorun',
  'Diğer',
];

type FormState = {
  ad: string;
  email: string;
  telefon: string;
  konu: string;
  mesaj: string;
};

export default function IletisimPage() {
  const [form, setForm] = useState<FormState>({
    ad: '',
    email: '',
    telefon: '',
    konu: konular[0] ?? '',
    mesaj: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  function handle(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/iletisim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setStatus('success');
        setForm({ ad: '', email: '', telefon: '', konu: konular[0] ?? '', mesaj: '' });
      } else {
        const data = await res.json();
        setErrorMsg(data.error ?? 'Bir hata oluştu.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Bağlantı hatası. İnternet bağlantınızı kontrol edin.');
      setStatus('error');
    }
  }

  const WHATSAPP = 'https://wa.me/905300000000?text=Merhaba%2C%20bilgi%20almak%20istiyorum.';

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#4B3AA0] text-white py-14 px-4 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">İletişim</h1>
        <p className="text-purple-200 text-lg">Size yardımcı olmaktan mutluluk duyarız.</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact info */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Bize Ulaşın</h2>

          <div className="space-y-5 text-gray-700">
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📱</span>
              <div>
                <p className="font-semibold">WhatsApp (En Hızlı)</p>
                <a
                  href={WHATSAPP}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#4B3AA0] underline"
                >
                  WhatsApp ile mesaj gönder
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">📧</span>
              <div>
                <p className="font-semibold">E-posta</p>
                <a href="mailto:info@markala.com.tr" className="text-[#4B3AA0] underline">
                  info@markala.com.tr
                </a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🕐</span>
              <div>
                <p className="font-semibold">Çalışma Saatleri</p>
                <p>Pazartesi – Cuma: 09:00 – 18:00</p>
                <p>Cumartesi: 10:00 – 14:00</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl mt-0.5">🚚</span>
              <div>
                <p className="font-semibold">Teslimat</p>
                <p>Türkiye geneli 81 ile kargo</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <a
              href={WHATSAPP}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-[#FFB91C] text-[#1a1a2e] font-bold py-3 px-7 rounded-full hover:bg-yellow-400 transition"
            >
              WhatsApp&apos;tan Teklif Al
            </a>
          </div>
        </div>

        {/* Form */}
        <div>
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Mesaj Gönder</h2>

          {status === 'success' ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <p className="text-2xl mb-2">✅</p>
              <p className="font-semibold text-green-800">Mesajınız alındı!</p>
              <p className="text-green-700 text-sm mt-1">
                En kısa sürede size dönüş yapacağız. Acil sorular için WhatsApp&apos;ı kullanabilirsiniz.
              </p>
              <button
                onClick={() => setStatus('idle')}
                className="mt-4 text-sm text-[#4B3AA0] underline"
              >
                Yeni mesaj gönder
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ad">
                  Ad Soyad <span className="text-red-500">*</span>
                </label>
                <input
                  id="ad"
                  name="ad"
                  type="text"
                  required
                  value={form.ad}
                  onChange={handle}
                  placeholder="Ahmet Yılmaz"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B3AA0]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  E-posta <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handle}
                  placeholder="ahmet@sirket.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B3AA0]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telefon">
                  Telefon (isteğe bağlı)
                </label>
                <input
                  id="telefon"
                  name="telefon"
                  type="tel"
                  value={form.telefon}
                  onChange={handle}
                  placeholder="0532 000 00 00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B3AA0]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="konu">
                  Konu
                </label>
                <select
                  id="konu"
                  name="konu"
                  value={form.konu}
                  onChange={handle}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B3AA0]"
                >
                  {konular.map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="mesaj">
                  Mesaj <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="mesaj"
                  name="mesaj"
                  required
                  value={form.mesaj}
                  onChange={handle}
                  rows={5}
                  placeholder="Nasıl yardımcı olabiliriz?"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#4B3AA0] resize-none"
                />
              </div>

              {status === 'error' && (
                <p className="text-red-600 text-sm">{errorMsg}</p>
              )}

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-[#FFB91C] text-[#1a1a2e] font-bold py-3 px-6 rounded-full hover:bg-yellow-400 transition disabled:opacity-60"
              >
                {status === 'sending' ? 'Gönderiliyor…' : 'Mesaj Gönder'}
              </button>

              <p className="text-xs text-gray-400 text-center">
                Acil sipariş için{' '}
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="underline text-[#4B3AA0]">
                  WhatsApp
                </a>
                &apos;ı tercih edin.
              </p>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

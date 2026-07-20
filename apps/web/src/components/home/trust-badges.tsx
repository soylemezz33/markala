"use client";

import { motion } from "framer-motion";
import { Truck, PenNib, Clock, SquaresFour } from "@phosphor-icons/react";
import { Container } from "@markala/ui";

// Kanonik değer önerisi 4'lüsü — docs/marka-kimligi.md §1 (sözlük dışı ad-hoc rozet üretilmez;
// "Güvenli Teslimat" sözlükten çıkarıldığı için kaldırıldı).
const badges = [
  {
    icon: PenNib,
    title: "Ücretsiz Tasarım Desteği",
    desc: "Tasarımın hazır değilse ekibimiz senin için ücretsiz hazırlar.",
  },
  {
    icon: Clock,
    title: "1–2 İş Günü Üretim",
    desc: "Onay sonrası siparişin 1–2 iş gününde üretilir.",
  },
  {
    icon: Truck,
    title: "81 İle Kargo",
    desc: "Siparişin Türkiye'nin 81 iline güvenle ulaşır.",
  },
  {
    icon: SquaresFour,
    title: "Tek Panelde 30+ Ürün",
    desc: "Kartvizitten brandaya tüm baskı ihtiyaçların tek panelde.",
  },
];

export function TrustBadges() {
  return (
    <section className="bg-paper-50 py-12 md:py-16 border-t border-paper-200">
      <Container>
        <motion.ul
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {badges.map((b) => (
            <motion.li
              key={b.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="text-center px-2"
            >
              <div className="inline-flex w-12 h-12 items-center justify-center text-brand-500 mb-3">
                <b.icon size={32} weight="regular" />
              </div>
              {/* Kart etiketi — doküman başlığı DEĞİL: <h3> kullanmak h1→h3 seviye
                  atlaması yaratıyordu (a11y). Görünüm aynı, semantik <p>. */}
              <p className="font-semibold text-ink-900 text-base">{b.title}</p>
              <p className="mt-2 text-sm text-ink-500 leading-relaxed">{b.desc}</p>
            </motion.li>
          ))}
        </motion.ul>
      </Container>
    </section>
  );
}

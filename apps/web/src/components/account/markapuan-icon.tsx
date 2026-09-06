/**
 * MarkaPuan ikonu — "M" harfli altın madeni para (2026-09-06, Hasan: "güzel bir M coin ikonu").
 * Tek SVG, harici görsel yok; boyut `size` ile, renkler marka sarısı tonlarında sabit
 * (koyu zeminde de aynı okunur). aria-hidden: yanındaki metin anlamı taşır.
 */
export function MarkaPuanIcon({ size = 28, className }: { size?: number; className?: string }) {
  const id = "mp-" + size;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={`${id}-g`} x1="8" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFE58A" />
          <stop offset="0.45" stopColor="#F2B900" />
          <stop offset="1" stopColor="#C98A00" />
        </linearGradient>
        <linearGradient id={`${id}-r`} x1="56" y1="8" x2="10" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#FFF3C2" />
          <stop offset="1" stopColor="#D69A00" />
        </linearGradient>
      </defs>
      {/* Kalınlık: alttaki koyu disk paranın kenarını verir */}
      <circle cx="33" cy="34" r="29" fill="#9A6B00" />
      <circle cx="31" cy="31" r="29" fill={`url(#${id}-g)`} />
      {/* Kenar tırtığı hissi: ince halka */}
      <circle cx="31" cy="31" r="23.5" fill="none" stroke={`url(#${id}-r)`} strokeWidth="2.5" />
      <circle cx="31" cy="31" r="20" fill="none" stroke="#B37D00" strokeOpacity="0.35" strokeWidth="1" />
      {/* M harfi: gövde gölgesi + açık yüz */}
      <path d="M18 43V19h6.2l6.8 12.4L37.8 19H44v24h-5.6V28.6l-6.4 11.3h-2L23.6 28.6V43H18Z" fill="#7A5400" transform="translate(1.2 1.4)" />
      <path d="M18 43V19h6.2l6.8 12.4L37.8 19H44v24h-5.6V28.6l-6.4 11.3h-2L23.6 28.6V43H18Z" fill="#FFF8DE" />
      {/* Parlama */}
      <path d="M14 20c4-8 12-12 21-11" stroke="#FFFFFF" strokeOpacity="0.55" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

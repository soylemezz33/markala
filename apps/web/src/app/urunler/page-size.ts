/**
 * /urunler sayfalama boyutu — hem server (out-of-range 404 guard'ı, page.tsx) hem
 * client (dilimleme, all-products-client.tsx) buradan okur; ikisi ayrışırsa SEO
 * canonical'ları ile görünen içerik tutarsızlaşır.
 */
export const URUNLER_PAGE_SIZE = 12;

import type { Metadata } from "next";
import { DesignEditorLoader } from "@/components/design/design-editor-loader";

// Editör ağır client bundle + ssr:false → boş SSR HTML. SEO değersiz, indexleme kapalı.
export const metadata: Metadata = {
  title: "Online Tasarım Aracı",
  description: "Tarayıcıda kendi baskı tasarımını oluştur.",
  robots: { index: false, follow: false },
};

// Şu an POC: ürün/şablon parametreleri (urun, design) sonraki fazda bağlanacak.
export default function TasarimAraciPage() {
  return <DesignEditorLoader />;
}

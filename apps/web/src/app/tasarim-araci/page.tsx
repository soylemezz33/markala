import type { Metadata } from "next";
import { DesignEditorLoader } from "@/components/design/design-editor-loader";
import { getCanvasSpec } from "@/lib/design/canvas-spec";

// Editör ağır client bundle + ssr:false → boş SSR HTML. SEO değersiz, indexleme kapalı.
export const metadata: Metadata = {
  title: "Online Tasarım Aracı",
  description: "Tarayıcıda kendi baskı tasarımını oluştur.",
  robots: { index: false, follow: false },
};

// ?urun=<key> → editör canvas ebadı (geçersizse kartvizit). ?design= sonraki fazda (kaydet/yükle).
export default function TasarimAraciPage({
  searchParams,
}: {
  searchParams?: { urun?: string; design?: string };
}) {
  const spec = getCanvasSpec(searchParams?.urun);
  return <DesignEditorLoader specKey={spec.key} designId={searchParams?.design} />;
}

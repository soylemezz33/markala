import Link from "next/link";
import { Container } from "@markala/ui";
import { Warning } from "@phosphor-icons/react/dist/ssr";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* TASLAK uyarı bandı — hukuk müşaviri onayı tamamlanana kadar gösterilir */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <Container className="py-2.5 max-w-5xl">
          <div className="flex items-center gap-2 text-sm text-yellow-800">
            <Warning size={16} weight="fill" className="shrink-0 text-yellow-600" />
            <span>
              <strong>TASLAK:</strong> Bu belge hukuk müşaviri incelemesinden geçmemiştir; yayına
              alınmadan önce onay zorunludur. Yayın öncesi son halini{" "}
              <Link href="/yasal/kvkk" className="underline font-medium hover:text-yellow-900">
                yasal sayfasında
              </Link>{" "}
              bulabilirsiniz.
            </span>
          </div>
        </Container>
      </div>
      {children}
    </>
  );
}

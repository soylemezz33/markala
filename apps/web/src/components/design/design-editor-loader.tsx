"use client";

import dynamic from "next/dynamic";

// Fabric.js `window`'a dokunur → ssr:false ZORUNLU. Next 14'te ssr:false yalnız client
// bileşeninde kullanılabilir; bu loader o sınırı sağlar (page.tsx server kalır, metadata/noindex orada).
const DesignEditor = dynamic(
  () => import("./design-editor").then((m) => m.DesignEditor),
  {
    ssr: false,
    loading: () => (
      <div className="grid min-h-[70vh] place-items-center text-ink-500">
        Tasarım aracı yükleniyor…
      </div>
    ),
  },
);

export function DesignEditorLoader({ specKey }: { specKey?: string }) {
  return <DesignEditor specKey={specKey} />;
}

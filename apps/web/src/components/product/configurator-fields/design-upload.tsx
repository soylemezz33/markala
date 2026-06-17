"use client";

import { cn } from "@markala/ui";
import { UploadSimple, CheckCircle } from "@phosphor-icons/react";
import { useConfigurator } from "./context";

export function DesignUpload() {
  const { state, dispatch } = useConfigurator();
  const { needsDesign, uploadedFileName } = state;

  const MAX_MB = 200;

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && file.size > MAX_MB * 1024 * 1024) {
      alert(`Dosya çok büyük (maks. ${MAX_MB} MB). Daha küçük bir dosya seçin veya sipariş sonrası WhatsApp ile gönderin.`);
      e.target.value = "";
      return;
    }
    dispatch({ type: "UPLOAD_FILE", file });
  }

  return (
    <div className="border-t border-paper-200 pt-6">
      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-sm font-medium text-ink-900">
          Tasarım desteği istiyorum
          <span className="block text-xs text-ink-500 font-normal mt-0.5">
            Profesyonel grafik ekibimiz sizin için hazırlasın — ücretsiz.
          </span>
        </span>
        <button
          type="button"
          onClick={() => dispatch({ type: "TOGGLE_DESIGN_HELP" })}
          className={cn(
            "relative w-11 h-6 rounded-full transition-colors flex-none",
            needsDesign ? "bg-brand-500" : "bg-paper-200",
          )}
          role="switch"
          aria-checked={needsDesign}
          aria-label="Tasarım desteği istiyorum"
        >
          <span
            className={cn(
              "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform",
              needsDesign && "translate-x-5",
            )}
          />
        </button>
      </label>

      {!needsDesign && (
        <label className="mt-4 block border-2 border-dashed border-paper-200 rounded-md p-6 text-center hover:border-ink-300 transition-colors cursor-pointer">
          <input
            type="file"
            className="hidden"
            accept=".ai,.pdf,.cdr,.psd,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
          />
          {uploadedFileName ? (
            <>
              <CheckCircle size={28} className="mx-auto text-success" />
              <p className="mt-2 text-sm font-medium text-ink-900 break-all">{uploadedFileName}</p>
              <p className="mt-1 text-xs text-ink-500">
                Dosya adı kaydedildi. Baskı dosyanızı sipariş onayından sonra e-posta / WhatsApp ile ileteceğiz.
              </p>
            </>
          ) : (
            <>
              <UploadSimple size={28} className="mx-auto text-ink-500" />
              <p className="mt-2 text-sm font-medium text-ink-900">Tasarım dosyanızı yükleyin</p>
              <p className="mt-1 text-xs text-ink-500">
                AI, PDF, CDR, PSD, JPG, PNG · Maks. 200 MB
              </p>
            </>
          )}
        </label>
      )}
    </div>
  );
}

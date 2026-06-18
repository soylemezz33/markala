"use client";

import { useState } from "react";
import { cn } from "@markala/ui";
import { UploadSimple, CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import { useConfigurator } from "./context";

const MAX_MB = 50;

export function DesignUpload() {
  const { state, dispatch } = useConfigurator();
  const { needsDesign, uploadedFileName, uploadedFileUrl } = state;
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Dosya çok büyük (maks. ${MAX_MB} MB). Lütfen sipariş sonrası WhatsApp ile gönderin.`);
      input.value = "";
      return;
    }

    setError(null);
    setUploading(true);
    // Seçilen dosyayı hemen state'e koy (ad görünsün); URL yükleme bitince eklenir.
    dispatch({ type: "UPLOAD_FILE", file });

    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/tasarim-yukle", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        url?: string;
        fileName?: string;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.url) {
        throw new Error(data.error || "Dosya yüklenemedi.");
      }
      dispatch({
        type: "SET_UPLOADED_URL",
        fileName: data.fileName || file.name,
        url: data.url,
      });
    } catch (err) {
      setError(
        err instanceof Error && err.message
          ? `Yükleme başarısız: ${err.message}`
          : "Dosya yüklenemedi. Lütfen tekrar deneyin.",
      );
      dispatch({ type: "UPLOAD_FILE", file: null });
      input.value = "";
    } finally {
      setUploading(false);
    }
  }

  const uploaded = Boolean(uploadedFileUrl);

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
        <label
          className={cn(
            "mt-4 block border-2 border-dashed rounded-md p-6 text-center transition-colors",
            uploading
              ? "border-paper-200 cursor-wait"
              : "border-paper-200 hover:border-ink-300 cursor-pointer",
          )}
        >
          <input
            type="file"
            className="hidden"
            accept=".ai,.eps,.pdf,.cdr,.psd,.tif,.tiff,.zip,.rar,.jpg,.jpeg,.png"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          {uploading ? (
            <>
              <SpinnerGap size={28} className="mx-auto text-ink-500 animate-spin" />
              <p className="mt-2 text-sm font-medium text-ink-900">Yükleniyor…</p>
              <p className="mt-1 text-xs text-ink-500 break-all">{uploadedFileName}</p>
            </>
          ) : uploaded ? (
            <>
              <CheckCircle size={28} className="mx-auto text-success" weight="fill" />
              <p className="mt-2 text-sm font-medium text-ink-900 break-all">{uploadedFileName}</p>
              <p className="mt-1 text-xs text-success">✓ Yüklendi · değiştirmek için tıklayın</p>
            </>
          ) : (
            <>
              <UploadSimple size={28} className="mx-auto text-ink-500" />
              <p className="mt-2 text-sm font-medium text-ink-900">Tasarım dosyanızı yükleyin</p>
              <p className="mt-1 text-xs text-ink-500">Maks. 50 MB · AI, PDF, CDR, PSD, JPG, PNG</p>
            </>
          )}
        </label>
      )}

      {error && (
        <p className="mt-3 flex items-start gap-2 text-xs text-error bg-error/10 border border-error/20 rounded-md px-3 py-2">
          <WarningCircle size={14} className="flex-none mt-0.5" weight="fill" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ApiSettingsClient } from "./api-settings-client";

export default async function ApiSettingsPage() {
  // Kayıtlı entegrasyon ayarları (anahtarlar "integration.<id>.<field>").
  // Hata olursa boş başlat (form yine açılır, kayıt yine denenebilir).
  let initial: Record<string, unknown> = {};
  let loadError = false;
  try {
    const api = await getAdminApi();
    initial = await api.settings.get("integration");
  } catch {
    loadError = true;
  }

  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ApiSettingsClient initial={initial} />
    </>
  );
}

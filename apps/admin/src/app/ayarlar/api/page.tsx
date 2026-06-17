import { getAdminApi } from "@/lib/api";
import { ApiSettingsClient } from "./api-settings-client";

export default async function ApiSettingsPage() {
  const api = await getAdminApi();
  // Kayıtlı entegrasyon ayarları (anahtarlar "integration.<id>.<field>").
  // Hata olursa boş başlat (form yine açılır, kayıt yine denenebilir).
  let initial: Record<string, unknown> = {};
  try {
    initial = await api.settings.get("integration");
  } catch {
    initial = {};
  }

  return <ApiSettingsClient initial={initial} />;
}

import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { MenuClient } from "./menu-client";
import { DEFAULT_NAV, type NavCategory } from "./default-nav";

/**
 * Header Menü Yöneticisi (Faz 1) — storefront header navigasyonunu yönetir.
 * Kayıt (header_nav SiteSetting) varsa onu, yoksa fabrika DEFAULT_NAV'ı düzenlemeye açar.
 */
export default async function MenuPage() {
  let initial: NavCategory[] = DEFAULT_NAV;
  let hasSaved = false;
  let loadError = false;
  try {
    const api = await getAdminApi();
    const settings = await api.settings.get("header");
    const saved = settings["header_nav"];
    if (Array.isArray(saved) && saved.length > 0) {
      initial = saved as NavCategory[];
      hasSaved = true;
    }
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <MenuClient initial={initial} hasSaved={hasSaved} />
    </>
  );
}

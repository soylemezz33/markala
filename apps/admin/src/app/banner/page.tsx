import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { BannerClient } from "./banner-client";

export default async function BannerAdminPage() {
  let banners: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    banners = await api.banners.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <BannerClient banners={banners as never} />
    </>
  );
}

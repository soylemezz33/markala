import { getAdminApi } from "@/lib/api";
import { BannerClient } from "./banner-client";

export default async function BannerAdminPage() {
  const api = await getAdminApi();
  const banners = await api.banners.list();
  return <BannerClient banners={banners as never} />;
}

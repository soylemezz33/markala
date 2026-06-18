import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { CouponsClient } from "./coupons-client";

export default async function CouponsAdminPage() {
  let coupons: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    coupons = await api.coupons.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <CouponsClient coupons={coupons as never} />
    </>
  );
}

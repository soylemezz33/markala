import { getAdminApi } from "@/lib/api";
import { CouponsClient } from "./coupons-client";

export default async function CouponsAdminPage() {
  const api = await getAdminApi();
  const coupons = await api.coupons.list();
  return <CouponsClient coupons={coupons as never} />;
}

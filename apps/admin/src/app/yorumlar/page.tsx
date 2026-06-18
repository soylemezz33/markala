import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsAdminPage() {
  let reviews: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    reviews = await api.reviews.list();
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <ReviewsClient reviews={reviews as never} />
    </>
  );
}

import { getAdminApi } from "@/lib/api";
import { ReviewsClient } from "./reviews-client";

export default async function ReviewsAdminPage() {
  const api = await getAdminApi();
  const reviews = await api.reviews.list();
  return <ReviewsClient reviews={reviews as never} />;
}

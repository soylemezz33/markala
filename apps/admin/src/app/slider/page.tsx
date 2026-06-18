import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { SliderClient } from "./slider-client";

export default async function SliderAdminPage() {
  let slides: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    slides = await api.heroSlides.list(true);
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <SliderClient slides={slides as never} />
    </>
  );
}

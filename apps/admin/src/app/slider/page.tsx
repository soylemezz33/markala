import { getAdminApi } from "@/lib/api";
import { SliderClient } from "./slider-client";

export default async function SliderAdminPage() {
  const api = await getAdminApi();
  const slides = await api.heroSlides.list(true);
  return <SliderClient slides={slides as never} />;
}

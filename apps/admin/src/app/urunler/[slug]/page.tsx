import { notFound } from "next/navigation";
import { getAdminApi } from "@/lib/api";
import { ProductDetailClient } from "./product-detail-client";

interface Props {
  params: { slug: string };
}

export default async function ProductEditPage({ params }: Props) {
  const { slug } = params;
  const api = await getAdminApi();

  let product;
  try {
    product = await api.products.detail(slug);
  } catch {
    notFound();
  }

  if (!product) notFound();

  const categories = await api.categories.list(true);

  return (
    <ProductDetailClient
      product={product as never}
      categories={categories as never}
    />
  );
}

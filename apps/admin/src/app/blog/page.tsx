import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { BlogClient } from "./blog-client";

export default async function BlogAdminPage() {
  let posts: unknown[] = [];
  let categories: unknown[] = [];
  let loadError = false;
  try {
    const api = await getAdminApi();
    [posts, categories] = await Promise.all([
      api.blog.listPosts(),
      api.blog.listCategories(),
    ]);
  } catch {
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <BlogClient posts={posts as never} categories={categories as never} />
    </>
  );
}

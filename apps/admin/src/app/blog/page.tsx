import { getAdminApi } from "@/lib/api";
import { BlogClient } from "./blog-client";

export default async function BlogAdminPage() {
  const api = await getAdminApi();
  const [posts, categories] = await Promise.all([
    api.blog.listPosts(),
    api.blog.listCategories(),
  ]);
  return <BlogClient posts={posts as never} categories={categories as never} />;
}

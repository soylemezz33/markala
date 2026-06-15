import { describe, it, expect, vi } from "vitest";
import { BlogService } from "./blog.service";

function mockPrisma() {
  return {
    blogPost: {
      findMany: vi.fn().mockResolvedValue([
        {
          id: "p1",
          slug: "ilk-yazi",
          title: "İlk Yazı",
          excerpt: "Özet",
          content: "İçerik",
          authorName: "Hasan",
          tags: [],
          status: "published",
          createdAt: new Date("2026-01-01"),
          category: { slug: "genel", name: "Genel" },
        },
      ]),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "new-post", viewCount: 0, ...data }),
      ),
      update: vi.fn().mockImplementation(({ where, data }) =>
        Promise.resolve({ id: where.id, ...data }),
      ),
      delete: vi.fn().mockResolvedValue({ id: "p1" }),
    },
    blogCategory: {
      findMany: vi.fn().mockResolvedValue([
        { id: "c1", slug: "genel", name: "Genel", sortOrder: 0 },
        { id: "c2", slug: "haberler", name: "Haberler", sortOrder: 1 },
      ]),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({ id: "new-cat", ...data }),
      ),
    },
  };
}

describe("BlogService", () => {
  it("findAllPosts kategori include ile createdAt desc sıralı getirir", async () => {
    const prisma = mockPrisma();
    const svc = new BlogService(prisma as never);
    const res = await svc.findAllPosts();
    expect(prisma.blogPost.findMany).toHaveBeenCalledWith({
      include: { category: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
    expect(res).toHaveLength(1);
    expect(res[0].category).toEqual({ slug: "genel", name: "Genel" });
  });

  it("createPost dto verisini prisma'ya iletir", async () => {
    const prisma = mockPrisma();
    const svc = new BlogService(prisma as never);
    const res = await svc.createPost({
      slug: "test-yazi",
      title: "Test Yazı",
      excerpt: "Kısa özet",
      content: "Uzun içerik",
      authorName: "Hasan",
    });
    expect(prisma.blogPost.create).toHaveBeenCalledOnce();
    const callData = prisma.blogPost.create.mock.calls[0][0].data;
    expect(callData.slug).toBe("test-yazi");
    expect(callData.title).toBe("Test Yazı");
    expect(callData.authorName).toBe("Hasan");
    expect(res.id).toBe("new-post");
  });

  it("publishPost status published ve publishedAt Date olarak günceller", async () => {
    const prisma = mockPrisma();
    const svc = new BlogService(prisma as never);
    await svc.publishPost("p1");
    expect(prisma.blogPost.update).toHaveBeenCalledOnce();
    const call = prisma.blogPost.update.mock.calls[0][0];
    expect(call.where).toEqual({ id: "p1" });
    expect(call.data.status).toBe("published");
    expect(call.data.publishedAt).toBeInstanceOf(Date);
  });

  it("findAllCategories sortOrder asc sıralı getirir", async () => {
    const prisma = mockPrisma();
    const svc = new BlogService(prisma as never);
    const res = await svc.findAllCategories();
    expect(prisma.blogCategory.findMany).toHaveBeenCalledWith({
      orderBy: { sortOrder: "asc" },
    });
    expect(res).toHaveLength(2);
    expect(res[0].sortOrder).toBe(0);
    expect(res[1].sortOrder).toBe(1);
  });
});

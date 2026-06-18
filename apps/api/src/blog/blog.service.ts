import { Injectable, NotFoundException } from "@nestjs/common";
import { BlogStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBlogCategoryDto, CreateBlogPostDto, UpdateBlogPostDto } from "./blog.dto";

@Injectable()
export class BlogService {
  constructor(private prisma: PrismaService) {}

  findAllPosts() {
    return this.prisma.blogPost.findMany({
      include: { category: { select: { slug: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  createPost(dto: CreateBlogPostDto) {
    return this.prisma.blogPost.create({
      data: {
        slug: dto.slug,
        title: dto.title,
        excerpt: dto.excerpt,
        content: dto.content,
        authorName: dto.authorName,
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.authorRole !== undefined && { authorRole: dto.authorRole }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        tags: dto.tags ?? [],
        ...(dto.status !== undefined && { status: dto.status as BlogStatus }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.ogImage !== undefined && { ogImage: dto.ogImage }),
      },
    });
  }

  updatePost(id: string, dto: UpdateBlogPostDto) {
    return this.prisma.blogPost.update({
      where: { id },
      data: {
        ...(dto.slug !== undefined && { slug: dto.slug }),
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.excerpt !== undefined && { excerpt: dto.excerpt }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.authorName !== undefined && { authorName: dto.authorName }),
        ...(dto.authorRole !== undefined && { authorRole: dto.authorRole }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.status !== undefined && { status: dto.status as BlogStatus }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
        ...(dto.ogImage !== undefined && { ogImage: dto.ogImage }),
      },
    });
  }

  removePost(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }

  publishPost(id: string) {
    return this.prisma.blogPost.update({
      where: { id },
      data: { status: "published" as BlogStatus, publishedAt: new Date() },
    });
  }

  findAllCategories() {
    return this.prisma.blogCategory.findMany({ orderBy: { sortOrder: "asc" } });
  }

  // === Public (guard'sız) — yalnız YAYINLANMIŞ içerik döner ===

  /** Yayınlanmış yazılar, en yeni önce. Taslak/arşiv ASLA sızdırılmaz. */
  findPublishedPosts() {
    return this.prisma.blogPost.findMany({
      where: { status: "published" as BlogStatus, publishedAt: { not: null } },
      include: { category: { select: { slug: true, name: true } } },
      orderBy: { publishedAt: "desc" },
    });
  }

  /** Tek yayınlanmış yazı; yoksa veya yayınlanmamışsa 404. */
  async findPublishedBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: "published" as BlogStatus, publishedAt: { not: null } },
      include: { category: { select: { slug: true, name: true } } },
    });
    if (!post) throw new NotFoundException(`Blog yazısı bulunamadı: ${slug}`);
    return post;
  }

  createCategory(dto: CreateBlogCategoryDto) {
    return this.prisma.blogCategory.create({ data: dto });
  }
}

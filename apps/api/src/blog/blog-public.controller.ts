import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { BlogService } from "./blog.service";

/**
 * Storefront'a AÇIK (guard YOK) blog okuma — yalnız YAYINLANMIŞ içerik döner.
 * Admin BlogController class-level guard'lı; bu ayrı public controller taslak sızdırmaz.
 * Prefix farkı (/blog/public) admin /blog/posts ile çakışmaz.
 */
@ApiTags("blog")
@Controller("blog/public")
export class BlogPublicController {
  constructor(private service: BlogService) {}

  /** Yayınlanmış yazılar, tarih (publishedAt) sıralı — en yeni önce. */
  @Get("posts")
  listPosts() {
    return this.service.findPublishedPosts();
  }

  /** Tek yayınlanmış yazı; yoksa 404. */
  @Get("posts/:slug")
  getPost(@Param("slug") slug: string) {
    return this.service.findPublishedBySlug(slug);
  }

  /** Blog kategorileri (sitemap / filtre için). */
  @Get("categories")
  listCategories() {
    return this.service.findAllCategories();
  }
}

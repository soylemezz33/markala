import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from "class-validator";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateBlogPostDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase alphanumeric with hyphens" })
  slug!: string;

  @IsString() @MinLength(2)
  title!: string;

  @IsString()
  excerpt!: string;

  @IsString()
  content!: string;

  @IsString() @IsOptional()
  coverImage?: string;

  @IsString()
  authorName!: string;

  @IsString() @IsOptional()
  authorRole?: string;

  @IsString() @IsOptional()
  categoryId?: string;

  @IsString({ each: true }) @IsOptional()
  tags?: string[];

  @IsIn(["draft", "published", "archived"]) @IsOptional()
  status?: "draft" | "published" | "archived";

  @IsString() @IsOptional()
  seoTitle?: string;

  @IsString() @IsOptional()
  seoDescription?: string;

  @IsString() @IsOptional()
  ogImage?: string;
}

export class UpdateBlogPostDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase alphanumeric with hyphens" })
  @IsOptional()
  slug?: string;

  @IsString() @MinLength(2) @IsOptional()
  title?: string;

  @IsString() @IsOptional()
  excerpt?: string;

  @IsString() @IsOptional()
  content?: string;

  @IsString() @IsOptional()
  coverImage?: string;

  @IsString() @IsOptional()
  authorName?: string;

  @IsString() @IsOptional()
  authorRole?: string;

  @IsString() @IsOptional()
  categoryId?: string;

  @IsString({ each: true }) @IsOptional()
  tags?: string[];

  @IsIn(["draft", "published", "archived"]) @IsOptional()
  status?: "draft" | "published" | "archived";

  @IsString() @IsOptional()
  seoTitle?: string;

  @IsString() @IsOptional()
  seoDescription?: string;

  @IsString() @IsOptional()
  ogImage?: string;
}

export class CreateBlogCategoryDto {
  @IsString()
  @Matches(SLUG_REGEX, { message: "slug must be lowercase alphanumeric with hyphens" })
  slug!: string;

  @IsString()
  name!: string;

  @IsString() @IsOptional()
  description?: string;

  @IsInt() @IsOptional()
  sortOrder?: number;
}

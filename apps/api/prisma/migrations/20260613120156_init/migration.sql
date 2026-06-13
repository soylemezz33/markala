-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('individual', 'corporate');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin', 'super_admin');

-- CreateEnum
CREATE TYPE "CorporateStatus" AS ENUM ('none', 'pending', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('siparis-alindi', 'tasarim-bekleniyor', 'tasarim-onayindi', 'uretimde', 'kargoya-verildi', 'teslim-edildi', 'iptal-edildi');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('beklemede', 'basarili', 'basarisiz', 'iade-edildi');

-- CreateEnum
CREATE TYPE "CouponType" AS ENUM ('percentage', 'fixed-amount', 'free-shipping');

-- CreateEnum
CREATE TYPE "BlogStatus" AS ENUM ('draft', 'published', 'archived');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('email', 'sms', 'push');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT,
    "account_type" "AccountType" NOT NULL DEFAULT 'individual',
    "role" "UserRole" NOT NULL DEFAULT 'customer',
    "company_name" TEXT,
    "tax_office" TEXT,
    "tax_number" TEXT,
    "corporate_status" "CorporateStatus" NOT NULL DEFAULT 'none',
    "corporate_approved_at" TIMESTAMP(3),
    "corporate_discount" DECIMAL(5,2),
    "corporate_credit_limit" DECIMAL(12,2),
    "two_factor_enabled" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret_encrypted" TEXT,
    "two_factor_backup_codes_hashed" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "marketing_consent" BOOLEAN NOT NULL DEFAULT false,
    "marketing_consent_at" TIMESTAMP(3),
    "marketing_consent_source" TEXT,
    "email_verified_at" TIMESTAMP(3),
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked_at" TIMESTAMP(3),
    "user_agent" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "corporate_applications" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "company_name" TEXT NOT NULL,
    "tax_office" TEXT NOT NULL,
    "tax_number" TEXT NOT NULL,
    "sector" TEXT,
    "annual_volume" TEXT,
    "contact_name" TEXT NOT NULL,
    "contact_role" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "notes" TEXT,
    "tax_certificate_url" TEXT,
    "signature_circular_url" TEXT,
    "status" "CorporateStatus" NOT NULL DEFAULT 'pending',
    "reviewed_by_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "review_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "corporate_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "full_address" TEXT NOT NULL,
    "zip_code" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "long_description" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "accent_color" TEXT,
    "starting_price" DECIMAL(10,2) NOT NULL,
    "production_time" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "short_description" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "base_price" DECIMAL(10,2) NOT NULL,
    "starting_price" DECIMAL(10,2),
    "production_time" TEXT NOT NULL,
    "size_label" TEXT,
    "images" TEXT[],
    "badges" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bestseller" BOOLEAN NOT NULL DEFAULT false,
    "rating_average" DECIMAL(3,2),
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'siparis-alindi',
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'beklemede',
    "subtotal" DECIMAL(12,4) NOT NULL,
    "shipping_fee" DECIMAL(10,2) NOT NULL,
    "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "vat" DECIMAL(12,4) NOT NULL,
    "total" DECIMAL(12,4) NOT NULL,
    "shipping_address_id" TEXT NOT NULL,
    "billing_address_id" TEXT NOT NULL,
    "iyzico_payment_id" TEXT,
    "iyzico_conversation_id" TEXT,
    "tracking_number" TEXT,
    "tracking_carrier" TEXT,
    "shipped_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "parasut_invoice_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_slug" TEXT NOT NULL,
    "product_name" TEXT NOT NULL,
    "product_image" TEXT NOT NULL,
    "configuration_summary" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "line_total" DECIMAL(10,2) NOT NULL,
    "needs_design_support" BOOLEAN NOT NULL DEFAULT false,
    "uploaded_file_name" TEXT,
    "uploaded_file_url" TEXT,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "design_uploads" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "order_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_url" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "design_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "CouponType" NOT NULL,
    "value" DECIMAL(10,2) NOT NULL,
    "min_order_amount" DECIMAL(10,2),
    "max_uses" INTEGER,
    "used_count" INTEGER NOT NULL DEFAULT 0,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "order_item_id" TEXT,
    "user_name" TEXT NOT NULL,
    "user_company" TEXT,
    "rating" INTEGER NOT NULL,
    "comment" TEXT NOT NULL,
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "blog_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "cover_image" TEXT,
    "author_name" TEXT NOT NULL,
    "author_role" TEXT,
    "category_id" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" "BlogStatus" NOT NULL DEFAULT 'draft',
    "seo_title" TEXT,
    "seo_description" TEXT,
    "og_image" TEXT,
    "reading_time" INTEGER,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "test_key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "variants" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ab_test_events" (
    "id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT,
    "user_id" TEXT,
    "uid" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ab_test_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "template" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consent_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" TEXT,
    "consent_type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "version" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consent_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "actor_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "diff" JSONB,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hero_slides" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "image_url" TEXT NOT NULL,
    "mobile_image_url" TEXT,
    "cta_label" TEXT,
    "cta_href" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hero_slides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "group" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_corporate_status_idx" ON "users"("corporate_status");

-- CreateIndex
CREATE INDEX "users_deleted_at_idx" ON "users"("deleted_at");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "corporate_applications_status_created_at_idx" ON "corporate_applications"("status", "created_at");

-- CreateIndex
CREATE INDEX "corporate_applications_email_idx" ON "corporate_applications"("email");

-- CreateIndex
CREATE INDEX "corporate_applications_user_id_idx" ON "corporate_applications"("user_id");

-- CreateIndex
CREATE INDEX "addresses_user_id_idx" ON "addresses"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE INDEX "categories_is_active_sort_order_idx" ON "categories"("is_active", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_category_id_is_active_idx" ON "products"("category_id", "is_active");

-- CreateIndex
CREATE INDEX "products_bestseller_is_active_idx" ON "products"("bestseller", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "orders_status_created_at_idx" ON "orders"("status", "created_at");

-- CreateIndex
CREATE INDEX "orders_payment_status_created_at_idx" ON "orders"("payment_status", "created_at");

-- CreateIndex
CREATE INDEX "orders_iyzico_conversation_id_idx" ON "orders"("iyzico_conversation_id");

-- CreateIndex
CREATE INDEX "orders_deleted_at_idx" ON "orders"("deleted_at");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

-- CreateIndex
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- CreateIndex
CREATE INDEX "design_uploads_user_id_idx" ON "design_uploads"("user_id");

-- CreateIndex
CREATE INDEX "design_uploads_order_id_idx" ON "design_uploads"("order_id");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "coupons_code_is_active_idx" ON "coupons"("code", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "reviews_order_item_id_key" ON "reviews"("order_item_id");

-- CreateIndex
CREATE INDEX "reviews_product_id_is_approved_created_at_idx" ON "reviews"("product_id", "is_approved", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "blog_categories_slug_key" ON "blog_categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "blog_posts_slug_key" ON "blog_posts"("slug");

-- CreateIndex
CREATE INDEX "blog_posts_status_published_at_idx" ON "blog_posts"("status", "published_at");

-- CreateIndex
CREATE INDEX "blog_posts_category_id_status_idx" ON "blog_posts"("category_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ab_tests_test_key_key" ON "ab_tests"("test_key");

-- CreateIndex
CREATE INDEX "ab_test_events_test_id_event_type_created_at_idx" ON "ab_test_events"("test_id", "event_type", "created_at");

-- CreateIndex
CREATE INDEX "ab_test_events_uid_idx" ON "ab_test_events"("uid");

-- CreateIndex
CREATE INDEX "notification_logs_user_id_created_at_idx" ON "notification_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "notification_logs_template_status_idx" ON "notification_logs"("template", "status");

-- CreateIndex
CREATE INDEX "consent_logs_user_id_idx" ON "consent_logs"("user_id");

-- CreateIndex
CREATE INDEX "consent_logs_email_idx" ON "consent_logs"("email");

-- CreateIndex
CREATE INDEX "consent_logs_consent_type_created_at_idx" ON "consent_logs"("consent_type", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_id_created_at_idx" ON "audit_logs"("actor_id", "created_at");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "hero_slides_is_active_sort_order_idx" ON "hero_slides"("is_active", "sort_order");

-- CreateIndex
CREATE INDEX "site_settings_group_idx" ON "site_settings"("group");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "corporate_applications" ADD CONSTRAINT "corporate_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipping_address_id_fkey" FOREIGN KEY ("shipping_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_billing_address_id_fkey" FOREIGN KEY ("billing_address_id") REFERENCES "addresses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_uploads" ADD CONSTRAINT "design_uploads_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "design_uploads" ADD CONSTRAINT "design_uploads_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ab_test_events" ADD CONSTRAINT "ab_test_events_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "ab_tests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consent_logs" ADD CONSTRAINT "consent_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

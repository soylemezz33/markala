#!/usr/bin/env bash
# Markala — ürün mockup'larını toplu olarak R2'ye yükler ve products.images'a atar.
#
# Slug-adlı görseller (<slug>.jpg) bir dizinde olmalı; her biri ilgili ürünün
# slug'ıyla eşleşir → R2'ye `products/<slug>.jpg` anahtarıyla yüklenir →
# products.images = ARRAY['<R2_PUBLIC_URL>/products/<slug>.jpg'] (kapak) yapılır.
#
# Sunucuda (/opt/markala) çalıştırılır; R2 cred + DB oradan okunur.
#   scp -P 23422 _upload-ready/*.jpg root@178.157.14.10:/opt/markala/_img/
#   ssh -p 23422 root@178.157.14.10 'cd /opt/markala && ./scripts/assign-product-images.sh _img'
#
# Önkoşullar: .env.production (R2_* + POSTGRES_*), aws-cli (yoksa kurulur),
#             markala-postgres container çalışır.
set -uo pipefail

IMG_DIR="${1:-_img}"
cd "$(dirname "$0")/.." 2>/dev/null || true

[ -f .env.production ] || { echo "HATA: .env.production yok"; exit 1; }
set -a; . ./.env.production; set +a

: "${R2_ACCOUNT_ID:?R2_ACCOUNT_ID gerekli}"
: "${R2_ACCESS_KEY_ID:?}"; : "${R2_SECRET_ACCESS_KEY:?}"; : "${R2_BUCKET:?}"
: "${R2_PUBLIC_URL:?R2_PUBLIC_URL gerekli (örn https://uploads.markala.com.tr)}"

ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION=auto

command -v aws >/dev/null 2>&1 || { echo ">>> aws-cli kuruluyor"; apk add --no-cache aws-cli >/dev/null 2>&1 || true; }

PUBLIC_BASE="${R2_PUBLIC_URL%/}"
ok=0; fail=0
shopt -s nullglob
for f in "$IMG_DIR"/*.jpg; do
  slug="$(basename "$f" .jpg)"
  key="products/${slug}.jpg"
  url="${PUBLIC_BASE}/${key}"

  # 1) Ürün gerçekten var mı?
  exists="$(docker exec markala-postgres sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT 1 FROM products WHERE slug='"'"''"$slug"''"'"' LIMIT 1;"' 2>/dev/null | tr -d '[:space:]')"
  if [ "$exists" != "1" ]; then echo "ATLA  $slug (ürün yok)"; fail=$((fail+1)); continue; fi

  # 2) R2'ye yükle
  if ! aws s3 cp "$f" "s3://${R2_BUCKET}/${key}" --endpoint-url "$ENDPOINT" --content-type image/jpeg >/dev/null 2>&1; then
    echo "HATA  $slug (R2 upload başarısız)"; fail=$((fail+1)); continue
  fi

  # 3) products.images = [url] (kapak olarak ata)
  docker exec markala-postgres sh -c \
    'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "UPDATE products SET images=ARRAY['"'"''"$url"''"'"'] WHERE slug='"'"''"$slug"''"'"';"' \
    >/dev/null 2>&1 && { echo "OK    $slug → $url"; ok=$((ok+1)); } || { echo "HATA  $slug (DB update)"; fail=$((fail+1)); }
done

echo "----"
echo "Toplam: $ok atandı, $fail atlandı/hata"

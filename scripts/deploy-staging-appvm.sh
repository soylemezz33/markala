#!/usr/bin/env bash
# Markala — STAGING deploy, APP-VM'in İÇİNDEN (self-hosted runner).
#
# NEDEN AYRI BETİK: 2026-08-20'ye kadar bu mantık deploy-staging.yml içinde
# appleboy/ssh-action ile UZAKTAN koşuyordu ve "Compose + nginx conf'u VPS'e
# kopyala" adımında düşüyordu. Sebep prod'da 2026-08-17'de teşhis edilenle aynı:
# APP-VM iç ağda (10.20.33.5), GitHub'ın hosted runner'ı SSH ile ulaşamıyor.
# Prod scripts/deploy-appvm.sh ile self-hosted'a taşınmıştı; staging geride kalmıştı.
#
# GÜVENLİK SINIRI: bu betik YALNIZ staging servislerine dokunur. postgres, nginx,
# baskiport, backup ve tüm prod servisleri (markala-web/admin/api) ELLENMEZ.
# Tek istisna: nginx RELOAD edilir (restart DEĞİL) — staging vhost'u yüklensin diye.
#
# Beklenen env: GITHUB_REPOSITORY (ghcr imaj yolu için), GITHUB_SHA (log).
set -euo pipefail

cd /opt/markala

COMPOSE_FILE=docker-compose.staging.yml
ENV_FILE=.env.staging

# --- .env.staging: ilk çalıştırmada üret, varsa DOKUNMA (idempotent) ---
# Secrets yalnız APP-VM'de kalır; staging'e özel, prod .env.production'dan bağımsız.
if [ ! -f "$ENV_FILE" ]; then
  echo "→ $ENV_FILE yok — otomatik oluşturuluyor..."
  umask 077
  cat > "$ENV_FILE" <<EOF
STAGING_POSTGRES_DB=markala_staging
STAGING_POSTGRES_USER=markala
STAGING_POSTGRES_PASSWORD=$(openssl rand -hex 24)
STAGING_JWT_SECRET=$(openssl rand -hex 32)
STAGING_REVALIDATE_SECRET=$(openssl rand -hex 16)
GITHUB_REPOSITORY=${GITHUB_REPOSITORY:-soylemezz33/markala}
EOF
  echo "  ✓ /opt/markala/$ENV_FILE oluşturuldu"
fi

# Sonradan zorunlu hale gelen anahtarlar — mevcut dosyaya idempotent eklenir.
# (ENCRYPTION_KEY eksikken staging API açılışta çöküyordu — 2026-08-07.)
if ! grep -q '^STAGING_ENCRYPTION_KEY=' "$ENV_FILE"; then
  echo "STAGING_ENCRYPTION_KEY=$(openssl rand -hex 24)" >> "$ENV_FILE"
  echo "  ✓ STAGING_ENCRYPTION_KEY eklendi"
fi

echo "→ Staging imajlarını çek..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull

echo "→ Staging servislerini güncelle (prod servislerine DOKUNULMAZ)..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --no-build

# NOT: ayrıca 'prisma migrate deploy' KOŞULMAZ — api imajının CMD'si açılışta
# zaten migrate eder; ikinci bir eşzamanlı migrate boş DB'de yarış yaratıp
# P3009 (failed migration kaydı) bırakıyordu (2026-08-07 olayı).

echo "→ nginx reload (staging vhost'u yüklensin — RESTART değil, prod kesilmesin)..."
docker exec markala-nginx nginx -t
docker exec markala-nginx nginx -s reload

echo "→ Sağlık kontrolü (container ağı içinden, maks ~1 dk)..."
ok=0
for i in $(seq 1 6); do
  code=$(docker exec markala-nginx sh -c \
    "wget -q -O /dev/null -S http://staging-web:3000/api/health 2>&1 | head -1 | grep -o '[0-9]\{3\}'" \
    || echo 000)
  echo "  deneme $i/6: staging-web /api/health -> $code"
  if [ "$code" = "200" ]; then ok=1; break; fi
  sleep 10
done

if [ "$ok" != "1" ]; then
  echo "❌ Staging web sağlıksız:"
  docker ps --format '{{.Names}} {{.Status}}' | grep staging || true
  docker logs markala-staging-web --tail 40 2>&1 || true
  exit 1
fi

echo "✅ Staging deploy tamam: ${GITHUB_SHA:-bilinmiyor}"

#!/bin/bash
# Markala — Manuel deploy script
# VPS'de çalıştırılır.
# Kullanım: ./scripts/deploy.sh

set -euo pipefail

cd /opt/markala

echo "═════════════════════════════════════════════"
echo "  Markala Deploy — $(date)"
echo "═════════════════════════════════════════════"

# 1. Latest images
echo "→ Yeni image'lar çekiliyor..."
docker compose -f docker-compose.production.yml pull

# 2. DB migrate (önce, downtime'sız)
echo "→ Database migration..."
docker compose -f docker-compose.production.yml run --rm api \
    sh -c "cd apps/api && npx prisma migrate deploy"

# 3. Restart services (rolling, postgres dokunmadan)
echo "→ Service'ler restart ediliyor..."
docker compose -f docker-compose.production.yml up -d --no-build --remove-orphans

# 3b. nginx'i restart et — web/api/admin yeniden oluşturulduysa IP'leri değişir;
#     nginx upstream hostname'lerini bir kez resolve ettiği için stale IP'ye
#     takılıp 502 verir. Restart güncel IP'leri yeniden çözer.
echo "→ nginx yeniden başlatılıyor (upstream IP yenileme)..."
docker compose -f docker-compose.production.yml restart nginx

# 4. Health check
echo "→ Health check (10 sn bekleme)..."
sleep 10

WEB_HEALTH=$(curl -fsS http://localhost:3000/api/health | grep -o '"status":"ok"' || echo "FAIL")
ADMIN_HEALTH=$(curl -fsS http://localhost:3001/api/health | grep -o '"status":"ok"' || echo "FAIL")

if [[ "$WEB_HEALTH" == *"ok"* && "$ADMIN_HEALTH" == *"ok"* ]]; then
    echo "✅ Web + Admin sağlıklı"
else
    echo "❌ Health check fail!"
    docker compose -f docker-compose.production.yml ps
    exit 1
fi

# 5. Cleanup
echo "→ Eski image'lar temizleniyor..."
docker image prune -f

echo ""
echo "✅ Deploy tamamlandı: $(git rev-parse --short HEAD)"
echo "🔗 https://markala.com.tr"

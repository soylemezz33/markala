#!/usr/bin/env bash
# APP-VM production deploy — self-hosted runner tarafından `sudo bash scripts/deploy-appvm.sh`
# ile çağrılır. ROOT gerekir: .env.production root-only (600) ve /opt/markala yalnız root'a
# yazılabilir. Runner `hasan` olarak koşar, passwordless sudo ile bu betiği root'a yükseltir.
#
# GÜVENLİK: yalnız app servisleri (web/admin/api) yenilenir. postgres/nginx/baskiport/backup'a
# ve VERİTABANINA DOKUNULMAZ. nginx paylaşımlı ingress'tir (baskiport da kullanır) → reload'dan
# öte müdahale yok.
set -euo pipefail

COMPOSE="docker compose -f docker-compose.production.yml --env-file .env.production"
cd /opt/markala

echo "→ Pre-deploy DB yedeği (best-effort, postgres'e DOKUNMAZ)..."
mkdir -p backups
docker exec markala-postgres sh -c 'pg_dump -U "${POSTGRES_USER:-markala}" "${POSTGRES_DB:-markala}"' \
  > "backups/db-predeploy-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || echo "  (yedek atlandı)"

echo "→ Pull öncesi imaj digest'leri (imaj gerçekten yenilendi mi izi):"
for s in web admin api; do
  echo "   $s: $(docker inspect -f '{{index .RepoDigests 0}}' "markala-$s" 2>/dev/null || echo yok)"
done

echo "→ App imajlarını çek (web/admin/api)..."
$COMPOSE pull web admin api

echo "→ Önceki recreate kalıntılarını temizle (<hash>_markala-*)..."
docker rm -f $(docker ps -aq --filter name=_markala- 2>/dev/null) 2>/dev/null || true

echo "→ Sadece app servislerini güncelle (postgres/nginx KORUNUR)..."
$COMPOSE up -d --no-build --no-deps --force-recreate web admin api

echo "→ Nginx reload (recreate sonrası bayat upstream IP fix)..."
sleep 5
docker exec markala-nginx nginx -s reload || { echo "⚠ nginx reload başarısız"; docker exec markala-nginx nginx -t 2>&1 || true; }

echo "→ Sağlık kontrolü (compose healthcheck, maks ~2 dk)..."
ok=0
for i in $(seq 1 12); do
  n=$(docker inspect -f '{{.State.Health.Status}}' markala-web markala-admin markala-api 2>/dev/null | grep -c '^healthy$' || true)
  echo "  deneme $i/12: healthy=$n/3"
  [ "$n" = "3" ] && { ok=1; break; }
  sleep 10
done
if [ "$ok" != "1" ]; then
  echo "❌ Health check başarısız!"; docker ps --format '{{.Names}} {{.Status}}' | grep markala || true; exit 1
fi

echo "→ Konteynerler GERÇEKTEN yeniden başladı mı (eski koda karşı sigorta)..."
now=$(date +%s); stale=0
for s in web admin api; do
  started=$(docker inspect -f '{{.State.StartedAt}}' "markala-$s" 2>/dev/null || echo "")
  [ -z "$started" ] && { echo "  ❌ markala-$s bulunamadı"; stale=1; continue; }
  age=$(( (now - $(date -d "$started" +%s 2>/dev/null || echo 0)) / 60 ))
  echo "  markala-$s: ${age} dk önce başladı"
  [ "$age" -gt 10 ] && { echo "    ❌ yenilenmemiş"; stale=1; }
done
[ "$stale" = "0" ] || { echo "❌ Deploy uygulanmadı (konteyner yenilenmedi)"; exit 1; }

echo "→ Eski imaj temizliği (volume/DB DOKUNULMAZ)..."
docker image prune -f >/dev/null 2>&1 || true
df -h / | tail -1
echo "✅ Deploy tamam"

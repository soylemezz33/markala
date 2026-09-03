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

# TAG: iş akışı tam sha etiketini geçirir (main-<sha>). Verilmezse compose "latest"e
# düşer — elle çalıştırmada çalışsın diye, ama CI'da her zaman verilir.
TAG="${TAG:-latest}"
export TAG
echo "→ Hedef imaj etiketi: $TAG"

# GERİ ALMA — ETİKETE DEĞİL, O AN ÇALIŞAN İMAJIN KİMLİĞİNE dayanır.
# Etikete güvenilemez: "latest" hareketlidir ve bu deploy'un kendi build'i onu zaten
# ezmiştir; "latest"e dönmek aynı bozuk imaja dönmek olurdu. İmaj kimliği (sha256:...)
# ise değişmez ve pull'dan sonra da diskte durur.
# Geri alırken bu kimlikleri yerel bir etikete (:geri-alma) bağlayıp compose'u onunla
# ayağa kaldırıyoruz.
#
# NOT: .RepoDigests İMAJIN alanıdır, KONTEYNERİN değil — konteyner üzerinde sorgulanınca
# her zaman boş döner. Betiğin eski "pull öncesi digest" satırı bu yüzden hep "yok"
# basıyordu (2026-09-03'te fark edildi). Konteynerin .Image alanı doğru olanıdır.
declare -A ONCEKI_IMAJ=()
for s in web admin api; do
  id="$(docker inspect -f '{{.Image}}' "markala-$s" 2>/dev/null || true)"
  [ -n "$id" ] && ONCEKI_IMAJ[$s]="$id"
done
echo "→ Geri alma için saklanan imaj sayısı: ${#ONCEKI_IMAJ[@]}/3"

geri_al() {
  echo ""
  if [ "${#ONCEKI_IMAJ[@]}" -lt 3 ]; then
    echo "⏪ GERİ ALINAMIYOR: önceki imajların hepsi yok (${#ONCEKI_IMAJ[@]}/3) — elle müdahale gerekir."
    return 0
  fi
  echo "⏪ GERİ ALINIYOR (deploy öncesi çalışan imajlar)"
  local repo="ghcr.io/${GITHUB_REPOSITORY:-soylemezz33/markala}"
  for s in web admin api; do
    echo "   $s ← ${ONCEKI_IMAJ[$s]:0:19}..."
    docker tag "${ONCEKI_IMAJ[$s]}" "$repo/$s:geri-alma" || return 0
  done
  TAG="geri-alma" $COMPOSE up -d --no-build --no-deps --force-recreate web admin api || true
  sleep 5
  # nginx reload ŞART: recreate sonrası bayat upstream IP kalırsa site stilsiz/502 gelir.
  docker exec markala-nginx nginx -s reload || true
  echo "⏪ Geri alma uygulandı — site önceki sürümle ayakta"
}

echo "→ Pre-deploy DB yedeği (best-effort, postgres'e DOKUNMAZ)..."
mkdir -p backups
docker exec markala-postgres sh -c 'pg_dump -U "${POSTGRES_USER:-markala}" "${POSTGRES_DB:-markala}"' \
  > "backups/db-predeploy-$(date +%Y%m%d-%H%M%S).sql" 2>/dev/null || echo "  (yedek atlandı)"

echo "→ Pull öncesi çalışan imajlar (imaj gerçekten yenilendi mi izi):"
for s in web admin api; do
  echo "   $s: ${ONCEKI_IMAJ[$s]:-yok}"
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
  echo "❌ Health check başarısız!"; docker ps --format '{{.Names}} {{.Status}}' | grep markala || true
  echo "--- son loglar (teşhis için) ---"
  for s in web admin api; do echo "[markala-$s]"; docker logs "markala-$s" --tail 25 2>&1 || true; done
  geri_al
  exit 1
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
[ "$stale" = "0" ] || { echo "❌ Deploy uygulanmadı (konteyner yenilenmedi)"; geri_al; exit 1; }

# Buraya YALNIZ her şey sağlıklıyken gelinir; artık geri alma imajını tutmaya gerek yok.
echo "→ Eski imaj temizliği (volume/DB DOKUNULMAZ)..."
docker image prune -f >/dev/null 2>&1 || true
df -h / | tail -1
echo "✅ Deploy tamam"

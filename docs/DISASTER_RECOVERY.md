# Markala — Disaster Recovery (DR) Rehberi

> **Amaç:** Veritabanı/sunucu kaybı sonrası Markala'yı en geç **2 saat içinde** ayağa kaldırmak. Bu doküman drill prosedürlerini ve incident playbook'larını içerir.
> **Sahibi:** Hasan Söylemez (Bilgi İşlem & Sistem Sorumlusu).
> **Son drill:** _(ilk drill yapıldığında doldur)_

## 1. RTO / RPO Tanımları

| Metrik | Hedef | Açıklama |
|--------|-------|----------|
| **RPO** (Recovery Point Objective) | ≤ 24 saat | En fazla kaybedilebilecek veri penceresi. Backup günde 1 kez (03:00 TR) çalışır. Faz 2'de WAL streaming ile 5 dk'ya çekilecek. |
| **RTO** (Recovery Time Objective) | ≤ 2 saat | Outage başlangıcından "tam servis" durumuna kadar geçen süre. |
| **MTTD** (Mean Time To Detect) | ≤ 5 dk | UptimeRobot interval'i. |
| **MTTR** (Mean Time To Repair) | ≤ 90 dk | Detection sonrası onarım hedefi. |

## 2. Backup envanteri

| Katman | Konum | Frekans | Retention |
|--------|-------|---------|-----------|
| Local DB dump | Hetzner VPS `./backups/markala-*.sql.gz` | Günlük 03:00 | 30 gün |
| Remote DB dump | Cloudflare R2 `s3://markala-backups/postgres-backups/` | Günlük (backup script sonu) | 90 gün (R2 lifecycle rule) |
| Uploads / medya | Cloudflare R2 `s3://markala-uploads/` | Anlık (yazma sırasında) | ∞ (versioned) |
| Compose / nginx / scripts | GitHub repo `soylemezz33/markala` | Her commit | ∞ |
| Secrets (.env) | 1Password vault "Markala-Prod" | Manuel (rotation 90 gün) | – |
| Iyzico, Paraşüt, NetGSM credentials | 1Password | – | – |

## 3. Aylık Restore Drill Prosedürü

> **Sıklık:** Ayda 1. Takvim event'i Hasan'ın Google Calendar'ında. Drill yapılmamışsa "backup'ım var" demek yalan — drill ≠ backup.

### 3.1. Hazırlık (5 dk)

```sh
# Geçici drill veritabanı ayağa kaldır (production'a dokunmaz)
docker run -d --name pg-drill \
  -e POSTGRES_PASSWORD=drill \
  -e POSTGRES_USER=markala \
  -e POSTGRES_DB=markala_drill \
  -p 5433:5432 \
  postgres:16-alpine

# R2'den son backup'ı indir
cd /opt/markala
docker run --rm \
  -e R2_ACCOUNT_ID -e R2_ACCESS_KEY_ID -e R2_SECRET_ACCESS_KEY -e R2_BUCKET=markala-backups \
  --env-file .env \
  -v $(pwd)/backups:/backups \
  -v $(pwd)/scripts:/scripts:ro \
  amazon/aws-cli \
  s3 cp s3://markala-backups/postgres-backups/markala-latest.sql.gz /backups/drill.sql.gz \
  --endpoint-url https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com
```

### 3.2. Restore (15 dk)

```sh
gunzip -c ./backups/drill.sql.gz | \
  docker exec -i pg-drill psql -U markala -d markala_drill
```

### 3.3. Doğrulama (10 dk)

```sh
docker exec pg-drill psql -U markala -d markala_drill -c "\dt"                          # tablolar geldi mi?
docker exec pg-drill psql -U markala -d markala_drill -c "SELECT COUNT(*) FROM users;"  # kullanıcı sayısı
docker exec pg-drill psql -U markala -d markala_drill -c "SELECT MAX(created_at) FROM orders;"  # son siparişin tarihi
docker exec pg-drill psql -U markala -d markala_drill -c "SELECT COUNT(*) FROM products WHERE active = true;"
```

Beklenen: tablo sayısı production ile aynı, son sipariş tarihi backup zamanından önce/eşit.

### 3.4. Temizlik

```sh
docker rm -f pg-drill
rm ./backups/drill.sql.gz
```

### 3.5. Drill log

`docs/DISASTER_RECOVERY.md` sonundaki "Drill History" tablosuna satır ekle.

## 4. Incident Playbook'ları

### 4.1. PostgreSQL container down (servis devam, DB yok)

```sh
docker compose -f docker-compose.production.yml ps postgres
docker compose -f docker-compose.production.yml logs --tail 200 postgres
# Disk dolu mu?
df -h /var/lib/docker
# Restart dene
docker compose -f docker-compose.production.yml restart postgres
```

Hâlâ down → bir sonraki adıma geç.

### 4.2. PostgreSQL data corruption / volume kayıp

```sh
# 1. Mevcut volume'u snapshot'la (hâlâ erişilebilirse)
docker run --rm -v markala_postgres-data:/data -v $(pwd)/backups:/backup alpine \
  tar czf /backup/postgres-data-emergency-$(date +%s).tar.gz /data

# 2. Volume'u sıfırla
docker compose -f docker-compose.production.yml down postgres
docker volume rm markala_postgres-data
docker compose -f docker-compose.production.yml up -d postgres
# init.sql ile schema kurulur, hazır olmasını bekle (~30 sn)

# 3. Restore et — local en güncel backup
docker compose -f docker-compose.production.yml exec backup \
  sh /usr/local/bin/restore.sh markala-latest.sql.gz
# YA DA R2'den:
docker compose -f docker-compose.production.yml exec backup \
  sh /usr/local/bin/restore.sh --from-r2 markala-latest.sql.gz

# 4. API/Web restart (cache invalidate)
docker compose -f docker-compose.production.yml restart api web admin

# 5. Smoke test
curl -fsS https://markala.com.tr/api/health
```

`restore.sh` compose'a mount edilmemişse, host'tan çağır:
```sh
docker compose exec -T postgres sh -c "gunzip -c /backups/markala-latest.sql.gz | psql -U markala markala"
```

### 4.3. VPS tamamen kaybedildi (Hetzner outage / data loss)

**Hedef RTO: 2 saat**.

1. **Yeni Hetzner VPS sipariş et** (CX31, Falkenstein) — ~10 dk.
2. **DNS'i Cloudflare'de yeni IP'ye çevir** — TTL 60 sn ayarlıysa anında — ~2 dk.
3. **Sunucuyu hazırla:**
   ```sh
   ssh root@<new-ip>
   curl -fsSL https://raw.githubusercontent.com/soylemezz33/markala/main/scripts/setup-server.sh | bash
   ```
4. **Repo'yu klonla + .env restore et** (1Password'tan) — ~10 dk.
   ```sh
   git clone https://github.com/soylemezz33/markala.git /opt/markala
   cd /opt/markala
   # 1Password'tan .env'i indir/yapıştır
   ```
5. **Stack'i başlat (DB hariç):**
   ```sh
   docker compose -f docker-compose.production.yml up -d postgres
   sleep 30  # init için bekle
   ```
6. **R2'den restore:**
   ```sh
   ./scripts/restore-postgres.sh --from-r2 markala-latest.sql.gz
   ```
7. **Geri kalan servisleri başlat:**
   ```sh
   docker compose -f docker-compose.production.yml up -d
   ```
8. **SSL — Let's Encrypt yeniden alma:**
   ```sh
   docker compose exec nginx certbot --nginx -d markala.com.tr -d www.markala.com.tr -d admin.markala.com.tr -d api.markala.com.tr
   ```
9. **Smoke + status page güncelle:**
   ```sh
   curl -fsS https://markala.com.tr/api/health
   # UptimeRobot otomatik UP raporlar
   ```

### 4.4. Rollback senaryosu (kötü deploy)

```sh
# Önceki tag'i bul
docker image ls ghcr.io/soylemezz33/markala/web | head -5

# .env'de TAG değişkenini geri çek
sed -i 's/^TAG=.*/TAG=v1.2.2/' .env

# Re-deploy (DB'ye dokunmuyor)
docker compose -f docker-compose.production.yml up -d --no-build web api admin

# Smoke
curl -fsS https://markala.com.tr/api/health
```

DB schema değişti ve geri uyumsuz ise: `restore.sh` + uygulama rollback aynı anda gerekir. Bu yüzden migration'lar **her zaman geriye uyumlu** yazılmalı (additive only).

## 5. Faz 2 — Cross-region failover planı

Bütçe makul olunca eklenecek:
1. **WAL streaming** → `pgBackRest` ile RPO 5 dk.
2. **İkincil VPS (Nuremberg)** — hot standby.
3. **Cloudflare Load Balancer** — origin pool failover.
4. **R2 cross-region replication** — Avrupa + ABD bölgeleri.
5. **Terraform** ile infra-as-code (full stack yeniden kurulabilir).

## 6. İletişim — Incident sırasında

| Durum | Aksiyon | Sorumlu |
|-------|---------|---------|
| Down ≤ 15 dk | Slack `#markala-alerts` not | Hasan |
| Down 15-60 dk | Status page + Twitter "biraz aksaklık" | Hasan |
| Down >60 dk | Mehmet Erdoğan'a bilgi + müşteri iletişimi | Hasan |
| Data loss şüphesi | Hetzner support ticket + log koru | Hasan |

## 7. Drill History

| Tarih | Backup tarihi | Süre | Sonuç | Notlar |
|-------|---------------|------|-------|--------|
| _YYYY-MM-DD_ | _markala-XXX.sql.gz_ | _Xdk_ | ✅ / ❌ | _ilk drill notu_ |

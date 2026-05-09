# Markala — Operations Runbook

Production'da bir şey ters giderse buradan başla. Sırayla bak, atlama.

## 🚨 Site Down — 5 Dakika İçinde Çöz

### 1. Cloudflare durumu
- https://www.cloudflarestatus.com/ → "Operational" mı?
- Cloudflare dashboard → Analytics → Traffic dropped mı?

### 2. VPS erişimi
```bash
ping <VPS_IP>
ssh markala@<VPS_IP>
```
- Ping cevap vermezse → Hetzner Cloud Console'dan VPS durumunu kontrol et
- SSH cevap vermezse → Hetzner Console'dan "Rescue" mode

### 3. Docker container'lar
```bash
ssh markala@<VPS_IP>
cd /opt/markala
docker compose -f docker-compose.production.yml ps
```

| Beklenen | Aksiyon |
|---|---|
| Hepsi `Up` ve `healthy` | 4. adıma geç |
| Bazısı `Restarting` | `docker compose logs SERVICE --tail 50` |
| Bazısı `Exited` | `docker compose up -d SERVICE` |
| Hepsi down | `docker compose up -d` |

### 4. Disk dolu mu?
```bash
df -h
# /var/lib/docker dolu olabilir
docker system prune -af --volumes  # ⚠️ Volumes hariç bırak: --volumes flag'ini SİL
```

### 5. RAM dolu mu?
```bash
free -h
# Container'lar yüksek RAM kullanıyorsa restart
docker compose restart web admin
```

## 🐛 Health Check Failures

```bash
curl -v http://localhost:3000/api/health  # Web
curl -v http://localhost:3001/api/health  # Admin
curl -v http://localhost:4000/health      # API
```

| Hata | Çözüm |
|---|---|
| Connection refused | Container down — `docker compose up -d` |
| 500 error | Loglara bak: `docker compose logs SERVICE --tail 100` |
| Timeout | DB bağlantı problemi — Postgres health check |
| 401/403 | Env var problemi — `.env.production` doğrula |

## 💾 Database Sorunları

### Connection limit aşıldı
```bash
docker compose exec postgres psql -U markala -c "SELECT count(*) FROM pg_stat_activity;"
# Limit default 100 — connection pool sorunu varsa
docker compose restart api
```

### Disk dolu (Postgres)
```bash
docker compose exec postgres psql -U markala -c "SELECT pg_database_size('markala');"
# Eski yorumlar / log tablolarını temizle
docker compose exec postgres psql -U markala -c "DELETE FROM notification_logs WHERE created_at < NOW() - INTERVAL '90 days';"
docker compose exec postgres psql -U markala -c "VACUUM FULL;"
```

### Yavaş query'ler
```bash
docker compose exec postgres psql -U markala -c "
  SELECT query, calls, total_exec_time, mean_exec_time
  FROM pg_stat_statements
  ORDER BY mean_exec_time DESC LIMIT 10;
"
# pg_stat_statements extension açıksa
```

## 📦 Deploy Sorunları

### Deploy başarısız
1. GitHub Actions log'larına bak: https://github.com/soylemezz33/markala/actions
2. SSH ile VPS'e gir, manuel dene:
   ```bash
   cd /opt/markala
   ./scripts/deploy.sh
   ```
3. Hata ne diyorsa düzelt — genelde:
   - Docker image pull fail → GHCR token expired
   - Env var eksik → `.env.production` güncelle
   - Migration hata → manuel çalıştır

### Rollback (önceki versiyona dön)
```bash
cd /opt/markala
TAG=main-<önceki-commit-sha> docker compose -f docker-compose.production.yml pull
TAG=main-<önceki-commit-sha> docker compose -f docker-compose.production.yml up -d
```

## 🔐 Güvenlik Olayları

### Brute force SSH atak
```bash
sudo fail2ban-client status sshd
# Banlı IP'leri gör
sudo fail2ban-client unban <IP>  # Yanlış banlıysa kaldır
```

### DDoS
- Cloudflare → "Security" → "Under Attack Mode" ON
- Geçici çözüm: tüm trafik Cloudflare challenge sayfasına gider

### Veri sızıntısı şüphesi
1. Tüm secret'ları rotasyon et:
   ```bash
   # Yeni JWT_SECRET, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET üret
   # .env.production'ı güncelle
   docker compose restart
   ```
2. Postgres password değiştir:
   ```bash
   docker compose exec postgres psql -U markala -c "ALTER USER markala WITH PASSWORD 'YENI_PASSWORD';"
   # .env.production'da POSTGRES_PASSWORD'u güncelle
   docker compose restart api
   ```
3. Cloudflare API token'ını yenile

## 📊 Performans Sorunları

### Yavaş sayfa yükleme
1. Lighthouse skor: https://pagespeed.web.dev/?url=https://markala.com.tr
2. Cloudflare cache hit oranı: dashboard → Analytics → Performance
3. Slow query log'u: Postgres
4. Image optimization aktif mi: `next.config.mjs` `images.formats: ["avif", "webp"]`

### Bellek/CPU yüksek
```bash
docker stats
# Hangi container kaynak yiyor?

# Çıkar (memory leak şüphesi)
docker compose restart SERVICE
```

## 💾 Backup & Restore

### Backup'ları gör
```bash
ls -lah /opt/markala/backups/
```

### Manuel backup
```bash
docker compose -f docker-compose.production.yml exec backup sh /usr/local/bin/backup.sh
```

### Restore (felaket durumu)
```bash
# Hangi backup'tan?
ls /opt/markala/backups/markala-*.sql.gz

# Restore
BACKUP=markala-20260515-090000.sql.gz
gunzip -c /opt/markala/backups/$BACKUP | \
    docker compose -f docker-compose.production.yml exec -T postgres \
    psql -U markala markala
```

## 📱 İletişim Acil Durumlar

| Senaryo | Aksiyon |
|---|---|
| Tüm site down >5dk | WhatsApp grup, müşterilere bilgi mesajı |
| Ödeme sorunu | iyzico support: 0850 222 99 00 |
| Cloudflare problemi | https://support.cloudflare.com/ |
| Hetzner VPS problemi | https://console.hetzner.cloud/ → support |
| Database bozulma | Backup'tan restore + post-mortem |

## 📝 Post-Mortem Şablonu

Her major incident sonrası `docs/postmortems/YYYY-MM-DD-XX.md` oluştur:

```md
# YYYY-MM-DD: Kısa başlık

## Özet
Ne oldu? Kaç dakika down? Etki?

## Zaman çizelgesi
- 14:23 — Alarm geldi
- 14:25 — VPS'e SSH girildi
- 14:30 — Sebep: ...
- 14:42 — Çözüldü

## Root cause
Neden oldu, hangi değişiklik tetikledi?

## Önleme
1. Şu monitoring eksikti, eklendi
2. Şu test eklendi
3. Şu config değişti
```

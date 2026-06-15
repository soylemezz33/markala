# Markala — Monitoring & Alerting Rehberi

> **Audience:** Hasan (operatör). VPS'e bir kez kurulur, sonra çoğunlukla unutulur. Alarm geldiğinde bu rehbere dön.
> **Stack:** UptimeRobot (external) + Prometheus + node-exporter (internal) + Grafana Cloud free tier (dashboards & long-term storage) + Slack (alert channel).
> **RTO target:** 15 dk (alarm → triage başlangıç).

## 1. Mimari özet

```
                ┌─────────────────────┐
                │   UptimeRobot       │  (external blackbox, 5 dk)
                │   → email + Slack   │
                └──────────┬──────────┘
                           │ HTTPS probe
                           ▼
┌──────────────────────────────────────────────────────────────┐
│  Hetzner VPS — markala-prod-1                                │
│                                                              │
│  nginx ◀── stub_status ── nginx-exporter (:9113)             │
│  postgres ◀── sql ── postgres-exporter (:9187, Phase 2)      │
│  host ◀── /proc /sys ── node-exporter (:9100)                │
│                                ▲                             │
│                                │ scrape (30s)                │
│                          ┌─────┴──────┐                      │
│                          │ Prometheus │ ─ remote_write ─▶ Grafana Cloud
│                          │ (:9090)    │                      │
│                          └────────────┘                      │
└──────────────────────────────────────────────────────────────┘
```

İki katmanlı izleme:
- **External** (UptimeRobot): "Site açık mı?" perspektifi. DNS, SSL, edge dahil.
- **Internal** (Prometheus): "Niye yavaş?" perspektifi. CPU, RAM, disk, request rate.

## 2. UptimeRobot kurulumu (15 dk, ücretsiz)

1. https://uptimerobot.com → free hesap aç (`hasansylemezz@gmail.com`).
2. **Add New Monitor** → her satır için tekrarla:

   | Name | Type | URL/Target | Interval | Keyword |
   |------|------|------------|----------|---------|
   | Markala — Web | HTTPS | `https://markala.com.tr` | 5 min | `Markala` exists |
   | Markala — API Health | Keyword | `https://markala.com.tr/api/health` | 5 min | `"status":"ok"` exists |
   | Markala — Admin | HTTPS | `https://admin.markala.com.tr/giris` | 5 min | – |
   | Markala — SSL | SSL | `https://markala.com.tr` | 1 day | – |
   | Markala — Sitemap | HTTPS | `https://markala.com.tr/sitemap.xml` | 15 min | – |

   Konfigürasyonun JSON karşılığı: `monitoring/uptime-config.json`.

3. **My Settings → Alert Contacts:**
   - **Email**: `hasansylemezz@gmail.com` (varsayılan).
   - **Webhook → Slack**: Slack Incoming Webhook URL'i yapıştır (`#markala-alerts` kanalı).
4. **Status Page (public):** `Status Pages → Add Status Page` → "Markala Status" → tüm monitorları seç → kaydet. Faz 2'de `status.markala.com.tr` CNAME ile özelleştir.
5. **Deploy sırasında alarm susturma:** `scripts/deploy.sh`'a entegrasyon: deploy başında `editMonitor` API çağrısı ile maintenance window aç, deploy sonu kapat. (Şimdilik manuel.)

## 3. Prometheus + node-exporter (VPS içi)

### Servisleri başlat
```sh
docker compose -f docker-compose.production.yml up -d node-exporter nginx-exporter prometheus
```

### Doğrulama
```sh
# node-exporter erişilebilir mi?
docker exec markala-prometheus wget -qO- http://node-exporter:9100/metrics | head -20

# Prometheus targets sağlıklı mı?
docker exec markala-prometheus wget -qO- http://localhost:9090/api/v1/targets | grep -o '"health":"[^"]*"' | sort -u
# Beklenen: "health":"up"
```

### Nginx stub_status etkinleştirme
`nginx/conf.d/default.conf` içine ekle (henüz yoksa):
```nginx
server {
    listen 8080;
    server_name localhost;
    location /stub_status {
        stub_status on;
        access_log off;
        allow 172.16.0.0/12;  # docker network
        deny all;
    }
}
```
Sonra: `docker compose exec nginx nginx -s reload`.

## 4. Grafana Cloud (ücretsiz, opsiyonel ama tavsiye edilir)

Free tier: 10K active metrics, 50 GB log, 14 gün retention.

1. https://grafana.com/products/cloud → free signup.
2. **Connections → Add new data source → Hosted Prometheus metrics** → API key oluştur.
3. URL ve credentials'ı VPS'te `.env` içine ekle:
   ```sh
   GRAFANA_CLOUD_URL=https://prometheus-prod-XX-prod-eu-west-X.grafana.net/api/prom/push
   GRAFANA_CLOUD_USERNAME=123456
   GRAFANA_CLOUD_API_KEY=glc_eyJ...
   ```
4. `monitoring/prometheus.yml` içindeki `remote_write` bloğunu uncomment et + env'leri inject et.
5. `docker compose restart prometheus`.
6. Grafana'da hazır dashboard import et:
   - **1860** — Node Exporter Full
   - **12708** — Nginx exporter
   - **9628** — PostgreSQL (Phase 2)

## 5. Alert Thresholds (SLO Alarm Matrisi)

| Metrik | Warning eşiği | Critical eşiği | Süre | PromQL / Kaynak |
|--------|---------------|----------------|------|-----------------|
| CPU kullanımı | >70% | >85% | 10 dk / 5 dk | `(1 - rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100` |
| Memory kullanımı | >80% | >90% | 10 dk / 5 dk | `(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100` |
| Disk doluluk | >85% | >95% | 10 dk / 5 dk | `(1 - node_filesystem_avail_bytes / node_filesystem_size_bytes) * 100` |
| Disk I/O wait | >20% | >40% | 5 dk | `rate(node_cpu_seconds_total{mode="iowait"}[5m]) * 100` |
| HTTP 5xx rate | >0.5% | >5% | 5 dk | `rate(nginx_http_requests_total{status=~"5.."}[5m])` |
| API latency (p99) | >500ms | – | 5 dk | `probe_duration_seconds{job="markala-api-health-probe"}` |
| TLS expiry | <14 gün | <7 gün | 1 sa | UptimeRobot SSL / `probe_ssl_earliest_cert_expiry` |
| Postgres bağlantı | >80% pool | >95% pool | 5 dk / 2 dk | `pg_stat_database_numbackends / pg_settings_max_connections` |
| Site erişilirlik | – | 2 ardışık fail | – | UptimeRobot HTTPS monitor |
| API health/deep | – | fail (2 dk) | 2 dk | UptimeRobot keyword + Blackbox probe |
| Backup tazeliği | – | >25 sa | 1 dk | `time() - markala_backup_last_success_timestamp_seconds` |

Tüm kurallar: `monitoring/alerts/rules.yml`. Promtool ile doğrula:
```sh
promtool check rules monitoring/alerts/rules.yml
```

## 6. Slack alert formatı

UptimeRobot webhook payload (Slack-uyumlu):
```
*[DOWN]* Markala — Web (https://markala.com.tr)
Started: 2026-05-13 09:42:11 UTC+3
Reason: HTTP 502 Bad Gateway
Duration so far: 2 min
```

Slack'te kanal: `#markala-alerts`. Mute kuralı: gece 02:00-07:00 arası critical-only (Slack notification schedule).

## 7. Health endpoint sözleşmesi

İki endpoint mevcut; kullanım amacına göre seç:

### `/api/health` — Shallow (her zaman 200)
Bağımlılık testi yok. Load-balancer, Kubernetes liveness probe için:
```json
{
  "status": "ok",
  "service": "markala-api",
  "version": "0.1.0",
  "uptime_seconds": 84231,
  "timestamp": "2026-05-13T06:42:11Z"
}
```

### `/api/health/deep` — Deep (DB + Redis ping)
UptimeRobot ve Prometheus blackbox probe için. DB veya Redis erişilemezse **HTTP 503**:
```json
{
  "status": "degraded",
  "service": "markala-api",
  "version": "0.1.0",
  "uptime_seconds": 84231,
  "db": "error",
  "redis": "ok",
  "timestamp": "2026-05-13T06:42:11Z"
}
```

| Alan | Değerler |
|------|---------|
| `status` | `"ok"` / `"degraded"` |
| `db` | `"ok"` / `"error"` |
| `redis` | `"ok"` / `"error"` / `"not_configured"` |

`redis: "not_configured"` — `REDIS_URL` env yok, sağlıklı sayılır.
UptimeRobot keyword check: `"status":"ok"` (deep için string olmadan yok — HTTP 503 tetikler).

Implementasyon: `apps/api/src/health/health.controller.ts`.

## 8. Sorun giderme

| Belirti | Olası neden | İlk adım |
|---------|-------------|----------|
| UptimeRobot Down + site açık | DNS/Cloudflare edge | `curl -I https://markala.com.tr` farklı network'ten |
| Prometheus target DOWN | container down | `docker compose ps` + `docker logs <name>` |
| Disk %85+ | log birikmesi | `du -sh /var/lib/docker/* \| sort -h`; eski log temizle |
| CPU spike | crawl/bot trafiği | `tail -f nginx-logs` user-agent analiz |
| 5xx spike | API exception | `docker logs markala-api --since 10m` |

## 9. İlk haftalık checklist (Hasan)

- [ ] UptimeRobot hesap + 5 monitor aktif
- [ ] Slack webhook bağlandı + test mesajı geldi
- [ ] Grafana Cloud signup + remote_write aktif
- [ ] Node Exporter Full dashboard import edildi
- [ ] R2 backup credentials `.env` içinde (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET=markala-backups`)
- [ ] `scripts/restore-postgres.sh` ile **drill** yapıldı (bkz. `DISASTER_RECOVERY.md`)
- [ ] Public status page link `markala.com.tr` footer'a eklendi

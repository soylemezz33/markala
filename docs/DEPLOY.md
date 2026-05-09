# Markala — Deploy Rehberi

Production deploy için A'dan Z'ye adımlar. Hetzner VPS + Cloudflare + GitHub Actions stack'i için yazıldı.

## 📋 Önkoşullar

- [ ] **Hetzner Cloud hesabı** (~€5/ay CX22, ~€10/ay CX32 önerilen)
- [ ] **Cloudflare hesabı** (ücretsiz plan yeterli)
- [ ] **Domain `markala.com.tr`** (zaten registered)
- [ ] **GitHub repo** → `soylemezz33/markala` (✅ kuruldu)

## 🚀 1. Hetzner VPS Sipariş

1. https://console.hetzner.cloud/ → "Add Server"
2. Lokasyon: **Nuremberg** veya **Helsinki** (Türkiye'ye ~50ms)
3. Image: **Ubuntu 24.04 LTS**
4. Type: **CX22** (4 vCPU, 8GB RAM, 80GB SSD) — ~€5/ay
5. SSH Key: lokalde `ssh-keygen -t ed25519` → public key'i ekle
6. Networking: Public IP enable (default)
7. Hostname: `markala-prod`
8. Create — IP'yi not et (örn. `123.45.67.89`)

## 🌐 2. Cloudflare DNS Bağlantısı

1. https://dash.cloudflare.com/ → "Add Site"
2. `markala.com.tr` ekle
3. Plan: **Free**
4. Cloudflare nameserver'larını al (`xxx.ns.cloudflare.com`)
5. Domain registrar'ında nameserver'ları Cloudflare'inkilerle değiştir
6. **DNS records** ekle:

| Type | Name | Content | Proxy |
|---|---|---|---|
| A | `@` | `<VPS_IP>` | ✅ Proxied |
| A | `www` | `<VPS_IP>` | ✅ Proxied |
| A | `admin` | `<VPS_IP>` | ✅ Proxied |
| A | `api` | `<VPS_IP>` | ✅ Proxied |
| A | `uploads` | `<R2_PUBLIC_DOMAIN>` | ✅ Proxied |
| TXT | `@` | Search Console verification | DNS only |

7. **SSL/TLS** → "Full (strict)"
8. **SSL/TLS** → "Edge Certificates" → "Always Use HTTPS" ON
9. **SSL/TLS** → "Origin Server" → "Create Certificate" — `*.markala.com.tr, markala.com.tr` için 15 yıl SSL üret
   - `.pem` ve `.key` dosyalarını indirip sakla

## 🛠️ 3. VPS Kurulum

```bash
# Local'den SSH
ssh root@<VPS_IP>

# Bootstrap script çalıştır
curl -fsSL https://raw.githubusercontent.com/soylemezz33/markala/main/scripts/setup-server.sh | sudo bash
```

Script şunları yapar:
- Sistem güncelleme + Docker + Compose
- `markala` user oluşturur (deploy için)
- UFW firewall (sadece 22, 80, 443)
- fail2ban (SSH brute force koruma)
- SSH hardening (root login kapalı, password kapalı)
- Otomatik güvenlik güncellemeleri
- 4GB swap
- Docker log rotation

### SSH key ekle (deploy user için)

```bash
# VPS'de root olarak
mkdir -p /home/markala/.ssh
chmod 700 /home/markala/.ssh

# Local'deki public key'i yapıştır (örn. GitHub Actions deploy key)
nano /home/markala/.ssh/authorized_keys
chmod 600 /home/markala/.ssh/authorized_keys
chown -R markala:markala /home/markala/.ssh

systemctl restart ssh
```

### SSL sertifikalarını yükle

```bash
mkdir -p /opt/markala/nginx/ssl
# Lokal makinen: scp ~/Downloads/markala.com.tr.pem markala@<VPS_IP>:/opt/markala/nginx/ssl/
# scp ~/Downloads/markala.com.tr.key markala@<VPS_IP>:/opt/markala/nginx/ssl/
chmod 600 /opt/markala/nginx/ssl/*
```

## ⚙️ 4. Environment Hazırla

```bash
ssh markala@<VPS_IP>
cd /opt/markala

# Repo'yu klonla
git clone https://github.com/soylemezz33/markala.git .

# Production env oluştur
cp .env.production.example .env.production
nano .env.production  # gerçek değerleri doldur
chmod 600 .env.production
```

**Kritik secret'lar:**

```bash
# JWT secret
openssl rand -hex 64

# Postgres password
openssl rand -base64 32

# Admin session secret
openssl rand -base64 48

# Admin password hash (lokalde, dev sunucu çalışırken)
curl 'http://localhost:3001/api/auth/setup-hash?password=BURAYA_GUVENLI_SIFRE_YAZ'
# Dönen JSON'daki ADMIN_PASSWORD_HASH değerini .env.production'a kopyala
```

## 🚢 5. İlk Deploy

```bash
# VPS'de markala user olarak
cd /opt/markala

# Build (yerel, ilk seferde) — sonra GitHub Actions devralır
docker compose -f docker-compose.production.yml build

# Servisleri başlat
docker compose -f docker-compose.production.yml up -d

# Loglara bak
docker compose -f docker-compose.production.yml logs -f
```

**Doğrulama:**

```bash
# Web
curl -I https://markala.com.tr
# Beklenen: HTTP/2 200, security headers

# API health
curl https://api.markala.com.tr/health
# Beklenen: {"status":"ok"}

# Admin
curl -I https://admin.markala.com.tr/giris
# Beklenen: HTTP/2 200
```

## 🤖 6. GitHub Actions CI/CD

GitHub repo → Settings → Secrets:

| Secret | Değer |
|---|---|
| `SSH_HOST` | VPS_IP |
| `SSH_USER` | `markala` |
| `SSH_PORT` | `22` |
| `SSH_PRIVATE_KEY` | Deploy user'ın private key'i (RSA/Ed25519) |

Settings → Environments → "production" oluştur.

Sonra her `git push origin main`'de:
1. CI: type-check + build (✅ veya ❌)
2. Deploy: Docker image build → GHCR push → SSH ile VPS'de pull + restart
3. Health check otomatik

## 📊 7. Monitoring

### Cloudflare Analytics (built-in, ücretsiz)
- Trafik, top page, cache hit ratio
- "Analytics & Logs" sekmesi

### UptimeKuma (self-hosted, ücretsiz)
```bash
docker run -d --restart=unless-stopped \
    -p 3002:3001 -v uptime-kuma:/app/data \
    --name uptime-kuma louislam/uptime-kuma
```
Sonra `https://uptime-kuma.markala.com.tr/`'yu admin paneli yap.

### GA4 + Search Console
`.env.production`'da `NEXT_PUBLIC_GA4_ID` ve `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` doluysa otomatik.

## 🔄 8. Günlük Operasyon

```bash
# Deploy (manuel)
ssh markala@<VPS_IP>
cd /opt/markala
./scripts/deploy.sh

# Loglar
docker compose -f docker-compose.production.yml logs -f web
docker compose -f docker-compose.production.yml logs --tail 100 api

# Container durumu
docker compose -f docker-compose.production.yml ps

# Restart tek service
docker compose -f docker-compose.production.yml restart web

# Database shell
docker compose -f docker-compose.production.yml exec postgres psql -U markala

# Manuel backup
docker compose -f docker-compose.production.yml exec backup sh /usr/local/bin/backup.sh
```

## 🚨 9. Disaster Recovery

### Postgres restore
```bash
# En son backup'tan
gunzip -c /opt/markala/backups/markala-latest.sql.gz | \
    docker compose -f docker-compose.production.yml exec -T postgres \
    psql -U markala markala
```

### Tüm sistemden çıkış / yeniden kurulum
```bash
docker compose -f docker-compose.production.yml down
# ... veri kaybetmeden:
docker compose -f docker-compose.production.yml down  # volumes korunur
# Tamamen sil:
docker compose -f docker-compose.production.yml down -v  # ⚠️ DİKKAT: data silinir
```

## 🔐 10. Güvenlik Checklist

- [ ] SSH password login kapalı
- [ ] Root login kapalı
- [ ] UFW aktif (22, 80, 443 only)
- [ ] fail2ban aktif
- [ ] Docker log rotation aktif
- [ ] Otomatik güvenlik güncellemeleri aktif
- [ ] `.env.production` chmod 600
- [ ] SSL sertifikaları chmod 600
- [ ] Cloudflare WAF aktif
- [ ] Cloudflare Bot Fight Mode aktif
- [ ] Postgres dış erişim YOK (sadece Docker network)
- [ ] Backup'lar günlük + 30 gün retention

## 📞 İletişim

Sorun çıkarsa: WhatsApp veya iletişim sayfası. Bu doküman repo'da güncel tutulur.

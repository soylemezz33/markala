#!/bin/bash
# post-install-automation.sh
# VM hazır olunca local makineden çalıştır — markala-prod'a SSH ile tüm setup'ı yapar.
#
# Önkoşul: ssh markala@185.121.126.20 key auth çalışmalı.
#
# Yapacakları:
#   1. Sistemi güncelle, Docker + UFW + fail2ban + swap kur (setup-server.sh)
#   2. markala user için SSH key üret
#   3. GitHub'a deploy key olarak ekle (gh CLI burada)
#   4. /opt/markala'da repo'yu clone et
#   5. .env.production placeholder'ı yerleştir
#   6. (TODO) Cloudflare API ile DNS A records + Origin SSL (Hasan token verince)
#   7. docker compose up -d
#
# Kullanım:
#   bash scripts/esxi/post-install-automation.sh

set -euo pipefail

VM_HOST="markala@185.121.126.20"
VM_IP="185.121.126.20"
REPO="soylemezz33/markala"
DEPLOY_DIR="/opt/markala"
DOMAIN="markala.com.tr"

echo "═══════════════════════════════════════════"
echo " markala-prod post-install otomasyon"
echo "═══════════════════════════════════════════"

# === 1. SSH key auth check ===
echo "→ SSH key auth doğrulanıyor..."
ssh -o BatchMode=yes -o ConnectTimeout=5 "$VM_HOST" 'echo "SSH OK: $(hostname) / $(whoami)"' || {
  echo "❌ SSH key auth fail. VM hazır değil veya key import olmamış."
  exit 1
}

# === 2. setup-server.sh çalıştır ===
echo "→ setup-server.sh remote'a kopyalanıyor..."
scp scripts/setup-server.sh "$VM_HOST:/tmp/setup-server.sh"
echo "→ setup-server.sh çalıştırılıyor (sudo)..."
ssh "$VM_HOST" 'sudo bash /tmp/setup-server.sh'

# === 3. markala user için SSH key üret ===
echo "→ Deploy SSH key üretiliyor..."
ssh "$VM_HOST" '[ -f ~/.ssh/id_ed25519 ] || ssh-keygen -t ed25519 -N "" -C "markala-prod@$(hostname)" -f ~/.ssh/id_ed25519'
DEPLOY_PUBKEY=$(ssh "$VM_HOST" 'cat ~/.ssh/id_ed25519.pub')
echo "Deploy public key:"
echo "  $DEPLOY_PUBKEY"

# === 4. GitHub deploy key olarak ekle ===
echo "→ GitHub deploy key ekleniyor (read-only)..."
echo "$DEPLOY_PUBKEY" | gh repo deploy-key add - --repo "$REPO" --title "markala-prod $(date +%Y-%m-%d)" || {
  echo "⚠️  Deploy key eklenemedi (zaten var veya gh auth eksik). Devam ediyor."
}

# === 5. Repo clone ===
echo "→ /opt/markala'da repo clone..."
ssh "$VM_HOST" "sudo mkdir -p $DEPLOY_DIR && sudo chown markala:markala $DEPLOY_DIR"
ssh "$VM_HOST" "ssh-keyscan github.com >> ~/.ssh/known_hosts 2>/dev/null"
ssh "$VM_HOST" "cd $DEPLOY_DIR && [ -d .git ] || git clone git@github.com:$REPO.git ."

# === 6. .env.production placeholder ===
echo "→ .env.production placeholder yerleştiriliyor..."
ssh "$VM_HOST" "[ -f $DEPLOY_DIR/.env.production ] || cp $DEPLOY_DIR/.env.production.example $DEPLOY_DIR/.env.production && chmod 600 $DEPLOY_DIR/.env.production"

# === 7. Postgres password + JWT secret otomatik üret ===
echo "→ Postgres password + JWT secret üretiliyor..."
ssh "$VM_HOST" 'cd /opt/markala && grep -q "POSTGRES_PASSWORD=$" .env.production && sed -i "s|POSTGRES_PASSWORD=|POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d /+= | head -c32)|" .env.production'
ssh "$VM_HOST" 'cd /opt/markala && grep -q "JWT_SECRET=$" .env.production && sed -i "s|JWT_SECRET=|JWT_SECRET=$(openssl rand -hex 64)|" .env.production'
ssh "$VM_HOST" 'cd /opt/markala && grep -q "ADMIN_SESSION_SECRET=$" .env.production && sed -i "s|ADMIN_SESSION_SECRET=|ADMIN_SESSION_SECRET=$(openssl rand -base64 48 | tr -d /+= | head -c48)|" .env.production'

# === 8. (TODO) Cloudflare DNS + Origin SSL ===
echo ""
echo "═══════════════════════════════════════════"
echo " HASAN'IN ELLE YAPACAĞI: Cloudflare DNS + SSL"
echo "═══════════════════════════════════════════"
cat <<EOF
1) Cloudflare → markala.com.tr → DNS → Records:
   - A   @          185.121.126.20  Proxied
   - A   www        185.121.126.20  Proxied
   - A   admin      185.121.126.20  Proxied
   - A   api        185.121.126.20  Proxied
   - A   uploads    185.121.126.20  Proxied (sonra R2 ile değişir)

2) Cloudflare → SSL/TLS → Origin Server → Create Certificate
   - Common name: *.markala.com.tr
   - 15 yıl
   - .pem ve .key dosyalarını $DEPLOY_DIR/nginx/ssl/ altına yükle:
       ssh markala@185.121.126.20
       sudo mkdir -p /opt/markala/nginx/ssl
       sudo nano /opt/markala/nginx/ssl/markala.com.tr.pem  # paste
       sudo nano /opt/markala/nginx/ssl/markala.com.tr.key  # paste
       sudo chmod 600 /opt/markala/nginx/ssl/*

3) Diğer secrets'ları .env.production'da doldur:
   ssh markala@185.121.126.20 'sudo nano /opt/markala/.env.production'
   - IYZICO_API_KEY, IYZICO_SECRET
   - SENDGRID_API_KEY
   - NETGSM_USERNAME, NETGSM_PASSWORD
   - DHL_API_KEY, DHL_ACCOUNT_NUMBER
   - R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
   - PARASUT_CLIENT_ID, PARASUT_CLIENT_SECRET, PARASUT_COMPANY_ID
   - SENTRY_DSN, NEXT_PUBLIC_GA4_ID

4) Deploy başlat:
   ssh markala@185.121.126.20 'cd /opt/markala && docker compose -f docker-compose.production.yml up -d'

EOF

echo "═══════════════════════════════════════════"
echo " ✅ Otomatik kısım tamamlandı"
echo "═══════════════════════════════════════════"

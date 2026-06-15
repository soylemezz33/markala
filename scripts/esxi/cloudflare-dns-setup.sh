#!/bin/bash
# cloudflare-dns-setup.sh
# Markala için Cloudflare DNS A records + Origin SSL otomasyonu.
#
# Önkoşul:
#   export CF_API_TOKEN="..."        # Zone:Read, DNS:Edit, SSL:Edit yetkileri
#   export CF_ZONE_ID="..."          # markala.com.tr zone id (CF dashboard → API → Zone ID)
#
# Yapacakları:
#   1. 5 A record oluştur (@, www, admin, api, uploads → 185.121.126.20)
#   2. Cloudflare Origin Certificate oluştur (15 yıl, *.markala.com.tr)
#   3. Cert/key dosyalarını local'e kaydet, sonra VM'e push
#   4. Always Use HTTPS aç, Min TLS 1.2 set

set -euo pipefail

: "${CF_API_TOKEN:?CF_API_TOKEN env değişkeni gerekli}"
: "${CF_ZONE_ID:?CF_ZONE_ID env değişkeni gerekli}"

VM_IP="185.121.126.20"
DOMAIN="markala.com.tr"
VM_HOST="markala@185.121.126.20"

CF_API="https://api.cloudflare.com/client/v4"
H_AUTH="Authorization: Bearer $CF_API_TOKEN"
H_JSON="Content-Type: application/json"

cf() {
  curl -s -H "$H_AUTH" -H "$H_JSON" "$@"
}

echo "═══════════════════════════════════════════"
echo " Cloudflare DNS + SSL setup — $DOMAIN"
echo "═══════════════════════════════════════════"

# === 1. Verify token ===
echo "→ Token doğrulanıyor..."
verify=$(cf "$CF_API/user/tokens/verify")
echo "$verify" | grep -q '"success":true' || { echo "❌ Token geçersiz"; exit 1; }
echo "✓ Token OK"

# === 2. Zone bilgisi ===
echo "→ Zone bilgisi..."
zone=$(cf "$CF_API/zones/$CF_ZONE_ID")
echo "$zone" | grep -o '"name":"[^"]*"' | head -1

# === 3. A records ===
declare -A RECORDS=(
  ["@"]="$VM_IP"
  ["www"]="$VM_IP"
  ["admin"]="$VM_IP"
  ["api"]="$VM_IP"
  ["uploads"]="$VM_IP"
)

for name in "${!RECORDS[@]}"; do
  ip="${RECORDS[$name]}"
  full="$name"
  [ "$name" = "@" ] && full="$DOMAIN" || full="$name.$DOMAIN"

  # Var olan record'u sil
  existing=$(cf "$CF_API/zones/$CF_ZONE_ID/dns_records?type=A&name=$full" | grep -o '"id":"[^"]*"' | head -1 | sed 's/"id":"\(.*\)"/\1/')
  if [ -n "$existing" ]; then
    echo "→ $full: önceki record siliniyor ($existing)..."
    cf -X DELETE "$CF_API/zones/$CF_ZONE_ID/dns_records/$existing" > /dev/null
  fi

  echo "→ A $full → $ip (proxied) oluşturuluyor..."
  cf -X POST "$CF_API/zones/$CF_ZONE_ID/dns_records" \
    -d "{\"type\":\"A\",\"name\":\"$full\",\"content\":\"$ip\",\"ttl\":1,\"proxied\":true}" \
    | grep -o '"success":[a-z]*' | head -1
done

# === 4. Origin Certificate ===
CERT_DIR="$HOME/.markala-ssl"
mkdir -p "$CERT_DIR" && chmod 700 "$CERT_DIR"

if [ ! -f "$CERT_DIR/markala.com.tr.pem" ]; then
  echo "→ Origin Certificate üretiliyor (15 yıl)..."
  # CSR + private key
  openssl req -new -newkey rsa:2048 -nodes \
    -keyout "$CERT_DIR/markala.com.tr.key" \
    -out "$CERT_DIR/markala.com.tr.csr" \
    -subj "/CN=*.$DOMAIN" 2>/dev/null

  csr=$(cat "$CERT_DIR/markala.com.tr.csr" | sed ':a;N;$!ba;s/\n/\\n/g')

  resp=$(cf -X POST "$CF_API/certificates" \
    -H "X-Auth-User-Service-Key: " \
    -d "{\"hostnames\":[\"*.$DOMAIN\",\"$DOMAIN\"],\"requested_validity\":5475,\"request_type\":\"origin-rsa\",\"csr\":\"$csr\"}")

  # Cert'i extract et
  echo "$resp" | python3 -c 'import sys,json; print(json.load(sys.stdin)["result"]["certificate"])' > "$CERT_DIR/markala.com.tr.pem"
  echo "✓ Cert: $CERT_DIR/markala.com.tr.pem"
else
  echo "✓ Cert zaten var: $CERT_DIR/markala.com.tr.pem"
fi

# === 5. VM'e push ===
echo "→ Cert/key VM'e push ediliyor..."
ssh "$VM_HOST" 'sudo mkdir -p /opt/markala/nginx/ssl && sudo chown markala:markala /opt/markala/nginx/ssl'
scp "$CERT_DIR/markala.com.tr.pem" "$VM_HOST:/opt/markala/nginx/ssl/"
scp "$CERT_DIR/markala.com.tr.key" "$VM_HOST:/opt/markala/nginx/ssl/"
ssh "$VM_HOST" 'sudo chmod 600 /opt/markala/nginx/ssl/markala.com.tr.key'

# === 6. SSL settings ===
echo "→ Zone SSL ayarları (Full Strict, Always HTTPS, Min TLS 1.2)..."
cf -X PATCH "$CF_API/zones/$CF_ZONE_ID/settings/ssl" -d '{"value":"strict"}' | grep -o '"success":[a-z]*' | head -1
cf -X PATCH "$CF_API/zones/$CF_ZONE_ID/settings/always_use_https" -d '{"value":"on"}' | grep -o '"success":[a-z]*' | head -1
cf -X PATCH "$CF_API/zones/$CF_ZONE_ID/settings/min_tls_version" -d '{"value":"1.2"}' | grep -o '"success":[a-z]*' | head -1
cf -X PATCH "$CF_API/zones/$CF_ZONE_ID/settings/automatic_https_rewrites" -d '{"value":"on"}' | grep -o '"success":[a-z]*' | head -1

echo "═══════════════════════════════════════════"
echo " ✅ Cloudflare config tamam"
echo "═══════════════════════════════════════════"
echo "DNS propagation 1-5 dk sürer. Test:"
echo "  nslookup $DOMAIN"
echo "  curl -I https://$DOMAIN"

#!/usr/bin/env bash
# SSL sertifika expiry denetleyicisi — markala.com.tr + alt domainler
# Çıkış kodu: 0 = tümü OK, 1 = uyarı/kritik var

set -euo pipefail

# ── Yapılandırma ─────────────────────────────────────────────────────────────
DOMAINS=(
  "markala.com.tr"
  "www.markala.com.tr"
)

WARN_DAYS=30
ALERT_DAYS=14
CRITICAL_DAYS=7

# Telegram alarm (opsiyonel — secrets ile beslenir)
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# ── Renkler ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RESET='\033[0m'

# ── Telegram gönderici ───────────────────────────────────────────────────────
send_telegram() {
  local msg="$1"
  if [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]]; then
    curl -s -X POST \
      "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="$msg" \
      -d parse_mode="Markdown" \
      > /dev/null
  fi
}

# ── Domain başına expiry günü hesapla ────────────────────────────────────────
check_domain() {
  local domain="$1"
  local expiry_raw

  # 5 sn timeout ile cert bilgisi al
  expiry_raw=$(echo | timeout 5 openssl s_client \
    -connect "${domain}:443" \
    -servername "$domain" \
    2>/dev/null \
    | openssl x509 -noout -enddate 2>/dev/null \
    | cut -d= -f2 || true)

  if [[ -z "$expiry_raw" ]]; then
    echo -e "${RED}[HATA]${RESET} ${domain}: sertifika alınamadı (domain ulaşılamaz?)"
    return 2
  fi

  # "notAfter" tarihini Unix timestamp'e çevir
  local expiry_ts now_ts days_left
  expiry_ts=$(date -d "$expiry_raw" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$expiry_raw" +%s 2>/dev/null || true)

  # Her iki date komutu da başarısız olursa expiry_ts boş kalır;
  # set -euo pipefail altında boş aritmetik değişken script'i crash'ler.
  if [[ -z "$expiry_ts" ]]; then
    echo -e "${RED}[HATA]${RESET} ${domain}: geçerlilik tarihi ayrıştırılamadı: '${expiry_raw}'"
    return 2
  fi

  now_ts=$(date +%s)
  days_left=$(( (expiry_ts - now_ts) / 86400 ))

  local expiry_human
  expiry_human=$(date -d "@$expiry_ts" +"%Y-%m-%d" 2>/dev/null || date -r "$expiry_ts" +"%Y-%m-%d" 2>/dev/null)

  if (( days_left <= CRITICAL_DAYS )); then
    echo -e "${RED}[KRİTİK]${RESET} ${domain}: ${days_left} gün kaldı (${expiry_human})"
    send_telegram "🚨 *KRİTİK SSL ALARMI*%0A%0ADomain: \`${domain}\`%0AKalan: *${days_left} gün*%0ASon tarih: ${expiry_human}%0A%0ADerhal yenile!"
    return 1
  elif (( days_left <= ALERT_DAYS )); then
    echo -e "${YELLOW}[UYARI]${RESET} ${domain}: ${days_left} gün kaldı (${expiry_human})"
    send_telegram "⚠️ *SSL Uyarısı*%0A%0ADomain: \`${domain}\`%0AKalan: *${days_left} gün*%0ASon tarih: ${expiry_human}"
    return 1
  elif (( days_left <= WARN_DAYS )); then
    echo -e "${YELLOW}[DİKKAT]${RESET} ${domain}: ${days_left} gün kaldı (${expiry_human}) — yakında yenile"
    return 1
  else
    echo -e "${GREEN}[OK]${RESET} ${domain}: ${days_left} gün kaldı (${expiry_human})"
    return 0
  fi
}

# ── Ana akış ─────────────────────────────────────────────────────────────────
main() {
  echo -e "${CYAN}=== markala.com.tr SSL Expiry Denetimi — $(date '+%Y-%m-%d %H:%M:%S') ===${RESET}"
  echo ""

  local exit_code=0

  for domain in "${DOMAINS[@]}"; do
    check_domain "$domain" || exit_code=1
  done

  echo ""
  if (( exit_code == 0 )); then
    echo -e "${GREEN}Sonuç: Tüm sertifikalar geçerli.${RESET}"
  else
    echo -e "${YELLOW}Sonuç: Bir veya daha fazla sertifika dikkat gerektiriyor.${RESET}"
  fi

  return $exit_code
}

main "$@"

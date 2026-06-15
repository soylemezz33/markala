#!/bin/sh
# Markala — PostgreSQL günlük backup script
# docker-compose'daki backup container'ı tarafından çağrılır
# Retention: 30 gün (RETENTION_DAYS env)

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d-%H%M%S)

# ---------------------------------------------------------------------------
# GPG at-rest şifreleme (KVKK m.12 — müşteri PII'si şifresiz saklanamaz)
# BACKUP_GPG_RECIPIENT tanımlıysa dump gzip'ten sonra GPG ile şifrelenir
# (.sql.gz.gpg). Tanımlı DEĞİLSE eski davranış (şifresiz .sql.gz) korunur ama
# yüksek sesle uyarılır — böylece bu değişiklik anahtar provizyonu öncesi
# çalışan prod backup döngüsünü KIRMAZ. "Şifreleme istendi ama gpg yok" durumu
# ise abort eder: yanlışlıkla şifresiz PII üretmeyiz.
# ---------------------------------------------------------------------------
GPG_RECIPIENT="${BACKUP_GPG_RECIPIENT:-}"
EXT="sql.gz"
if [ -n "$GPG_RECIPIENT" ]; then
    if ! command -v gpg >/dev/null 2>&1; then
        echo "[$(date)] ❌ BACKUP_GPG_RECIPIENT tanımlı ama gpg kurulu değil — abort (şifresiz backup ÜRETİLMEZ)" >&2
        exit 4
    fi
    # Public key import (idempotent) — recipient keyring'de yoksa dosyadan al
    GPG_PUBKEY_FILE="${BACKUP_GPG_PUBLIC_KEY_FILE:-/backups/keys/backup-pub.asc}"
    if [ -f "$GPG_PUBKEY_FILE" ]; then
        gpg --batch --import "$GPG_PUBKEY_FILE" >/dev/null 2>&1 || true
    fi
    EXT="sql.gz.gpg"
fi

FILENAME="markala-${DATE}.${EXT}"
LATEST_LINK="${BACKUP_DIR}/markala-latest.${EXT}"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Postgres backup başlıyor: $FILENAME"

# Dump + gzip (+ opsiyonel GPG şifreleme)
if [ -n "$GPG_RECIPIENT" ]; then
    echo "[$(date)] 🔒 GPG şifreleme aktif (recipient: ${GPG_RECIPIENT})"
    pg_dump --clean --if-exists --no-owner --no-privileges \
        --schema=public \
        | gzip -9 \
        | gpg --batch --yes --trust-model always --encrypt \
              --recipient "$GPG_RECIPIENT" \
        > "${BACKUP_DIR}/${FILENAME}"
else
    echo "[$(date)] ⚠️  UYARI: BACKUP_GPG_RECIPIENT tanımlı değil — backup ŞİFRESİZ üretiliyor." >&2
    echo "[$(date)] ⚠️  KVKK m.12: müşteri PII'si at-rest şifreli olmalı. GPG anahtarı tanımlayın." >&2
    pg_dump --clean --if-exists --no-owner --no-privileges \
        --schema=public \
        | gzip -9 > "${BACKUP_DIR}/${FILENAME}"
fi

# Symlink "latest"
ln -sf "${FILENAME}" "$LATEST_LINK"

# Backup boyutu
SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup tamamlandı: ${FILENAME} (${SIZE})"

# Eski backup'ları temizle (şifreli .sql.gz.gpg ve şifresiz .sql.gz dahil)
DELETED=$(find "$BACKUP_DIR" -name "markala-*.sql.gz*" -mtime +${RETENTION_DAYS} -type f -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] ${DELETED} eski backup silindi (${RETENTION_DAYS} günden eski)"
fi

# Toplam backup sayısı + disk kullanımı
TOTAL_FILES=$(find "$BACKUP_DIR" -name "markala-*.sql.gz*" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "[$(date)] Toplam: ${TOTAL_FILES} backup, ${TOTAL_SIZE} disk kullanımı"

# ---------------------------------------------------------------------------
# Remote backup — Cloudflare R2 (S3-uyumlu)
# Yalnızca R2 credentials tanımlıysa çalışır. AWS CLI kurulu olmalı.
# ---------------------------------------------------------------------------
if [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ] && [ -n "$R2_ACCOUNT_ID" ]; then
    R2_BUCKET="${R2_BUCKET:-markala-backups}"
    R2_PREFIX="${R2_PREFIX:-postgres-backups}"
    R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    echo "[$(date)] R2'ye upload başlatılıyor: s3://${R2_BUCKET}/${R2_PREFIX}/${FILENAME}"

    if command -v aws >/dev/null 2>&1; then
        if ! AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
             AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
             AWS_DEFAULT_REGION="auto" \
             aws s3 cp "${BACKUP_DIR}/${FILENAME}" \
                 "s3://${R2_BUCKET}/${R2_PREFIX}/${FILENAME}" \
                 --endpoint-url="$R2_ENDPOINT" \
                 --no-progress; then
            echo "[$(date)] ❌ R2 upload FAILED (aws)" >&2
            exit 2
        fi
        echo "[$(date)] R2 upload tamamlandı"
    elif command -v rclone >/dev/null 2>&1; then
        # Alternatif: rclone (config: "r2" remote olarak tanımlı olmalı)
        if ! rclone copy "${BACKUP_DIR}/${FILENAME}" "r2:${R2_BUCKET}/${R2_PREFIX}/"; then
            echo "[$(date)] ❌ R2 upload FAILED (rclone)" >&2
            exit 2
        fi
        echo "[$(date)] R2 upload tamamlandı (rclone)"
    else
        echo "[$(date)] ❌ aws/rclone bulunamadı — R2 upload zorunlu, abort" >&2
        exit 3
    fi
else
    echo "[$(date)] R2 credentials tanımlı değil — yalnızca local backup"
fi

# ---------------------------------------------------------------------------
# Success metrics — Prometheus textfile collector
# node-exporter --collector.textfile.directory=/var/lib/node_exporter/textfile_collector
# /backups/metrics → host'tan node-exporter container'a mount edilir
# ---------------------------------------------------------------------------
METRICS_DIR="${BACKUP_DIR}/metrics"
mkdir -p "$METRICS_DIR"
NOW_TS=$(date +%s)

# Plain timestamp file (insan-okunur)
echo "$NOW_TS" > "${BACKUP_DIR}/last-success"

# Prometheus textfile (atomic write — temp + mv)
TMP_METRIC="${METRICS_DIR}/.backup.prom.$$"
cat > "$TMP_METRIC" <<EOF
# HELP markala_backup_last_success_timestamp_seconds Unix timestamp of last successful Postgres backup
# TYPE markala_backup_last_success_timestamp_seconds gauge
markala_backup_last_success_timestamp_seconds ${NOW_TS}
# HELP markala_backup_size_bytes Last backup file size in bytes (compressed)
# TYPE markala_backup_size_bytes gauge
markala_backup_size_bytes $(stat -c%s "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${FILENAME}" 2>/dev/null || echo 0)
EOF
mv -f "$TMP_METRIC" "${METRICS_DIR}/backup.prom"

echo "[$(date)] ✅ Backup başarılı — metric timestamp: ${NOW_TS}"

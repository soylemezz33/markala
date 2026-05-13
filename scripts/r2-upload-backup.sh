#!/bin/sh
# Markala — R2 manual backup upload script
# Mevcut local backup dosyalarını Cloudflare R2'ye yükler.
#
# Kullanım:
#   ./r2-upload-backup.sh                                # latest'i yükle
#   ./r2-upload-backup.sh markala-20260513-030000.sql.gz # belirli dosya
#   ./r2-upload-backup.sh --all                          # tüm local backupları sync
#
# Env (zorunlu):
#   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
# Env (opsiyonel):
#   R2_BUCKET (default: markala-backups)
#   R2_PREFIX (default: postgres-backups)
#   BACKUP_DIR (default: /backups)

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
R2_BUCKET="${R2_BUCKET:-markala-backups}"
R2_PREFIX="${R2_PREFIX:-postgres-backups}"

# Credential kontrol
if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_ACCOUNT_ID" ]; then
    echo "❌ R2 credentials eksik."
    echo "   Tanımlanması gereken env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    exit 1
fi

R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

# AWS CLI kontrol
if ! command -v aws >/dev/null 2>&1; then
    echo "❌ AWS CLI bulunamadı."
    echo "   Kurulum: apk add aws-cli  (Alpine)"
    echo "           apt install awscli  (Debian/Ubuntu)"
    exit 1
fi

export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY"
export AWS_DEFAULT_REGION="auto"

upload_one() {
    FILE="$1"
    BASENAME=$(basename "$FILE")
    echo "[$(date)] Upload: ${BASENAME} → s3://${R2_BUCKET}/${R2_PREFIX}/${BASENAME}"
    aws s3 cp "$FILE" "s3://${R2_BUCKET}/${R2_PREFIX}/${BASENAME}" \
        --endpoint-url="$R2_ENDPOINT" \
        --no-progress
}

case "${1:-}" in
    --all)
        echo "[$(date)] Tüm backuplar R2'ye sync ediliyor..."
        aws s3 sync "$BACKUP_DIR" "s3://${R2_BUCKET}/${R2_PREFIX}/" \
            --endpoint-url="$R2_ENDPOINT" \
            --exclude "*" \
            --include "markala-*.sql.gz" \
            --no-progress
        echo "[$(date)] ✅ Sync tamamlandı"
        ;;
    --list)
        echo "[$(date)] R2 bucket listesi (s3://${R2_BUCKET}/${R2_PREFIX}/):"
        aws s3 ls "s3://${R2_BUCKET}/${R2_PREFIX}/" \
            --endpoint-url="$R2_ENDPOINT" \
            --human-readable --summarize
        ;;
    --help|-h)
        sed -n '2,18p' "$0"
        ;;
    "")
        # Default: latest
        TARGET="${BACKUP_DIR}/markala-latest.sql.gz"
        if [ ! -e "$TARGET" ]; then
            echo "❌ markala-latest.sql.gz bulunamadı. Önce backup oluştur."
            exit 1
        fi
        # Symlink'i resolve et
        REAL=$(readlink -f "$TARGET" 2>/dev/null || echo "$TARGET")
        upload_one "$REAL"
        echo "[$(date)] ✅ Upload tamamlandı"
        ;;
    *)
        TARGET="${BACKUP_DIR}/$1"
        if [ ! -f "$TARGET" ]; then
            echo "❌ Dosya bulunamadı: $TARGET"
            exit 1
        fi
        upload_one "$TARGET"
        echo "[$(date)] ✅ Upload tamamlandı"
        ;;
esac

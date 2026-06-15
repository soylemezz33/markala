#!/bin/sh
# Markala — PostgreSQL restore script (disaster recovery)
#
# Kullanım:
#   ./restore-postgres.sh                                    # latest backup'ı geri yükle
#   ./restore-postgres.sh markala-20260513-030000.sql.gz     # belirli backup
#   ./restore-postgres.sh --from-r2 markala-20260513.sql.gz  # R2'den indir + restore
#
# UYARI: Mevcut DB içeriği SİLİNİR (--clean --if-exists). Önce drill ortamında test et.

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
PGHOST="${PGHOST:-postgres}"
PGUSER="${PGUSER:-markala}"
PGDATABASE="${PGDATABASE:-markala}"

FROM_R2=0
BACKUP_FILE=""

# Argüman parse
while [ $# -gt 0 ]; do
    case "$1" in
        --from-r2)
            FROM_R2=1
            shift
            ;;
        --help|-h)
            sed -n '2,10p' "$0"
            exit 0
            ;;
        *)
            BACKUP_FILE="$1"
            shift
            ;;
    esac
done

# Default backup dosyası — şifreli (.sql.gz.gpg) varsa onu tercih et, yoksa düz .sql.gz
if [ -z "$BACKUP_FILE" ]; then
    if [ -e "${BACKUP_DIR}/markala-latest.sql.gz.gpg" ]; then
        BACKUP_FILE="markala-latest.sql.gz.gpg"
    else
        BACKUP_FILE="markala-latest.sql.gz"
    fi
fi
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

echo "[$(date)] Restore başlıyor"
echo "[$(date)] Target: ${PGUSER}@${PGHOST}/${PGDATABASE}"
echo "[$(date)] Source: ${BACKUP_FILE}"

# R2'den indir (opsiyonel)
if [ "$FROM_R2" = "1" ]; then
    if [ -z "$R2_ACCESS_KEY_ID" ] || [ -z "$R2_SECRET_ACCESS_KEY" ] || [ -z "$R2_ACCOUNT_ID" ]; then
        echo "❌ R2 credentials eksik (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ACCOUNT_ID)"
        exit 1
    fi
    R2_BUCKET="${R2_BUCKET:-markala-backups}"
    R2_PREFIX="${R2_PREFIX:-postgres-backups}"
    R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"

    echo "[$(date)] R2'den indiriliyor: s3://${R2_BUCKET}/${R2_PREFIX}/${BACKUP_FILE}"
    mkdir -p "$BACKUP_DIR"
    AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY_ID" \
    AWS_SECRET_ACCESS_KEY="$R2_SECRET_ACCESS_KEY" \
    AWS_DEFAULT_REGION="auto" \
    aws s3 cp "s3://${R2_BUCKET}/${R2_PREFIX}/${BACKUP_FILE}" "$BACKUP_PATH" \
        --endpoint-url="$R2_ENDPOINT" --no-progress
    echo "[$(date)] R2 download tamamlandı"
fi

# Dosya kontrol
if [ ! -f "$BACKUP_PATH" ] && [ ! -L "$BACKUP_PATH" ]; then
    echo "❌ Backup dosyası bulunamadı: $BACKUP_PATH"
    echo "Mevcut backuplar:"
    ls -lh "$BACKUP_DIR" 2>/dev/null | grep "markala-" || echo "  (hiç backup yok)"
    exit 1
fi

# Onay (TTY varsa)
if [ -t 0 ] && [ "${RESTORE_FORCE:-0}" != "1" ]; then
    echo ""
    echo "⚠️  DİKKAT: ${PGDATABASE} DB'nin mevcut içeriği SİLİNİR ve ${BACKUP_FILE} ile değiştirilir."
    printf "Devam etmek için 'EVET' yazın: "
    read CONFIRM
    if [ "$CONFIRM" != "EVET" ]; then
        echo "İptal edildi."
        exit 1
    fi
fi

echo "[$(date)] psql restore başlıyor..."

# Boyut bilgisi
SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
echo "[$(date)] Dosya boyutu: $SIZE"

# Restore — şifreli (.gpg) ise önce GPG decrypt, sonra gunzip → psql
# GPG decrypt için PRIVATE key restore makinesinin keyring'inde (GNUPGHOME) olmalı.
case "$BACKUP_FILE" in
    *.gpg)
        if ! command -v gpg >/dev/null 2>&1; then
            echo "❌ Şifreli backup (.gpg) ama gpg kurulu değil. Kur: apk add gnupg / apt install gnupg" >&2
            exit 1
        fi
        echo "[$(date)] 🔓 GPG decrypt → gunzip → psql"
        gpg --batch --quiet --decrypt "$BACKUP_PATH" \
            | gunzip -c \
            | psql -v ON_ERROR_STOP=1 -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"
        ;;
    *)
        gunzip -c "$BACKUP_PATH" | psql -v ON_ERROR_STOP=1 -h "$PGHOST" -U "$PGUSER" -d "$PGDATABASE"
        ;;
esac

echo "[$(date)] ✅ Restore başarılı: $BACKUP_FILE"
echo ""
echo "Doğrulama önerileri:"
echo "  - Tablo sayısı: psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c \"\\dt\""
echo "  - Sipariş sayısı: psql -h $PGHOST -U $PGUSER -d $PGDATABASE -c \"SELECT COUNT(*) FROM orders;\""
echo "  - Smoke test: curl -fsS https://markala.com.tr/api/health"

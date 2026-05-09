#!/bin/sh
# Markala — PostgreSQL günlük backup script
# docker-compose'daki backup container'ı tarafından çağrılır
# Retention: 30 gün (RETENTION_DAYS env)

set -e

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DATE=$(date +%Y%m%d-%H%M%S)
FILENAME="markala-${DATE}.sql.gz"
LATEST_LINK="${BACKUP_DIR}/markala-latest.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] Postgres backup başlıyor: $FILENAME"

# Dump + gzip (compressed)
pg_dump --clean --if-exists --no-owner --no-privileges \
    --schema=public \
    | gzip -9 > "${BACKUP_DIR}/${FILENAME}"

# Symlink "latest"
ln -sf "${FILENAME}" "$LATEST_LINK"

# Backup boyutu
SIZE=$(du -h "${BACKUP_DIR}/${FILENAME}" | cut -f1)
echo "[$(date)] Backup tamamlandı: ${FILENAME} (${SIZE})"

# Eski backup'ları temizle
DELETED=$(find "$BACKUP_DIR" -name "markala-*.sql.gz" -mtime +${RETENTION_DAYS} -type f -print -delete | wc -l)
if [ "$DELETED" -gt 0 ]; then
    echo "[$(date)] ${DELETED} eski backup silindi (${RETENTION_DAYS} günden eski)"
fi

# Toplam backup sayısı + disk kullanımı
TOTAL_FILES=$(find "$BACKUP_DIR" -name "markala-*.sql.gz" -type f | wc -l)
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "[$(date)] Toplam: ${TOTAL_FILES} backup, ${TOTAL_SIZE} disk kullanımı"

echo "[$(date)] ✅ Backup başarılı"

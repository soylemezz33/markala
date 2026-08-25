import { getAdminApi } from "@/lib/api";
import type { AdminNotificationLogsDto } from "@markala/api-client";
import { EmailLogsClient } from "./email-logs-client";

/**
 * Müşteriye giden e-postaların kaydı (Hasan talebi 2026-08-25): hangi gün/saatte,
 * kime, hangi konuyla mail gitmiş. Kaynak: NotificationLog (mail.service her
 * gönderimde yazar). Son 500 kayıt çekilir; arama/filtre/sayfalama client'ta.
 */
export const dynamic = "force-dynamic";

export default async function EmailLogsPage() {
  let data: AdminNotificationLogsDto = { total: 0, rows: [] };
  let loadError = false;
  try {
    const api = await getAdminApi();
    data = await api.adminNotificationLogs.list({ take: 500 });
  } catch {
    loadError = true;
  }
  return <EmailLogsClient total={data.total} rows={data.rows} loadError={loadError} />;
}

import { getAdminApi } from "@/lib/api";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { PanelUsersClient } from "./yetkililer-client";

export const dynamic = "force-dynamic";

export default async function YetkililerPage() {
  let data: { users: Array<{ id: string; email: string; fullName: string | null; role: string; createdAt: string }>; assignableRoles: string[] } = {
    users: [],
    assignableRoles: [],
  };
  let loadError = false;
  try {
    const api = await getAdminApi();
    const res = await api.panelUsers.list();
    // SAVUNMA: beklenmedik sekil gelirse sayfa COKMESIN. 2026-08-21'de tam bu oldu —
    // yol cakismasi yuzunden dizi donmus, `data.users` tanimsiz kalinca arayuz patlamisti.
    if (res && Array.isArray((res as { users?: unknown }).users)) {
      data = res;
    } else {
      loadError = true;
    }
  } catch {
    // 403 = super_admin değil; sayfa yine açılır ama liste boş + uyarı görünür.
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <PanelUsersClient users={data.users} roles={data.assignableRoles} />
    </>
  );
}

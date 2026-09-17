import { getAdminApi } from "@/lib/api";
import type { PanelRolMatrisiDto, PanelUserDto } from "@markala/api-client";
import { LoadErrorBanner } from "@/components/load-error-banner";
import { PanelUsersClient } from "./yetkililer-client";

export const dynamic = "force-dynamic";

export default async function YetkililerPage() {
  let data: { users: PanelUserDto[]; assignableRoles: string[] } = { users: [], assignableRoles: [] };
  let matris: PanelRolMatrisiDto | null = null;
  let meId: string | null = null;
  let loadError = false;
  try {
    const api = await getAdminApi();
    // Üç istek bağımsız; biri düşerse diğerleri yine gösterilsin (allSettled).
    const [listeSonuc, matrisSonuc, meSonuc] = await Promise.allSettled([
      api.panelUsers.list(),
      api.panelUsers.roles(),
      api.auth.me() as unknown as Promise<{ id?: string }>,
    ]);
    // SAVUNMA: beklenmedik şekil gelirse sayfa ÇÖKMESİN. 2026-08-21'de tam bu oldu —
    // yol çakışması yüzünden dizi dönmüş, `data.users` tanımsız kalınca arayüz patlamıştı.
    if (listeSonuc.status === "fulfilled" && Array.isArray((listeSonuc.value as { users?: unknown })?.users)) {
      data = listeSonuc.value;
    } else {
      loadError = true;
    }
    if (matrisSonuc.status === "fulfilled" && Array.isArray(matrisSonuc.value?.roller)) {
      matris = matrisSonuc.value;
    }
    if (meSonuc.status === "fulfilled" && typeof meSonuc.value?.id === "string") {
      meId = meSonuc.value.id;
    }
  } catch {
    // 403 = super_admin değil; sayfa yine açılır ama liste boş + uyarı görünür.
    loadError = true;
  }
  return (
    <>
      {loadError && <LoadErrorBanner />}
      <PanelUsersClient users={data.users} roles={data.assignableRoles} matris={matris} meId={meId} />
    </>
  );
}

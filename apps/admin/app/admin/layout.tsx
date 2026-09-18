import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentAdmin, publicUser } from "@/lib/auth";
import { getResourceMeta, resourceOrder } from "@/lib/admin-resources";
import { rows } from "@/lib/db";
import { publicUrl } from "@/lib/utils";
import type { RowDataPacket } from "mysql2";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAdmin();
  if (!user) redirect("/login");
  const resources = await Promise.all(resourceOrder.map(getResourceMeta));
  const settingsRows = await rows<RowDataPacket & { key: string; value: string | null }>(
    "SELECT `key`, value FROM settings WHERE `key` IN ('store_name', 'store_logo')"
  );
  const settingsMap = Object.fromEntries(settingsRows.map((r) => [r.key, r.value]));
  const storeSettings = {
    name: settingsMap.store_name || "UBSI Cyber Store",
    logo: publicUrl(settingsMap.store_logo),
  };

  return (
    <AdminShell user={publicUser(user)} resources={resources} storeSettings={storeSettings}>
      {children}
    </AdminShell>
  );
}

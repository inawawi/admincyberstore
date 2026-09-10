import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { currentAdmin, publicUser } from "@/lib/auth";
import { getResourceMeta, resourceOrder } from "@/lib/admin-resources";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await currentAdmin();
  if (!user) redirect("/login");
  const resources = await Promise.all(resourceOrder.map(getResourceMeta));
  return <AdminShell user={publicUser(user)} resources={resources}>{children}</AdminShell>;
}

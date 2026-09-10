import { DashboardView } from "@/components/dashboard-view";
import { currentAdmin } from "@/lib/auth";
import { dashboardData } from "@/lib/admin-resources";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [user, data] = await Promise.all([currentAdmin(), dashboardData()]);
  return <DashboardView data={data} name={String(user?.name || "Administrator")} />;
}

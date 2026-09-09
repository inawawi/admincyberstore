import { currentAdmin, publicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await currentAdmin();
  return user
    ? Response.json({ user: publicUser(user) })
    : Response.json({ message: "Unauthenticated." }, { status: 401 });
}

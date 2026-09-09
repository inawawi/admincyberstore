import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/http";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await requireAdmin();
    revalidatePath("/", "layout");
    return Response.json({ message: "Cache sistem berhasil dibersihkan." });
  } catch (error) {
    return handleApiError(request, error);
  }
}

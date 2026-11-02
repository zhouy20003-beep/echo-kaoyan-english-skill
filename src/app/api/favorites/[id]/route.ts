import { deleteFavorite } from "@/lib/db";
import { json, withUser } from "@/lib/api";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withUser(async (user) => {
    const { id } = await params;
    await deleteFavorite(user.id, id);
    return json({ ok: true });
  });
}

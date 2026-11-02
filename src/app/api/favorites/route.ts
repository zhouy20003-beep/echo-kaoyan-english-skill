import type { NextRequest } from "next/server";
import { addFavorite, listFavorites } from "@/lib/db";
import { favoriteSchema } from "@/lib/validation";
import { json, withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => {
    const items = await listFavorites(user.id);
    return json({ items });
  });
}

export async function POST(req: NextRequest) {
  return withUser(async (user) => {
    const input = favoriteSchema.parse(await req.json());
    await addFavorite({ ...input, userId: user.id });
    return json({ ok: true }, 201);
  });
}

import type { NextRequest } from "next/server";
import { addWrongItems, listWrongItems } from "@/lib/db";
import { wrongSchema } from "@/lib/validation";
import { json, withUser } from "@/lib/api";

export async function GET() {
  return withUser(async (user) => {
    const items = await listWrongItems(user.id);
    return json({ items });
  });
}

export async function POST(req: NextRequest) {
  return withUser(async (user) => {
    const input = wrongSchema.parse(await req.json());
    await addWrongItems(input.items.map((item) => ({ ...item, userId: user.id })));
    return json({ ok: true, saved: input.items.length }, 201);
  });
}

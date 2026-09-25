import { NextResponse } from "next/server";
import { getAuthContextForApi } from "@/lib/auth";
import { submitForValidation } from "@/services/validation";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  const auth = await getAuthContextForApi();
  if (!auth) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { data, error } = await submitForValidation(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ song: data });
}

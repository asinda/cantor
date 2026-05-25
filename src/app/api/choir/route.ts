import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getChoirByUser, getChoirMembers, updateChoir, regenerateInviteCode } from "@/services/choirs";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  if (!membership) return NextResponse.json({ choir: null });

  const { data: members } = await getChoirMembers(membership.choir_id);

  return NextResponse.json({
    choir:   membership.choirs,
    role:    membership.role,
    members: members ?? [],
  });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const membership = await getChoirByUser(user.id);
  if (!membership || membership.role !== "chef")
    return NextResponse.json({ error: "Réservé au chef de chœur" }, { status: 403 });

  const body = await req.json();

  if (body.action === "regenerate_invite") {
    const { data, error } = await regenerateInviteCode(membership.choir_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ invite_code: data?.invite_code });
  }

  const { data, error } = await updateChoir(membership.choir_id, body);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ choir: data });
}

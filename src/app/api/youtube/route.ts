import { NextRequest, NextResponse } from "next/server";
import { fetchYouTubeInfo } from "@/services/youtube";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Paramètre url manquant" }, { status: 400 });

  const info = await fetchYouTubeInfo(url);
  if (!info) return NextResponse.json({ error: "URL YouTube invalide ou inaccessible" }, { status: 404 });

  return NextResponse.json(info);
}

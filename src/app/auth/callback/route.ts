import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code  = searchParams.get("code");
  const raw   = searchParams.get("next") ?? "/dashboard";
  const next  = raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") && !raw.includes("@")
    ? raw
    : "/dashboard";
  const error = searchParams.get("error");

  // Erreur renvoyée par le provider OAuth (ex: access_denied)
  if (error) {
    const description = searchParams.get("error_description") ?? error;
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(description)}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    if (!exchangeError) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("[auth/callback] exchangeCodeForSession:", exchangeError.message);
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(exchangeError.message)}`
    );
  }

  // Code manquant
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() lit le cookie local — pas d'appel réseau, pas de timeout
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const { pathname } = request.nextUrl;

  /* ── Pages publiques (pas besoin d'être connecté) ── */
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/auth") ||              // OAuth callback
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/sw.js" ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.svg";

  /* ── Redirection selon état d'auth ── */
  if (!user && !isPublic) {
    // Non connecté → login
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/") {
    // Pas de page d'accueil : connecté → dashboard
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)"],
};

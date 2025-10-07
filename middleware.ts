import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const buildSupabaseClient = (req: NextRequest, res: NextResponse) => {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not configured.");
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        res.cookies.set({ name, value: "", ...options });
      },
    },
  });
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = buildSupabaseClient(req, res);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error("Supabase session lookup failed in middleware:", error);
  }

  const isAuthRoute = req.nextUrl.pathname === "/";
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/guilds");

  if (session && isAuthRoute) {
    return NextResponse.redirect(new URL("/guilds", req.url));
  }

  if (!session && isProtectedRoute) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return res;
}

export const config = {
  matcher: ["/", "/guilds/:path*"],
};


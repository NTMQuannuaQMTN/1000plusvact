import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
    console.log("middleware.ts: ", req.nextUrl.pathname);

  const res = NextResponse.next();
  const path = req.nextUrl.pathname;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value }) => {
            res.cookies.set(name, value);
          });
        },
      },
    }
  );

  // ✅ ONLY USE SESSION (stable in middleware)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("middleware.ts: session", session);

  const user = session?.user ?? null;

  const isLogin = path === "/login";
  const isSignup = path === "/signup";
  const isAuthPage = isLogin || isSignup;

  const isDashboard = path === "/dashboard";
  const isAdmin = path === "/admin";

  const isProtected = isDashboard || isAdmin;

  // 🔴 NOT LOGGED IN → block protected
  console.log("middleware.ts: ", { user, isProtected, isAuthPage, isDashboard, isAdmin });

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 🟡 NOT LOGGED IN → allow auth pages
  if (!user && isAuthPage) {
    return res;
  }

  // 🟢 LOGGED IN → get role ONCE
  let role: string | null = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    role = data?.role ?? null;
  }

  // 🚨 FIX: ALWAYS FORCE CORRECT DESTINATION (NO BACK AND FORTH)

  const target =
    role === "admin" ? "/admin" : "/dashboard";

  // 1. If logged in user visits login/signup → redirect ONCE
  if (user && isAuthPage) {
    return NextResponse.redirect(new URL(target, req.url));
  }

  // 2. If admin tries dashboard → redirect
  if (role === "admin" && isDashboard) {
    return NextResponse.redirect(new URL("/admin", req.url));
  }

  // 3. If student tries admin → redirect
  if (role !== "admin" && isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 4. ROOT → always send to correct place
  if (path === "/") {
    if (!user) return res;
    return NextResponse.redirect(new URL(target, req.url));
  }

  return res;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/dashboard", "/admin"],
};
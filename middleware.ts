import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(
          cookiesToSet: Array<{
            name: string;
            value: string;
            options: CookieOptions;
          }>,
        ) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // 未ログインユーザーがアプリページへアクセスしようとした場合
  if (
    !user &&
    (pathname.startsWith("/app") || pathname.startsWith("/company"))
  ) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // ログイン済みユーザーの system_role が必要なルートのみDBを参照する
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname.startsWith("/company"))
  ) {
    const { data: profile } = await supabase
      .from("users")
      .select("system_role")
      .eq("id", user.id)
      .single();

    const isAdmin =
      profile?.system_role === "ADMIN" ||
      profile?.system_role === "MASTER_ADMIN";

    // ログイン済みユーザーがログイン/サインアップページへアクセスした場合
    if (pathname === "/login" || pathname === "/signup") {
      return NextResponse.redirect(
        new URL(isAdmin ? "/company/posts" : "/app/posts", request.url),
      );
    }

    // /company/* は ADMIN / MASTER_ADMIN のみアクセス可能
    if (!isAdmin) {
      return NextResponse.redirect(new URL("/app/posts", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

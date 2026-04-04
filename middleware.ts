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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
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

  // ログイン済みユーザーがログイン/サインアップページへアクセスした場合
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const systemRole = user.user_metadata?.system_role as string | undefined;
    if (systemRole === "ADMIN") {
      return NextResponse.redirect(new URL("/company/posts", request.url));
    }
    return NextResponse.redirect(new URL("/app/posts", request.url));
  }

  // /company/* は ADMIN のみアクセス可能
  if (user && pathname.startsWith("/company")) {
    const systemRole = user.user_metadata?.system_role as string | undefined;
    if (systemRole !== "ADMIN") {
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

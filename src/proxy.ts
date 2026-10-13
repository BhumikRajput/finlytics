import NextAuth from "next-auth";
import authConfig from "./auth.config";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (the exported function is `proxy`).
// This keeps signed-out visitors out of every page except /login and /register.
// API routes are excluded on purpose: they check the session themselves and answer
// with a JSON 401 instead of an HTML redirect.
const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

// The Google button/provider only exists when both env vars are set.
export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// Pages anyone can open without being signed in.
const PUBLIC_PATHS = ["/login", "/register"];

// This part of the config is imported by src/proxy.ts, so it must stay free of
// Node-only code (Prisma, bcrypt). The full config lives in src/auth.ts.
const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 30 }, // 30 days
  // Auth.js v5 reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET automatically.
  providers: googleEnabled ? [Google] : [],
  callbacks: {
    // Runs in the proxy for every matched request. Returning false sends the
    // visitor to pages.signIn (with ?callbackUrl=...).
    // Signed-in visitors on /login are redirected inside the page itself, after
    // checking the database, so a stale cookie can never cause a redirect loop.
    authorized({ auth, request }) {
      const isPublic = PUBLIC_PATHS.includes(request.nextUrl.pathname);
      if (isPublic) return true;
      return Boolean(auth?.user);
    },
  },
} satisfies NextAuthConfig;

export default authConfig;

import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import authConfig from "./auth.config";
import { prisma } from "./lib/prisma";
import { normalizeEmail } from "./lib/auth-validation";

declare module "next-auth" {
  interface Session {
    user: { id: string } & DefaultSession["user"];
  }
}

// Used to burn the same CPU time when the email doesn't exist, so response
// timing doesn't reveal which emails are registered.
let dummyHash: string | undefined;
const getDummyHash = () => (dummyHash ??= bcrypt.hashSync("not-a-real-password", 12));

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = normalizeEmail(raw?.email);
        const password = typeof raw?.password === "string" ? raw.password : "";
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        const ok = await bcrypt.compare(password, user?.passwordHash ?? getDummyHash());
        if (!user || !user.passwordHash || !ok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,

    // Google sign-in: create the user on first login, link to an existing one by email.
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true; // credentials were checked in authorize()

      const email = normalizeEmail(profile?.email);
      // Never trust an email Google hasn't verified.
      if (!email || profile?.email_verified !== true) return false;

      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const name = (profile?.name ?? email.split("@")[0]).trim().slice(0, 80) || "User";
        await prisma.user.create({ data: { email, name, emailVerified: new Date() } });
      } else if (!existing.emailVerified) {
        // Password sign-ups aren't email-verified. Whoever owns the inbox (proved by Google)
        // now owns the account, and any password set before that is thrown away, so someone
        // who pre-registered a victim's email can't keep access. The real owner can set a new
        // password from the Profile page.
        await prisma.user.update({
          where: { id: existing.id },
          data: { emailVerified: new Date(), passwordHash: null },
        });
      }
      return true;
    },

    // Make token.sub our own database id for every provider.
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google") {
        const dbUser = await prisma.user.findUnique({
          where: { email: normalizeEmail(profile?.email ?? token.email) },
        });
        if (dbUser) token.sub = dbUser.id;
      } else if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});


// full configuration
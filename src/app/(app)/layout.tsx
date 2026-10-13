import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { getSessionUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { AppProviders } from "../providers";

// Everything inside the (app) route group needs a signed-in user. The proxy already
// redirects visitors without a session; this is a second check that also verifies
// the user still exists, and it loads the name/email for the sidebar, all in one query.
export default async function AppLayout({ children }: { children: ReactNode }) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true },
  });
  // A valid cookie for an account that no longer exists (database reset, deleted user).
  // The login page shows the message and the next sign-in replaces the old cookie.
  if (!user) redirect("/login?error=SessionExpired");

  return (
    <AppProviders>
      <AppShell user={{ name: user.name, email: user.email }}>{children}</AppShell>
    </AppProviders>
  );
}

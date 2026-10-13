import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, passwordHash: true },
  });
  if (!user) redirect("/login");

  // Only a yes/no goes to the browser, never the hash itself.
  return <ProfileClient name={user.name} email={user.email} hasPassword={user.passwordHash !== null} />;
}

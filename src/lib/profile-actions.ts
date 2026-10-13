"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { getCurrentUserId } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { validateName, validatePassword } from "@/lib/auth-validation";

export type ProfileFormState = { ok?: boolean; error?: string } | undefined;

export async function updateNameAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "You are signed out. Please sign in again." };

  const name = String(formData.get("name") ?? "").trim();
  const problem = validateName(name);
  if (problem) return { error: problem };

  await prisma.user.update({ where: { id: userId }, data: { name } });
  revalidatePath("/", "layout"); // refresh the name shown in the sidebar
  return { ok: true };
}

// Works for both cases:
//  - the user has a password  -> the current password must be correct
//  - Google-only user         -> they can set a first password (the live session proves who they are)
export async function changePasswordAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await getCurrentUserId();
  if (!userId) return { error: "You are signed out. Please sign in again." };

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { passwordHash: true },
  });
  if (!user) return { error: "Account not found." };

  if (user.passwordHash) {
    if (!currentPassword) return { error: "Enter your current password." };
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return { error: "Current password is incorrect." };
    }
  }

  const problem = validatePassword(newPassword);
  if (problem) return { error: problem };
  if (newPassword !== confirmPassword) return { error: "New password and confirmation don't match." };

  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  revalidatePath("/profile");
  return { ok: true };
}

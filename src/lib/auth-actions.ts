"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  normalizeEmail,
  safeRedirect,
  validateEmail,
  validateName,
  validatePassword,
  type AuthFormState,
} from "@/lib/auth-validation";

// NOTE: signIn()/signOut() finish by throwing Next's redirect "error". It must be
// re-thrown, which is why only AuthError is caught below.

export async function loginAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const redirectTo = safeRedirect(formData.get("callbackUrl"));

  if (!email || !password) return { error: "Enter your email and password.", email };

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (e) {
    if (e instanceof AuthError) {
      return {
        error:
          e.type === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong. Please try again.",
        email,
      };
    }
    throw e;
  }
}

export async function registerAction(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const redirectTo = safeRedirect(formData.get("callbackUrl"));
  const values = { name, email };

  const problem =
    validateName(name) ?? validateEmail(email) ?? validatePassword(password);
  if (problem) return { error: problem, ...values };
  if (password !== confirmPassword) return { error: "Passwords don't match.", ...values };

  const taken = { error: "An account with this email already exists. Try signing in.", ...values };

  if (await prisma.user.findUnique({ where: { email }, select: { id: true } })) return taken;

  try {
    await prisma.user.create({
      data: { name, email, passwordHash: await bcrypt.hash(password, 12) },
    });
  } catch (e) {
    // Two sign-ups racing for the same email: the unique index catches the loser.
    if (typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002") return taken;
    throw e;
  }

  try {
    await signIn("credentials", { email, password, redirectTo });
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "Account created, but signing in failed. Please sign in manually.", email };
    }
    throw e;
  }
}

export async function googleSignInAction(formData: FormData) {
  await signIn("google", { redirectTo: safeRedirect(formData.get("callbackUrl")) });
}

export async function signOutAction() {
  await signOut({ redirectTo: "/login" });
}

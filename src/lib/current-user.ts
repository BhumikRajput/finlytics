/**
 * Resolve the signed-in user id for API routes and server components.
 * API handlers never trust a user id from the request body — they call these helpers.
 */
import { cache } from "react";
import { auth } from "@/auth";
import { prisma } from "./prisma";

// Cheap: cookie/JWT only, no DB. Fine for reading pages and GET routes.
export const getSessionUserId = cache(async () => {
  const session = await auth();
  return session?.user?.id ?? null;
});

// Strict: also confirms the account still exists. Use for the layout,
// and for writes (POST/PUT/DELETE) and sensitive actions.
export const getCurrentUserId = cache(async () => {
  const id = await getSessionUserId();
  if (!id) return null;
  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  return user?.id ?? null;
});

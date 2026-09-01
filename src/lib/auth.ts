import "server-only";

import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "@/lib/db";

// Hash de senha com scrypt (embutido no Node, sem dependência nativa).
// Formato guardado: "salt:hash".
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuf = Buffer.from(hash, "hex");
  const test = scryptSync(password, salt, 64);
  return hashBuf.length === test.length && timingSafeEqual(hashBuf, test);
}

const SESSION_COOKIE = "session_id";
const SESSION_DAYS = 30;

export async function createSession(userId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const session = await db.session.create({ data: { userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, session.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) await db.session.delete({ where: { id } }).catch(() => {});
  store.delete(SESSION_COOKIE);
}

// Memoizado por requisição: evita repetir a mesma consulta várias vezes.
export const getSession = cache(async () => {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await db.session.findUnique({
    where: { id },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session;
});

// Usuário "dono" dos dados no momento — se um admin estiver "vendo como"
// outro usuário, é esse outro usuário que retorna aqui.
export const getActingUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;
  if (session.impersonatingId) {
    const target = await db.user.findUnique({
      where: { id: session.impersonatingId },
    });
    if (target) return target;
  }
  return session.user;
});

export async function getUserId(): Promise<string | null> {
  const user = await getActingUser();
  return user?.id ?? null;
}

export async function requireUserId(): Promise<string> {
  const id = await getUserId();
  if (!id) redirect("/login");
  return id;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.user.role === "admin";
}

export async function logActivity(
  userId: string,
  action: string,
  description: string
) {
  await db.activityLog.create({ data: { userId, action, description } });
}

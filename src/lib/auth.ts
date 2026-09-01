import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

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

export const DEFAULT_PASSWORD = "1234";
export const PROFILE_ID = "default";
export const DEFAULT_PROFILE = {
  name: "Bruce Strela",
  email: "brucestrela@pm.me",
};

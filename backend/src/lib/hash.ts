import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const hashPassword = (plain: string) => bcrypt.hash(plain, 10);
export const verifyPassword = (plain: string, hash: string) =>
	bcrypt.compare(plain, hash);

export const sha256 = (s: string) =>
	crypto.createHash("sha256").update(s).digest("hex");

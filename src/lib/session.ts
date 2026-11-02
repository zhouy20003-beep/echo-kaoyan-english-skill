import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const SESSION_COOKIE = "echo_session";
export const SESSION_DAYS = 30;

export interface SessionPayload {
  sub: string;
  email: string;
}

const DEV_SECRET = "echo-kaoyan-english-ii-dev-secret-change-me";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET?.trim();
  if (!value) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET_NOT_CONFIGURED");
    }
    return new TextEncoder().encode(DEV_SECRET);
  }
  return new TextEncoder().encode(value);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ email: payload.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    return { sub: payload.sub, email: String(payload.email || "") };
  } catch {
    return null;
  }
}

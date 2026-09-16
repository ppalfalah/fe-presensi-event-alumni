import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnvFile } from "node:process";

type E2ETarget = "local" | "staging" | "production";

export interface E2ECredentials {
  admin: { email: string; password: string };
  alumni: { email: string; password: string };
}

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required. Copy .env.e2e.example to .env.e2e in the frontend, or set E2E variables in the process environment.`);
  }
  return value;
}

function parseOrigin(name: string): URL {
  const value = required(name);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute HTTP(S) origin.`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${name} must be an HTTP(S) origin without credentials, path, query or hash (omit /api).`);
  }
  const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
  if (hostname === "ppalfalah.id" || hostname.endsWith(".ppalfalah.id")) {
    throw new Error(`${name}: production domains are blocked for E2E, regardless of E2E_TARGET.`);
  }
  return url;
}

// Shared, fail-closed guard. Keep this in the config so every future spec is guarded.
// No destructive execution on ANY target until dedicated fixtures/DB isolation exist.
export function loadE2EEnvironment() {
  const envFile = resolve(process.cwd(), ".env.e2e");
  if (existsSync(envFile)) loadEnvFile(envFile);

  const target = required("E2E_TARGET") as E2ETarget;
  if (!["local", "staging", "production"].includes(target)) {
    throw new Error("E2E_TARGET must be local, staging or production.");
  }
  if (target === "production") {
    throw new Error("Production E2E execution is blocked. Use local or an isolated staging environment.");
  }

  const baseURL = parseOrigin("E2E_BASE_URL");
  const apiURL = parseOrigin("E2E_API_URL");
  for (const url of [baseURL, apiURL]) {
    if (target === "local" && (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || url.protocol !== "http:")) {
      throw new Error("E2E_TARGET=local requires HTTP loopback URLs for BOTH frontend and backend.");
    }
    if (target === "staging" && url.protocol !== "https:") {
      throw new Error("Staging E2E URLs must use HTTPS and an explicitly isolated non-production deployment.");
    }
  }
  if (baseURL.origin === apiURL.origin) {
    throw new Error("Frontend and Laravel API must use separate origins in this E2E setup.");
  }

  return { target, baseURL, apiURL };
}

export function getE2ECredentials(): E2ECredentials {
  const adminEmail = required("E2E_ADMIN_EMAIL");
  const alumniEmail = required("E2E_ALUMNI_EMAIL");

  for (const [name, email] of [
    ["E2E_ADMIN_EMAIL", adminEmail],
    ["E2E_ALUMNI_EMAIL", alumniEmail],
  ] as const) {
    if (!email.toLowerCase().endsWith(".test")) {
      throw new Error(`${name} must use a reserved .test identity for local E2E.`);
    }
  }

  if (adminEmail.toLowerCase() === alumniEmail.toLowerCase()) {
    throw new Error("E2E admin and alumni identities must be different.");
  }

  return {
    admin: { email: adminEmail, password: required("E2E_ADMIN_PASSWORD") },
    alumni: { email: alumniEmail, password: required("E2E_ALUMNI_PASSWORD") },
  };
}

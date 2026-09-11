import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type DashboardFixtureState =
  | "admin-empty"
  | "admin-populated"
  | "alumni-no-attendance"
  | "alumni-with-attendance";

export async function prepareDashboardFixture(state: DashboardFixtureState) {
  const backendPath = resolve(
    process.cwd(),
    process.env.E2E_BACKEND_PATH?.trim() || "../presensi-event-backend",
  );
  const artisanPath = resolve(backendPath, "artisan");

  if (!existsSync(artisanPath)) {
    throw new Error(
      `Laravel artisan was not found at ${artisanPath}. Set E2E_BACKEND_PATH to the backend repository path.`,
    );
  }

  try {
    await execFileAsync(
      process.env.E2E_PHP_BINARY?.trim() || "php",
      ["artisan", "e2e:fixture", state, "--env=e2e"],
      {
        cwd: backendPath,
        env: process.env,
        windowsHide: true,
        timeout: 30_000,
      },
    );
  } catch (error) {
    const output = error as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      `Failed to prepare dashboard fixture "${state}". ${output.stderr || output.stdout || output.message || "Unknown Artisan error"}`,
    );
  }
}

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

export type UserFixtureState =
  | "users-empty"
  | "users-filter"
  | "users-editable"
  | "users-deletable"
  | "users-pagination-10"
  | "users-pagination-11";

export type EventFixtureState =
  | "events-empty"
  | "events-list"
  | "events-form"
  | "events-edit"
  | "events-status"
  | "events-registrations"
  | "events-pagination"
  | "event-categories"
  | "quota-one-remaining"
  | "quota-full"
  | "quota-race"
  | "qr-generate"
  | "qr-event-no-code"
  | "qr-event-active-code"
  | "qr-multiple-events"
  | "qr-regenerate"
  | "qr-pagination";

export type ReportFixtureState =
  | "reports-empty"
  | "reports-summary"
  | "reports-detail"
  | "reports-detail-empty"
  | "reports-full-attendance"
  | "reports-pagination"
  | "engagement-overview"
  | "engagement-17"
  | "engagement-boundaries"
  | "engagement-pagination";

export type Phase9FixtureState = "broadcast-event" | "settings-admin";

export type Phase10FixtureState =
  | "alumni-events-list"
  | "alumni-events-empty"
  | "alumni-events-filters"
  | "alumni-event-unregistered"
  | "alumni-event-registered"
  | "alumni-event-quota-register"
  | "alumni-event-quota-full"
  | "alumni-event-quota-cancel";

export type Phase11FixtureState =
  | "scan-base"
  | "scan-valid"
  | "scan-event-not-started"
  | "scan-event-ended"
  | "scan-unregistered"
  | "scan-already-attended"
  | "scan-qr-before-valid"
  | "scan-qr-valid-window"
  | "scan-qr-expired";

async function prepareFixture(
  state:
    | DashboardFixtureState
    | UserFixtureState
    | EventFixtureState
    | ReportFixtureState
    | Phase9FixtureState
    | Phase10FixtureState
    | Phase11FixtureState,
) {
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
        timeout: state === "engagement-boundaries" ? 60_000 : 30_000,
      },
    );
  } catch (error) {
    const output = error as { stderr?: string; stdout?: string; message?: string };
    throw new Error(
      `Failed to prepare E2E fixture "${state}". ${output.stderr || output.stdout || output.message || "Unknown Artisan error"}`,
    );
  }
}

export function prepareDashboardFixture(state: DashboardFixtureState) {
  return prepareFixture(state);
}

export function prepareUserFixture(state: UserFixtureState) {
  return prepareFixture(state);
}

export function prepareEventFixture(state: EventFixtureState) {
  return prepareFixture(state);
}

export function prepareReportFixture(state: ReportFixtureState) {
  return prepareFixture(state);
}

export function preparePhase9Fixture(state: Phase9FixtureState) {
  return prepareFixture(state);
}

export function preparePhase10Fixture(state: Phase10FixtureState) {
  return prepareFixture(state);
}

export function preparePhase11Fixture(state: Phase11FixtureState) {
  return prepareFixture(state);
}

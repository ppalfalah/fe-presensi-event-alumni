import { expect, type Locator, type Page } from "@playwright/test";
import {
  preparePhase13Fixture,
  type Phase13FixtureState,
} from "./dashboard-fixtures";
import { loginAsAlumniThroughUI, openAlumniLogin } from "./auth";
import { getE2ECredentials } from "./environment";
import { serveIsolatedE2EAvatars } from "./settings";

export const PHASE13_ALUMNI_EMAIL = "phase13.profile@example.test";

export async function loginPhase13Alumni(
  page: Page,
  state: Phase13FixtureState,
) {
  await preparePhase13Fixture(state);
  await serveIsolatedE2EAvatars(page);
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, {
    email: PHASE13_ALUMNI_EMAIL,
    password: getE2ECredentials().alumni.password,
  });
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
}

export async function openNotificationsPage(
  page: Page,
  state: Phase13FixtureState,
) {
  await loginPhase13Alumni(page, state);
  await page.goto("/alumni/main/notifikasi");
  await expect(
    page.getByRole("heading", { name: "Notifikasi", exact: true }),
  ).toBeVisible();
}

export function notificationBell(page: Page): Locator {
  return page.getByRole("button", { name: "Buka notifikasi", exact: true });
}

export function notificationBadge(page: Page): Locator {
  return notificationBell(page).locator("span");
}

export function notificationPopup(page: Page): Locator {
  return page
    .getByRole("heading", { name: "Notifikasi", exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'absolute')][1]");
}

export function notificationCard(page: Page, title: string): Locator {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator("xpath=ancestor::article[1]");
}

export function notificationSummary(page: Page, label: string): Locator {
  return page
    .locator("div.grid.grid-cols-2")
    .getByText(label, { exact: true })
    .locator("..");
}

export async function chooseNotificationFilter(page: Page, label: string) {
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();
}

import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAlumniThroughUI, openAlumniLogin } from "./auth";
import {
  preparePhase10Fixture,
  type Phase10FixtureState,
} from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export async function openAlumniEventsPage(
  page: Page,
  state: Phase10FixtureState,
) {
  await preparePhase10Fixture(state);
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, getE2ECredentials().alumni);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await page.goto("/alumni/main/events");
  await expect(
    page.getByRole("heading", { name: "Daftar Event", exact: true }),
  ).toBeVisible();
}

export function alumniEventCard(page: Page, title: string): Locator {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator(
      "xpath=ancestor::div[.//button[contains(normalize-space(.), 'Lihat Detail & Pendaftaran')]][1]",
    );
}

export async function openAlumniEventDetail(
  page: Page,
  state: Phase10FixtureState,
  title: string,
) {
  await openAlumniEventsPage(page, state);
  const card = alumniEventCard(page, title);
  await expect(card).toBeVisible();
  await card
    .getByRole("button", { name: "Lihat Detail & Pendaftaran" })
    .click();
  await expect(page).toHaveURL(/\/alumni\/main\/events\/\d+$/);
  await expect(
    page.getByRole("heading", { name: "Detail Event", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: title, exact: true }),
  ).toBeVisible();
}

export async function registerForEvent(page: Page) {
  await page.getByRole("button", { name: "Daftar Event", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Berhasil mendaftar event!",
  );
  await expect(
    page.getByRole("button", { name: "Sudah Terdaftar", exact: true }),
  ).toBeDisabled();
}

export async function cancelEventRegistration(page: Page) {
  await page.getByRole("button", { name: "Batal Daftar", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Batalkan pendaftaran?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Batalkan", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "Pendaftaran berhasil dibatalkan",
  );
  await expect(
    page.getByRole("button", { name: "Daftar Event", exact: true }),
  ).toBeEnabled();
}

export function indonesianDateFromToday(dayOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

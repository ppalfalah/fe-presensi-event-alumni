import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAlumniThroughUI, openAlumniLogin } from "./auth";
import {
  preparePhase12Fixture,
  type Phase12FixtureState,
} from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export async function loginAlumniWithPhase12Fixture(
  page: Page,
  state: Phase12FixtureState,
) {
  await preparePhase12Fixture(state);
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, getE2ECredentials().alumni);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await expect(page.getByText(/Assalamu'alaikum, E2E/i)).toBeVisible();
}

export async function openPresenceHistoryPage(
  page: Page,
  state: Phase12FixtureState,
) {
  await loginAlumniWithPhase12Fixture(page, state);
  await page.goto("/alumni/main/riwayat");
  await expect(page).toHaveURL(/\/alumni\/main\/riwayat$/);
  await expect(
    page.getByRole("heading", { name: "Riwayat Kehadiran", exact: true }),
  ).toBeVisible();
}

export function historyCard(page: Page, eventTitle: string): Locator {
  return page
    .getByRole("heading", { name: eventTitle, exact: true })
    .locator("xpath=ancestor::div[.//*[normalize-space()='Diverifikasi:'] or .//*[contains(normalize-space(.), 'Diverifikasi:')]][1]");
}

export function recommendationSection(page: Page): Locator {
  return page
    .getByRole("heading", { name: "Rekomendasi Untuk Anda", exact: true })
    .locator("xpath=ancestor::div[./div/h2[normalize-space()='Rekomendasi Untuk Anda']][1]");
}

export function recommendationCard(page: Page, eventTitle: string): Locator {
  return recommendationSection(page)
    .getByText(eventTitle, { exact: true })
    .locator("xpath=ancestor::div[.//button[normalize-space()='Detail']][1]");
}

export function recommendationCards(page: Page): Locator {
  return recommendationSection(page).locator("xpath=./div[2]/*");
}

export function indonesianDateFromToday(dayOffset: number) {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
}

import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "./auth";
import {
  prepareReportFixture,
  type ReportFixtureState,
} from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

async function loginAsE2EAdmin(page: Page) {
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
}

export async function openReportsPage(page: Page, state: ReportFixtureState) {
  await prepareReportFixture(state);
  await loginAsE2EAdmin(page);
  await page.goto("/admin/reports");
  await expect(
    page.getByRole("heading", { name: "Riwayat Kehadiran" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Semua Event" }),
  ).toBeVisible();
}

export async function openEngagementPage(
  page: Page,
  state: ReportFixtureState,
) {
  await prepareReportFixture(state);
  await loginAsE2EAdmin(page);
  await page.goto("/admin/engagement-mapping");
  await expect(
    page.getByRole("heading", { name: "Mapping Engagement Alumni" }),
  ).toBeVisible();
}

export function reportEventRow(page: Page, eventTitle: string): Locator {
  return page.getByRole("row").filter({ hasText: eventTitle });
}

export function reportEventSelect(page: Page): Locator {
  return page
    .getByRole("heading", { name: "Pilih Event untuk Detail Kehadiran" })
    .locator("xpath=ancestor::section")
    .getByRole("combobox");
}

export function attendanceModal(page: Page): Locator {
  return page
    .getByText("Detail kehadiran event", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'fixed')]");
}

export function attendanceTable(page: Page): Locator {
  return attendanceModal(page)
    .getByRole("columnheader", { name: "Nama", exact: true })
    .locator("xpath=ancestor::table");
}

export function attendanceRow(page: Page, alumniName: string): Locator {
  return attendanceTable(page)
    .getByRole("row")
    .filter({ hasText: alumniName });
}

export async function selectReportEvent(page: Page, eventTitle: string) {
  const select = reportEventSelect(page);
  const option = select.locator("option").filter({ hasText: eventTitle });
  const value = await option.getAttribute("value");
  expect(value, `Event option ${eventTitle} should have a value`).not.toBeNull();
  await select.selectOption(value as string);
  await expect(attendanceModal(page)).toBeVisible();
  await expect(
    attendanceModal(page).getByRole("heading", {
      name: eventTitle,
      exact: true,
    }),
  ).toBeVisible();
}

export async function clickReportEvent(page: Page, eventTitle: string) {
  const row = reportEventRow(page, eventTitle);
  await expect(row).toBeVisible();
  await row.click();
  await expect(attendanceModal(page)).toBeVisible();
  await expect(
    attendanceModal(page).getByRole("heading", {
      name: eventTitle,
      exact: true,
    }),
  ).toBeVisible();
}

export function reportStatisticCard(page: Page, caption: string): Locator {
  return page.getByText(caption, { exact: true }).locator("..");
}

export function engagementTable(page: Page): Locator {
  return page
    .getByRole("columnheader", { name: "Nama Alumni", exact: true })
    .locator("xpath=ancestor::table");
}

export function engagementRow(page: Page, alumniName: string): Locator {
  return engagementTable(page)
    .getByRole("row")
    .filter({ hasText: alumniName });
}

export function engagementStatisticCard(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("..");
}

export async function expectAttendanceOrder(page: Page, names: string[]) {
  const rows = attendanceTable(page).locator("tbody tr");
  await expect(rows).toHaveCount(names.length);

  for (const [index, name] of names.entries()) {
    await expect(rows.nth(index)).toContainText(name);
  }
}

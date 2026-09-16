import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAlumniThroughUI, openAlumniLogin } from "../../helpers/auth";
import { prepareDashboardFixture } from "../../helpers/dashboard-fixtures";
import { getE2ECredentials } from "../../helpers/environment";

function engagementCard(page: Page): Locator {
  return page.locator("section").filter({ hasText: "Progress Kompetitif Kehadiran" });
}

function eventFollowedCard(page: Page): Locator {
  return page.getByText("Event diikuti", { exact: true }).locator("..");
}

async function loginToAlumniDashboard(page: Page) {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, alumni);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await expect(page.getByText("Selamat datang di Sistem Presensi Alumni")).toBeVisible();
}

test("TC-BB038 - dashboard alumni tampil setelah alumni berhasil login", async ({ page }) => {
  await prepareDashboardFixture("alumni-no-attendance");
  await loginToAlumniDashboard(page);

  await expect(page.getByRole("heading", { name: "Assalamu'alaikum, E2E" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Riwayat Kehadiran" })).toBeVisible();
});

test("TC-BB039 - dashboard alumni menampilkan keadaan belum pernah mengikuti event", async ({ page }) => {
  await prepareDashboardFixture("alumni-no-attendance");
  await loginToAlumniDashboard(page);

  await expect(engagementCard(page).getByText("0%", { exact: true }).first()).toBeVisible();
  await expect(eventFollowedCard(page).getByText("0", { exact: true })).toBeVisible();
  await expect(page.getByText("Belum ada riwayat kehadiran", { exact: true })).toBeVisible();
  await expect(page.getByText("Belum ada riwayat kehadiran terbaru.", { exact: true })).toBeVisible();
});

test("TC-BB040 - dashboard alumni menampilkan progres dan riwayat sesuai aktivitas", async ({ page }) => {
  await prepareDashboardFixture("alumni-with-attendance");
  await loginToAlumniDashboard(page);

  await expect(engagementCard(page).getByText("40%", { exact: true }).first()).toBeVisible();
  await expect(engagementCard(page).getByText("Kehadiran 2 dari 5 event", { exact: true })).toBeVisible();
  await expect(eventFollowedCard(page).getByText("2", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E Dashboard Attendance 1").first()).toBeVisible();
  await expect(page.getByText("E2E Dashboard Attendance 2").first()).toBeVisible();
  await expect(page.getByText("Belum ada riwayat kehadiran", { exact: true })).toHaveCount(0);
});

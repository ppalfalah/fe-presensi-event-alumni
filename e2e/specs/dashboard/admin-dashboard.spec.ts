import { expect, test, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "../../helpers/auth";
import { prepareDashboardFixture } from "../../helpers/dashboard-fixtures";
import { getE2ECredentials } from "../../helpers/environment";

function statisticCard(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("..");
}

async function loginToAdminDashboard(page: Page) {
  const { admin } = getE2ECredentials();
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(
    page.getByText("Selamat datang di Dashboard Pesantren Al-Falah"),
  ).toBeVisible();
}

test("TC-BB035 - dashboard admin tampil setelah admin berhasil login", async ({ page }) => {
  await prepareDashboardFixture("admin-empty");
  await loginToAdminDashboard(page);

  await expect(page.getByRole("heading", { name: "Assalamu'alaikum, Admin!" })).toBeVisible();
  await expect(page.getByText("Grafik Kehadiran Alumni")).toBeVisible();
});

test("TC-BB036 - dashboard admin menampilkan ringkasan data sesuai database", async ({ page }) => {
  await prepareDashboardFixture("admin-populated");
  await loginToAdminDashboard(page);

  await expect(statisticCard(page, "Total Alumni").getByRole("heading", { name: "3" })).toBeVisible();
  await expect(statisticCard(page, "Total Event").getByRole("heading", { name: "2" })).toBeVisible();
  await expect(statisticCard(page, "Total Kehadiran").getByRole("heading", { name: "3" })).toBeVisible();
  await expect(page.getByText(/Total 3 kehadiran pada periode/)).toBeVisible();
});

test("TC-BB037 - dashboard admin tetap tampil saat data sistem kosong", async ({ page }) => {
  await prepareDashboardFixture("admin-empty");
  await loginToAdminDashboard(page);

  await expect(statisticCard(page, "Total Alumni").getByRole("heading", { name: "0" })).toBeVisible();
  await expect(statisticCard(page, "Total Event").getByRole("heading", { name: "0" })).toBeVisible();
  await expect(statisticCard(page, "Total Kehadiran").getByRole("heading", { name: "0" })).toBeVisible();
  await expect(page.getByText("Belum ada data kehadiran pada filter yang dipilih.")).toBeVisible();
  await expect(page.getByText("Belum ada event mendatang")).toBeVisible();
});

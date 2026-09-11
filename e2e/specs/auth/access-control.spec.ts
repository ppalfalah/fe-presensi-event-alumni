import { expect, test } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "../../helpers/auth";
import { getE2ECredentials } from "../../helpers/environment";

test("TC-BB033 - alumni credentials cannot access the admin portal", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, alumni);
  await expect(page.getByText("Alumni tidak diperbolehkan masuk melalui portal admin.")).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByText("Selamat datang di Dashboard Pesantren Al-Falah")).toHaveCount(0);
});

test("EXTRA-AUTH-002 - unauthenticated users are redirected from an admin protected route", async ({ page }) => {
  await page.goto("/");
  await page.goto("/admin/dashboard");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByRole("heading", { name: "Masuk sebagai Admin" })).toBeVisible();
  await expect(page.getByText("Selamat datang di Dashboard Pesantren Al-Falah")).toHaveCount(0);
});

test("EXTRA-AUTH-003 - unauthenticated users are redirected from an alumni protected route", async ({ page }) => {
  await page.goto("/");
  await page.goto("/alumni/main/dashboard");
  await expect(page).toHaveURL(/\/alumni\/login$/);
  await expect(page.getByRole("heading", { name: "Mulai Sekarang" })).toBeVisible();
  await expect(page.getByText("Selamat datang di Sistem Presensi Alumni")).toHaveCount(0);
});

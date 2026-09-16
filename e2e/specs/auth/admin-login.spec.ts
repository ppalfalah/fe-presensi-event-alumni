import { expect, test } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "../../helpers/auth";
import { getE2ECredentials } from "../../helpers/environment";

test("TC-BB029 - admin can login with valid credentials", async ({ page }) => {
  const { admin } = getE2ECredentials();
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await expect(page.getByText("Selamat datang di Dashboard Pesantren Al-Falah")).toBeVisible();
});

test("TC-BB030 - admin login validates empty email and password", async ({ page }) => {
  await openAdminLogin(page);
  const email = page.getByPlaceholder("admin@pesantren.com");
  const password = page.getByPlaceholder("Masukkan kata sandi admin");
  await page.getByRole("button", { name: "Masuk ke Dasboard Admin" }).click();

  await expect(email).toBeFocused();
  expect(await email.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  expect(await password.evaluate((input: HTMLInputElement) => input.validity.valueMissing)).toBe(true);
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("TC-BB031 - valid admin email with a wrong password is rejected", async ({ page }) => {
  const { admin } = getE2ECredentials();
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, { ...admin, password: `${admin.password}-salah` });
  await expect(page.getByText(/email atau (kata sandi|password) salah/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByText("Selamat datang di Dashboard Pesantren Al-Falah")).toHaveCount(0);
});

test("TC-BB032 - an unregistered admin email is rejected", async ({ page }) => {
  const { admin } = getE2ECredentials();
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, {
    email: `e2e.unknown-admin.${Date.now()}@example.test`,
    password: admin.password,
  });
  await expect(page.getByText(/email atau (kata sandi|password) salah/i)).toBeVisible();
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test("TC-BB034 - admin forgot-password link opens password recovery", async ({ page }) => {
  await openAdminLogin(page);
  await page.getByRole("link", { name: /Lupa kata sandi/i }).click();
  await expect(page).toHaveURL(/\/forgot-password$/, { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "Lupa Kata Sandi" })).toBeVisible();
});

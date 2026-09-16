import { expect, test } from "@playwright/test";
import { loginAsAlumniThroughUI, openAlumniLogin } from "../../helpers/auth";
import { getE2ECredentials } from "../../helpers/environment";

test("TC-BB021 - alumni can login with valid credentials", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, alumni);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await expect(page.getByText("Selamat datang di Sistem Presensi Alumni")).toBeVisible();
});

test("TC-BB022 - alumni login validates empty email and password", async ({ page }) => {
  await openAlumniLogin(page);
  await page.getByRole("button", { name: "Masuk dengan Email" }).click();
  await expect(page.getByText("Email wajib diisi.")).toBeVisible();
  await expect(page.getByText("Kata sandi wajib diisi.")).toBeVisible();
  await expect(page).toHaveURL(/\/alumni\/login$/);
});

test("TC-BB023 - alumni login validates an empty email", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await page.getByPlaceholder("masukkan kata sandi Anda").fill(alumni.password);
  await page.getByRole("button", { name: "Masuk dengan Email" }).click();
  await expect(page.getByText("Email wajib diisi.")).toBeVisible();
  await expect(page).toHaveURL(/\/alumni\/login$/);
});

test("TC-BB024 - registered alumni email with a wrong password is rejected", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, { ...alumni, password: `${alumni.password}-salah` });
  await expect(page.getByText(/email atau (kata sandi|password) salah/i)).toBeVisible();
  await expect(page).toHaveURL(/\/alumni\/login$/);
  await expect(page.getByText("Selamat datang di Sistem Presensi Alumni")).toHaveCount(0);
});

test("TC-BB025 - alumni login validates an empty password", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await page.getByPlaceholder("masukkan alamat email Anda").fill(alumni.email);
  await page.getByRole("button", { name: "Masuk dengan Email" }).click();
  await expect(page.getByText("Kata sandi wajib diisi.")).toBeVisible();
  await expect(page).toHaveURL(/\/alumni\/login$/);
});

test("TC-BB026 - an unregistered alumni email is rejected", async ({ page }) => {
  const { alumni } = getE2ECredentials();
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, {
    email: `e2e.unknown.${Date.now()}@example.test`,
    password: alumni.password,
  });
  await expect(page.getByText(/email atau (kata sandi|password) salah/i)).toBeVisible();
  await expect(page).toHaveURL(/\/alumni\/login$/);
});

test("TC-BB027 - alumni forgot-password link opens password recovery", async ({ page }) => {
  await openAlumniLogin(page);
  await page.getByRole("link", { name: /Lupa kata sandi/i }).click();
  await expect(page).toHaveURL(/\/forgot-password$/);
  await expect(page.getByRole("heading", { name: "Lupa Kata Sandi" })).toBeVisible();
});

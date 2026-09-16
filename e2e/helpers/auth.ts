import { expect, type Page } from "@playwright/test";

export interface LoginCredentials {
  email: string;
  password: string;
}

export async function openAlumniLogin(page: Page) {
  await page.goto("/alumni/login");
  await expect(page.getByRole("heading", { name: "Mulai Sekarang" })).toBeVisible();
}

export async function loginAsAlumniThroughUI(
  page: Page,
  credentials: LoginCredentials,
) {
  const form = page.locator("form");
  await form.getByPlaceholder("masukkan alamat email Anda").fill(credentials.email);
  await form.getByPlaceholder("masukkan kata sandi Anda").fill(credentials.password);
  await form.getByRole("button", { name: "Masuk dengan Email" }).click();
}

export async function openAdminLogin(page: Page) {
  await page.goto("/admin/login");
  await expect(page.getByRole("heading", { name: "Masuk sebagai Admin" })).toBeVisible();
}

export async function loginAsAdminThroughUI(
  page: Page,
  credentials: LoginCredentials,
) {
  const form = page.locator("form");
  await form.getByPlaceholder("admin@pesantren.com").fill(credentials.email);
  await form.getByPlaceholder("Masukkan kata sandi admin").fill(credentials.password);
  await form.getByRole("button", { name: "Masuk ke Dasboard Admin" }).click();
}

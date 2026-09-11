import { expect, type Page } from "@playwright/test";
import type { AlumniRegistrationData } from "./test-data";

export const registrationSuccess = /Registrasi berhasil.*menunggu persetujuan admin/i;

export async function openAlumniRegistration(page: Page) {
  await page.goto("/alumni/register");
  await expect(page.getByRole("heading", { name: "Mulai Sekarang" })).toBeVisible();
  await expect(registrationForm(page).getByRole("button", { name: "Daftar", exact: true })).toBeVisible();
}

export function registrationForm(page: Page) {
  return page.locator("form");
}

export function registrationSelect(page: Page, optionText: string) {
  return registrationForm(page).locator("select").filter({
    has: page.getByRole("option", { name: optionText, exact: true }),
  });
}

export async function fillAlumniRegistration(
  page: Page,
  data: AlumniRegistrationData,
) {
  const form = registrationForm(page);

  await form.getByPlaceholder("nama depan anda").fill(data.firstName);
  await form.getByPlaceholder("nama belakang anda").fill(data.lastName);
  await form.locator("select").first().selectOption(data.gender);
  await form.getByPlaceholder("masukkan alamat email Anda").fill(data.email);
  await form.getByPlaceholder("masukkan no telp Anda").fill(data.phone);
  await registrationSelect(page, "Pilih Tahun Lulus").selectOption(data.graduationYear);
  await form.locator('input[type="date"]').fill(data.birthDate);
  await form.getByPlaceholder("masukkan kata sandi Anda (min. 8 karakter)").fill(data.password);
  await form.getByPlaceholder("ulangi kata sandi Anda").fill(data.passwordConfirmation);

  const province = registrationSelect(page, "Pilih provinsi");
  await expect(province.getByRole("option", { name: data.province })).toBeAttached();
  await province.selectOption({ label: data.province });

  const city = registrationSelect(page, "Pilih kabupaten/kota");
  await expect(city.getByRole("option", { name: data.city })).toBeAttached();
  await city.selectOption({ label: data.city });

  const district = registrationSelect(page, "Pilih kecamatan");
  await expect(district.getByRole("option", { name: data.district })).toBeAttached();
  await district.selectOption({ label: data.district });

  const village = registrationSelect(page, "Pilih desa/kelurahan");
  await expect(village.getByRole("option", { name: data.village })).toBeAttached();
  await village.selectOption({ label: data.village });

  await form.getByPlaceholder("Kode pos").fill(data.postalCode);
  await form.getByPlaceholder(/Jl\. Melati/).fill(data.address);
}

export async function setGraduationYearOutsideVisibleOptions(
  page: Page,
  year: string,
) {
  const select = registrationSelect(page, "Pilih Tahun Lulus");
  await select.evaluate((element, injectedYear) => {
    const option = document.createElement("option");
    option.value = injectedYear;
    option.textContent = injectedYear;
    element.append(option);
  }, year);
  await select.selectOption(year);
}

export async function submitRegistration(page: Page) {
  await registrationForm(page).getByRole("button", { name: "Daftar", exact: true }).click();
}

export async function expectRegistrationSucceeded(page: Page) {
  await expect(page.getByRole("heading", { name: "Registrasi Berhasil!" })).toBeVisible();
  await expect(page.getByText(registrationSuccess)).toBeVisible();
}

export async function expectRegistrationDidNotSucceed(page: Page) {
  await expect(page.getByRole("heading", { name: "Registrasi Berhasil!" })).toHaveCount(0);
  await expect(page).toHaveURL(/\/alumni\/register$/);
}

import { expect, test } from "@playwright/test";
import { getE2ECredentials } from "../../helpers/environment";
import {
  expectRegistrationDidNotSucceed,
  expectRegistrationSucceeded,
  fillAlumniRegistration,
  openAlumniRegistration,
  registrationForm,
  registrationSelect,
  setGraduationYearOutsideVisibleOptions,
  submitRegistration,
} from "../../helpers/registration";
import { createUniqueAlumniData, toDateInput } from "../../helpers/test-data";

const PASSWORD_MINIMUM = 8;
const currentYear = new Date().getFullYear();
const minimumGraduationYear = currentYear - 49;

test("TC-BB001 - alumni registration succeeds with complete valid data", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB001", testInfo));
  await submitRegistration(page);
  await expectRegistrationSucceeded(page);
});

test("TC-BB002 - required alumni registration field is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB002", testInfo, { firstName: "" }));
  await submitRegistration(page);
  await expect(page.getByText("Nama depan wajib diisi.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB003 - duplicate alumni email is rejected", async ({ page }, testInfo) => {
  const { alumni } = getE2ECredentials();
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB003", testInfo, { email: alumni.email }));
  await submitRegistration(page);
  await expect(page.getByText("Email ini sudah terdaftar.", { exact: true })).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB004 - invalid alumni email format is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB004", testInfo, { email: "alamat-email-tidak-valid" }));
  await submitRegistration(page);
  await expect(page.getByText("Email harus berisi alamat yang benar.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB005 - invalid phone format is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB005", testInfo, { phone: "nomor-invalid" }));
  await submitRegistration(page);
  await expect(page.getByText("Nomor telepon belum sesuai.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB006 - graduation year is required", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB006", testInfo, { graduationYear: "" }));
  await submitRegistration(page);
  await expect(page.getByText("Tahun lulus wajib dipilih.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB007 - graduation year at the valid minimum boundary is accepted", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB007", testInfo, { graduationYear: String(minimumGraduationYear) }));
  await submitRegistration(page);
  await expectRegistrationSucceeded(page);
});

test("TC-BB008 - a valid birth date before today is accepted", async ({ page }, testInfo) => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB008", testInfo, { birthDate: toDateInput(yesterday) }));
  await submitRegistration(page);
  await expectRegistrationSucceeded(page);
});

test("TC-BB009 - a birth date after today is rejected", async ({ page }, testInfo) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB009", testInfo));
  await registrationForm(page).locator('input[type="date"]').fill(toDateInput(tomorrow));
  await submitRegistration(page);
  await expect(page.getByText("Tanggal lahir tidak boleh melebihi hari ini.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB010 - password below the minimum boundary is rejected", async ({ page }, testInfo) => {
  const password = "Aa1!xyz";
  expect(password).toHaveLength(PASSWORD_MINIMUM - 1);
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB010", testInfo, { password, passwordConfirmation: password }));
  await submitRegistration(page);
  await expect(page.getByText("Kata sandi minimal 8 karakter (1 lagi).")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB011 - password at the valid minimum boundary is accepted", async ({ page }, testInfo) => {
  const password = "Aa1!xyzz";
  expect(password).toHaveLength(PASSWORD_MINIMUM);
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB011", testInfo, { password, passwordConfirmation: password }));
  await submitRegistration(page);
  await expectRegistrationSucceeded(page);
});

test("TC-BB012 - mismatched password confirmation is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB012", testInfo, { passwordConfirmation: "Berbeda!2026" }));
  await submitRegistration(page);
  await expect(page.getByText("Konfirmasi kata sandi tidak sama.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB013 - province is required", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB013", testInfo));
  await registrationSelect(page, "Pilih provinsi").selectOption("");
  await submitRegistration(page);
  await expect(page.getByText("Provinsi wajib dipilih.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB014 - city cannot be selected before province", async ({ page }) => {
  await openAlumniRegistration(page);
  const city = registrationSelect(page, "Pilih provinsi terlebih dahulu");
  await expect(city).toBeDisabled();
  await expect(city).toHaveValue("");
});

test("TC-BB015 - district cannot be selected before city", async ({ page }) => {
  await openAlumniRegistration(page);
  await registrationSelect(page, "Pilih provinsi").selectOption({ label: "Jawa Barat" });
  const district = registrationSelect(page, "Pilih kabupaten/kota terlebih dahulu");
  await expect(district).toBeDisabled();
  await expect(district).toHaveValue("");
});

test("TC-BB016 - village cannot be selected before district", async ({ page }) => {
  await openAlumniRegistration(page);
  await registrationSelect(page, "Pilih provinsi").selectOption({ label: "Jawa Barat" });
  const city = registrationSelect(page, "Pilih kabupaten/kota");
  await expect(city.getByRole("option", { name: "Kota Bandung" })).toBeAttached();
  await city.selectOption({ label: "Kota Bandung" });
  const village = registrationSelect(page, "Pilih kecamatan terlebih dahulu");
  await expect(village).toBeDisabled();
  await expect(village).toHaveValue("");
});

test("TC-BB017 - changing province resets dependent domicile fields", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB017", testInfo));
  await registrationSelect(page, "Pilih provinsi").selectOption({ label: "Jawa Tengah" });

  const city = registrationSelect(page, "Pilih kabupaten/kota");
  const district = registrationSelect(page, "Pilih kabupaten/kota terlebih dahulu");
  const village = registrationSelect(page, "Pilih kecamatan terlebih dahulu");
  await expect(city).toHaveValue("");
  await expect(city.getByRole("option", { name: "Kota Semarang" })).toBeAttached();
  await expect(district).toHaveValue("");
  await expect(district).toBeDisabled();
  await expect(village).toHaveValue("");
  await expect(village).toBeDisabled();
});

test("TC-BB018 - empty postal code is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB018", testInfo));
  await registrationForm(page).getByPlaceholder("Kode pos").fill("");
  await submitRegistration(page);
  await expect(page.getByText("Kode pos wajib diisi.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("TC-BB019 - empty domicile address is validated", async ({ page }, testInfo) => {
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("TC-BB019", testInfo, { address: "" }));
  await submitRegistration(page);
  await expect(page.getByText("Alamat wajib diisi.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

test("EXTRA-AUTH-001 - graduation year below the frontend minimum is rejected", async ({ page }, testInfo) => {
  const invalidYear = String(minimumGraduationYear - 1);
  await openAlumniRegistration(page);
  await fillAlumniRegistration(page, createUniqueAlumniData("EXTRA-AUTH-001", testInfo));
  await setGraduationYearOutsideVisibleOptions(page, invalidYear);
  await submitRegistration(page);
  await expect(page.getByText("Tahun lulus belum sesuai.")).toBeVisible();
  await expectRegistrationDidNotSucceed(page);
});

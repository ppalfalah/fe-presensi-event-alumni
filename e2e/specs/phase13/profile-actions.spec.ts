import { expect, test } from "@playwright/test";
import {
  alumniProfilePhoto,
  expectAlumniProfilePhotoLoaded,
  openAlumniProfile,
  profileAvatarContainer,
  profileInfoRow,
  uploadAlumniProfilePhoto,
} from "../../helpers/alumni-profile";
import { createImagePayload } from "../../helpers/settings";

test("TC-BB237 - tombol kamera mengunggah dan menampilkan foto profil terbaru", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-no-avatar");
  const uploadResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname.endsWith("/auth/profile/avatar"),
  );

  await uploadAlumniProfilePhoto(page, await createImagePayload(page, "png"));
  expect((await uploadResponse).status()).toBe(200);

  await expect(page.getByRole("status")).toContainText("Foto profil berhasil diperbarui");
  await expectAlumniProfilePhotoLoaded(page);
});

test("TC-BB238 - menghapus foto profil mengembalikan avatar default", async ({ page }) => {
  await openAlumniProfile(page, "profile-avatar");
  await expectAlumniProfilePhotoLoaded(page);

  await page.locator("button:has(svg.lucide-trash-2)").click();
  await expect(
    page.getByRole("heading", { name: "Hapus foto profil?", exact: true }),
  ).toBeVisible();
  const deleteResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" &&
      new URL(response.url()).pathname.endsWith("/auth/profile/avatar"),
  );
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  expect((await deleteResponse).status()).toBe(200);

  await expect(page.getByRole("status")).toContainText("Foto profil berhasil dihapus");
  await expect(alumniProfilePhoto(page)).toHaveCount(0);
  await expect(profileAvatarContainer(page).getByText("EA", { exact: true })).toBeVisible();
});

test("TC-BB239 - tombol Ubah mengaktifkan mode edit pada halaman profil yang sama", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");
  const profileUrl = page.url();
  await page.getByRole("button", { name: "Ubah", exact: true }).click();

  await expect(page).toHaveURL(profileUrl);
  await expect(page.getByPlaceholder("Nama depan", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Nama belakang", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Simpan", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Batal", exact: true })).toBeVisible();
});

test("TC-BB240 - perubahan profil valid tersimpan dan tetap tampil setelah reload", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");
  await page.getByRole("button", { name: "Ubah", exact: true }).click();

  await page.getByPlaceholder("Nama depan", { exact: true }).fill("E2E Updated");
  await page.getByPlaceholder("Nama belakang", { exact: true }).fill("Alumni Updated");
  await page.getByPlaceholder("No telepon", { exact: true }).fill("081298765432");
  await profileInfoRow(page, "Jenis Kelamin").locator("select").selectOption("Perempuan");
  await profileInfoRow(page, "Angkatan (Tahun Lulus)").locator("select").selectOption("2021");
  await profileInfoRow(page, "Tanggal Lahir").locator('input[type="date"]').fill("2001-02-16");

  const saveResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "PUT" &&
      new URL(response.url()).pathname.endsWith("/auth/profile"),
  );
  await page.getByRole("button", { name: "Simpan", exact: true }).click();
  expect((await saveResponse).status()).toBe(200);
  await expect(page.getByRole("status")).toContainText("Profil berhasil diperbarui!");

  await expect(profileInfoRow(page, "Nama Depan")).toContainText("E2E Updated");
  await expect(profileInfoRow(page, "Nama Belakang")).toContainText("Alumni Updated");
  await expect(profileInfoRow(page, "No Telp")).toContainText("081298765432");
  await expect(profileInfoRow(page, "Jenis Kelamin")).toContainText("Perempuan");
  await expect(profileInfoRow(page, "Angkatan (Tahun Lulus)")).toContainText("2021");

  await page.reload();
  await expect(page.getByRole("button", { name: "Ubah", exact: true })).toBeVisible();
  await expect(profileInfoRow(page, "Nama Depan")).toContainText("E2E Updated");
  await expect(profileInfoRow(page, "Nama Belakang")).toContainText("Alumni Updated");
  await expect(profileInfoRow(page, "No Telp")).toContainText("081298765432");
  await expect(profileInfoRow(page, "Jenis Kelamin")).toContainText("Perempuan");
  await expect(profileInfoRow(page, "Angkatan (Tahun Lulus)")).toContainText("2021");
  await expect(profileInfoRow(page, "Tanggal Lahir")).toContainText("16 Februari 2001");
});

test("TC-BB241 - membatalkan edit tanpa perubahan mempertahankan data profil", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");
  await expect(profileInfoRow(page, "Nama Depan")).toContainText("E2E");
  await expect(profileInfoRow(page, "Nama Belakang")).toContainText("Alumni Profile");
  await expect(profileInfoRow(page, "No Telp")).toContainText("081234567890");

  await page.getByRole("button", { name: "Ubah", exact: true }).click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();

  await expect(profileInfoRow(page, "Nama Depan")).toContainText("E2E");
  await expect(profileInfoRow(page, "Nama Belakang")).toContainText("Alumni Profile");
  await expect(profileInfoRow(page, "No Telp")).toContainText("081234567890");
  await expect(page.getByPlaceholder("Nama depan", { exact: true })).toHaveCount(0);
});

test("TC-BB243 - menu Ganti Kata Sandi membuka formulir perubahan kata sandi", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");
  await page.getByRole("button", { name: "Ganti Kata Sandi", exact: true }).click();

  await expect(page).toHaveURL(/\/alumni\/change-password$/);
  await expect(
    page.getByRole("heading", { name: "Ganti Kata Sandi", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Kata Sandi Lama", { exact: true })).toBeVisible();
  await expect(page.getByText("Kata Sandi Baru", { exact: true })).toBeVisible();
  await expect(page.getByText("Konfirmasi Kata Sandi Baru", { exact: true })).toBeVisible();
  await expect(page.getByPlaceholder("Masukkan kata sandi lama", { exact: true })).toBeVisible();
});

test("TC-BB244 - menu Keluar mengakhiri sesi alumni dan membuka halaman login", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");
  await page.getByRole("button", { name: "Keluar", exact: true }).click();

  await expect(page).toHaveURL(/\/alumni\/login$/);
  await expect(page.getByRole("heading", { name: "Mulai Sekarang", exact: true })).toBeVisible();
  const remainingTokens = await page.evaluate(() => ({
    local: ["access_token", "alumni_token", "token"].map((key) => localStorage.getItem(key)),
    session: ["access_token", "alumni_token"].map((key) => sessionStorage.getItem(key)),
  }));
  expect(remainingTokens.local).toEqual([null, null, null]);
  expect(remainingTokens.session).toEqual([null, null]);
});

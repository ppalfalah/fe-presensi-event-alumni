import { expect, test } from "@playwright/test";
import {
  createImagePayload,
  expectProfilePhotoLoaded,
  openSettingsPage,
  profilePhoto,
  saveProfile,
  settingsEmailInput,
  settingsNameInput,
  uploadProfilePhoto,
} from "../../helpers/settings";

test("TC-BB160 - halaman pengaturan menampilkan profil dan keamanan akun", async ({
  page,
}) => {
  await openSettingsPage(page);

  await expect(
    page.getByRole("heading", { name: "Profil Administrator" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Keamanan Akun" }),
  ).toBeVisible();
});

test("TC-BB161 - nama administrator valid dapat disimpan", async ({ page }) => {
  await openSettingsPage(page);
  await settingsNameInput(page).fill("Administrator Phase Sembilan");
  await saveProfile(page);

  await expect(
    page.getByText("Profil administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(settingsNameInput(page)).toHaveValue(
    "Administrator Phase Sembilan",
  );
});

test("TC-BB162 - nama administrator kosong ditolak dengan validasi wajib", async ({
  page,
}) => {
  await openSettingsPage(page);
  await settingsNameInput(page).clear();
  await saveProfile(page);

  await expect(
    page.getByText("Nama dan email administrator wajib diisi.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(settingsNameInput(page)).toHaveValue("");
});

test("TC-BB163 - email administrator berformat valid dapat disimpan", async ({
  page,
}) => {
  await openSettingsPage(page);
  await settingsNameInput(page).fill("E2E Admin");
  const validEmail = "e2e.admin.phase9.updated@example.test";
  await settingsEmailInput(page).fill(validEmail);
  await saveProfile(page);

  await expect(
    page.getByText("Profil administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(settingsEmailInput(page)).toHaveValue(validEmail);
});

test("TC-BB164 - email administrator tidak valid ditolak dengan validasi", async ({
  page,
}) => {
  await openSettingsPage(page);
  await settingsEmailInput(page).fill("admin-invalid-email");
  await saveProfile(page);

  await expect(
    page.getByText(/format email.*tidak valid|email.*harus valid/i),
  ).toBeVisible();
  await expect(
    page.getByText("Profil administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("TC-BB177 - profil terbaru tetap tersimpan setelah halaman dimuat ulang", async ({
  page,
}) => {
  await openSettingsPage(page);
  const updatedName = "Admin Persisten Phase Sembilan";
  const updatedEmail = "e2e.admin.persisted@example.test";

  await settingsNameInput(page).fill(updatedName);
  await settingsEmailInput(page).fill(updatedEmail);
  await saveProfile(page);
  await expect(
    page.getByText("Profil administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Oke" }).click();

  await uploadProfilePhoto(page, await createImagePayload(page, "png"));
  await expectProfilePhotoLoaded(page);
  const avatarSource = await profilePhoto(page).getAttribute("src");
  expect(avatarSource).toBeTruthy();

  await page.reload();
  await expect(settingsNameInput(page)).toBeEnabled();
  await expectProfilePhotoLoaded(page);
  await expect(profilePhoto(page)).toHaveAttribute("src", avatarSource as string);
  await expect(settingsNameInput(page)).toHaveValue(updatedName);
  await expect(settingsEmailInput(page)).toHaveValue(updatedEmail);
});

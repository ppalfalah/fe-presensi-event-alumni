import { expect, test } from "@playwright/test";
import { editField, openUsersPage, userRow } from "../../helpers/users";

test("TC-BB057 - edit alumni dengan input valid menyimpan dan menampilkan data terbaru", async ({ page }) => {
  await openUsersPage(page, "users-editable");
  await page.getByRole("button", { name: "Ubah Editable Alumni" }).click();
  await expect(page.getByRole("heading", { name: "Ubah Pengguna" })).toBeVisible();

  await editField(page, "Nama Depan").fill("Updated");
  await editField(page, "Nama Belakang").fill("Alumni");
  await page.getByRole("button", { name: "Perbarui" }).click();

  await expect(page.getByRole("status")).toContainText("Pengguna berhasil diperbarui");
  await expect(userRow(page, "Updated Alumni")).toBeVisible();
  await expect(userRow(page, "Editable Alumni")).toHaveCount(0);
});

test("TC-BB058 - edit alumni dengan field wajib kosong ditolak dengan validasi", async ({ page }) => {
  await openUsersPage(page, "users-editable");
  await page.getByRole("button", { name: "Ubah Editable Alumni" }).click();

  await editField(page, "Nama Depan").fill("");
  await page.getByRole("button", { name: "Perbarui" }).click();

  await expect(page.getByRole("status")).toContainText(/nama depan|required|wajib|string/i);
  await expect(page.getByRole("heading", { name: "Ubah Pengguna" })).toBeVisible();
  await expect(userRow(page, "Editable Alumni")).toBeVisible();
});

test("TC-BB059 - hapus alumni setelah konfirmasi menghilangkan data", async ({ page }) => {
  await openUsersPage(page, "users-deletable");
  await page.getByRole("button", { name: "Hapus Disposable Alumni" }).click();
  await expect(page.getByText("Pengguna \"Disposable Alumni\" akan dihapus permanen dari daftar.")).toBeVisible();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Pengguna berhasil dihapus");
  await expect(userRow(page, "Disposable Alumni")).toHaveCount(0);
  await expect(page.getByText("Belum ada data pengguna")).toBeVisible();
});

test("TC-BB060 - membatalkan konfirmasi hapus mempertahankan data alumni", async ({ page }) => {
  await openUsersPage(page, "users-deletable");
  await page.getByRole("button", { name: "Hapus Disposable Alumni" }).click();
  await expect(page.getByRole("heading", { name: "Hapus pengguna?" })).toBeVisible();
  await page.getByRole("button", { name: "Batal", exact: true }).click();

  await expect(page.getByRole("heading", { name: "Hapus pengguna?" })).toHaveCount(0);
  await expect(userRow(page, "Disposable Alumni")).toBeVisible();
});

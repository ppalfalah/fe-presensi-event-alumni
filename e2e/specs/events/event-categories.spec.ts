import { expect, test } from "@playwright/test";
import { categoryRow, expandCategories, openEventsPage } from "../../helpers/events";

test("TC-BB089 - daftar kategori menampilkan kategori dan informasi yang tersedia", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);

  await expect(categoryRow(page, "E2E General")).toContainText("Kategori utama fixture event E2E");
  await expect(categoryRow(page, "E2E General")).toContainText("1");
  await expect(categoryRow(page, "E2E Unused Category")).toContainText("Kategori yang aman untuk dihapus");
  await expect(categoryRow(page, "E2E Unused Category")).toContainText("0");
});

test("TC-BB090 - tambah kategori valid menyimpan dan menampilkan kategori baru", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);
  await page.getByRole("button", { name: "Tambah Kategori" }).click();
  const modal = page.getByRole("heading", { name: "Tambah Kategori" }).locator("..").locator("..").locator("..");

  await modal.getByPlaceholder("Contoh: Seminar").fill("E2E New Category");
  await modal.getByPlaceholder("Deskripsi singkat kategori").fill("Kategori baru hasil pengujian E2E");
  await modal.getByRole("button", { name: "Tambah Kategori" }).click();

  await expect(page.getByRole("status")).toContainText("Kategori event berhasil ditambahkan");
  await expect(categoryRow(page, "E2E New Category")).toContainText("Kategori baru hasil pengujian E2E");
});

test("TC-BB091 - nama kategori kosong ditolak dan menampilkan validasi", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);
  await page.getByRole("button", { name: "Tambah Kategori" }).click();
  const modal = page.getByRole("heading", { name: "Tambah Kategori" }).locator("..").locator("..").locator("..");

  await modal.getByPlaceholder("Contoh: Seminar").press("Enter");
  const submit = modal.getByRole("button", { name: "Tambah Kategori" });
  await expect(submit).toBeDisabled();
  await expect(modal.getByText("Nama kategori wajib diisi.")).toBeVisible();
});

test("TC-BB092 - edit kategori valid menyimpan dan menampilkan data terbaru", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);
  await categoryRow(page, "E2E Unused Category").getByRole("button", { name: "Ubah E2E Unused Category" }).click();

  await page.getByPlaceholder("Contoh: Seminar").fill("E2E Updated Category");
  await page.getByPlaceholder("Deskripsi singkat kategori").fill("Deskripsi kategori diperbarui");
  await page.getByRole("button", { name: "Simpan Perubahan" }).click();

  await expect(page.getByRole("status")).toContainText("Kategori event berhasil diperbarui");
  await expect(categoryRow(page, "E2E Updated Category")).toContainText("Deskripsi kategori diperbarui");
  await expect(categoryRow(page, "E2E Unused Category")).toHaveCount(0);
});

test("TC-BB093 - kategori yang digunakan event tidak dapat dihapus", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);
  const row = categoryRow(page, "E2E General");
  const deleteButton = row.getByRole("button", { name: "Hapus E2E General" });

  await expect(deleteButton).toBeDisabled();
  await expect(deleteButton).toHaveAttribute("title", "Kategori masih digunakan oleh event");
  await expect(row.getByText("Kategori masih digunakan oleh event")).toBeVisible();
});

test("TC-BB094 - kategori yang tidak digunakan berhasil dihapus setelah konfirmasi", async ({ page }) => {
  await openEventsPage(page, "event-categories");
  await expandCategories(page);
  await categoryRow(page, "E2E Unused Category").getByRole("button", { name: "Hapus E2E Unused Category" }).click();

  const confirmation = page.getByRole("heading", { name: "Hapus kategori?" }).locator("..");
  await confirmation.getByRole("button", { name: "Hapus", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Kategori event berhasil dihapus");
  await expect(categoryRow(page, "E2E Unused Category")).toHaveCount(0);
});

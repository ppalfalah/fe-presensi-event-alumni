import { expect, test } from "@playwright/test";
import {
  FILTER_USERS,
  expectVisibleUsers,
  openUsersPage,
  userRow,
} from "../../helpers/users";

test("TC-BB041 - seluruh data alumni ditampilkan pada tabel", async ({ page }) => {
  await openUsersPage(page, "users-filter");

  await expectVisibleUsers(page, FILTER_USERS);
  await expect(page.getByText("Menampilkan 1-5 dari 5 pengguna")).toBeVisible();
});

test("TC-BB042 - informasi data alumni tidak tersedia ditampilkan saat database kosong", async ({ page }) => {
  await openUsersPage(page, "users-empty");

  await expect(page.getByText("Belum ada data pengguna")).toBeVisible();
});

test("TC-BB043 - pencarian menampilkan alumni yang sesuai", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await page.getByPlaceholder("Cari nama atau email...").fill("bima.filter@example.test");

  await expect(userRow(page, "Bima Basuki")).toBeVisible();
  await expect(page.getByText("Menampilkan 1-1 dari 1 pengguna")).toBeVisible();
  await expect(userRow(page, "Alia Andini")).toHaveCount(0);
});

test("TC-BB044 - pencarian yang tidak terdaftar menampilkan data tidak ditemukan", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await page.getByPlaceholder("Cari nama atau email...").fill("tidak.ada@example.test");

  await expect(page.getByText("Pengguna tidak ditemukan")).toBeVisible();
});

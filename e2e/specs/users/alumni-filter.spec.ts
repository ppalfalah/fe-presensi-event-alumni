import { expect, test } from "@playwright/test";
import {
  FILTER_USERS,
  expectVisibleUsers,
  filterSelect,
  openUsersPage,
  selectBandungHierarchy,
  userRow,
  userRows,
} from "../../helpers/users";

const BANDUNG_USERS = [
  "Alia Andini",
  "Bima Basuki",
  "Citra Cahyani",
  "Damar Darma",
] as const;

test("TC-BB045 - filter provinsi menampilkan alumni dari provinsi terpilih", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });

  await expectVisibleUsers(page, BANDUNG_USERS);
  await expect(userRow(page, "Zaki Zain")).toHaveCount(0);
});

test("TC-BB046 - filter provinsi tanpa alumni menampilkan kondisi data tidak ditemukan", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Tengah" });

  await expect(page.getByText("Belum ada data pengguna")).toBeVisible();
});

test("TC-BB047 - filter kota menampilkan alumni dari kota terpilih", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });
  await filterSelect(page, "Filter Kota/Kabupaten").selectOption({ label: "Kota Bandung" });

  await expectVisibleUsers(page, BANDUNG_USERS);
});

test("TC-BB048 - filter kecamatan menampilkan alumni dari kecamatan terpilih", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });
  await filterSelect(page, "Filter Kota/Kabupaten").selectOption({ label: "Kota Bandung" });
  await filterSelect(page, "Filter Kecamatan").selectOption({ label: "Sukasari" });

  await expectVisibleUsers(page, BANDUNG_USERS);
});

test("TC-BB049 - filter desa menampilkan alumni dari desa terpilih", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await selectBandungHierarchy(page);

  await expectVisibleUsers(page, BANDUNG_USERS);
});

test("TC-BB050 - perubahan provinsi mereset pilihan wilayah di bawahnya", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await selectBandungHierarchy(page);

  const city = filterSelect(page, "Filter Kota/Kabupaten");
  const district = filterSelect(page, "Filter Kecamatan");
  const village = filterSelect(page, "Filter Desa/Kelurahan");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Tengah" });

  await expect(city).toHaveValue("");
  await expect(city).toBeEnabled();
  await expect(district).toHaveValue("");
  await expect(district).toBeDisabled();
  await expect(village).toHaveValue("");
  await expect(village).toBeDisabled();
});

test("TC-BB051 - kombinasi filter wilayah menampilkan alumni yang memenuhi seluruh kriteria", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await selectBandungHierarchy(page);

  await expectVisibleUsers(page, BANDUNG_USERS);
  await expect(userRow(page, "Zaki Zain")).toHaveCount(0);
});

test("TC-BB052 - reset seluruh filter wilayah mengembalikan semua data alumni", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await selectBandungHierarchy(page);
  await expectVisibleUsers(page, BANDUNG_USERS);

  await filterSelect(page, "Filter Provinsi").selectOption("");

  await expect(filterSelect(page, "Filter Kota/Kabupaten")).toHaveValue("");
  await expect(filterSelect(page, "Filter Kecamatan")).toHaveValue("");
  await expect(filterSelect(page, "Filter Desa/Kelurahan")).toHaveValue("");
  await expectVisibleUsers(page, FILTER_USERS);
});

test("TC-BB053 - filter status menampilkan alumni Aktif, Nonaktif, Menunggu Persetujuan, dan Ditolak", async ({ page }) => {
  await openUsersPage(page, "users-filter");

  for (const scenario of [
    { tab: /^Aktif \(2\)$/, names: ["Alia Andini", "Zaki Zain"] },
    { tab: /^Nonaktif \(1\)$/, names: ["Citra Cahyani"] },
    { tab: /^Menunggu Persetujuan \(1\)$/, names: ["Bima Basuki"] },
    { tab: /^Ditolak \(1\)$/, names: ["Damar Darma"] },
  ]) {
    await test.step(scenario.tab.source, async () => {
      await page.getByRole("button", { name: scenario.tab }).click();
      await expectVisibleUsers(page, scenario.names);
    });
  }
});

test("TC-BB054 - pencarian dan filter aktif menampilkan alumni yang memenuhi keduanya", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });
  await page.getByRole("button", { name: /^Aktif \(2\)$/ }).click();
  await page.getByPlaceholder("Cari nama atau email...").fill("alia.filter@example.test");

  await expectVisibleUsers(page, ["Alia Andini"]);
  await expect(userRow(page, "Zaki Zain")).toHaveCount(0);
});

test("TC-BB055 - sorting Nama ascending mengurutkan data A-Z", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await page.getByRole("button", { name: /^Nama/ }).click();

  await expect(userRows(page)).toHaveText([
    /Alia Andini/,
    /Bima Basuki/,
    /Citra Cahyani/,
    /Damar Darma/,
    /Zaki Zain/,
  ]);
});

test("TC-BB056 - sorting Nama descending mengurutkan data Z-A", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  const nameHeader = page.getByRole("button", { name: /^Nama/ });
  await nameHeader.click();
  await nameHeader.click();

  await expect(userRows(page)).toHaveText([
    /Zaki Zain/,
    /Damar Darma/,
    /Citra Cahyani/,
    /Bima Basuki/,
    /Alia Andini/,
  ]);
});

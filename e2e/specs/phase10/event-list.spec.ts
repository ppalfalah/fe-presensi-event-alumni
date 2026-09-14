import { expect, test } from "@playwright/test";
import {
  alumniEventCard,
  indonesianDateFromToday,
  openAlumniEventsPage,
} from "../../helpers/alumni-events";

const WORKSHOP = "E2E Alumni Workshop";
const SEMINAR = "E2E Alumni Seminar";

test("TC-BB178 - halaman Daftar Event menampilkan event yang tersedia", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-list");

  await expect(
    page.getByRole("heading", { name: "Daftar Event", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: SEMINAR, exact: true })).toBeVisible();
});

test("TC-BB179 - daftar event kosong menampilkan informasi belum ada event", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-empty");

  await expect(page.getByText("Belum ada event aktif saat ini", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Lihat Detail & Pendaftaran" })).toHaveCount(0);
});

test("TC-BB180 - kartu event menampilkan informasi event dan status pendaftaran", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-list");
  const card = alumniEventCard(page, WORKSHOP);

  await expect(card.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
  await expect(card.getByText("E2E Workshop", { exact: true })).toBeVisible();
  await expect(card.getByText(indonesianDateFromToday(7), { exact: false })).toBeVisible();
  await expect(card.getByText(/09:00\s*-\s*11:00 WIB/)).toBeVisible();
  await expect(card.getByText("Aula Alumni E2E", { exact: true })).toBeVisible();
  await expect(card.getByText("Sisa kuota: 10 dari 10", { exact: true })).toBeVisible();
  await expect(card.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
});

test("TC-BB181 - pencarian dengan kata kunci sesuai hanya menampilkan event terkait", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-filters");

  await page.getByPlaceholder("Cari event atau lokasi...").fill("Workshop");
  await expect(page.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: SEMINAR, exact: true })).not.toBeVisible();
});

test("TC-BB182 - pencarian tanpa hasil menampilkan informasi event tidak ditemukan", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-filters");

  await page.getByPlaceholder("Cari event atau lokasi...").fill("event-yang-tidak-tersedia");
  await expect(page.getByText("Tidak ada event yang ditemukan", { exact: true })).toBeVisible();
  await expect(page.getByText("Belum ada event aktif saat ini", { exact: true })).not.toBeVisible();
});

test("TC-BB183 - filter kategori hanya menampilkan event pada kategori terpilih", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-filters");

  await page.getByRole("button", { name: "E2E Workshop", exact: true }).click();
  await expect(page.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: SEMINAR, exact: true })).not.toBeVisible();
});

test("TC-BB184 - kategori Semua mengembalikan seluruh event dari semua kategori", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-filters");

  await page.getByRole("button", { name: "E2E Workshop", exact: true }).click();
  await expect(page.getByRole("heading", { name: SEMINAR, exact: true })).not.toBeVisible();

  await page.getByRole("button", { name: "Semua", exact: true }).click();
  await expect(page.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: SEMINAR, exact: true })).toBeVisible();
});

test("TC-BB185 - tombol detail membuka halaman detail event yang dipilih", async ({ page }) => {
  await openAlumniEventsPage(page, "alumni-events-list");
  await alumniEventCard(page, WORKSHOP)
    .getByRole("button", { name: "Lihat Detail & Pendaftaran" })
    .click();

  await expect(page).toHaveURL(/\/alumni\/main\/events\/\d+$/);
  await expect(
    page.getByRole("heading", { name: "Detail Event", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: WORKSHOP, exact: true })).toBeVisible();
});

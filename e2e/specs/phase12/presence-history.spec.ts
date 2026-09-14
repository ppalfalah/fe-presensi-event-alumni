import { expect, test } from "@playwright/test";
import { preparePhase12Fixture } from "../../helpers/dashboard-fixtures";
import {
  historyCard,
  indonesianDateFromToday,
  loginAlumniWithPhase12Fixture,
  openPresenceHistoryPage,
} from "../../helpers/presence-history";
import {
  expectAttendanceSuccess,
  openPreparedScanPage,
  VALID_SCAN_TOKEN,
} from "../../helpers/scan-presence";

test("TC-BB208 - menu profil membuka halaman Riwayat Kehadiran", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "history-empty");
  const header = page.locator("header");

  await header.getByRole("button", { name: "E", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Riwayat Kehadiran", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Riwayat Kehadiran", exact: true }).click();

  await expect(page).toHaveURL(/\/alumni\/main\/riwayat$/);
  await expect(
    page.getByRole("heading", { name: "Riwayat Kehadiran", exact: true }),
  ).toBeVisible();
});

test("TC-BB209 - alumni tanpa presensi melihat kondisi riwayat kosong", async ({ page }) => {
  await openPresenceHistoryPage(page, "history-empty");

  await expect(page.getByText("Belum Ada Riwayat Kehadiran", { exact: true })).toBeVisible();
  await expect(page.getByText("Detail Event", { exact: true })).toHaveCount(0);
});

test("TC-BB210 - riwayat menampilkan seluruh event yang pernah dihadiri", async ({ page }) => {
  await openPresenceHistoryPage(page, "history-populated");

  await expect(page.getByRole("heading", { name: "E2E History Seminar", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E History Reuni", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "2 Event", exact: true })).toBeVisible();
});

test("TC-BB211 - kartu riwayat menampilkan data kehadiran sesuai presensi", async ({ page }) => {
  await openPresenceHistoryPage(page, "history-detail");
  const card = historyCard(page, "E2E History Detail Event");
  const eventDate = indonesianDateFromToday(-7).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  await expect(card.getByRole("heading", { name: "E2E History Detail Event", exact: true })).toBeVisible();
  await expect(card.getByText(new RegExp(`${eventDate}.*09:00\\s*-\\s*11:00 WIB`))).toBeVisible();
  await expect(card.getByText("Aula Riwayat E2E", { exact: true })).toBeVisible();
  await expect(card.getByText("Hadir", { exact: true })).toBeVisible();
  const verification = card.locator("span").filter({ hasText: /^Diverifikasi:/ });
  await expect(verification).toContainText(/10[.:]15 WIB/);
});

test("TC-BB212 - presensi QR yang berhasil langsung tercatat pada riwayat", async ({ page }) => {
  await preparePhase12Fixture("history-after-scan");
  await openPreparedScanPage(page, {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });
  await expectAttendanceSuccess(page);

  await page
    .getByRole("button", { name: "Lihat Riwayat Kehadiran", exact: true })
    .click();
  await expect(page).toHaveURL(/\/alumni\/main\/riwayat$/);
  const card = historyCard(page, "E2E Newly Scanned History");
  await expect(card).toBeVisible();
  await expect(card.getByText("Hadir", { exact: true })).toBeVisible();
  await expect(card.getByText(/Diverifikasi:/)).toBeVisible();
});

test("TC-BB213 - memilih riwayat menampilkan detail event beserta waktu presensi", async ({ page }) => {
  await openPresenceHistoryPage(page, "history-detail");
  await historyCard(page, "E2E History Detail Event").click();

  await expect(page).toHaveURL(/\/alumni\/main\/events\/\d+$/);
  await expect(
    page.getByRole("heading", { name: "E2E History Detail Event", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Informasi Event", exact: true })).toBeVisible();
  await expect(page.getByText(/Diverifikasi:.*10[.:]15 WIB/)).toBeVisible();
});

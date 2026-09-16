import { expect, test } from "@playwright/test";
import {
  expectAttendanceSuccess,
  openScanPage,
  VALID_SCAN_TOKEN,
} from "../../helpers/scan-presence";

test("TC-BB194 - QR valid mencatat presensi alumni terdaftar", async ({ page }) => {
  await openScanPage(page, "scan-valid", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expectAttendanceSuccess(page);
});

test("TC-BB195 - QR dengan payload tidak valid ditolak", async ({ page }) => {
  await openScanPage(page, "scan-base", {
    permission: "granted",
    qrText: "not-a-valid-qr-token",
  });

  await expect(
    page.getByText(/QR Code (?:tidak valid|tidak dapat dikenali|tidak dikenali)/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB196 - event yang belum dimulai menolak presensi meski QR sedang valid", async ({ page }) => {
  await openScanPage(page, "scan-event-not-started", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(
    page.getByText(/belum (?:aktif|mulai|bisa melakukan presensi)|waktu presensi belum aktif/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB197 - event yang sudah berakhir menolak presensi meski QR sedang valid", async ({ page }) => {
  await openScanPage(page, "scan-event-ended", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(
    page.getByText(/event.*(?:berakhir|selesai|sudah tidak aktif)|waktu presensi.*berakhir/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB198 - alumni yang belum terdaftar ditolak saat memindai QR valid", async ({ page }) => {
  await openScanPage(page, "scan-unregistered", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(
    page.getByText(/belum terdaftar|belum mendaftar|tidak memiliki akses/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB199 - QR event yang sudah dihadiri tidak mencatat presensi ulang", async ({ page }) => {
  await openScanPage(page, "scan-already-attended", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(page.getByText(/sudah melakukan presensi/i)).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

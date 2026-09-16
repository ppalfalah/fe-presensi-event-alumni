import { expect, test } from "@playwright/test";
import {
  expectAttendanceSuccess,
  openScanPage,
  VALID_SCAN_TOKEN,
} from "../../helpers/scan-presence";

test("TC-BB201 - QR dipindai sebelum valid_from ditolak sebagai belum aktif", async ({ page }) => {
  await openScanPage(page, "scan-qr-before-valid", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(
    page.getByText(/belum (?:aktif|berlaku|dapat digunakan|bisa melakukan presensi)/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB202 - QR dalam rentang waktu berlaku memproses presensi", async ({ page }) => {
  await openScanPage(page, "scan-qr-valid-window", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expectAttendanceSuccess(page);
});

test("TC-BB203 - QR yang dipindai setelah kedaluwarsa ditolak", async ({ page }) => {
  await openScanPage(page, "scan-qr-expired", {
    permission: "granted",
    qrText: VALID_SCAN_TOKEN,
  });

  await expect(
    page.getByText(/sudah (?:tidak berlaku|kedaluwarsa|kadaluarsa)/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

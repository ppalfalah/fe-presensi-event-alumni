import { expect, test } from "@playwright/test";
import {
  expectAttendanceSuccess,
  observeNoScanRequest,
  openManualScanPage,
  submitManualCode,
  VALID_SCAN_TOKEN,
} from "../../helpers/scan-presence";

test("TC-BB204 - kode manual valid mencatat presensi alumni", async ({ page }) => {
  await openManualScanPage(page, "scan-valid");
  await submitManualCode(page, VALID_SCAN_TOKEN);

  await expectAttendanceSuccess(page);
});

test("TC-BB205 - kode manual tidak valid ditolak", async ({ page }) => {
  await openManualScanPage(page, "scan-base");
  await submitManualCode(page, "invalid-presence-code");

  await expect(
    page.getByText(/QR Code (?:tidak valid|tidak dapat dikenali|tidak dikenali)/i),
  ).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

test("TC-BB206 - kode manual kosong tidak diproses dan meminta kode presensi", async ({ page }) => {
  await openManualScanPage(page, "scan-base");
  const input = page.getByPlaceholder("Masukkan kode presensi...");
  const submit = page.getByRole("button", { name: "Kirim", exact: true });

  await input.clear();
  await expect(submit).toBeDisabled();
  await observeNoScanRequest(page);
  await expect(
    page.getByText(/(?:silakan )?masukkan kode presensi|kode presensi wajib diisi/i),
  ).toBeVisible();
});

test("TC-BB207 - kode manual event yang sudah dihadiri tidak mencatat presensi ulang", async ({ page }) => {
  await openManualScanPage(page, "scan-already-attended");
  await submitManualCode(page, VALID_SCAN_TOKEN);

  await expect(page.getByText(/sudah melakukan presensi/i)).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

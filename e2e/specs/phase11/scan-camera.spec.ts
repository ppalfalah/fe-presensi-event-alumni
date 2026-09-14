import { expect, test } from "@playwright/test";
import {
  observeNoScanRequest,
  openScanPage,
} from "../../helpers/scan-presence";

test("TC-BB192 - izin kamera diberikan mengaktifkan area pemindaian QR", async ({ page }) => {
  await openScanPage(page, "scan-base", { permission: "granted" });

  await expect(page.getByText("Kamera aktif. Arahkan ke QR Code event.")).toBeVisible();
  await expect(page.locator("#qr-reader")).toBeVisible();
  await expect(page.locator("#qr-reader video")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Matikan Kamera", exact: true }),
  ).toBeVisible();
});

test("TC-BB193 - izin kamera ditolak menampilkan kebutuhan izin dan aksi coba aktifkan", async ({ page }) => {
  await openScanPage(page, "scan-base", { permission: "denied" });

  await expect(page.getByText(/izin kamera (?:diblokir|diperlukan)/i).first()).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Coba Aktifkan Kamera", exact: true }),
  ).toBeVisible();
});

test("TC-BB200 - feed kamera tanpa QR tetap berada di area pemindaian tanpa memproses presensi", async ({ page }) => {
  await openScanPage(page, "scan-base", { permission: "granted" });

  await expect(page.getByText("Kamera aktif. Arahkan ke QR Code event.")).toBeVisible();
  await expect(page.locator("#qr-reader video")).toBeVisible();
  await observeNoScanRequest(page);
  await expect(page.locator("#qr-reader")).toBeVisible();
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).not.toBeVisible();
});

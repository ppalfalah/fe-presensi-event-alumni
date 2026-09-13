import { stat } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  ACTIVE_QR_TOKEN,
  openQrPage,
  qrPreview,
  qrTokenValue,
  selectExistingQrEvent,
} from "../../helpers/qr";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

test("TC-BB110 - tombol Unduh PNG mengunduh gambar QR Code", async ({ page }) => {
  await openQrPage(page, "qr-event-active-code");
  await selectExistingQrEvent(page, "E2E QR Active Event", ACTIVE_QR_TOKEN);

  const downloadPromise = page.waitForEvent("download");
  await qrPreview(page).getByRole("button", { name: "Unduh PNG" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe("QR-E2E QR Active Event.png");
  expect(download.suggestedFilename()).toMatch(/\.png$/i);
  const downloadedFile = await download.path();
  expect(downloadedFile).not.toBeNull();
  expect((await stat(downloadedFile as string)).size).toBeGreaterThan(0);
});

test("TC-BB111 - tombol Buka QR membuka QR Code yang sedang ditampilkan", async ({ page }) => {
  await openQrPage(page, "qr-event-active-code");
  await selectExistingQrEvent(page, "E2E QR Active Event", ACTIVE_QR_TOKEN);

  const popupPromise = page.waitForEvent("popup");
  await qrPreview(page).getByRole("button", { name: "Buka QR" }).click();
  const popup = await popupPromise;

  await expect.poll(() => popup.url()).toMatch(/^data:image\/png;base64,/);
});

test("TC-BB112 - tombol salin menyalin token QR dan menampilkan indikasi berhasil", async ({ page }) => {
  await openQrPage(page, "qr-event-active-code");
  await selectExistingQrEvent(page, "E2E QR Active Event", ACTIVE_QR_TOKEN);
  const displayedToken = (await qrTokenValue(page).textContent())?.trim();

  await qrPreview(page).getByRole("button", { name: "Salin Data QR" }).click();

  await expect(page.getByRole("status")).toContainText("Token berhasil disalin");
  expect(displayedToken).toBe(ACTIVE_QR_TOKEN);
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(displayedToken);
});

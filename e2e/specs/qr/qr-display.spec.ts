import { expect, test } from "@playwright/test";
import {
  ACTIVE_QR_TOKEN,
  OLD_QR_TOKEN,
  generateQr,
  openQrPage,
  qrControlPanel,
  qrDurationInput,
  qrPreview,
  qrTokenValue,
  selectExistingQrEvent,
  selectQrEvent,
} from "../../helpers/qr";

test("TC-BB103 - memilih event menyiapkan detail dan pratinjau QR Code", async ({ page }) => {
  await openQrPage(page, "qr-multiple-events");
  await selectQrEvent(page, "E2E QR Selection Beta");

  await expect(
    qrControlPanel(page)
      .locator("p")
      .filter({ hasText: "E2E QR Selection Beta" }),
  ).toHaveText("E2E QR Selection Beta");
  await expect(qrPreview(page).getByText("QR Belum Dibuat", { exact: true })).toBeVisible();
  await expect(qrPreview(page).getByText(/klik Buat QR Code/i)).toBeVisible();
});

test("TC-BB104 - QR Code yang dibuat tampil sebagai gambar pada pratinjau", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");
  await generateQr(page, 3);

  const image = qrPreview(page).getByRole("img", { name: "QR Code" });
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", /^data:image\/png;base64,/);
});

test("TC-BB105 - event tanpa QR menampilkan informasi QR belum tersedia", async ({ page }) => {
  await openQrPage(page, "qr-event-no-code");
  await selectQrEvent(page, "E2E QR No Code Event");

  await expect(qrPreview(page).getByText("QR Belum Dibuat", { exact: true })).toBeVisible();
  await expect(page.getByText("Event ini belum memiliki QR aktif.", { exact: true })).toBeVisible();
});

test("TC-BB106 - event dengan QR aktif menampilkan pratinjau dan informasi QR", async ({ page }) => {
  await openQrPage(page, "qr-event-active-code");
  await selectExistingQrEvent(page, "E2E QR Active Event", ACTIVE_QR_TOKEN);

  await expect(qrPreview(page).getByText("E2E QR Active Event", { exact: true })).toBeVisible();
  await expect(qrPreview(page).getByText("7 Hari", { exact: true })).toBeVisible();
  await expect(qrPreview(page).getByText("Aktif", { exact: true })).toBeVisible();
});

test("TC-BB107 - memilih event tanpa QR dari daftar menampilkan QR belum dibuat", async ({ page }) => {
  await openQrPage(page, "qr-multiple-events");
  await selectQrEvent(page, "E2E QR Selection Alpha");

  await expect(qrPreview(page).getByText("QR Belum Dibuat", { exact: true })).toBeVisible();
  await expect(page.getByText("Event ini belum memiliki QR aktif.", { exact: true })).toBeVisible();
});

test("TC-BB108 - event dengan QR aktif menampilkan peringatan pembuatan ulang", async ({ page }) => {
  await openQrPage(page, "qr-event-active-code");
  await selectExistingQrEvent(page, "E2E QR Active Event", ACTIVE_QR_TOKEN);

  await expect(
    page.getByText(
      "Event ini sudah memiliki QR aktif. Pembuatan ulang akan menonaktifkan QR sebelumnya.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("TC-BB109 - membuat ulang QR mengganti token aktif sebelumnya", async ({ page }) => {
  await openQrPage(page, "qr-regenerate");
  await selectExistingQrEvent(page, "E2E QR Regenerate Event", OLD_QR_TOKEN);
  await qrDurationInput(page).fill("4");
  await page.getByRole("button", { name: "Buat QR Code" }).click();

  await expect(qrTokenValue(page)).not.toHaveText(OLD_QR_TOKEN);
  const newToken = (await qrTokenValue(page).textContent())?.trim();
  expect(newToken).toBeTruthy();

  await page.reload();
  await selectQrEvent(page, "E2E QR Regenerate Event");
  await expect(qrPreview(page).getByRole("img", { name: "QR Code" })).toBeVisible();
  await expect(qrTokenValue(page)).toHaveText(newToken as string);
  await expect(qrPreview(page).getByText("4 Hari", { exact: true })).toBeVisible();
});

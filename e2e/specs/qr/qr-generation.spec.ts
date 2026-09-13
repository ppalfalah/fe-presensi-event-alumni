import { expect, test } from "@playwright/test";
import {
  generateQr,
  openQrPage,
  qrControlPanel,
  qrDurationInput,
  qrPreview,
  selectQrEvent,
} from "../../helpers/qr";

test("TC-BB098 - event dan masa berlaku valid berhasil membuat QR Code", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");
  await generateQr(page, 3);

  await expect(qrPreview(page).getByText("E2E QR Generate Event", { exact: true })).toBeVisible();
  await expect(qrPreview(page).getByText("Aktif", { exact: true })).toBeVisible();
});

test("TC-BB099 - masa berlaku kosong ditolak dengan pesan validasi", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");
  await qrDurationInput(page).fill("");

  await expect(qrControlPanel(page).getByRole("button", { name: "Buat QR Code" })).toBeDisabled();
  await expect(qrControlPanel(page).getByText(/(?:masa berlaku|durasi).*wajib/i)).toBeVisible();
});

test("TC-BB100 - masa berlaku 0 hari ditolak dengan pesan minimal 1 hari", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");
  await qrDurationInput(page).fill("0");

  await expect(qrControlPanel(page).getByRole("button", { name: "Buat QR Code" })).toBeDisabled();
  await expect(qrControlPanel(page).getByText(/minimal 1 hari/i)).toBeVisible();
});

test("TC-BB101 - batas 1 dan 30 hari diterima untuk membuat QR Code", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");

  await test.step("batas minimum 1 hari", async () => {
    await generateQr(page, 1);
  });

  await test.step("batas maksimum 30 hari", async () => {
    await generateQr(page, 30);
  });
});

test("TC-BB102 - masa berlaku 31 hari ditolak dengan pesan maksimal 30 hari", async ({ page }) => {
  await openQrPage(page, "qr-generate");
  await selectQrEvent(page, "E2E QR Generate Event");
  await qrDurationInput(page).fill("31");

  await expect(qrControlPanel(page).getByRole("button", { name: "Buat QR Code" })).toBeDisabled();
  await expect(qrControlPanel(page).getByText(/maksimal 30 hari/i)).toBeVisible();
});

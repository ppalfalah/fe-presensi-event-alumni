import { expect, test } from "@playwright/test";
import {
  cancelEventRegistration,
  openAlumniEventDetail,
  registerForEvent,
} from "../../helpers/alumni-events";

test("TC-BB186 - event yang belum didaftarkan menampilkan status dan aksi pendaftaran", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-unregistered",
    "E2E Registration Open",
  );

  await expect(page.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Daftar Event", exact: true }),
  ).toBeEnabled();
});

test("TC-BB187 - alumni mendaftar event melalui UI dan status berubah menjadi terdaftar", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-unregistered",
    "E2E Registration Open",
  );

  await registerForEvent(page);
  await expect(page.getByText("Terdaftar", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Batal Daftar", exact: true })).toBeVisible();
});

test("TC-BB188 - alumni membatalkan pendaftaran melalui dialog dan kembali belum terdaftar", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-registered",
    "E2E Registration Cancel",
  );
  await expect(page.getByText("Terdaftar", { exact: true })).toBeVisible();

  await cancelEventRegistration(page);
  await expect(page.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
});

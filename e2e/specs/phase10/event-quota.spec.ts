import { expect, test } from "@playwright/test";
import {
  cancelEventRegistration,
  openAlumniEventDetail,
  registerForEvent,
} from "../../helpers/alumni-events";

test("TC-BB189 - pendaftaran mengurangi sisa kuota event satu peserta", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-quota-register",
    "E2E Quota Decrease",
  );
  await expect(page.getByText("Sisa kuota: 2 dari 3", { exact: true })).toBeVisible();

  await registerForEvent(page);
  await expect(page.getByText("Sisa kuota: 1 dari 3", { exact: true })).toBeVisible();
});

test("TC-BB190 - kuota penuh mencegah alumni melakukan pendaftaran", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-quota-full",
    "E2E Quota Full Alumni",
  );

  await expect(page.getByText("Sisa kuota: 0 dari 2", { exact: true })).toBeVisible();
  await expect(page.getByText("Kuota penuh, segera hubungi penyelenggara", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Kuota Penuh", exact: true }),
  ).toBeDisabled();
  await expect(page.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
});

test("TC-BB191 - pembatalan pendaftaran mengembalikan satu sisa kuota event", async ({ page }) => {
  await openAlumniEventDetail(
    page,
    "alumni-event-quota-cancel",
    "E2E Quota Restore",
  );
  await expect(page.getByText("Sisa kuota: 1 dari 3", { exact: true })).toBeVisible();

  await cancelEventRegistration(page);
  await expect(page.getByText("Sisa kuota: 2 dari 3", { exact: true })).toBeVisible();
  await expect(page.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
});

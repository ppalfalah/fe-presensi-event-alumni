import { expect, test } from "@playwright/test";
import {
  loginPhase13Alumni,
  notificationBadge,
  notificationBell,
  notificationPopup,
} from "../../helpers/alumni-notifications";

test("TC-BB220 - badge lonceng menampilkan jumlah notifikasi belum dibaca", async ({
  page,
}) => {
  await loginPhase13Alumni(page, "notifications-unread");

  await expect(notificationBell(page)).toBeVisible();
  await expect(notificationBadge(page)).toHaveText("3");
});

test("TC-BB221 - badge jumlah tidak tampil ketika tidak ada notifikasi belum dibaca", async ({
  page,
}) => {
  await loginPhase13Alumni(page, "notifications-zero-unread");

  await expect(notificationBell(page)).toBeVisible();
  await expect(notificationBadge(page)).toHaveCount(0);
});

test("TC-BB222 - ikon lonceng membuka ringkasan notifikasi terbaru", async ({
  page,
}) => {
  await loginPhase13Alumni(page, "notifications-popup");
  await notificationBell(page).click();
  const popup = notificationPopup(page);

  await expect(popup).toBeVisible();
  await expect(popup.getByText("E2E Popup Latest One", { exact: true })).toBeVisible();
  await expect(popup.getByText("E2E Popup Latest Two", { exact: true })).toBeVisible();
  await expect(popup.getByText("E2E Popup Latest Three", { exact: true })).toBeVisible();
  await expect(popup.getByText("E2E Popup Old Notification", { exact: true })).toHaveCount(0);
});

test("TC-BB231 - Lihat semua pada popup membuka halaman Notifikasi", async ({
  page,
}) => {
  await loginPhase13Alumni(page, "notifications-popup");
  await notificationBell(page).click();
  await page.getByRole("button", { name: "Lihat semua", exact: true }).click();

  await expect(page).toHaveURL(/\/alumni\/main\/notifikasi$/);
  await expect(
    page.getByRole("heading", { name: "Notifikasi", exact: true }),
  ).toBeVisible();
});

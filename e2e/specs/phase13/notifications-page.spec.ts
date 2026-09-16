import { expect, test } from "@playwright/test";
import {
  chooseNotificationFilter,
  notificationBadge,
  notificationCard,
  notificationSummary,
  openNotificationsPage,
} from "../../helpers/alumni-notifications";
import { preparePhase13Fixture } from "../../helpers/dashboard-fixtures";

test("TC-BB223 - daftar notifikasi menampilkan informasi event baru", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-event");
  const card = notificationCard(page, "E2E Event Notification Baru");

  await expect(card).toContainText("E2E Phase 13 Event Baru");
  await expect(card).toContainText("Event baru E2E Phase 13 tersedia untuk alumni.");
  await expect(card).toContainText("Aula E2E Phase 13");
  await expect(card).toContainText("Silaturahmi");
  await expect(card).toContainText(/09:00 WIB\s*-\s*11:00 WIB/);
});

test("TC-BB224 - notifikasi belum dibaca menampilkan status Belum dibaca", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-event");
  const card = notificationCard(page, "E2E Event Notification Baru");

  await expect(card.getByText("Belum dibaca", { exact: true })).toBeVisible();
});

test("TC-BB225 - menandai satu notifikasi memperbarui status dan badge belum dibaca", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-mixed");
  const target = notificationCard(page, "E2E Unread Notification A");
  const remaining = notificationCard(page, "E2E Unread Notification B");

  await expect(notificationBadge(page)).toHaveText("2");
  await target.getByRole("button", { name: "Tandai sudah dibaca", exact: true }).click();

  await expect(target.getByText("Sudah dibaca", { exact: true })).toBeVisible();
  await expect(remaining.getByText("Belum dibaca", { exact: true })).toBeVisible();
  await expect(notificationBadge(page)).toHaveText("1");
});

test("TC-BB226 - Tandai semua mengubah seluruh notifikasi menjadi sudah dibaca", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-all-unread");
  await page.getByRole("button", { name: /^Tandai semua(?: sudah dibaca)?$/ }).click();

  await expect(notificationCard(page, "E2E Event Notification Unread").getByText("Sudah dibaca", { exact: true })).toBeVisible();
  await expect(notificationCard(page, "E2E Unread Notification 2").getByText("Sudah dibaca", { exact: true })).toBeVisible();
  await expect(notificationBadge(page)).toHaveCount(0);
  await expect(notificationSummary(page, "Belum dibaca")).toContainText("0");
  await expect(notificationSummary(page, "Sudah dibaca")).toContainText("2");
});

test("TC-BB227 - filter Belum Dibaca hanya menampilkan notifikasi belum dibaca", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-mixed");
  await chooseNotificationFilter(page, "Belum Dibaca");

  await expect(notificationCard(page, "E2E Unread Notification A")).toBeVisible();
  await expect(notificationCard(page, "E2E Unread Notification B")).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Read Notification A", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "E2E Read Notification B", exact: true })).toHaveCount(0);
});

test("TC-BB228 - filter Sudah Dibaca hanya menampilkan notifikasi sudah dibaca", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-mixed");
  await chooseNotificationFilter(page, "Sudah Dibaca");

  await expect(notificationCard(page, "E2E Read Notification A")).toBeVisible();
  await expect(notificationCard(page, "E2E Read Notification B")).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Unread Notification A", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "E2E Unread Notification B", exact: true })).toHaveCount(0);
});

test("TC-BB229 - filter Semua mengembalikan seluruh notifikasi", async ({ page }) => {
  await openNotificationsPage(page, "notifications-mixed");
  await chooseNotificationFilter(page, "Belum Dibaca");
  await expect(page.getByRole("heading", { name: "E2E Read Notification A", exact: true })).toHaveCount(0);

  await chooseNotificationFilter(page, "Semua");
  for (const title of [
    "E2E Unread Notification A",
    "E2E Unread Notification B",
    "E2E Read Notification A",
    "E2E Read Notification B",
  ]) {
    await expect(notificationCard(page, title)).toBeVisible();
  }
});

test("TC-BB230 - ringkasan dibaca dan belum dibaca diperbarui setelah perubahan status", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-summary");
  await expect(notificationSummary(page, "Belum dibaca")).toContainText("2");
  await expect(notificationSummary(page, "Sudah dibaca")).toContainText("1");

  await notificationCard(page, "E2E Summary Unread A")
    .getByRole("button", { name: "Tandai sudah dibaca", exact: true })
    .click();

  await expect(notificationSummary(page, "Belum dibaca")).toContainText("1");
  await expect(notificationSummary(page, "Sudah dibaca")).toContainText("2");
});

test("TC-BB232 - tombol refresh mengambil notifikasi baru dari backend", async ({ page }) => {
  await openNotificationsPage(page, "notifications-refresh");
  await expect(notificationCard(page, "E2E Initial Notification")).toBeVisible();
  await expect(page.getByRole("heading", { name: "E2E Refresh Notification", exact: true })).toHaveCount(0);

  await preparePhase13Fixture("notifications-refresh-add");
  await expect(page.getByRole("heading", { name: "E2E Refresh Notification", exact: true })).toHaveCount(0);

  const refreshResponse = page.waitForResponse(
    (response) =>
      response.request().method() === "GET" &&
      new URL(response.url()).pathname.endsWith("/alumni/notifications"),
  );
  await page.getByRole("button", { name: "Muat ulang notifikasi", exact: true }).click();
  await refreshResponse;

  await expect(notificationCard(page, "E2E Refresh Notification")).toBeVisible();
  await expect(notificationSummary(page, "Belum dibaca")).toContainText("2");
});

test("TC-BB233 - halaman menampilkan empty state ketika tidak ada notifikasi", async ({
  page,
}) => {
  await openNotificationsPage(page, "notifications-empty");

  await expect(page.getByRole("heading", { name: "Belum ada notifikasi", exact: true })).toBeVisible();
  await expect(page.getByText("Informasi akun dan event alumni akan muncul di sini.", { exact: true })).toBeVisible();
  await expect(page.locator("article")).toHaveCount(0);
});

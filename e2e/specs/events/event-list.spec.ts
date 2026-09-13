import { expect, test } from "@playwright/test";
import { eventCard, openEventsPage } from "../../helpers/events";

test("TC-BB066 - daftar event ditampilkan ketika data tersedia", async ({ page }) => {
  await openEventsPage(page, "events-list");

  await expect(eventCard(page, "E2E Event Alpha")).toBeVisible();
  await expect(eventCard(page, "E2E Event Beta")).toBeVisible();
});

test("TC-BB067 - pesan data event tidak tersedia ditampilkan ketika database kosong", async ({ page }) => {
  await openEventsPage(page, "events-empty");

  await expect(page.getByText("Tidak ada event ditemukan")).toBeVisible();
});

test("TC-BB080 - memilih event menampilkan detail event", async ({ page }) => {
  await openEventsPage(page, "events-list");
  await eventCard(page, "E2E Event Alpha").click();

  const modal = page.getByRole("heading", { name: "Detail Event" }).locator("..").locator("..").locator("..");
  await expect(modal.getByRole("heading", { name: "E2E Event Alpha", exact: true })).toBeVisible();
  await expect(modal.getByText("Aula E2E", { exact: true })).toBeVisible();
  await expect(modal.getByText("Deskripsi E2E Event Alpha", { exact: true })).toBeVisible();
});

test("TC-BB081 - pencarian event menampilkan event sesuai kata kunci", async ({ page }) => {
  await openEventsPage(page, "events-list");
  await page.getByPlaceholder("Cari event...").fill("Alpha");

  await expect(eventCard(page, "E2E Event Alpha")).toBeVisible();
  await expect(eventCard(page, "E2E Event Beta")).toHaveCount(0);
});

test("TC-BB082 - pencarian event yang tidak tersedia menampilkan data tidak ditemukan", async ({ page }) => {
  await openEventsPage(page, "events-list");
  await page.getByPlaceholder("Cari event...").fill("Event Tidak Tersedia");

  await expect(page.getByText("Tidak ada event ditemukan")).toBeVisible();
});

test("TC-BB083 - filter status menampilkan event Mendatang, Selesai, dan Tidak Dipublikasikan", async ({ page }) => {
  await openEventsPage(page, "events-status");

  await test.step("Mendatang", async () => {
    await page.getByRole("button", { name: /^Mendatang \(1\)$/ }).click();
    await expect(eventCard(page, "E2E Status Upcoming")).toBeVisible();
    await expect(eventCard(page, "E2E Status Finished")).toHaveCount(0);
  });

  await test.step("Selesai", async () => {
    await page.getByRole("button", { name: /^Selesai \(1\)$/ }).click();
    await expect(eventCard(page, "E2E Status Finished")).toBeVisible();
    await expect(eventCard(page, "E2E Status Upcoming")).toHaveCount(0);
  });

  await test.step("Tidak Dipublikasikan", async () => {
    await page.getByRole("button", { name: /^Tidak Dipublikasikan \(1\)$/ }).click();
    await expect(eventCard(page, "E2E Status Unpublished")).toBeVisible();
    await expect(eventCard(page, "E2E Status Finished")).toHaveCount(0);
  });
});

test("TC-BB084 - aksi Pendaftar menampilkan daftar pendaftar event", async ({ page }) => {
  await openEventsPage(page, "events-registrations");
  await eventCard(page, "E2E Registered Event").getByRole("button", { name: "Pendaftar" }).click();

  await expect(page.getByRole("heading", { name: "Detail Pendaftar Event" })).toBeVisible();
  await expect(page.getByText("E2E Alumni", { exact: true })).toBeVisible();
  await expect(page.getByText("Registered Alumni Dua", { exact: true })).toBeVisible();
  await expect(page.getByText("Total Terdaftar").locator("..").getByText("2", { exact: true })).toBeVisible();
});

test("TC-BB085 - aksi WA membuka fitur pengiriman WhatsApp event", async ({ page }) => {
  await openEventsPage(page, "events-list");
  await eventCard(page, "E2E Event Alpha").getByRole("button", { name: "WA", exact: true }).click();

  const modal = page.getByRole("heading", { name: "Pesan Massal WA" }).locator("..").locator("..").locator("..");
  await expect(modal.getByText("E2E Event Alpha", { exact: true })).toBeVisible();
  await modal.getByRole("button", { name: "Buka Pesan Manual" }).click();
  await expect(page).toHaveURL(/\/admin\/broadcast$/);
});

test("TC-BB086 - membatalkan publikasi memindahkan event ke Tidak Dipublikasikan", async ({ page }) => {
  await openEventsPage(page, "events-list");
  await eventCard(page, "E2E Event Alpha").getByRole("button", { name: "Batalkan Publikasi" }).click();
  const confirmation = page.getByRole("heading", { name: "Batalkan publikasi event?" }).locator("..");
  await confirmation.getByRole("button", { name: "Batalkan Publikasi" }).click();

  await expect(page.getByRole("status")).toContainText("Publikasi event berhasil dibatalkan");
  await page.getByRole("button", { name: /^Tidak Dipublikasikan \(1\)$/ }).click();
  await expect(eventCard(page, "E2E Event Alpha")).toBeVisible();
});

test("TC-BB087 - pagination event tidak dapat melewati halaman pertama", async ({ page }) => {
  await openEventsPage(page, "events-pagination");

  await expect(page.getByText("Menampilkan 1-3 dari 4 event")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Berikutnya" })).toBeEnabled();
});

test("TC-BB088 - pagination event tidak dapat melewati halaman terakhir", async ({ page }) => {
  await openEventsPage(page, "events-pagination");
  const next = page.getByRole("button", { name: "Berikutnya" });
  await next.click();

  await expect(page.getByText("Menampilkan 4-4 dari 4 event")).toBeVisible();
  await expect(next).toBeDisabled();
  await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeEnabled();
});

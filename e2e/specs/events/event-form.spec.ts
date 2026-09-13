import { expect, test } from "@playwright/test";
import {
  eventCard,
  eventFormField,
  fillValidEventForm,
  localDate,
  openEventsPage,
  waitForEventFormData,
} from "../../helpers/events";

async function openCreateModal(page: import("@playwright/test").Page) {
  await waitForEventFormData(page);
  await page.getByRole("button", { name: "Buat Event Baru" }).click();
  await expect(page.getByRole("heading", { name: "Buat Event Baru" })).toBeVisible();
}

test("TC-BB068 - tambah event dengan data valid menyimpan dan menampilkan event", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E Valid Created Event" });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Event berhasil ditambahkan!");
  await expect(eventCard(page, "E2E Valid Created Event")).toBeVisible();
});

test("TC-BB069 - tambah event dengan field wajib kosong ditolak oleh validasi", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "" });
  const title = eventFormField(page, "Judul Event");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(title).toBeFocused();
  expect(await title.evaluate((element: HTMLInputElement) => element.validationMessage)).not.toBe("");
  await expect(page.getByRole("heading", { name: "Buat Event Baru" })).toBeVisible();
  await expect(eventCard(page, "E2E Created Event")).toHaveCount(0);
});

test("TC-BB070 - tambah event dengan input waktu tidak valid ditolak", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E Invalid Time Format", startTime: "" });
  const startTime = eventFormField(page, "Jam Mulai");
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(startTime).toBeFocused();
  expect(await startTime.evaluate((element: HTMLInputElement) => element.validationMessage)).not.toBe("");
  await expect(page.getByRole("heading", { name: "Buat Event Baru" })).toBeVisible();
  await expect(eventCard(page, "E2E Invalid Time Format")).toHaveCount(0);
});

test("TC-BB071 - waktu selesai sebelum waktu mulai ditolak", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E End Before Start", startTime: "11:00", endTime: "10:59" });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByText("Jam selesai harus lebih besar dari jam mulai.")).toBeVisible();
  await expect(eventCard(page, "E2E End Before Start")).toHaveCount(0);
});

test("TC-BB072 - waktu selesai sama dengan waktu mulai ditolak", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E Equal Times", startTime: "10:00", endTime: "10:00" });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByText("Jam selesai harus lebih besar dari jam mulai.")).toBeVisible();
  await expect(eventCard(page, "E2E Equal Times")).toHaveCount(0);
});

test("TC-BB073 - waktu selesai setelah waktu mulai diterima", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E Valid Time Boundary", startTime: "10:00", endTime: "10:01" });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Event berhasil ditambahkan!");
  await expect(eventCard(page, "E2E Valid Time Boundary")).toBeVisible();
});

test("TC-BB074 - tanggal event yang sudah lewat ditolak", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, { title: "E2E Past Date", date: localDate(-1) });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByText("Tanggal event tidak boleh lebih awal dari hari ini.")).toBeVisible();
  await expect(eventCard(page, "E2E Past Date")).toHaveCount(0);
});

test("TC-BB075 - tanggal event hari ini diterima", async ({ page }) => {
  await openEventsPage(page, "events-form");
  await openCreateModal(page);
  await fillValidEventForm(page, {
    title: "E2E Event Today",
    date: localDate(),
    startTime: "00:00",
    endTime: "23:59",
  });
  await page.getByRole("button", { name: "Simpan", exact: true }).click();

  await expect(page.getByRole("status")).toContainText("Event berhasil ditambahkan!");
  const now = new Date();
  if (now.getHours() === 23 && now.getMinutes() >= 59) {
    await page.getByRole("button", { name: /^Selesai \(1\)$/ }).click();
  }
  await expect(eventCard(page, "E2E Event Today")).toBeVisible();
});

test("TC-BB076 - edit event dengan input valid menyimpan data terbaru", async ({ page }) => {
  await openEventsPage(page, "events-edit");
  await eventCard(page, "E2E Editable Event").getByRole("button", { name: "Ubah" }).click();
  await expect(page.getByRole("heading", { name: "Ubah Event" })).toBeVisible();
  await eventFormField(page, "Judul Event").fill("E2E Updated Event");
  await page.getByRole("button", { name: "Perbarui" }).click();

  await expect(page.getByRole("status")).toContainText("Event berhasil diperbarui!");
  await expect(eventCard(page, "E2E Updated Event")).toBeVisible();
  await expect(eventCard(page, "E2E Editable Event")).toHaveCount(0);
});

test("TC-BB077 - edit event dengan input tidak valid ditolak", async ({ page }) => {
  await openEventsPage(page, "events-edit");
  await eventCard(page, "E2E Editable Event").getByRole("button", { name: "Ubah" }).click();
  const title = eventFormField(page, "Judul Event");
  await title.fill("");
  await page.getByRole("button", { name: "Perbarui" }).click();

  await expect(title).toBeFocused();
  expect(await title.evaluate((element: HTMLInputElement) => element.validationMessage)).not.toBe("");
  await expect(page.getByRole("heading", { name: "Ubah Event" })).toBeVisible();
  await expect(page.getByText("E2E Editable Event", { exact: true })).toBeVisible();
  await expect(eventCard(page, "E2E Updated Event")).toHaveCount(0);
});

test("TC-BB078 - admin dapat menghapus event setelah konfirmasi", async ({ page }) => {
  await openEventsPage(page, "events-edit");
  const deleteAction = eventCard(page, "E2E Editable Event").getByRole("button", { name: /Hapus/i });

  await expect(deleteAction, "Aksi hapus event harus tersedia melalui UI").toBeVisible();
  await deleteAction.click();
  await page.getByRole("button", { name: "Hapus", exact: true }).click();
  await expect(eventCard(page, "E2E Editable Event")).toHaveCount(0);
});

test("TC-BB079 - pembatalan konfirmasi hapus mempertahankan event", async ({ page }) => {
  await openEventsPage(page, "events-edit");
  const deleteAction = eventCard(page, "E2E Editable Event").getByRole("button", { name: /Hapus/i });

  await expect(deleteAction, "Aksi hapus event harus tersedia melalui UI").toBeVisible();
  await deleteAction.click();
  await page.getByRole("button", { name: "Batal", exact: true }).click();
  await expect(eventCard(page, "E2E Editable Event")).toBeVisible();
});

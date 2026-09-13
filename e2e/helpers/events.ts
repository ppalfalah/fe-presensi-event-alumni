import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, loginAsAlumniThroughUI, openAdminLogin, openAlumniLogin, type LoginCredentials } from "./auth";
import { prepareEventFixture, type EventFixtureState } from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export function localDate(dayOffset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function openEventsPage(page: Page, state: EventFixtureState) {
  await prepareEventFixture(state);
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/events");
  await expect(page.getByRole("heading", { name: "Manajemen Event" })).toBeVisible();
}

export async function waitForEventFormData(page: Page) {
  const categorySection = page.getByRole("button", { name: /Kelola Kategori Event/ });

  await expect(categorySection.getByText(/^\d+ kategori$/)).toBeVisible();
  await expect(page.getByText("Tidak ada event ditemukan")).toBeVisible();
}

export function eventCard(page: Page, title: string): Locator {
  return page.getByRole("button", { name: `Lihat detail ${title}`, exact: true });
}

export function eventFormField(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("..").locator("input, textarea, select");
}

export async function fillValidEventForm(
  page: Page,
  overrides: Partial<{
    title: string;
    description: string;
    location: string;
    date: string;
    startTime: string;
    endTime: string;
    quota: string;
  }> = {},
) {
  const values = {
    title: "E2E Created Event",
    description: "Deskripsi event hasil pengujian E2E",
    location: "Aula Pengujian E2E",
    date: localDate(3),
    startTime: "09:00",
    endTime: "11:00",
    quota: "20",
    ...overrides,
  };

  await eventFormField(page, "Judul Event").fill(values.title);
  await eventFormField(page, "Deskripsi").fill(values.description);
  await eventFormField(page, "Lokasi").fill(values.location);
  await eventFormField(page, "Tanggal Event").fill(values.date);
  await eventFormField(page, "Jam Mulai").fill(values.startTime);
  await eventFormField(page, "Jam Selesai").fill(values.endTime);
  await eventFormField(page, "Kuota Peserta").fill(values.quota);
}

export async function openAlumniEvent(
  page: Page,
  title: string,
  credentials: LoginCredentials = getE2ECredentials().alumni,
) {
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, credentials);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await page.goto("/alumni/main/events");
  await expect(page.getByRole("heading", { name: "Daftar Event" })).toBeVisible();

  const heading = page.getByRole("heading", { name: title, exact: true });
  const card = heading.locator("..").locator("..");
  await expect(heading).toBeVisible();
  await card.getByRole("button", { name: "Lihat Detail & Pendaftaran" }).click();
  await expect(page.getByRole("heading", { name: "Detail Event" })).toBeVisible();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

export async function expandCategories(page: Page) {
  const toggle = page.getByRole("button", { name: /Kelola Kategori Event/ });
  if ((await toggle.getAttribute("aria-expanded")) !== "true") {
    await toggle.click();
  }
  await expect(page.locator("#event-category-management")).toBeVisible();
}

export function categoryRow(page: Page, name: string): Locator {
  return page.getByRole("row").filter({ hasText: name });
}

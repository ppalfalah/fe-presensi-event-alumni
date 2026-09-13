import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "./auth";
import { prepareEventFixture, type EventFixtureState } from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export const ACTIVE_QR_TOKEN = "00000000-0000-4000-8000-000000000106";
export const OLD_QR_TOKEN = "00000000-0000-4000-8000-000000000109";

export async function openQrPage(page: Page, state: EventFixtureState) {
  await prepareEventFixture(state);
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/qr-code");
  await expect(page.getByRole("heading", { name: "Buat QR Code" })).toBeVisible();
  await expect(qrEventSelect(page)).toBeEnabled();
}

export function qrControlPanel(page: Page): Locator {
  return page.getByRole("heading", { name: "Atur QR Code" }).locator("..").locator("..");
}

export function qrPreview(page: Page): Locator {
  return page.getByRole("heading", { name: "Pratinjau QR Code" }).locator("..").locator("..").locator("..");
}

export function qrEventSelect(page: Page): Locator {
  return qrControlPanel(page).getByText("Event", { exact: true }).locator("..").locator("select");
}

export function qrDurationInput(page: Page): Locator {
  return qrControlPanel(page)
    .getByText("Masa Berlaku QR Code", { exact: true })
    .locator("..")
    .locator('input[type="number"]');
}

export function qrTokenValue(page: Page): Locator {
  return qrPreview(page).getByText("Token", { exact: true }).locator("..").locator("span.font-mono");
}

export async function selectQrEvent(page: Page, eventTitle: string) {
  const select = qrEventSelect(page);

  await expect(select.getByRole("option", { name: eventTitle })).toBeAttached();
  await select.selectOption({ label: eventTitle });
  await expect(select).not.toHaveValue("");
  await expect(qrControlPanel(page).getByText(eventTitle, { exact: true })).toBeVisible();
}

export async function generateQr(page: Page, durationDays: number) {
  await qrDurationInput(page).fill(String(durationDays));
  await qrControlPanel(page).getByRole("button", { name: "Buat QR Code" }).click();
  await expect(qrPreview(page).getByRole("img", { name: "QR Code" })).toBeVisible();
  await expect(qrPreview(page).getByText(`${durationDays} Hari`, { exact: true })).toBeVisible();
}

export async function selectExistingQrEvent(
  page: Page,
  eventTitle: string,
  expectedToken: string,
) {
  await selectQrEvent(page, eventTitle);
  await expect(qrPreview(page).getByRole("img", { name: "QR Code" })).toBeVisible();
  await expect(qrTokenValue(page)).toHaveText(expectedToken);
}

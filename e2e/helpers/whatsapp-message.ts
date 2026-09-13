import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "./auth";
import { preparePhase9Fixture } from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export const BROADCAST_EVENT_TITLE = "E2E WhatsApp Gathering";

export async function openWhatsAppMessagePage(page: Page) {
  await preparePhase9Fixture("broadcast-event");
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/broadcast");
  await expect(
    page.getByRole("heading", { name: "Buat Pesan untuk Event" }),
  ).toBeVisible();
  await expect(
    broadcastEventSelect(page).getByRole("option", {
      name: BROADCAST_EVENT_TITLE,
    }),
  ).toBeAttached();
}

export function broadcastPanel(page: Page): Locator {
  return page
    .getByRole("heading", { name: "Buat Pesan untuk Event" })
    .locator("..")
    .locator("..");
}

export function broadcastEventSelect(page: Page): Locator {
  return broadcastPanel(page).getByRole("combobox");
}

export function broadcastMessage(page: Page): Locator {
  return broadcastPanel(page).getByRole("textbox");
}

export function broadcastCounter(page: Page, count: number): Locator {
  return broadcastPanel(page).getByText(`${count}/1000`, { exact: true });
}

export function copyMessageButton(page: Page): Locator {
  return broadcastPanel(page).getByRole("button", { name: /Salin Pesan/ });
}

export function continueToWhatsAppButton(page: Page): Locator {
  return broadcastPanel(page).getByRole("button", {
    name: "Lanjutkan ke WhatsApp",
  });
}

export async function selectBroadcastEvent(page: Page) {
  const select = broadcastEventSelect(page);
  await select.selectOption({ label: BROADCAST_EVENT_TITLE });
  await expect(select.locator("option:checked")).toHaveText(
    BROADCAST_EVENT_TITLE,
  );
  await expect(broadcastMessage(page)).toBeEnabled();
  await expect(broadcastMessage(page)).toHaveValue(
    new RegExp(BROADCAST_EVENT_TITLE),
  );
}

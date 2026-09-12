import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "./auth";
import { prepareUserFixture, type UserFixtureState } from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export const FILTER_USERS = [
  "Alia Andini",
  "Bima Basuki",
  "Citra Cahyani",
  "Damar Darma",
  "Zaki Zain",
] as const;

export async function openUsersPage(page: Page, state: UserFixtureState) {
  await prepareUserFixture(state);
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Manajemen Alumni" })).toBeVisible();
}

export function usersTable(page: Page): Locator {
  return page.getByRole("table");
}

export function userRows(page: Page): Locator {
  return usersTable(page).locator("tbody tr");
}

export function userRow(page: Page, name: string): Locator {
  return userRows(page).filter({ hasText: name });
}

export function filterSelect(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("..").getByRole("combobox");
}

export function editField(page: Page, label: string): Locator {
  return page.getByText(label, { exact: true }).locator("..").locator("input, select, textarea");
}

export async function selectBandungHierarchy(page: Page) {
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });
  await filterSelect(page, "Filter Kota/Kabupaten").selectOption({ label: "Kota Bandung" });
  await filterSelect(page, "Filter Kecamatan").selectOption({ label: "Sukasari" });
  await filterSelect(page, "Filter Desa/Kelurahan").selectOption({ label: "Isola" });
}

export async function expectVisibleUsers(page: Page, names: readonly string[]) {
  await expect(userRows(page)).toHaveCount(names.length);
  for (const name of names) {
    await expect(userRow(page, name)).toBeVisible();
  }
}

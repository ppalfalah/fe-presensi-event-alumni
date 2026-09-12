import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { filterSelect, openUsersPage, userRow } from "../../helpers/users";

async function readDownload(downloadPath: string | null): Promise<string> {
  expect(downloadPath, "Playwright download path should be available").not.toBeNull();
  return readFile(downloadPath as string, "utf8");
}

test("TC-BB061 - ekspor Excel dan workflow PDF menghasilkan data alumni", async ({ page, context }) => {
  await context.addInitScript(() => {
    window.print = () => {
      document.documentElement.dataset.e2ePrintInvoked = "true";
    };
  });
  await openUsersPage(page, "users-filter");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Excel" }).click(),
  ]);
  const excel = await readDownload(await download.path());
  expect(excel).toContain("Data Pengguna Alumni");
  expect(excel).toContain("Alia Andini");
  expect(excel).toContain("Zaki Zain");

  const popupPromise = page.waitForEvent("popup");
  await page.getByRole("button", { name: "PDF" }).click();
  const popup = await popupPromise;
  await expect(popup).toHaveTitle("Data Pengguna Alumni");
  await expect(popup.getByText("Alia Andini")).toBeVisible();
  await expect(popup.getByText("Zaki Zain")).toBeVisible();
  await expect.poll(() => popup.evaluate(() => document.documentElement.dataset.e2ePrintInvoked)).toBe("true");
});

test("TC-BB062 - ekspor dengan filter dan pencarian hanya berisi hasil yang sesuai", async ({ page }) => {
  await openUsersPage(page, "users-filter");
  await filterSelect(page, "Filter Provinsi").selectOption({ label: "Jawa Barat" });
  await page.getByRole("button", { name: /^Aktif \(2\)$/ }).click();
  await page.getByPlaceholder("Cari nama atau email...").fill("alia.filter@example.test");
  await expect(userRow(page, "Alia Andini")).toBeVisible();

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Excel" }).click(),
  ]);
  const excel = await readDownload(await download.path());

  expect(excel).toContain("Alia Andini");
  expect(excel).toContain("alia.filter@example.test");
  expect(excel).not.toContain("Bima Basuki");
  expect(excel).not.toContain("Zaki Zain");
});

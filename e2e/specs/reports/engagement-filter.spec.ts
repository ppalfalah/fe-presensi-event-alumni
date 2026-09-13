import { expect, test, type Page } from "@playwright/test";
import {
  engagementRow,
  openEngagementPage,
} from "../../helpers/reports";

function segmentSelect(page: Page) {
  return page.getByRole("combobox").filter({
    has: page.locator('option[value="Al-Mutawasithun"]'),
  });
}

test("TC-BB135 - filter tahun kelulusan hanya menampilkan alumni pada tahun terpilih", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await page.getByPlaceholder("Tahun Kelulusan", { exact: true }).fill("2021");
  await expect(engagementRow(page, "Citra Menengah")).toBeVisible();
  await expect(engagementRow(page, "Alya Pemula")).toHaveCount(0);
  await expect(engagementRow(page, "Damar Aktif")).toHaveCount(0);
});

test("TC-BB136 - filter segment hanya menampilkan alumni pada segment terpilih", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await segmentSelect(page).selectOption("Al-Mutawasithun");
  await expect(engagementRow(page, "Citra Menengah")).toBeVisible();
  await expect(engagementRow(page, "Alya Pemula")).toHaveCount(0);
  await expect(engagementRow(page, "Damar Aktif")).toHaveCount(0);
});

test("TC-BB137 - kombinasi nama, tahun, dan segment menerapkan seluruh filter", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await page
    .getByPlaceholder("Cari nama, email, atau tahun kelulusan...")
    .fill("Damar");
  await page.getByPlaceholder("Tahun Kelulusan", { exact: true }).fill("2020");
  await segmentSelect(page).selectOption("Al-Muqorrobun");

  const row = engagementRow(page, "Damar Aktif");
  await expect(row).toBeVisible();
  await expect(row).toContainText("2020");
  await expect(row).toContainText("Al-Muqorrobun");
  await expect(engagementRow(page, "Bima Pemula")).toHaveCount(0);
  await expect(page.getByText("Menampilkan 1-1 dari 1 alumni")).toBeVisible();
});

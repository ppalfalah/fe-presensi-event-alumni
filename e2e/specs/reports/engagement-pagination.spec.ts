import { expect, test } from "@playwright/test";
import { engagementTable, openEngagementPage } from "../../helpers/reports";

test("TC-BB146 - engagement membagi data yang melebihi batas ke beberapa halaman", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-pagination");

  const rows = engagementTable(page).locator("tbody tr");
  await expect(page.getByText("Menampilkan 1-10 dari 11 alumni")).toBeVisible();
  await expect(rows).toHaveCount(10);
  await expect(page.getByText("Page Alumni 01", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Menampilkan 11-11 dari 11 alumni")).toBeVisible();
  await expect(rows).toHaveCount(1);
  await expect(page.getByText("Page Alumni 11", { exact: true })).toBeVisible();
});

test("TC-BB147 - pagination engagement tidak melewati halaman pertama dan terakhir", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-pagination");

  const previous = page.getByRole("button", { name: "Sebelumnya" });
  const next = page.getByRole("button", { name: "Berikutnya" });

  await test.step("halaman pertama tidak dapat mundur", async () => {
    await expect(page.getByRole("button", { name: "1", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(previous).toBeDisabled();
    await expect(next).toBeEnabled();
  });

  await test.step("halaman terakhir tidak dapat maju", async () => {
    await next.click();
    await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(previous).toBeEnabled();
    await expect(next).toBeDisabled();
  });
});


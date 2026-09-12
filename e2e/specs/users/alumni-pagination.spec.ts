import { expect, test } from "@playwright/test";
import { openUsersPage, userRows } from "../../helpers/users";

test("TC-BB063 - tepat 10 alumni ditampilkan pada satu halaman dengan batas 10", async ({ page }) => {
  await openUsersPage(page, "users-pagination-10");

  await expect(userRows(page)).toHaveCount(10);
  await expect(page.getByText("Menampilkan 1-10 dari 10 pengguna")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
});

test("TC-BB064 - sebelas alumni dipaginasi menjadi 10 data dan 1 data", async ({ page }) => {
  await openUsersPage(page, "users-pagination-11");

  await expect(userRows(page)).toHaveCount(10);
  await expect(page.getByText("Menampilkan 1-10 dari 11 pengguna")).toBeVisible();
  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(userRows(page)).toHaveCount(1);
  await expect(page.getByText("Menampilkan 11-11 dari 11 pengguna")).toBeVisible();
});

test("TC-BB065 - navigasi pagination tidak dapat melewati halaman pertama dan terakhir", async ({ page }) => {
  await openUsersPage(page, "users-pagination-11");
  const previous = page.getByRole("button", { name: "Sebelumnya" });
  const next = page.getByRole("button", { name: "Berikutnya" });

  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.getByRole("button", { name: "2", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  await expect(userRows(page)).toHaveCount(1);
});

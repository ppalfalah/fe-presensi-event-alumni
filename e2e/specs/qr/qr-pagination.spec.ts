import { expect, test } from "@playwright/test";
import { openQrPage } from "../../helpers/qr";

test("TC-BB113 - pagination QR tidak dapat melewati halaman pertama", async ({ page }) => {
  await openQrPage(page, "qr-pagination");
  const previous = page.getByRole("button", { name: "Sebelumnya" });

  await expect(previous, "Kontrol pagination Sebelumnya belum tersedia pada halaman QR").toBeVisible();
  await expect(previous).toBeDisabled();
});

test("TC-BB114 - pagination QR tidak dapat melewati halaman terakhir", async ({ page }) => {
  await openQrPage(page, "qr-pagination");
  const next = page.getByRole("button", { name: "Berikutnya" });

  await expect(next, "Kontrol pagination Berikutnya belum tersedia pada halaman QR").toBeVisible();
  await next.click();
  await expect(next).toBeDisabled();
});

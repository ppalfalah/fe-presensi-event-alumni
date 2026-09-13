import { expect, test } from "@playwright/test";
import { prepareEventFixture } from "../../helpers/dashboard-fixtures";
import { openAlumniEvent } from "../../helpers/events";
import { getE2ECredentials } from "../../helpers/environment";

test("TC-BB095 - satu slot tersisa masih menerima pendaftar hingga kuota maksimum", async ({ page }) => {
  await prepareEventFixture("quota-one-remaining");
  await openAlumniEvent(page, "E2E Quota One Remaining");

  await expect(page.getByText("Sisa kuota: 1 dari 2")).toBeVisible();
  await page.getByRole("button", { name: "Daftar Event" }).click();

  await expect(page.getByRole("status")).toContainText("Berhasil mendaftar event!");
  await expect(page.getByRole("button", { name: "Sudah Terdaftar" })).toBeDisabled();
  await expect(page.getByText("Sisa kuota: 0 dari 2")).toBeVisible();
});

test("TC-BB096 - kuota maksimum ditandai penuh dan pendaftaran tambahan tidak tersedia", async ({ page }) => {
  await prepareEventFixture("quota-full");
  await openAlumniEvent(page, "E2E Quota Full");

  await expect(page.getByText("Belum Terdaftar", { exact: true })).toBeVisible();
  await expect(page.getByText("Sisa kuota: 0 dari 2")).toBeVisible();
  await expect(page.getByText("Kuota penuh, segera hubungi penyelenggara")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kuota Penuh" })).toBeDisabled();
});

test("TC-BB097 - pendaftaran bersamaan ditolak agar jumlah tidak melebihi kuota", async ({ browser, baseURL }) => {
  await prepareEventFixture("quota-race");
  const credentials = getE2ECredentials();
  const contextA = await browser.newContext({ baseURL });
  const contextB = await browser.newContext({ baseURL });
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    await openAlumniEvent(pageA, "E2E Quota Race", credentials.alumni);
    await openAlumniEvent(pageB, "E2E Quota Race", {
      email: "e2e.quota.b@example.test",
      password: credentials.alumni.password,
    });

    await expect(pageA.getByRole("button", { name: "Daftar Event" })).toBeEnabled();
    await expect(pageB.getByRole("button", { name: "Daftar Event" })).toBeEnabled();

    await pageA.getByRole("button", { name: "Daftar Event" }).click();
    await expect(pageA.getByRole("status")).toContainText("Berhasil mendaftar event!");
    await expect(pageA.getByRole("button", { name: "Sudah Terdaftar" })).toBeDisabled();

    await pageB.getByRole("button", { name: "Daftar Event" }).click();
    await expect(pageB.getByRole("status")).toContainText("Kuota penuh, segera hubungi penyelenggara");
    await expect(pageB.getByText("Belum Terdaftar", { exact: true })).toBeVisible();

    await pageB.reload();
    await expect(pageB.getByRole("button", { name: "Kuota Penuh" })).toBeDisabled();
    await expect(pageB.getByText("Sisa kuota: 0 dari 1")).toBeVisible();
  } finally {
    await contextA.close();
    await contextB.close();
  }
});

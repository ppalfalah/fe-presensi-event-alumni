import { expect, test } from "@playwright/test";
import {
  engagementRow,
  engagementStatisticCard,
  openEngagementPage,
} from "../../helpers/reports";

test("TC-BB132 - statistik menampilkan total alumni, event eligible, dan segment", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await expect(
    engagementStatisticCard(page, "Total Alumni").getByText("4", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    engagementStatisticCard(page, "Event Eligible").getByText("5", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/\(Al-Muqorrobun\): 1/)).toBeVisible();
  await expect(page.getByText(/\(Al-Mutawasithun\): 1/)).toBeVisible();
  await expect(page.getByText(/\(Al-Mubtadi'un\): 2/)).toBeVisible();
});

test("TC-BB133 - pencarian nama menampilkan alumni yang sesuai", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await page
    .getByPlaceholder("Cari nama, email, atau tahun kelulusan...")
    .fill("Alya");
  await expect(engagementRow(page, "Alya Pemula")).toBeVisible();
  await expect(engagementRow(page, "Bima Pemula")).toHaveCount(0);
  await expect(page.getByText("Menampilkan 1-1 dari 1 alumni")).toBeVisible();
});

test("TC-BB134 - pencarian nama yang tidak terdaftar menampilkan keadaan kosong", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-overview");

  await page
    .getByPlaceholder("Cari nama, email, atau tahun kelulusan...")
    .fill("Nama Tidak Ada");
  await expect(
    page.getByText("Tidak ada alumni yang cocok dengan filter.", {
      exact: true,
    }),
  ).toBeVisible();
});

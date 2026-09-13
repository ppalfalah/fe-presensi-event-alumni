import { expect, test } from "@playwright/test";
import {
  openReportsPage,
  reportEventRow,
  reportStatisticCard,
} from "../../helpers/reports";

test("TC-BB115 - riwayat menampilkan event, tanggal, jumlah hadir, tingkat kehadiran, dan status", async ({
  page,
}) => {
  await openReportsPage(page, "reports-summary");

  const fullRow = reportEventRow(page, "E2E Report Summary Full");
  const halfRow = reportEventRow(page, "E2E Report Summary Half");

  await expect(fullRow).toContainText("2");
  await expect(fullRow).toContainText("100%");
  await expect(fullRow).toContainText("Selesai");
  await expect(fullRow).toContainText(/\d{2}\s+\S{3}\s+\d{4}/);
  await expect(halfRow).toContainText("1");
  await expect(halfRow).toContainText("50%");
  await expect(halfRow).toContainText("Selesai");
});

test("TC-BB116 - riwayat menampilkan informasi saat tidak ada event", async ({
  page,
}) => {
  await openReportsPage(page, "reports-empty");

  await expect(page.getByText("Belum ada data event", { exact: true })).toBeVisible();
});

test("TC-BB117 - statistik riwayat sesuai data event dan kehadiran", async ({
  page,
}) => {
  await openReportsPage(page, "reports-summary");

  await expect(
    reportStatisticCard(page, "Event Terlaksana").getByRole("heading", {
      name: "2",
    }),
  ).toBeVisible();
  await expect(
    reportStatisticCard(page, "Total Kehadiran").getByRole("heading", {
      name: "3",
    }),
  ).toBeVisible();
  await expect(
    reportStatisticCard(page, "Rata-rata Kehadiran").getByRole("heading", {
      name: "75%",
    }),
  ).toBeVisible();
});

test("TC-BB127 - tingkat kehadiran event tanpa kehadiran adalah 0 persen", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail-empty");

  const row = reportEventRow(page, "E2E Report Empty Attendance");
  await expect(row).toContainText("0%");
  await expect(row.locator('[style*="width: 0%"]')).toHaveAttribute(
    "style",
    "width: 0%;",
  );
});

test("TC-BB128 - tingkat kehadiran seluruh peserta adalah maksimal 100 persen", async ({
  page,
}) => {
  await openReportsPage(page, "reports-full-attendance");

  const row = reportEventRow(page, "E2E Report Full Attendance");
  await expect(row).toContainText("100%");
  await expect(row.locator('[style*="width: 100%"]')).toBeVisible();
  await expect(row).not.toContainText(/10[1-9]%|1[1-9]\d%|[2-9]\d{2,}%/);
});

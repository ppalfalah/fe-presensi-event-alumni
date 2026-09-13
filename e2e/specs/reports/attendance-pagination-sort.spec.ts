import { expect, test } from "@playwright/test";
import {
  attendanceModal,
  expectAttendanceOrder,
  openReportsPage,
  selectReportEvent,
} from "../../helpers/reports";

test("TC-BB129 - pagination event tidak dapat melewati halaman pertama", async ({
  page,
}) => {
  await openReportsPage(page, "reports-pagination");

  await expect(page.getByText("Halaman 1 dari 2", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sebelumnya" })).toBeDisabled();
  await expect(page.getByText("E2E Report Page 01", { exact: true })).toBeVisible();
});

test("TC-BB130 - pagination event tidak dapat melewati halaman terakhir", async ({
  page,
}) => {
  await openReportsPage(page, "reports-pagination");

  await page.getByRole("button", { name: "Berikutnya" }).click();
  await expect(page.getByText("Halaman 2 dari 2", { exact: true })).toBeVisible();
  await expect(page.getByText("E2E Report Page 06", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Berikutnya" })).toBeDisabled();
});

test("TC-BB131 - peserta dapat diurutkan berdasarkan tahun kelulusan dan domisili dua arah", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, "E2E Report Detail Event");
  const modal = attendanceModal(page);
  const graduationSort = modal.getByRole("button", {
    name: /^Tahun Kelulusan/,
  });
  const domicileSort = modal.getByRole("button", { name: /^Domisili/ });

  await test.step("Tahun Kelulusan ascending lama ke baru", async () => {
    await graduationSort.click();
    await expectAttendanceOrder(page, [
      "Alya Laporan",
      "Citra Laporan",
      "Bima Laporan",
    ]);
  });

  await test.step("Tahun Kelulusan descending baru ke lama", async () => {
    await graduationSort.click();
    await expectAttendanceOrder(page, [
      "Bima Laporan",
      "Citra Laporan",
      "Alya Laporan",
    ]);
  });

  await test.step("Domisili ascending A-Z", async () => {
    await domicileSort.click();
    await expectAttendanceOrder(page, [
      "Alya Laporan",
      "Citra Laporan",
      "Bima Laporan",
    ]);
  });

  await test.step("Domisili descending Z-A", async () => {
    await domicileSort.click();
    await expectAttendanceOrder(page, [
      "Bima Laporan",
      "Citra Laporan",
      "Alya Laporan",
    ]);
  });
});


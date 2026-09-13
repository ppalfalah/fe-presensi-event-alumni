import { expect, test } from "@playwright/test";
import {
  attendanceModal,
  attendanceRow,
  clickReportEvent,
  openReportsPage,
  selectReportEvent,
} from "../../helpers/reports";

const DETAIL_EVENT = "E2E Report Detail Event";

test("TC-BB118 - memilih event melalui dropdown menampilkan detail kehadiran", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  await expect(attendanceModal(page).getByText("Total kehadiran: 3")).toBeVisible();
  await expect(attendanceRow(page, "Alya Laporan")).toBeVisible();
});

test("TC-BB119 - mengklik event membuka detail dan daftar peserta hadir", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await clickReportEvent(page, DETAIL_EVENT);

  await expect(attendanceRow(page, "Alya Laporan")).toBeVisible();
  await expect(attendanceRow(page, "Bima Laporan")).toBeVisible();
  await expect(attendanceRow(page, "Citra Laporan")).toBeVisible();
});

test("TC-BB120 - detail kehadiran menampilkan seluruh field resmi peserta", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  const modal = attendanceModal(page);
  for (const heading of [
    "Nama",
    "Email",
    "No HP",
    "Tahun Kelulusan",
    "Domisili",
    "Jam Daftar",
    "Waktu Hadir / Scan QR",
  ]) {
    await expect(
      modal.getByRole("columnheader", { name: heading, exact: true }),
    ).toBeVisible();
  }

  const row = attendanceRow(page, "Alya Laporan");
  await expect(row).toContainText("alya.report@example.test");
  await expect(row).toContainText("081200000001");
  await expect(row).toContainText("2019");
  await expect(row).toContainText("Kota Bandung, Jawa Barat");
  const dateTimePattern = /\d{1,2}\s+\S+\s+\d{4},\s+\d{2}:\d{2}/;
  await expect(row.getByRole("cell").nth(5)).toContainText(dateTimePattern);
  await expect(row.getByRole("cell").nth(6)).toContainText(dateTimePattern);
});

test("TC-BB121 - detail event tanpa peserta menampilkan keadaan kehadiran kosong", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail-empty");
  await selectReportEvent(page, "E2E Report Empty Attendance");

  await expect(
    attendanceModal(page).getByText(
      "Belum ada data kehadiran untuk event ini.",
      { exact: true },
    ),
  ).toBeVisible();
});

test("TC-BB122 - pencarian peserta menampilkan peserta yang sesuai", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  const search = attendanceModal(page).getByPlaceholder(/cari.*peserta/i);
  await expect(
    search,
    "Spreadsheet mensyaratkan pencarian peserta di detail kehadiran",
  ).toBeVisible();
  await search.fill("Alya Laporan");
  await expect(attendanceRow(page, "Alya Laporan")).toBeVisible();
  await expect(attendanceRow(page, "Bima Laporan")).toHaveCount(0);
});

test("TC-BB123 - pencarian peserta tanpa hasil menampilkan informasi tidak ditemukan", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  const search = attendanceModal(page).getByPlaceholder(/cari.*peserta/i);
  await expect(
    search,
    "Spreadsheet mensyaratkan pencarian peserta di detail kehadiran",
  ).toBeVisible();
  await search.fill("Peserta Tidak Terdaftar");
  await expect(
    attendanceModal(page).getByText(/data peserta tidak ditemukan/i),
  ).toBeVisible();
});

test("TC-BB124 - rekap tahun kelulusan menampilkan bucket dan total sesuai peserta", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  await expect(
    attendanceModal(page).getByRole("heading", {
      name: "Kehadiran berdasarkan Tahun Kelulusan",
    }),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Tahun Kelulusan 2019, 1 kehadiran"),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Tahun Kelulusan 2020, 1 kehadiran"),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Tahun Kelulusan 2021, 1 kehadiran"),
  ).toBeVisible();
});

test("TC-BB125 - rekap domisili menampilkan bucket dan total sesuai peserta", async ({
  page,
}) => {
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, DETAIL_EVENT);

  await expect(
    attendanceModal(page).getByRole("heading", {
      name: "Kehadiran berdasarkan Domisili",
    }),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Kota Bandung, Jawa Barat, 1 kehadiran"),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Kota Depok, Jawa Barat, 1 kehadiran"),
  ).toBeVisible();
  await expect(
    attendanceModal(page).getByLabel("Kota Semarang, Jawa Tengah, 1 kehadiran"),
  ).toBeVisible();
});

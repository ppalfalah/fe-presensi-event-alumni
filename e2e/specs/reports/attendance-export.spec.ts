import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import {
  attendanceModal,
  openReportsPage,
  selectReportEvent,
} from "../../helpers/reports";

test("TC-BB126 - detail kehadiran menghasilkan laporan Excel dan workflow PDF", async ({
  page,
  context,
}) => {
  await context.addInitScript(() => {
    window.print = () => {
      document.documentElement.dataset.e2ePrintInvoked = "true";
    };
  });
  await openReportsPage(page, "reports-detail");
  await selectReportEvent(page, "E2E Report Detail Event");

  await test.step("Excel diunduh dengan seluruh data peserta", async () => {
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      attendanceModal(page).getByRole("button", { name: "Excel" }).click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/^laporan-kehadiran-\d+-\d{4}-\d{2}-\d{2}\.xls$/);

    const downloadPath = await download.path();
    expect(downloadPath).not.toBeNull();
    const content = await readFile(downloadPath as string, "utf8");
    expect(content).toContain("E2E Report Detail Event");
    expect(content).toContain("Alya Laporan");
    expect(content).toContain("Bima Laporan");
    expect(content).toContain("Citra Laporan");
  });

  await test.step("PDF membuka laporan cetak yang siap disimpan", async () => {
    const popupPromise = page.waitForEvent("popup");
    await attendanceModal(page).getByRole("button", { name: "PDF" }).click();
    const popup = await popupPromise;

    await expect(popup).toHaveTitle("E2E Report Detail Event");
    await expect(popup.getByText("Alya Laporan")).toBeVisible();
    await expect(popup.getByText("Bima Laporan")).toBeVisible();
    await expect(popup.getByText("Citra Laporan")).toBeVisible();
    await expect
      .poll(() =>
        popup.evaluate(
          () => document.documentElement.dataset.e2ePrintInvoked,
        ),
      )
      .toBe("true");
  });
});


import { expect, test, type Locator } from "@playwright/test";
import { engagementRow, openEngagementPage } from "../../helpers/reports";

async function expectAttendance(
  row: Locator,
  fraction: string,
  percentage: number,
) {
  await expect(row).toContainText(fraction);
  await expect(row).toContainText(`${percentage}%`);
}

test("TC-BB138 - alumni dengan nol dari 17 event menampilkan 0/17 dan 0 persen", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-17");
  await expectAttendance(engagementRow(page, "Engagement Zero"), "0/17", 0);
});

test("TC-BB139 - alumni dengan sepuluh dari 17 event menampilkan sekitar 59 persen", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-17");
  await expectAttendance(
    engagementRow(page, "Engagement Partial"),
    "10/17",
    59,
  );
});

test("TC-BB140 - alumni dengan 17 dari 17 event menampilkan 100 persen", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-17");
  await expectAttendance(engagementRow(page, "Engagement Full"), "17/17", 100);
});

test("TC-BB141 - persentase 0 menetapkan segmen Ghoiru Muqayyad", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");
  const row = engagementRow(page, "Boundary Zero");

  await expectAttendance(row, "0/35", 0);
  await expect(row).toContainText("Ghoiru Muqayyad");
});

test("TC-BB142 - persentase 1 sampai 39 menetapkan segmen Al-Mubtadi\u2019un", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary Beginner Low");
  const upper = engagementRow(page, "Boundary Beginner High");

  await test.step("batas bawah representatif 3 persen", async () => {
    await expectAttendance(lower, "1/35", 3);
    await expect(lower).toContainText("Al-Mubtadi\u2019un");
  });

  await test.step("batas atas representatif 37 persen", async () => {
    await expectAttendance(upper, "13/35", 37);
    await expect(upper).toContainText("Al-Mubtadi\u2019un");
  });
});

test("TC-BB143 - persentase 40 dan 69 menetapkan segmen Al-Mutawassithun", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary Middle Low");
  const upper = engagementRow(page, "Boundary Middle High");

  await test.step("batas bawah 40 persen", async () => {
    await expectAttendance(lower, "14/35", 40);
    await expect(lower).toContainText("Al-Mutawassithun");
  });

  await test.step("batas atas yang tampil 69 persen", async () => {
    await expectAttendance(upper, "24/35", 69);
    await expect(upper).toContainText("Al-Mutawassithun");
  });
});

test("TC-BB144 - batas resmi 69 sampai 100 menetapkan segmen Al-Muqarrabun", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary Middle High");
  const upper = engagementRow(page, "Boundary Full");

  await test.step("batas resmi bawah 69 persen", async () => {
    await expectAttendance(lower, "24/35", 69);
    await expect(lower).toContainText("Al-Muqarrabun");
  });

  await test.step("batas atas 100 persen", async () => {
    await expectAttendance(upper, "35/35", 100);
    await expect(upper).toContainText("Al-Muqarrabun");
  });
});

test("TC-BB145 - angka dan progress bar sesuai persentase kehadiran", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const zero = engagementRow(page, "Boundary Zero");
  const middle = engagementRow(page, "Boundary Middle Low");
  const full = engagementRow(page, "Boundary Full");

  await expectAttendance(zero, "0/35", 0);
  await expectAttendance(middle, "14/35", 40);
  await expectAttendance(full, "35/35", 100);
  await expect(zero.locator('[style*="width: 0%"]')).toHaveAttribute(
    "style",
    "width: 0%;",
  );
  await expect(middle.locator('[style*="width: 40%"]')).toHaveAttribute(
    "style",
    "width: 40%;",
  );
  await expect(full.locator('[style*="width: 100%"]')).toHaveAttribute(
    "style",
    "width: 100%;",
  );
});

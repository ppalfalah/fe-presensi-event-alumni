import { expect, test, type Locator } from "@playwright/test";
import { engagementRow, openEngagementPage } from "../../helpers/reports";

type SemanticSegment = "NONE" | "BEGINNER" | "MIDDLE" | "HIGH";

const segmentPatterns: Record<SemanticSegment, RegExp> = {
  NONE: /Ghoir(?:u)?\s+Mu[kq]ayyad/i,
  BEGINNER: /Al-Mubtadi(?:'|\u2019)un/i,
  MIDDLE: /Al-Mutawas{1,2}ithun/i,
  HIGH: /Al-Muq(?:arrab|orrob)un/i,
};

async function expectAttendance(
  row: Locator,
  fraction: string,
  percentage: number,
) {
  await expect(row).toContainText(fraction);
  await expect(row).toContainText(`${percentage}%`);
}

async function expectSemanticSegment(
  row: Locator,
  segment: SemanticSegment,
) {
  await expect(row).toContainText(segmentPatterns[segment]);
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

  await expectAttendance(row, "0/100", 0);
  await expectSemanticSegment(row, "NONE");
});

test("TC-BB142 - persentase 1 sampai 39 menetapkan segmen Al-Mubtadi\u2019un", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary Beginner Low");
  const upper = engagementRow(page, "Boundary Beginner High");

  await test.step("batas bawah 1 persen", async () => {
    await expectAttendance(lower, "1/100", 1);
    await expectSemanticSegment(lower, "BEGINNER");
  });

  await test.step("batas atas 39 persen", async () => {
    await expectAttendance(upper, "39/100", 39);
    await expectSemanticSegment(upper, "BEGINNER");
  });
});

test("TC-BB143 - persentase 40 dan 69 menetapkan segmen Al-Mutawassithun", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary Middle Low");
  const upper = engagementRow(page, "Boundary Middle High");

  await test.step("batas bawah 40 persen", async () => {
    await expectAttendance(lower, "40/100", 40);
    await expectSemanticSegment(lower, "MIDDLE");
  });

  await test.step("batas atas 69 persen", async () => {
    await expectAttendance(upper, "69/100", 69);
    await expectSemanticSegment(upper, "MIDDLE");
  });
});

test("TC-BB144 - batas resmi 70 sampai 100 menetapkan segmen Al-Muqarrabun", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const lower = engagementRow(page, "Boundary High Low");
  const upper = engagementRow(page, "Boundary Full");

  await test.step("batas bawah 70 persen", async () => {
    await expectAttendance(lower, "70/100", 70);
    await expectSemanticSegment(lower, "HIGH");
  });

  await test.step("batas atas 100 persen", async () => {
    await expectAttendance(upper, "100/100", 100);
    await expectSemanticSegment(upper, "HIGH");
  });
});

test("TC-BB145 - angka dan progress bar sesuai persentase kehadiran", async ({
  page,
}) => {
  await openEngagementPage(page, "engagement-boundaries");

  const zero = engagementRow(page, "Boundary Zero");
  const middle = engagementRow(page, "Boundary Middle Low");
  const full = engagementRow(page, "Boundary Full");

  await expectAttendance(zero, "0/100", 0);
  await expectAttendance(middle, "40/100", 40);
  await expectAttendance(full, "100/100", 100);
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

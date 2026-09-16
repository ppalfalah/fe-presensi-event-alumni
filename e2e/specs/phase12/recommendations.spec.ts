import { expect, test } from "@playwright/test";
import {
  loginAlumniWithPhase12Fixture,
  recommendationCard,
  recommendationCards,
  recommendationSection,
} from "../../helpers/presence-history";

test("TC-BB214 - riwayat kategori yang konsisten menghasilkan rekomendasi relevan", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-single-category");
  const section = recommendationSection(page);
  const card = recommendationCard(page, "E2E Recommended Seminar");

  await expect(section).toBeVisible();
  await expect(card).toBeVisible();
  await expect(card.getByText("Seminar Alumni", { exact: true })).toBeVisible();
});

test("TC-BB215 - pengguna baru tanpa riwayat tetap memperoleh rekomendasi event", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-new-user");
  const section = recommendationSection(page);

  await expect(section).toBeVisible();
  await expect(
    section.getByText(/E2E New User Recommendation [AB]/).first(),
  ).toBeVisible();
});

test("TC-BB216 - event aktif dari kategori minat tampil sebagai rekomendasi", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-active-match");

  await expect(
    recommendationCard(page, "E2E Active Matching Recommendation"),
  ).toBeVisible();
});

test("TC-BB217 - kategori tanpa kandidat aktif menggunakan event aktif kategori lain", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-no-active-match");

  await expect(recommendationSection(page)).toBeVisible();
  await expect(recommendationCard(page, "E2E Fallback Reuni")).toBeVisible();
});

test("TC-BB218 - event kategori sesuai yang nonaktif atau telah lewat tidak direkomendasikan", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-inactive-past");
  const section = recommendationSection(page);

  await expect(recommendationCard(page, "E2E Valid Matching Event")).toBeVisible();
  await expect(section.getByText("E2E Inactive Matching Event", { exact: true })).toHaveCount(0);
  await expect(section.getByText("E2E Past Matching Event", { exact: true })).toHaveCount(0);
});

test("TC-BB219 - kategori riwayat dominan mendapat prioritas rekomendasi", async ({ page }) => {
  await loginAlumniWithPhase12Fixture(page, "recommendation-dominant-category");
  const dominantTitle = "E2E Dominant Seminar Recommendation";
  const secondaryTitle = "E2E Secondary Reuni Recommendation";

  await expect(recommendationCard(page, dominantTitle)).toBeVisible();
  await expect(recommendationCard(page, secondaryTitle)).toBeVisible();

  const renderedCards = await recommendationCards(page).allTextContents();
  const dominantIndex = renderedCards.findIndex((text) => text.includes(dominantTitle));
  const secondaryIndex = renderedCards.findIndex((text) => text.includes(secondaryTitle));
  expect(dominantIndex).toBeGreaterThanOrEqual(0);
  expect(secondaryIndex).toBeGreaterThanOrEqual(0);
  expect(dominantIndex).toBeLessThan(secondaryIndex);
});

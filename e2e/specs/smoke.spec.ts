import { expect, test } from "@playwright/test";

test("Smoke - public landing page loads", async ({ page, baseURL }) => {
  const response = await page.goto("/");

  expect(response?.status()).toBe(200);
  await expect(page).toHaveURL(`${baseURL}/`);
  await expect(page.getByRole("heading", {
    level: 1,
    name: "Menjaga Silaturahmi, Menjaga Keberkahan.",
  })).toBeVisible();
});

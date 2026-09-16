import { expect, type Locator, type Page } from "@playwright/test";
import type { ImageFilePayload } from "./settings";
import { loginPhase13Alumni } from "./alumni-notifications";

export async function openAlumniProfile(
  page: Page,
  state: "profile-complete" | "profile-avatar" | "profile-no-avatar",
) {
  await loginPhase13Alumni(page, state);
  await page.goto("/alumni/main/profil");
  await expect(
    page.getByRole("heading", { name: "Profil Saya", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Ubah", exact: true })).toBeVisible();
}

export function profileInfoRow(page: Page, label: string): Locator {
  return page
    .getByText(label, { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'flex-1')][1]");
}

export function profileAvatarContainer(page: Page): Locator {
  return page.locator("button:has(svg.lucide-camera)").locator("..");
}

export function alumniProfilePhoto(page: Page): Locator {
  return profileAvatarContainer(page).locator('img[src*="/storage/avatars/"]');
}

export async function expectAlumniProfilePhotoLoaded(page: Page) {
  const photo = alumniProfilePhoto(page);
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
}

export async function uploadAlumniProfilePhoto(
  page: Page,
  file: ImageFilePayload,
) {
  const chooserPromise = page.waitForEvent("filechooser");
  await page.locator("button:has(svg.lucide-camera)").click();
  const chooser = await chooserPromise;
  await chooser.setFiles(file);
}

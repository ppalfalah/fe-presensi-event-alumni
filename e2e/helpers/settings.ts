import { existsSync } from "node:fs";
import { extname, resolve, sep } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "./auth";
import { preparePhase9Fixture } from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export interface ImageFilePayload {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

async function serveIsolatedE2EAvatars(page: Page) {
  const configuredApiUrl = process.env.E2E_API_URL?.trim();
  if (!configuredApiUrl) {
    throw new Error("E2E_API_URL is required to serve isolated E2E avatars.");
  }

  const backendPath = resolve(
    process.cwd(),
    process.env.E2E_BACKEND_PATH?.trim() || "../presensi-event-backend",
  );
  const avatarRoot = resolve(
    backendPath,
    "storage/app/public/e2e/avatars",
  );
  const apiOrigin = new URL(configuredApiUrl).origin;

  await page.route(`${apiOrigin}/storage/avatars/**`, async (route) => {
    const requestedUrl = new URL(route.request().url());
    const filename = decodeURIComponent(
      requestedUrl.pathname.split("/").at(-1) ?? "",
    );

    if (!/^[A-Za-z0-9._-]+$/.test(filename)) {
      await route.abort();
      return;
    }

    const avatarPath = resolve(avatarRoot, filename);
    if (
      !avatarPath.startsWith(`${avatarRoot}${sep}`) ||
      !existsSync(avatarPath)
    ) {
      await route.abort();
      return;
    }

    const contentType =
      extname(filename).toLowerCase() === ".png"
        ? "image/png"
        : extname(filename).toLowerCase() === ".webp"
          ? "image/webp"
          : "image/jpeg";

    await route.fulfill({ path: avatarPath, contentType });
  });
}

export async function openSettingsPage(page: Page) {
  await preparePhase9Fixture("settings-admin");
  await serveIsolatedE2EAvatars(page);
  await openAdminLogin(page);
  await loginAsAdminThroughUI(page, getE2ECredentials().admin);
  await expect(page).toHaveURL(/\/admin\/dashboard$/);
  await page.goto("/admin/settings");
  await expect(
    page.getByRole("heading", {
      name: "Profil Administrator",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Keamanan Akun", exact: true }),
  ).toBeVisible();
}

export function settingsSection(page: Page, title: string): Locator {
  return page
    .getByRole("heading", { name: title, exact: true })
    .locator("xpath=ancestor::section[1]");
}

export function settingsNameInput(page: Page): Locator {
  return settingsSection(page, "Profil Administrator").getByPlaceholder(
    "Nama administrator",
  );
}

export function settingsEmailInput(page: Page): Locator {
  return settingsSection(page, "Profil Administrator").getByPlaceholder(
    "email@pesantren.ac.id",
  );
}

export function profilePhoto(page: Page): Locator {
  return settingsSection(page, "Profil Administrator").locator(
    'img[src*="/storage/avatars/"]',
  );
}

export async function expectProfilePhotoLoaded(page: Page) {
  const photo = profilePhoto(page);
  await expect(photo).toBeVisible();
  await expect
    .poll(() => photo.evaluate((image: HTMLImageElement) => image.naturalWidth))
    .toBeGreaterThan(0);
}

export async function saveProfile(page: Page) {
  await settingsSection(page, "Profil Administrator")
    .getByRole("button", { name: "Simpan Profil" })
    .click();
}

export async function uploadProfilePhoto(page: Page, file: ImageFilePayload) {
  const profile = settingsSection(page, "Profil Administrator");
  await profile.getByRole("button", { name: "Menu foto profil" }).click();

  const chooserPromise = page.waitForEvent("filechooser");
  await profile.getByRole("button", { name: "Ubah", exact: true }).click();
  const chooser = await chooserPromise;
  await chooser.setFiles(file);
}

export async function createImagePayload(
  page: Page,
  format: "jpeg" | "png" | "webp",
  targetSize?: number,
): Promise<ImageFilePayload> {
  let buffer: Buffer;

  if (format === "webp") {
    buffer = Buffer.from(
      "UklGRiIAAABXRUJQVlA4IC4AAADQAQCdASoBAAEAAUAmJaQAA3AA/vuUAAA=",
      "base64",
    );
  } else {
    buffer = await page.screenshot({
      type: format,
      ...(format === "jpeg" ? { quality: 25 } : {}),
    });
  }

  if (targetSize !== undefined) {
    if (buffer.length > targetSize) {
      throw new Error(
        `Generated ${format} fixture is ${buffer.length} bytes, above target ${targetSize}.`,
      );
    }
    buffer = Buffer.concat([buffer, Buffer.alloc(targetSize - buffer.length)]);
  }

  return {
    name: `e2e-avatar.${format === "jpeg" ? "jpg" : format}`,
    mimeType: `image/${format}`,
    buffer,
  };
}

export function oldPasswordInput(page: Page): Locator {
  return settingsSection(page, "Keamanan Akun").getByPlaceholder(
    "Masukkan kata sandi lama",
  );
}

export function newPasswordInput(page: Page): Locator {
  return settingsSection(page, "Keamanan Akun").getByPlaceholder(
    "Minimal 8 karakter",
  );
}

export function confirmationInput(page: Page): Locator {
  return settingsSection(page, "Keamanan Akun").getByPlaceholder(
    "Ulangi kata sandi baru",
  );
}

export async function submitPasswordChange(
  page: Page,
  currentPassword: string,
  newPassword: string,
  confirmation: string,
) {
  await oldPasswordInput(page).fill(currentPassword);
  await newPasswordInput(page).fill(newPassword);
  await confirmationInput(page).fill(confirmation);
  await settingsSection(page, "Keamanan Akun")
    .getByRole("button", { name: "Perbarui Kata Sandi" })
    .click();
}

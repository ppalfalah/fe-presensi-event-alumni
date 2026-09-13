import { expect, test } from "@playwright/test";
import {
  createImagePayload,
  expectProfilePhotoLoaded,
  openSettingsPage,
  profilePhoto,
  uploadProfilePhoto,
} from "../../helpers/settings";

const TWO_MEBIBYTES = 2 * 1024 * 1024;

test("TC-BB165 - foto profil menerima JPG dan PNG hingga 2 MB", async ({
  baseURL,
  browser,
}) => {
  test.setTimeout(60_000);

  for (const format of ["jpeg", "png"] as const) {
    await test.step(`unggah ${format === "jpeg" ? "JPG" : "PNG"}`, async () => {
      const context = await browser.newContext({ baseURL });
      const page = await context.newPage();

      try {
        await openSettingsPage(page);
        await uploadProfilePhoto(page, await createImagePayload(page, format));
        await expectProfilePhotoLoaded(page);
        await expect(profilePhoto(page)).toHaveAttribute(
          "src",
          /\/storage\/avatars\//,
        );
      } finally {
        await context.close();
      }
    });
  }
});

test("TC-BB166 - format foto selain JPG dan PNG ditolak", async ({ page }) => {
  await openSettingsPage(page);
  await uploadProfilePhoto(page, await createImagePayload(page, "webp"));

  await expect(
    page.getByText(/format.*tidak didukung|hanya.*JPG.*PNG/i),
  ).toBeVisible();
  await expect(profilePhoto(page)).toHaveCount(0);
});

test("TC-BB167 - foto profil tepat 2 MB diterima", async ({ page }) => {
  await openSettingsPage(page);
  const exactBoundaryImage = await createImagePayload(
    page,
    "png",
    TWO_MEBIBYTES,
  );
  expect(exactBoundaryImage.buffer.byteLength).toBe(TWO_MEBIBYTES);

  await uploadProfilePhoto(page, exactBoundaryImage);

  await expectProfilePhotoLoaded(page);
  await expect(profilePhoto(page)).toHaveAttribute("src", /\/storage\/avatars\//);
});

test("TC-BB168 - foto profil di atas 2 MB ditolak dengan validasi ukuran", async ({
  page,
}) => {
  await openSettingsPage(page);
  await uploadProfilePhoto(page, await createImagePayload(page, "png"));
  await expectProfilePhotoLoaded(page);
  const existingAvatarSource = await profilePhoto(page).getAttribute("src");
  expect(existingAvatarSource).toBeTruthy();

  const oversizedImage = await createImagePayload(
    page,
    "png",
    TWO_MEBIBYTES + 1024,
  );
  expect(oversizedImage.buffer.byteLength).toBe(TWO_MEBIBYTES + 1024);

  let validationMessage = "";
  page.once("dialog", async (dialog) => {
    validationMessage = dialog.message();
    await dialog.accept();
  });
  await uploadProfilePhoto(page, oversizedImage);

  await expect
    .poll(() => validationMessage)
    .toContain("Ukuran foto maksimal 2 MB");
  await expect(profilePhoto(page)).toHaveAttribute(
    "src",
    existingAvatarSource as string,
  );
});

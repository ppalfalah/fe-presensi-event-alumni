import { expect, test } from "@playwright/test";
import { loginAsAdminThroughUI, openAdminLogin } from "../../helpers/auth";
import { getE2ECredentials } from "../../helpers/environment";
import {
  confirmationInput,
  newPasswordInput,
  oldPasswordInput,
  openSettingsPage,
  submitPasswordChange,
} from "../../helpers/settings";

const CURRENT_PASSWORD = () => getE2ECredentials().admin.password;

test("TC-BB169 - kata sandi lama yang benar diterima", async ({ page }) => {
  await openSettingsPage(page);
  await submitPasswordChange(page, CURRENT_PASSWORD(), "Correct9!", "Correct9!");

  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/kata sandi lama.*tidak sesuai|current password.*incorrect/i),
  ).toHaveCount(0);
});

test("TC-BB170 - kata sandi lama yang salah menolak perubahan", async ({
  baseURL,
  browser,
  page,
}) => {
  await openSettingsPage(page);
  await submitPasswordChange(
    page,
    "Definitely-Wrong-Password!",
    "ValidNew9!",
    "ValidNew9!",
  );

  await expect(
    page.getByText(
      /kata sandi lama.*(?:tidak sesuai|incorrect)|current password.*incorrect/i,
    ),
  ).toBeVisible();
  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toHaveCount(0);

  await test.step("kata sandi baseline tetap dapat digunakan", async () => {
    const verificationContext = await browser.newContext({ baseURL });
    const verificationPage = await verificationContext.newPage();

    try {
      await openAdminLogin(verificationPage);
      await loginAsAdminThroughUI(
        verificationPage,
        getE2ECredentials().admin,
      );
      await expect(verificationPage).toHaveURL(/\/admin\/dashboard$/);
    } finally {
      await verificationContext.close();
    }
  });
});

test("TC-BB171 - kata sandi baru tujuh karakter ditolak", async ({ page }) => {
  await openSettingsPage(page);
  await submitPasswordChange(page, CURRENT_PASSWORD(), "Seven7!", "Seven7!");

  await expect(
    page.getByText("Kata sandi baru minimal 8 karakter.", { exact: true }),
  ).toBeVisible();
  await expect(newPasswordInput(page)).toHaveValue("Seven7!");
});

test("TC-BB172 - kata sandi baru tepat delapan karakter diterima", async ({
  page,
}) => {
  await openSettingsPage(page);
  const minimumPassword = "Eight8!!";
  expect(minimumPassword).toHaveLength(8);
  await submitPasswordChange(
    page,
    CURRENT_PASSWORD(),
    minimumPassword,
    minimumPassword,
  );

  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
});

test("TC-BB173 - konfirmasi yang sama dengan kata sandi baru diterima", async ({
  page,
}) => {
  await openSettingsPage(page);
  const newPassword = "Matching9!";
  await submitPasswordChange(
    page,
    CURRENT_PASSWORD(),
    newPassword,
    newPassword,
  );

  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/konfirmasi.*tidak cocok/i)).toHaveCount(0);
});

test("TC-BB174 - konfirmasi berbeda menolak perubahan kata sandi", async ({
  page,
}) => {
  await openSettingsPage(page);
  await submitPasswordChange(
    page,
    CURRENT_PASSWORD(),
    "Mismatch9!",
    "Different9!",
  );

  await expect(
    page.getByText("Kata sandi baru dan konfirmasi tidak cocok.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

test("TC-BB175 - formulir valid berhasil memperbarui kata sandi", async ({
  page,
}) => {
  await openSettingsPage(page);
  await submitPasswordChange(
    page,
    CURRENT_PASSWORD(),
    "Updated9!",
    "Updated9!",
  );

  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(oldPasswordInput(page)).toHaveValue("");
  await expect(newPasswordInput(page)).toHaveValue("");
  await expect(confirmationInput(page)).toHaveValue("");
});

test("TC-BB176 - kolom kata sandi lama kosong menampilkan validasi wajib", async ({
  page,
}) => {
  await openSettingsPage(page);
  await submitPasswordChange(page, "", "Required9!", "Required9!");

  await expect(
    page.getByText("Kata sandi lama wajib diisi.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Kata sandi administrator berhasil diperbarui.", {
      exact: true,
    }),
  ).toHaveCount(0);
});

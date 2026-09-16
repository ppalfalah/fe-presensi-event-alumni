import { expect, test } from "@playwright/test";
import {
  alumniProfilePhoto,
  expectAlumniProfilePhotoLoaded,
  openAlumniProfile,
  profileAvatarContainer,
  profileInfoRow,
} from "../../helpers/alumni-profile";
import { PHASE13_ALUMNI_EMAIL } from "../../helpers/alumni-notifications";

test("TC-BB234 - halaman profil menampilkan data akun alumni", async ({ page }) => {
  await openAlumniProfile(page, "profile-complete");

  await expect(profileInfoRow(page, "Nama Depan")).toContainText("E2E");
  await expect(profileInfoRow(page, "Nama Belakang")).toContainText("Alumni Profile");
  await expect(profileInfoRow(page, "Email")).toContainText(PHASE13_ALUMNI_EMAIL);
  await expect(profileInfoRow(page, "No Telp")).toContainText("081234567890");
  await expect(profileInfoRow(page, "Jenis Kelamin")).toContainText("Laki-laki");
  await expect(profileInfoRow(page, "Angkatan (Tahun Lulus)")).toContainText("2020");
  await expect(profileInfoRow(page, "Tanggal Lahir")).toContainText("15 Januari 2000");
});

test("TC-BB235 - profil dengan foto menampilkan gambar avatar yang dapat dimuat", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-avatar");

  await expectAlumniProfilePhotoLoaded(page);
  await expect(alumniProfilePhoto(page)).toHaveAttribute(
    "src",
    /\/storage\/avatars\/e2e-phase13-existing\.png$/,
  );
});

test("TC-BB236 - profil tanpa foto menampilkan avatar default berbasis inisial", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-no-avatar");

  await expect(alumniProfilePhoto(page)).toHaveCount(0);
  await expect(profileAvatarContainer(page).getByText("EA", { exact: true })).toBeVisible();
});

test("TC-BB242 - profil menampilkan alamat, wilayah, dan kode pos lengkap", async ({
  page,
}) => {
  await openAlumniProfile(page, "profile-complete");

  await expect(profileInfoRow(page, "Alamat Lengkap")).toContainText(
    "Jl. E2E Phase 13 No. 13",
  );
  const region = profileInfoRow(page, "Wilayah");
  await expect(region).toContainText("Isola");
  await expect(region).toContainText("Sukasari");
  await expect(region).toContainText("Kota Bandung");
  await expect(region).toContainText("Jawa Barat");
  await expect(profileInfoRow(page, "Kode Pos")).toContainText("40111");
});

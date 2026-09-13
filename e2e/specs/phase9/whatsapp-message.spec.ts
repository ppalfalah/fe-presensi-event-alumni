import { expect, test } from "@playwright/test";
import {
  BROADCAST_EVENT_TITLE,
  broadcastCounter,
  broadcastEventSelect,
  broadcastMessage,
  continueToWhatsAppButton,
  copyMessageButton,
  openWhatsAppMessagePage,
  selectBroadcastEvent,
} from "../../helpers/whatsapp-message";

test.use({ permissions: ["clipboard-read", "clipboard-write"] });

function normalizeClipboardText(value: string) {
  return value.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
}

test("TC-BB148 - halaman pesan WhatsApp menampilkan seluruh kontrol utama", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);

  await expect(broadcastEventSelect(page)).toBeVisible();
  await expect(broadcastMessage(page)).toBeVisible();
  await expect(broadcastCounter(page, 0)).toBeVisible();
  await expect(copyMessageButton(page)).toBeVisible();
  await expect(continueToWhatsAppButton(page)).toBeVisible();
});

test("TC-BB149 - pesan belum dapat digunakan sebelum event dipilih", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);

  await expect(broadcastEventSelect(page).locator("option:checked")).toHaveText(
    "Pilih event",
  );
  await expect(broadcastMessage(page)).toBeDisabled();
  await expect(broadcastMessage(page)).toHaveAttribute(
    "placeholder",
    "Pilih event terlebih dahulu",
  );
  await expect(copyMessageButton(page)).toBeDisabled();
  await expect(continueToWhatsAppButton(page)).toBeDisabled();
});

test("TC-BB150 - memilih event membuat template WhatsApp otomatis", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);

  await expect(broadcastMessage(page)).toHaveValue(
    new RegExp(BROADCAST_EVENT_TITLE),
  );
  await expect(broadcastMessage(page)).toHaveValue(/Aula Phase 9/);
  await expect(broadcastMessage(page)).toHaveValue(/E2E Phase 9/);
});

test("TC-BB151 - template berisi informasi event dan dapat diedit", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);

  const message = broadcastMessage(page);
  await expect(message).toHaveValue(new RegExp(BROADCAST_EVENT_TITLE));
  await expect(message).toHaveValue(/09:00 - 11:00 WIB/);
  await expect(message).toHaveValue(/Aula Phase 9/);

  const edited = "Pesan undangan E2E yang telah disunting admin.";
  await message.fill(edited);
  await expect(message).toHaveValue(edited);
});

test("TC-BB152 - perubahan pesan tersimpan di textarea dan memperbarui counter", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);

  const edited = "Pesan Phase 9 yang dapat diedit pengguna.";
  await broadcastMessage(page).fill(edited);

  await expect(broadcastMessage(page)).toHaveValue(edited);
  await expect(broadcastCounter(page, edited.length)).toBeVisible();
});

test("TC-BB153 - pesan kosong menampilkan 0 dari 1000 dan menonaktifkan aksi", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);
  await broadcastMessage(page).clear();

  await expect(broadcastCounter(page, 0)).toBeVisible();
  await expect(copyMessageButton(page)).toBeDisabled();
  await expect(continueToWhatsAppButton(page)).toBeDisabled();
});

test("TC-BB154 - pesan tepat 1000 karakter diterima", async ({ page }) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);
  await broadcastMessage(page).fill("A".repeat(1000));

  await expect(broadcastMessage(page)).toHaveValue("A".repeat(1000));
  await expect(broadcastCounter(page, 1000)).toBeVisible();
  await expect(
    page.getByText("Pesan maksimal 1000 karakter.", { exact: true }),
  ).toHaveCount(0);
  await expect(copyMessageButton(page)).toBeEnabled();
  await expect(continueToWhatsAppButton(page)).toBeEnabled();
});

test("TC-BB155 - pesan lebih dari 1000 karakter ditolak dengan validasi", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);
  await broadcastMessage(page).fill("A".repeat(1001));

  await expect(broadcastCounter(page, 1001)).toBeVisible();
  await expect(
    page.getByText("Pesan maksimal 1000 karakter.", { exact: true }),
  ).toBeVisible();
  await expect(copyMessageButton(page)).toBeDisabled();
  await expect(continueToWhatsAppButton(page)).toBeDisabled();
});

test("TC-BB156 - counter mengikuti penambahan dan penghapusan karakter", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);

  await test.step("pesan 100 karakter", async () => {
    await broadcastMessage(page).fill("A".repeat(100));
    await expect(broadcastCounter(page, 100)).toBeVisible();
  });

  await test.step("pesan dikurangi menjadi 40 karakter", async () => {
    await broadcastMessage(page).fill("B".repeat(40));
    await expect(broadcastCounter(page, 40)).toBeVisible();
  });
});

test("TC-BB157 - Salin Pesan menyalin textarea dan menampilkan indikasi", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);
  const expectedMessage = normalizeClipboardText(
    await broadcastMessage(page).inputValue(),
  );

  await copyMessageButton(page).click();

  await expect(
    page.getByRole("button", { name: "Pesan tersalin" }),
  ).toBeVisible();
  await expect
    .poll(async () =>
      normalizeClipboardText(
        await page.evaluate(() => navigator.clipboard.readText()),
      ),
    )
    .toBe(expectedMessage);
});

test("TC-BB158 - Salin Pesan tidak aktif tanpa event dan pesan", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);

  await expect(broadcastMessage(page)).toHaveValue("");
  await expect(copyMessageButton(page)).toBeDisabled();
});

test("TC-BB159 - Lanjutkan ke WhatsApp membuka wa.me dengan pesan aktif", async ({
  page,
}) => {
  await openWhatsAppMessagePage(page);
  await selectBroadcastEvent(page);
  const expectedMessage = (await broadcastMessage(page).inputValue()).trim();

  const whatsappRequestPromise = page.context().waitForEvent("request", {
    predicate: (request) => request.url().startsWith("https://wa.me/?text="),
  });
  const popupPromise = page.waitForEvent("popup");
  const [, popup, whatsappRequest] = await Promise.all([
    continueToWhatsAppButton(page).click(),
    popupPromise,
    whatsappRequestPromise,
  ]);
  const openedUrl = new URL(whatsappRequest.url());

  expect(popup).toBeTruthy();
  expect(openedUrl.origin).toBe("https://wa.me");
  expect(openedUrl.pathname).toBe("/");
  expect(openedUrl.searchParams.get("text")).toBe(expectedMessage);
});

import { expect, type Page } from "@playwright/test";
import QRCode from "qrcode";
import { loginAsAlumniThroughUI, openAlumniLogin } from "./auth";
import {
  preparePhase11Fixture,
  type Phase11FixtureState,
} from "./dashboard-fixtures";
import { getE2ECredentials } from "./environment";

export const VALID_SCAN_TOKEN = "11111111-1111-4111-8111-111111111111";

type FakeCameraFeed =
  | { permission: "denied" }
  | { permission: "granted"; qrText?: string };

export async function installFakeCamera(page: Page, feed: FakeCameraFeed) {
  const qrDataUrl =
    feed.permission === "granted" && feed.qrText
      ? await QRCode.toDataURL(feed.qrText, {
          errorCorrectionLevel: "M",
          margin: 4,
          width: 220,
        })
      : null;

  await page.addInitScript(
    ({ permission, dataUrl }) => {
      const permissionStatus = {
        state: permission,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        dispatchEvent: () => true,
      };

      Object.defineProperty(navigator.permissions, "query", {
        configurable: true,
        value: async (descriptor: PermissionDescriptor) => {
          if (descriptor.name === "camera") {
            return permissionStatus;
          }

          return permissionStatus;
        },
      });

      Object.defineProperty(navigator.mediaDevices, "enumerateDevices", {
        configurable: true,
        value: async () => [
          {
            deviceId: "e2e-camera",
            groupId: "e2e-camera-group",
            kind: "videoinput",
            label: "E2E Back Camera",
            toJSON: () => ({}),
          },
        ],
      });

      Object.defineProperty(navigator.mediaDevices, "getUserMedia", {
        configurable: true,
        value: async () => {
          if (permission === "denied") {
            throw new DOMException("Permission denied", "NotAllowedError");
          }

          const canvas = document.createElement("canvas");
          canvas.width = 640;
          canvas.height = 640;
          const context = canvas.getContext("2d", { alpha: false });
          if (!context) {
            throw new Error("E2E camera canvas is unavailable");
          }

          const drawBackground = () => {
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);
          };
          drawBackground();

          let image: HTMLImageElement | null = null;
          if (dataUrl) {
            image = new Image();
            image.src = dataUrl;
          }

          const drawFrame = () => {
            drawBackground();
            if (image?.complete && image.naturalWidth > 0) {
              context.drawImage(image, 210, 210, 220, 220);
            }
          };
          drawFrame();
          const frameTimer = window.setInterval(drawFrame, 100);
          const stream = canvas.captureStream(30);
          const track = stream.getVideoTracks()[0];
          const originalStop = track.stop.bind(track);
          track.stop = () => {
            window.clearInterval(frameTimer);
            originalStop();
          };
          track.getSettings = () => ({
            deviceId: "e2e-camera",
            facingMode: "environment",
            width: 640,
            height: 640,
            frameRate: 30,
          });

          const cameraWindow = window as typeof window & {
            __e2eFakeCamera?: {
              canvas: HTMLCanvasElement;
              image: HTMLImageElement | null;
              stream: MediaStream;
            };
          };
          cameraWindow.__e2eFakeCamera = { canvas, image, stream };

          return stream;
        },
      });
    },
    { permission: feed.permission, dataUrl: qrDataUrl },
  );
}

export async function openScanPage(
  page: Page,
  state: Phase11FixtureState,
  feed: FakeCameraFeed,
) {
  await preparePhase11Fixture(state);
  await installFakeCamera(page, feed);
  await openAlumniLogin(page);
  await loginAsAlumniThroughUI(page, getE2ECredentials().alumni);
  await expect(page).toHaveURL(/\/alumni\/main\/dashboard$/);
  await page.goto("/alumni/main/scan");
  await expect(
    page.getByRole("heading", { name: "Pindai QR Presensi", exact: true }),
  ).toBeVisible();
}

export async function openManualScanPage(
  page: Page,
  state: Phase11FixtureState,
) {
  await openScanPage(page, state, { permission: "granted" });
  await expect(page.getByText("Kamera aktif. Arahkan ke QR Code event.")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Masukkan Kode Manual", exact: true }),
  ).toBeVisible();
}

export async function submitManualCode(page: Page, token: string) {
  await page.getByPlaceholder("Masukkan kode presensi...").fill(token);
  await page.getByRole("button", { name: "Kirim", exact: true }).click();
}

export async function expectAttendanceSuccess(page: Page) {
  await expect(page.getByText("Presensi berhasil dicatat", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Lihat Riwayat Kehadiran", exact: true }),
  ).toBeVisible();
}

export async function observeNoScanRequest(page: Page, timeout = 1_500) {
  const requestObserved = await page
    .waitForRequest(
      (request) =>
        request.method() === "POST" &&
        new URL(request.url()).pathname.endsWith("/presensi/scan"),
      { timeout },
    )
    .then(() => true)
    .catch(() => false);

  expect(requestObserved).toBe(false);
}

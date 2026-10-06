"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Html5Qrcode, type CameraDevice } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { useScanQR } from "@/hooks/alumni/useAlumniHooks";
import { toFriendlyErrorMessage } from "@/lib/api";

function Icon({
  name,
  className = "w-5 h-5",
}: {
  name: "camera" | "info" | "check" | "x";
  className?: string;
}) {
  const common = {
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    case "camera":
      return (
        <svg {...common}>
          <path d="M14.5 4 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-3h5z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
      );

    case "info":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
      );

    case "check":
      return (
        <svg {...common}>
          <path d="m5 13 4 4L19 7" />
        </svg>
      );

    case "x":
      return (
        <svg {...common}>
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      );
  }
}

type ScanStatus = "idle" | "scanning" | "success" | "error";
type CameraFacing = "front" | "back" | "unknown";
type CameraPermissionState =
  | "unknown"
  | "prompt"
  | "granted"
  | "denied"
  | "unsupported";

const BACK_CAMERA_KEYWORDS = [
  "back",
  "rear",
  "environment",
  "belakang",
  "world",
];

const FRONT_CAMERA_KEYWORDS = ["front", "user", "depan", "facetime"];

function detectCameraFacing(label: string): CameraFacing {
  const normalized = label.toLowerCase();

  if (FRONT_CAMERA_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "front";
  }

  if (BACK_CAMERA_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return "back";
  }

  return "unknown";
}

function findPreferredCamera(cameras: CameraDevice[]) {
  return (
    cameras.find(
      (camera) => detectCameraFacing(camera.label ?? "") === "back"
    ) ?? cameras[0]
  );
}

function isCameraPermissionDenied(error: unknown) {
  const errorName =
    error && typeof error === "object" && "name" in error
      ? String(error.name)
      : "";
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : String(error);

  return (
    errorName === "NotAllowedError" ||
    /NotAllowedError/i.test(errorMessage) ||
    /Permission denied/i.test(errorMessage) ||
    /permission.*denied/i.test(errorMessage) ||
    /not allowed/i.test(errorMessage)
  );
}

async function getCameraPermissionState(): Promise<CameraPermissionState> {
  if (
    typeof navigator === "undefined" ||
    !navigator.permissions?.query
  ) {
    return "unsupported";
  }

  try {
    const permissionStatus = await navigator.permissions.query({
      name: "camera" as PermissionName,
    });

    return permissionStatus.state;
  } catch {
    return "unsupported";
  }
}

function getCameraErrorMessage(error: unknown) {
  const errorName =
    error && typeof error === "object" && "name" in error
      ? String(error.name).toLowerCase()
      : "";
  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalizedMessage = errorMessage.toLowerCase();

  if (isCameraPermissionDenied(error)) {
    return "Izin kamera diblokir. Izinkan akses kamera melalui pengaturan browser, lalu coba lagi.";
  }

  if (
    errorName.includes("notfound") ||
    normalizedMessage.includes("notfound") ||
    normalizedMessage.includes("camera not found") ||
    normalizedMessage.includes("kamera tidak ditemukan")
  ) {
    return "Kamera tidak ditemukan pada perangkat ini.";
  }

  if (
    errorName.includes("notreadable") ||
    normalizedMessage.includes("notreadable") ||
    normalizedMessage.includes("trackstarterror") ||
    normalizedMessage.includes("could not start video source")
  ) {
    return "Kamera tidak dapat digunakan. Pastikan kamera tidak sedang digunakan aplikasi lain.";
  }

  if (normalizedMessage.includes("area pemindai belum siap")) {
    return "Area pemindai belum siap. Silakan coba lagi.";
  }

  if (normalizedMessage.includes("koneksi https atau localhost")) {
    return errorMessage;
  }

  return "Kamera gagal diaktifkan. Silakan coba lagi.";
}

function getMessage(value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return null;
}

function isFailedResponse(value: unknown): value is { success: false } {
  return (
    value !== null &&
    typeof value === "object" &&
    "success" in value &&
    value.success === false
  );
}

function getFriendlyErrorMessage(message: string): string {
  const errorMap: Record<string, string> = {
    "QR Code tidak valid":
      "QR Code tidak dapat dikenali. Pastikan Anda memindai QR Code yang benar.",
    "QR Code tidak dikenali":
      "Anda belum terdaftar untuk event ini atau QR Code tidak valid.",
    "Event ini sudah tidak aktif":
      "Event ini sudah berakhir atau dibatalkan.",
    "QR Code sudah kadaluarsa. Silakan minta admin untuk generate QR code baru.":
      "QR Code sudah tidak berlaku. Hubungi panitia event.",
    "QR Code belum aktif atau sudah tidak valid.":
      "QR Code belum dapat digunakan atau sudah tidak berlaku.",
    "Kamu sudah melakukan presensi untuk event ini":
      "Anda sudah melakukan presensi sebelumnya.",
  };

  if (errorMap[message]) {
    return errorMap[message];
  }

  return toFriendlyErrorMessage(
    message,
    "Presensi belum berhasil diproses. Silakan coba lagi."
  );
}

function getCleanQrToken(value: string) {
  const trimmedValue = value.trim();
  const uuidMatch = trimmedValue.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i
  );

  return uuidMatch?.[0] ?? trimmedValue;
}

export default function ScanPage() {
  const router = useRouter();

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);
  const isStartingRef = useRef(false);
  const isMountedRef = useRef(false);
  const cameraPermissionRef = useRef<CameraPermissionState>("unknown");
  const permissionStatusRef = useRef<PermissionStatus | null>(null);

  const [status, setStatus] = useState<ScanStatus>("scanning");
  const [message, setMessage] = useState("Meminta akses kamera...");
  const [cameraReady, setCameraReady] = useState(false);
  const [isCameraStarting, setIsCameraStarting] = useState(true);
  const [cameraFacing, setCameraFacing] =
    useState<CameraFacing>("unknown");
  const [cameraPermission, setCameraPermission] =
    useState<CameraPermissionState>("unknown");

  const [manualToken, setManualToken] = useState("");
  const [manualError, setManualError] = useState("");

  const {
    mutate: scanQr,
    isPending: isScanPending,
  } = useScanQR();

  const scanQrRef = useRef(scanQr);
  useEffect(() => {
    scanQrRef.current = scanQr;
  }, [scanQr]);

  const stopScanner = useCallback(async (scanner = scannerRef.current) => {
    try {
      if (scanner?.isScanning) {
        await scanner.stop();
      }
    } catch {
      // scanner sudah berhenti
    }
  }, []);

  const clearScanner = useCallback(async (scanner = scannerRef.current) => {
    if (!scanner) return;

    await stopScanner(scanner);

    try {
      await scanner.clear();
    } catch {
      // reader sudah kosong
    } finally {
      if (scannerRef.current === scanner) {
        scannerRef.current = null;
      }
    }
  }, [stopScanner]);

  const stopAndClearScanner = useCallback(async () => {
    try {
      await clearScanner();
    } finally {
      isStartingRef.current = false;
    }
  }, [clearScanner]);

  const startScanner = useCallback(async () => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[ScanPage] startScanner called", {
        mounted: isMountedRef.current,
        starting: isStartingRef.current,
        scanning: scannerRef.current?.isScanning ?? false,
        readerExists: Boolean(document.getElementById("qr-reader")),
      });
    }

    if (isStartingRef.current) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[ScanPage] startScanner skipped: already starting");
      }
      return;
    }

    if (scannerRef.current?.isScanning) {
      if (process.env.NODE_ENV !== "production") {
        console.log("[ScanPage] startScanner skipped: already scanning");
      }
      return;
    }

    isStartingRef.current = true;

    try {
      if (isMountedRef.current) {
        setStatus("scanning");
        setCameraReady(false);
        setCameraFacing("unknown");
        setIsCameraStarting(true);
        setMessage("Meminta akses kamera...");
      }

      if (typeof window !== "undefined" && !window.isSecureContext) {
        throw new Error(
          "Kamera diblokir oleh browser. Anda harus menggunakan koneksi HTTPS atau localhost untuk mengaktifkan kamera di HP."
        );
      }

      const permissionState = await getCameraPermissionState();
      cameraPermissionRef.current = permissionState;

      if (isMountedRef.current) {
        setCameraPermission(permissionState);
      }

      if (permissionState === "denied") {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[ScanPage] camera permission denied");
        }

        if (isMountedRef.current) {
          setStatus("error");
          setCameraReady(false);
          setCameraFacing("unknown");
          setIsCameraStarting(false);
          setMessage(
            "Izin kamera diblokir. Buka pengaturan situs pada browser, izinkan akses kamera, lalu coba lagi."
          );
        }
        return;
      }

      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        throw new Error("Area pemindai belum siap. Silakan coba lagi.");
      }

      type CameraStartOption = {
        source: string | MediaTrackConstraints;
        facing: CameraFacing;
        debugLabel: string;
      };

      let cameraOptions: CameraStartOption[];
      let cameras: CameraDevice[] | null = null;

      try {
        cameras = await Html5Qrcode.getCameras();

        if (process.env.NODE_ENV !== "production") {
          console.log("[ScanPage] available cameras", cameras);
        }
      } catch (cameraListError) {
        if (isCameraPermissionDenied(cameraListError)) {
          throw cameraListError;
        }

        if (process.env.NODE_ENV !== "production") {
          console.error(
            "[ScanPage] getCameras failed, using facingMode fallback",
            cameraListError
          );
        }
      }

      if (cameras) {
        if (cameras.length === 0) {
          const noCameraError = new Error(
            "Kamera tidak ditemukan pada perangkat ini."
          );
          noCameraError.name = "NotFoundError";
          throw noCameraError;
        }

        const selectedCamera = findPreferredCamera(cameras);
        const detectedFacing = detectCameraFacing(selectedCamera.label ?? "");

        if (process.env.NODE_ENV !== "production") {
          console.log("[ScanPage] selected camera", {
            id: selectedCamera.id,
            label: selectedCamera.label,
            detectedFacing,
          });
        }

        cameraOptions = [
          {
            source: selectedCamera.id,
            facing: detectedFacing,
            debugLabel: selectedCamera.label || selectedCamera.id,
          },
        ];
      } else {
        cameraOptions = [
          {
            source: { facingMode: "environment" },
            facing: "back",
            debugLabel: "facingMode:environment",
          },
          {
            source: { facingMode: "user" },
            facing: "front",
            debugLabel: "facingMode:user",
          },
        ];
      }

      const scannerConfig = {
        fps: 10,
        qrbox: {
          width: 240,
          height: 240,
        },
        aspectRatio: 1,
      };
      let scanner: Html5Qrcode | null = null;
      let selectedFacing: CameraFacing = "unknown";
      let lastStartError: unknown = null;

      for (const cameraOption of cameraOptions) {
        if (scannerRef.current) {
          await clearScanner(scannerRef.current);
        }

        const candidateScanner = new Html5Qrcode("qr-reader");
        scannerRef.current = candidateScanner;
        isProcessingRef.current = false;

        try {
          await candidateScanner.start(
            cameraOption.source,
            scannerConfig,
            async (decodedText) => {
              if (isProcessingRef.current) return;

              isProcessingRef.current = true;
              if (isMountedRef.current) {
                setMessage("QR Code terbaca. Memproses presensi...");
              }

              await stopScanner(candidateScanner);

              const qrToken = getCleanQrToken(decodedText);

              scanQrRef.current(qrToken, {
                onSuccess: (data) => {
                  if (!isMountedRef.current) return;

                  if (isFailedResponse(data)) {
                    const failedMessage = getMessage(data);
                    setStatus("error");
                    setCameraReady(false);
                    setMessage(
                      failedMessage
                        ? getFriendlyErrorMessage(failedMessage)
                        : "QR Code tidak dikenali atau Anda belum mendaftar"
                    );
                    setManualToken("");
                    return;
                  }

                  setStatus("success");
                  setCameraReady(false);
                  setMessage(getMessage(data) || "Presensi berhasil dicatat");
                  setManualToken("");
                },
                onError: (error) => {
                  if (!isMountedRef.current) return;

                  const errMsg =
                    error instanceof Error ? error.message.toLowerCase() : "";

                  if (
                    errMsg.includes("belum aktif") ||
                    errMsg.includes("belum mulai") ||
                    errMsg.includes("belum berlaku") ||
                    errMsg.includes("waktu")
                  ) {
                    setStatus("error");
                    setCameraReady(false);
                    setMessage("Anda belum bisa melakukan presensi");
                    setManualToken("");
                  } else if (
                    errMsg.includes("sudah melakukan presensi") ||
                    errMsg.includes("sudah presensi") ||
                    errMsg.includes("sudah tercatat")
                  ) {
                    setStatus("success");
                    setCameraReady(false);
                    setMessage("Anda sudah melakukan presensi");
                    setManualToken("");
                  } else {
                    setStatus("error");
                    setCameraReady(false);

                    const rawMessage =
                      error instanceof Error
                        ? error.message
                        : "Presensi gagal diproses";
                    setMessage(getFriendlyErrorMessage(rawMessage));
                  }

                  isProcessingRef.current = false;
                },
              });
            },
            () => {}
          );

          scanner = candidateScanner;
          selectedFacing = cameraOption.facing;
          break;
        } catch (cameraStartError) {
          lastStartError = cameraStartError;

          await clearScanner(candidateScanner);

          if (isCameraPermissionDenied(cameraStartError)) {
            throw cameraStartError;
          }

          if (process.env.NODE_ENV !== "production") {
            console.error("[ScanPage] camera attempt failed", {
              source: cameraOption.debugLabel,
              error: cameraStartError,
            });
          }
        }
      }

      if (!scanner) {
        throw lastStartError ?? new Error("Kamera gagal diaktifkan.");
      }

      try {
        const settings = scanner.getRunningTrackSettings();

        if (process.env.NODE_ENV !== "production") {
          console.log("[ScanPage] running camera settings", settings);
        }

        if (settings.facingMode === "user") {
          selectedFacing = "front";
        } else if (settings.facingMode === "environment") {
          selectedFacing = "back";
        }
      } catch (settingsError) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(
            "[ScanPage] running camera settings unavailable",
            settingsError
          );
        }
      }

      if (!isMountedRef.current || scannerRef.current !== scanner) {
        await clearScanner(scanner);
        return;
      }

      cameraPermissionRef.current = "granted";
      setCameraPermission("granted");
      setCameraReady(true);
      setCameraFacing(selectedFacing);
      setIsCameraStarting(false);
      setMessage("Kamera aktif. Arahkan ke QR Code event.");
    } catch (error) {
      const permissionDenied = isCameraPermissionDenied(error);

      if (process.env.NODE_ENV !== "production") {
        if (permissionDenied) {
          console.warn("[ScanPage] camera permission denied", error);
        } else {
          console.error("[ScanPage] camera start failed", error);
        }
      }

      const failedScanner = scannerRef.current;
      if (failedScanner && !failedScanner.isScanning) {
        await clearScanner(failedScanner);
      }

      if (isMountedRef.current) {
        if (permissionDenied) {
          cameraPermissionRef.current = "denied";
          setCameraPermission("denied");
        }

        setStatus("error");
        setCameraReady(false);
        setCameraFacing("unknown");
        setIsCameraStarting(false);
        setMessage(
          permissionDenied
            ? "Izin kamera diblokir. Buka pengaturan situs pada browser, izinkan akses kamera, lalu coba lagi."
            : getCameraErrorMessage(error)
        );
      }
    } finally {
      isStartingRef.current = false;
    }
  }, [clearScanner, stopScanner]);

  const resetScanner = async () => {
    await stopScanner();
    await clearScanner();

    scannerRef.current = null;
    isProcessingRef.current = false;

    setStatus("idle");
    setCameraReady(false);
    setMessage("Arahkan kamera ke QR Code event untuk melakukan presensi");
    setManualToken("");
    setManualError("");
  };

  const handleRetryCamera = async () => {
    const permissionState = await getCameraPermissionState();
    cameraPermissionRef.current = permissionState;
    setCameraPermission(permissionState);

    if (permissionState === "denied") {
      isProcessingRef.current = false;
      isStartingRef.current = false;
      await stopAndClearScanner();

      setStatus("error");
      setCameraReady(false);
      setCameraFacing("unknown");
      setIsCameraStarting(false);
      setMessage(
        "Izin kamera masih diblokir. Izinkan kamera melalui pengaturan situs browser, lalu tekan tombol ini kembali."
      );
      return;
    }

    isProcessingRef.current = false;
    isStartingRef.current = false;

    await stopAndClearScanner();

    if (isMountedRef.current) {
      await startScanner();
    }
  };

  const handleManualSubmit = async () => {
    if (isProcessingRef.current) return;

    if (!manualToken.trim()) {
      setManualError("Kode presensi wajib diisi.");
      return;
    }

    setManualError("");
    isProcessingRef.current = true;
    setMessage("Memproses presensi manual...");
    await stopScanner();

    const qrToken = getCleanQrToken(manualToken);

    scanQr(qrToken, {
      onSuccess: (data) => {
        if (isFailedResponse(data)) {
          const failedMessage = getMessage(data);
          setStatus("error");
          setCameraReady(false);
          setMessage(
            failedMessage
              ? getFriendlyErrorMessage(failedMessage)
              : "QR Code tidak dikenali atau Anda belum mendaftar"
          );
          setManualToken("");
          return;
        }

        setStatus("success");
        setCameraReady(false);
        setMessage(getMessage(data) || "Presensi berhasil dicatat");
        setManualToken("");
      },
      onError: (error) => {
        const errMsg =
          error instanceof Error ? error.message.toLowerCase() : "";

        if (
          errMsg.includes("belum aktif") ||
          errMsg.includes("belum mulai") ||
          errMsg.includes("belum berlaku") ||
          errMsg.includes("waktu")
        ) {
          setStatus("error");
          setCameraReady(false);
          setMessage("Anda belum bisa melakukan presensi");
          setManualToken("");
        } else if (
          errMsg.includes("sudah melakukan presensi") ||
          errMsg.includes("sudah presensi") ||
          errMsg.includes("sudah tercatat")
        ) {
          setStatus("success");
          setCameraReady(false);
          setMessage("Anda sudah melakukan presensi");
          setManualToken("");
        } else {
          setStatus("error");
          setCameraReady(false);

          const rawMessage =
            error instanceof Error
              ? error.message
              : "Presensi gagal diproses";
          setMessage(getFriendlyErrorMessage(rawMessage));
        }

        isProcessingRef.current = false;
      },
    });
  };

  useEffect(() => {
    let disposed = false;

    const updatePermissionState = (nextState: CameraPermissionState) => {
      if (disposed) return;

      const previousState = cameraPermissionRef.current;

      if (nextState === "unsupported" && previousState === "denied") {
        return;
      }

      cameraPermissionRef.current = nextState;
      setCameraPermission(nextState);

      if (nextState === "denied") {
        setStatus("error");
        setCameraReady(false);
        setCameraFacing("unknown");
        setIsCameraStarting(false);
        setMessage(
          "Izin kamera diblokir. Buka pengaturan situs pada browser, izinkan akses kamera, lalu coba lagi."
        );
        void stopAndClearScanner();
      } else if (
        previousState === "denied" &&
        nextState === "granted" &&
        !scannerRef.current?.isScanning
      ) {
        setStatus("error");
        setMessage(
          "Izin kamera sudah diberikan. Tekan tombol untuk mengaktifkan kamera."
        );
      } else if (
        previousState === "denied" &&
        nextState === "prompt" &&
        !scannerRef.current?.isScanning
      ) {
        setStatus("error");
        setMessage(
          "Izin kamera dapat diminta kembali. Tekan tombol untuk mengaktifkan kamera."
        );
      }
    };

    const handlePermissionChange = () => {
      const permissionStatus = permissionStatusRef.current;
      if (permissionStatus) {
        updatePermissionState(permissionStatus.state);
      }
    };

    const watchPermission = async () => {
      if (!navigator.permissions?.query) {
        updatePermissionState("unsupported");
        return;
      }

      try {
        const permissionStatus = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });

        if (disposed) return;

        permissionStatusRef.current = permissionStatus;
        updatePermissionState(permissionStatus.state);
        permissionStatus.addEventListener("change", handlePermissionChange);
      } catch {
        updatePermissionState("unsupported");
      }
    };

    const handleWindowFocus = async () => {
      const permissionState = await getCameraPermissionState();
      updatePermissionState(permissionState);
    };

    void watchPermission();
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      disposed = true;
      window.removeEventListener("focus", handleWindowFocus);
      permissionStatusRef.current?.removeEventListener(
        "change",
        handlePermissionChange
      );
      permissionStatusRef.current = null;
    };
  }, [stopAndClearScanner]);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    const frameId = window.requestAnimationFrame(() => {
      if (cancelled || !isMountedRef.current) return;

      void startScanner();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      isMountedRef.current = false;
      void stopAndClearScanner();
    };
  }, [startScanner, stopAndClearScanner]);

  return (
    <div className="-mx-3 sm:-mx-4 px-3 sm:px-4 pt-3 pb-4 bg-slate-50">
      <section className="text-center">
        <h1 className="text-[19px] font-bold text-gray-800">
          Pindai QR Presensi
        </h1>

        <div className="mt-1.5 px-2 sm:px-6">
          {status === "error" && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm font-semibold mb-2 shadow-sm animate-in slide-in-from-top-2">
              {message}
            </div>
          )}

          {status === "success" && (
            <div className="bg-green-50 border border-green-100 text-[#41A07E] p-3 rounded-xl text-sm font-semibold mb-2 shadow-sm animate-in slide-in-from-top-2">
              {message}
            </div>
          )}

          {status !== "error" && status !== "success" && (
            <p className="text-xs text-gray-500 leading-snug font-medium sm:text-sm">
              {message}
            </p>
          )}
        </div>
      </section>

      {cameraPermission === "denied" && (
        <section className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-amber-900">
          <h2 className="text-sm font-bold">Izin kamera diblokir</h2>
          <p className="mt-1 text-xs leading-relaxed">
            Browser tidak dapat meminta izin kembali secara otomatis. Ubah izin
            kamera melalui pengaturan situs, lalu cek ulang izin.
          </p>
          <ol className="mt-2 list-decimal space-y-0.5 pl-4 text-xs leading-relaxed">
            <li>Buka ikon kunci atau kamera di address bar.</li>
            <li>Pilih izin Kamera.</li>
            <li>Ubah menjadi Izinkan atau Allow.</li>
            <li>Kembali ke halaman ini.</li>
            <li>Tekan Cek Ulang Izin Kamera.</li>
          </ol>
        </section>
      )}

      <section className="mt-3">
        <div className="qr-scanner-shell relative mx-auto aspect-square w-full max-w-[330px] bg-slate-950 rounded-[22px] overflow-hidden shadow-xl flex items-center justify-center border border-white/70">
          <div
            id="qr-reader"
            className={`qr-scanner-reader w-full h-full ${
              cameraFacing === "front" ? "is-front-camera" : ""
            }`}
          />

          {!cameraReady && (
            <div className="absolute inset-0 z-20 flex items-center justify-center text-slate-500 bg-slate-950">
              {status === "success" ? (
                <div className="w-16 h-16 rounded-full bg-[#41A07E] text-white flex items-center justify-center shadow-md shadow-[#B2DE96]/30">
                  <Icon name="check" className="w-9 h-9" />
                </div>
              ) : status === "error" ? (
                <div className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                  <Icon name="x" className="w-9 h-9" />
                </div>
              ) : (
                <Icon name="camera" className="w-14 h-14" />
              )}
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 z-10 bg-slate-950/20" />

          <div className="pointer-events-none absolute inset-x-[12%] inset-y-[12%] z-20 rounded-[28px]">
            {cameraReady && (
              <div className="qr-scanner-sweep absolute left-3 right-3 h-12 rounded-full" />
            )}

            <div className="absolute top-0 left-0 w-12 h-12 sm:w-14 sm:h-14 border-t-[5px] border-l-[5px] border-[#41A07E] rounded-tl-[18px] shadow-[0_0_18px_rgba(65,160,126,0.35)]" />
            <div className="absolute top-0 right-0 w-12 h-12 sm:w-14 sm:h-14 border-t-[5px] border-r-[5px] border-[#41A07E] rounded-tr-[18px] shadow-[0_0_18px_rgba(65,160,126,0.35)]" />
            <div className="absolute bottom-0 left-0 w-12 h-12 sm:w-14 sm:h-14 border-b-[5px] border-l-[5px] border-[#41A07E] rounded-bl-[18px] shadow-[0_0_18px_rgba(65,160,126,0.35)]" />
            <div className="absolute bottom-0 right-0 w-12 h-12 sm:w-14 sm:h-14 border-b-[5px] border-r-[5px] border-[#41A07E] rounded-br-[18px] shadow-[0_0_18px_rgba(65,160,126,0.35)]" />
          </div>
        </div>

        {(status === "idle" || status === "error") && !isCameraStarting && (
          <button
            onClick={status === "error" ? handleRetryCamera : startScanner}
            disabled={isScanPending}
            className="mt-3 w-full rounded-2xl bg-[#41A07E] py-3 font-semibold text-white shadow-md shadow-[#B2DE96]/30 transition-colors hover:bg-[#357f65] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <Icon name="camera" className="w-4 h-4" />
            {cameraPermission === "denied"
              ? "Cek Ulang Izin Kamera"
              : status === "error"
                ? "Coba Aktifkan Kamera"
                : "Aktifkan Kamera"}
          </button>
        )}

        {status === "scanning" && !isCameraStarting && (
          <button
            onClick={resetScanner}
            disabled={isScanPending}
            className="mt-3 w-full rounded-2xl py-3 font-semibold text-[#41A07E] bg-white border border-green-100 transition-colors hover:bg-green-50 active:scale-[0.98] disabled:opacity-60"
          >
            Matikan Kamera
          </button>
        )}

        {status === "success" && (
          <button
            onClick={() => router.push("/alumni/main/riwayat")}
            className="mt-3 w-full rounded-2xl bg-[#41A07E] py-3 font-semibold text-white shadow-md shadow-[#B2DE96]/30 transition-colors hover:bg-[#357f65] active:scale-[0.98]"
          >
            Lihat Riwayat Kehadiran
          </button>
        )}
      </section>

      {status !== "success" && (
        <section className="mt-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="font-bold text-gray-800 text-sm mb-2">
            Masukkan Kode Manual
          </h2>

          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Gunakan opsi ini jika kamera perangkat Anda bermasalah atau tidak
            dapat membaca QR Code.
          </p>

          <div>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => {
                  setManualToken(e.target.value);

                  if (manualError) {
                    setManualError("");
                  }
                }}
                placeholder="Masukkan kode presensi..."
                aria-invalid={Boolean(manualError)}
                aria-describedby={manualError ? "manual-code-error" : undefined}
                className={`flex-1 bg-gray-50 border text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 transition-colors ${
                  manualError
                    ? "border-red-400 focus:border-red-400 focus:ring-red-400"
                    : "border-gray-200 focus:border-[#41A07E] focus:ring-[#41A07E]"
                }`}
                disabled={isScanPending}
              />

              <button
                onClick={handleManualSubmit}
                disabled={isScanPending}
                className="bg-[#41A07E] hover:bg-[#357f65] disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-md shadow-[#B2DE96]/30 transition-colors active:scale-[0.98] flex items-center justify-center min-w-[80px]"
              >
                {isScanPending ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Kirim"
                )}
              </button>
            </div>

            {manualError && (
              <p
                id="manual-code-error"
                className="mt-2 text-xs font-medium text-red-500"
              >
                {manualError}
              </p>
            )}
          </div>
        </section>
      )}

      <section className="mt-5 rounded-2xl border border-green-100 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <Icon
            name="info"
            className="w-5 h-5 text-[#41A07E] mt-0.5 flex-shrink-0"
          />

          <div>
            <h2 className="font-bold text-gray-800 text-sm">
              Tips Memindai QR Code
            </h2>

            <ul className="text-xs text-gray-500 mt-1 space-y-1 leading-relaxed">
              <li>• Pastikan QR Code berada di dalam bingkai</li>
              <li>• Hindari pantulan cahaya pada QR Code</li>
              <li>• Pegang kamera dengan stabil</li>
              <li>• Gunakan pencahayaan yang cukup</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

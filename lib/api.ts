import axios from "axios";
import { handleAutoLogout } from "./heartbeat";

const getBaseUrl = () => {
  // Check both NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_API_URL for backward compatibility
  if (process.env.NEXT_PUBLIC_API_BASE_URL)
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;

  // Fallback to backend Laravel API, not Next.js frontend
  return "http://127.0.0.1:8000/api";
};

export const API_BASE_URL = getBaseUrl();
const BACKEND_HOST = API_BASE_URL.replace("/api", "");

export function getImageUrl(path?: string | null) {
  if (!path) return "";

  // Use only the origin (protocol + host) to avoid subfolder prefixes
  // e.g. API_BASE_URL "https://ppalfalah.id/.ppalfalah.id/api" → origin "https://ppalfalah.id"
  let origin: string;
  try {
    origin = new URL(API_BASE_URL).origin;
  } catch {
    origin = BACKEND_HOST;
  }

  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path);
      return `${origin}${url.pathname}`;
    } catch {
      return path;
    }
  }
  if (path.startsWith("/")) return `${origin}${path}`;
  return `${origin}/${path}`;
}

function getAuthToken() {
  if (typeof window === "undefined") return null;

  const pathname = window.location.pathname;
  if (pathname.startsWith("/admin")) {
    return (
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      localStorage.getItem("token")
    );
  } else if (pathname.startsWith("/alumni")) {
    return (
      localStorage.getItem("alumni_token") ||
      sessionStorage.getItem("alumni_token")
    );
  }

  return (
    localStorage.getItem("alumni_token") ||
    sessionStorage.getItem("alumni_token") ||
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token")
  );
}

export function clearAuthStorage() {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("just_logged_out", "true");
  // Clear localStorage (legacy + migration)
  localStorage.removeItem("access_token");
  localStorage.removeItem("admin_token");
  localStorage.removeItem("alumni_token");
  localStorage.removeItem("token");
  localStorage.removeItem("token_type");
  localStorage.removeItem("user");
  localStorage.removeItem("role");
  localStorage.removeItem("dummy_profile");
  // Clear sessionStorage (primary storage)
  sessionStorage.removeItem("alumni_token");
  sessionStorage.removeItem("access_token");
  sessionStorage.removeItem("token_type");
  sessionStorage.removeItem("user");
  sessionStorage.removeItem("role");
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // jangan pakai withCredentials kalau pakai Bearer token
  withCredentials: false,
});

// Request interceptor: attach token dari localStorage
api.interceptors.request.use((config) => {
  const token = getAuthToken();
  const isFormData =
    typeof FormData !== "undefined" && config.data instanceof FormData;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (isFormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

// Response interceptor: handle 401 — auto-logout via heartbeat module
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      const currentPath = window.location.pathname;

      // Don't redirect if already on login/register/forgot/reset pages
      // Let the form handle showing credential error messages
      const isAuthPage =
        currentPath.includes("/login") ||
        currentPath.includes("/register") ||
        currentPath.includes("/forgot-password") ||
        currentPath.includes("/reset-password");

      if (!isAuthPage) {
        // handleAutoLogout akan clear storage + stop heartbeat + redirect
        handleAutoLogout();
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function formatValidationErrors(errors: unknown) {
  if (!errors || typeof errors !== "object") return "";

  return Object.values(errors)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string => typeof value === "string")
    .map((value) => toFriendlyErrorMessage(value))
    .join(" ");
}

function getErrorData(error: unknown) {
  if (error instanceof ApiError) return error.data;
  if (axios.isAxiosError(error)) return error.response?.data;
  return null;
}

function getErrorStatus(error: unknown) {
  if (error instanceof ApiError) return error.status;
  if (axios.isAxiosError(error)) return error.response?.status;
  return undefined;
}

const FIELD_LABELS: Record<string, string> = {
  first_name: "nama depan",
  last_name: "nama belakang",
  name: "nama",
  gender: "jenis kelamin",
  email: "email",
  phone: "nomor telepon",
  graduation_year: "tahun lulus",
  birth_date: "tanggal lahir",
  password: "kata sandi",
  password_confirmation: "konfirmasi kata sandi",
  current_password: "kata sandi lama",
  old_password: "kata sandi lama",
  new_password: "kata sandi baru",
  new_password_confirmation: "konfirmasi kata sandi baru",
  event_title: "judul event",
  description: "deskripsi",
  location: "lokasi",
  start_date: "tanggal mulai",
  end_date: "tanggal selesai",
  start_time: "jam mulai",
  end_time: "jam selesai",
  api_token: "token WhatsApp",
  sender_number: "nomor pengirim",
};

const TECHNICAL_ERROR_PATTERNS: Array<[RegExp, string]> = [
  [
    /network error/i,
    "Tidak dapat terhubung ke layanan. Periksa koneksi internet Anda, lalu coba lagi.",
  ],
  [
    /failed to fetch/i,
    "Tidak dapat terhubung ke layanan. Periksa koneksi internet Anda, lalu coba lagi.",
  ],
  [
    /load failed/i,
    "Tidak dapat memuat data. Periksa koneksi internet Anda, lalu coba lagi.",
  ],
  [
    /request failed with status code 400/i,
    "Data yang dikirim belum sesuai. Periksa kembali isian Anda.",
  ],
  [
    /request failed with status code 401/i,
    "Sesi Anda sudah berakhir. Silakan masuk kembali.",
  ],
  [
    /request failed with status code 403/i,
    "Anda tidak memiliki izin untuk melakukan tindakan ini.",
  ],
  [/request failed with status code 404/i, "Data yang dicari tidak ditemukan."],
  [
    /request failed with status code 422/i,
    "Ada isian yang belum sesuai. Periksa kembali data Anda.",
  ],
  [
    /request failed with status code 429/i,
    "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.",
  ],
  [
    /request failed with status code 5\d\d/i,
    "Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.",
  ],
  [/request failed/i, "Permintaan belum berhasil diproses. Silakan coba lagi."],
  [
    /unauthorized|unauthenticated/i,
    "Sesi Anda sudah berakhir. Silakan masuk kembali.",
  ],
  [/forbidden/i, "Anda tidak memiliki izin untuk melakukan tindakan ini."],
  [/not found/i, "Data yang dicari tidak ditemukan."],
  [
    /internal server error|server error/i,
    "Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.",
  ],
  [/timeout|timed out/i, "Koneksi terlalu lama merespons. Silakan coba lagi."],
  [
    /sqlstate|constraint|foreign key|duplicate entry|query exception|base table|column .* not found|undefined index|undefined property/i,
    "Data belum dapat diproses karena ada gangguan pada layanan. Silakan coba lagi atau hubungi admin.",
  ],
  [/invalid credentials|credentials/i, "Email atau kata sandi salah."],
  [/password confirmation/i, "Konfirmasi kata sandi belum sama."],
  [/email has already been taken/i, "Email ini sudah terdaftar."],
  [/phone has already been taken/i, "Nomor telepon ini sudah terdaftar."],
  [
    /token (expired|invalid)|invalid token|expired token/i,
    "Kode atau sesi sudah tidak berlaku. Silakan coba lagi.",
  ],
];

function replaceFieldNames(message: string) {
  return Object.entries(FIELD_LABELS).reduce((result, [field, label]) => {
    const spacedField = field.replaceAll("_", " ");
    return result
      .replace(new RegExp(`\\b${field}\\b`, "gi"), label)
      .replace(new RegExp(`\\b${spacedField}\\b`, "gi"), label);
  }, message);
}

export function toFriendlyErrorMessage(
  message: string,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
) {
  const cleaned = message.trim();
  if (!cleaned) return fallback;

  const lower = cleaned.toLowerCase();
  for (const [pattern, friendlyMessage] of TECHNICAL_ERROR_PATTERNS) {
    if (pattern.test(lower)) return friendlyMessage;
  }

  return replaceFieldNames(cleaned)
    .replace(/^the /i, "")
    .replace(/ field is required\.?$/i, " wajib diisi.")
    .replace(/ is required\.?$/i, " wajib diisi.")
    .replace(
      / must be a valid email address\.?$/i,
      " harus berisi alamat email yang benar.",
    )
    .replace(/ must be at least (\d+) characters\.?$/i, " minimal $1 karakter.")
    .replace(
      / may not be greater than (\d+) characters\.?$/i,
      " maksimal $1 karakter.",
    )
    .replace(/ has already been taken\.?$/i, " sudah terdaftar.")
    .replace(/ does not match\.?$/i, " belum sesuai.")
    .replace(/ is invalid\.?$/i, " belum sesuai.")
    .replace(/\bbackend\b/gi, "layanan")
    .replace(/\bserver\b/gi, "layanan")
    .replace(/\buser\b/gi, "pengguna")
    .replace(/\brole\b/gi, "hak akses")
    .replace(/\bgenerate\b/gi, "membuat")
    .replace(/\blogin\b/gi, "masuk");
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
) {
  if (!(error instanceof Error)) return fallback;

  const data = getErrorData(error) as {
    message?: unknown;
    error?: unknown;
    errors?: unknown;
  } | null;

  const message =
    typeof data?.message === "string"
      ? data.message
      : typeof data?.error === "string"
        ? data.error
        : "";
  const validation = formatValidationErrors(data?.errors);

  if (message || validation) {
    return toFriendlyErrorMessage(
      [message, validation].filter(Boolean).join(" "),
      fallback,
    );
  }

  const status = getErrorStatus(error);
  if (status === 400)
    return "Data yang dikirim belum sesuai. Periksa kembali isian Anda.";
  if (status === 401) return "Sesi Anda sudah berakhir. Silakan masuk kembali.";
  if (status === 403)
    return "Anda tidak memiliki izin untuk melakukan tindakan ini.";
  if (status === 404) return "Data yang dicari tidak ditemukan.";
  if (status === 422)
    return "Ada isian yang belum sesuai. Periksa kembali data Anda.";
  if (status === 429)
    return "Terlalu banyak percobaan. Tunggu sebentar, lalu coba lagi.";
  if (status && status >= 500)
    return "Layanan sedang mengalami gangguan. Silakan coba lagi beberapa saat lagi.";

  return toFriendlyErrorMessage(error.message || fallback, fallback);
}

export function getApiFieldErrors(error: unknown) {
  const data = getErrorData(error) as { errors?: unknown } | null;
  const errors = data?.errors;

  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return {} as Record<string, string[]>;
  }

  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [
      key,
      (Array.isArray(value) ? value : [value])
        .filter((item): item is string => typeof item === "string")
        .map((item) => toFriendlyErrorMessage(item)),
    ]),
  );
}

// Helper function untuk fetch-style API calls
export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const token = getAuthToken();
  const isFormData =
    typeof FormData !== "undefined" && options?.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      getApiErrorMessage(new ApiError("Request failed", response.status, data)),
      response.status,
      data,
    );
  }

  return data;
}

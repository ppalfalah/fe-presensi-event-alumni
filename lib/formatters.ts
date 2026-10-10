/**
 * Shared formatting utilities for UI presentation.
 */

/**
 * Format domicile wording by abbreviating "kabupaten" to "kab." / "Kab."
 * Example:
 * - "Kabupaten Simeulue" -> "Kab. Simeulue"
 * - "kabupaten bogor" -> "kab. bogor"
 * - "Kota Bandung" -> "Kota Bandung"
 */
export function formatDomicileName(name?: string | null): string {
  if (!name) return "";
  return name.replace(/\bkabupaten\b\.?/gi, (match) => {
    return match.startsWith("kabupaten") ? "kab." : "Kab.";
  });
}

/**
 * Format combined domicile string (city and optional province).
 * Example:
 * - ("Kabupaten Bandung", "Jawa Barat") -> "Kab. Bandung, Jawa Barat"
 * - ("Kota Bandung", null) -> "Kota Bandung"
 */
export function formatDomicile(
  cityName?: string | null,
  provinceName?: string | null,
  fallback = "-"
): string {
  if (!cityName || cityName === "Tidak diketahui") return fallback;
  const formattedCity = formatDomicileName(cityName);
  return provinceName ? `${formattedCity}, ${provinceName}` : formattedCity;
}

/**
 * Parse any date input safely into a Date instance.
 * Handles date-only "YYYY-MM-DD" strings without UTC timezone shifting.
 */
export function parseDate(
  dateValue?: string | number | Date | null
): Date | null {
  if (!dateValue) return null;
  if (dateValue instanceof Date) {
    return Number.isNaN(dateValue.getTime()) ? null : dateValue;
  }
  if (typeof dateValue === "string") {
    const trimmed = dateValue.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [y, m, d] = trimmed.split("-").map(Number);
      return new Date(y, m - 1, d);
    }
    const parsed = new Date(trimmed);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format date to standard Indonesian abbreviated format.
 * Example:
 * - "2026-12-19" -> "19 Des 2026"
 */
export function formatDate(
  dateValue?: string | number | Date | null,
  fallback = "-"
): string {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Format datetime to Indonesian format with short month and 24h time.
 * Example:
 * - "2026-12-19T14:30:00" -> "19 Des 2026, 14:30"
 */
export function formatDateTimeIndonesia(
  dateValue?: string | number | Date | null,
  fallback = "-"
): string {
  const date = parseDate(dateValue);
  if (!date) return fallback;

  const datePart = date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const timeParts = new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return `${datePart}, ${hour}:${minute}`;
}

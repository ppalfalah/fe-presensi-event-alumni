"use client";

import { useEffect, useState } from "react";
import {
  Info,
  Plus,
  Trash2,
  X,
  CalendarDays,
  MapPin,
  Pencil,
  Power,
  Megaphone,
  Search,
  Users,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import {
  FormInput,
  FormSelect,
  FormTextarea,
} from "@/app/components/FormControl";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import FeedbackToast from "@/app/components/FeedbackToast";
import SearchInput from "@/app/components/SearchInput";
import { getApiErrorMessage, getApiFieldErrors } from "@/lib/api";
import {
  useEvents,
  useCreateEvent,
  useCreateEventCategory,
  useUpdateEvent,
  useUpdateEventCategory,
  useDeleteEventCategory,
  useToggleEvent,
  useEventCategories,
  useEvent,
  useEventRegistrations,
  type CategoryObject,
  type Event,
  type EventActiveStatus,
  type EventCategory,
  type EventPayload,
  type EventStatus,
} from "@/hooks/admin/useEvents";
import type { EventBroadcastTarget } from "@/hooks/admin/useBroadcast";
import { useEventBroadcastForm } from "./_hooks/useEventBroadcastForm";
import {
  parseEventDate,
  sanitizeBroadcastMessage,
} from "./_utils/eventFormatters";

type EventFormMode = "create" | "edit";
type CategoryFormMode = "create" | "edit";

type EventFormState = {
  category_id: number;
  event_title: string;
  description: string;
  location: string;
  event_date: string;
  start_time: string;
  end_time: string;
  quota: number | "";
  poster?: File | null;
};

type EventFormErrors = Partial<Record<keyof EventFormState, string[]>>;

const initialEventForm: EventFormState = {
  category_id: 0,
  event_title: "",
  description: "",
  location: "",
  event_date: "",
  start_time: "",
  end_time: "",
  quota: "",
  poster: null,
};

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    if (value.includes("T")) {
      return value.split("T")[0];
    }
    return value.slice(0, 10);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getTodayDateInput() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function toInputTime(value?: string | null) {
  if (!value) return "";

  return value.slice(0, 5);
}

function getRegisteredCount(event: Event) {
  return event.quota_used ?? event.registered ?? 0;
}

function getRemainingQuota(event: Event) {
  return event.remaining_quota ?? null;
}

function getQuotaPercent(event: Event) {
  if (!event.quota) return 0;

  return Math.min(
    Math.round((getRegisteredCount(event) / event.quota) * 100),
    100,
  );
}

function getQuotaLabel(event: Event) {
  if (
    event.quota === null ||
    event.quota === undefined ||
    event.quota_status === "unlimited"
  ) {
    return "Tidak terbatas";
  }

  return `${getRegisteredCount(event)}/${event.quota}`;
}

function getRemainingQuotaLabel(event: Event) {
  const remainingQuota = getRemainingQuota(event);
  return remainingQuota === null ? "Tidak terbatas" : remainingQuota;
}

const eventCategoryStyles = [
  "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
  "bg-amber-100 text-amber-800 ring-1 ring-amber-200",
  "bg-lime-100 text-lime-800 ring-1 ring-lime-200",
  "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
  "bg-cyan-100 text-cyan-700 ring-1 ring-cyan-200",
  "bg-blue-100 text-blue-700 ring-1 ring-blue-200",
  "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200",
  "bg-fuchsia-100 text-fuchsia-700 ring-1 ring-fuchsia-200",
  "bg-stone-200 text-stone-700 ring-1 ring-stone-300",
];

function getEventCategoryLabel(
  category: Event["category"] | CategoryObject | null | undefined,
) {
  if (typeof category === "string") return category || "Tanpa kategori";
  if (category && typeof category === "object") {
    return category.category_name || "Tanpa kategori";
  }
  return "Tanpa kategori";
}

function getEventCategoryStyle(
  category: Event["category"],
  categoryId: number | null | undefined,
  categories: EventCategory[],
) {
  const label = getEventCategoryLabel(category).trim().toLowerCase();
  const orderedCategories = [...categories].sort((a, b) => a.id - b.id);

  const categoryIndex = orderedCategories.findIndex((item) => {
    if (categoryId != null && item.id === categoryId) return true;

    return item.category_name.trim().toLowerCase() === label;
  });

  const colorIndex =
    categoryIndex >= 0 ? categoryIndex % eventCategoryStyles.length : 0;

  return eventCategoryStyles[colorIndex];
}

function getEventPublicationStatus(event: Event): EventActiveStatus {
  const status = event.raw_status_event ?? event.status_event;

  return status === "inactive" ? "inactive" : "active";
}

function getEventTimeStatus(event: Event): EventStatus {
  return event.status_event === "Selesai" ? "Selesai" : "Mendatang";
}

function isEventPublished(event: Event) {
  return getEventPublicationStatus(event) === "active";
}

function formatDateTimeIndonesia(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

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
  const minute =
    timeParts.find((part) => part.type === "minute")?.value ?? "00";

  return `${datePart}, ${hour}:${minute}`;
}

function isValidPoster(file: File) {
  const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  return validTypes.includes(file.type) && file.size <= 5 * 1024 * 1024;
}

function hasEventValueChanged(
  key: keyof EventFormState,
  nextValue: EventFormState[keyof EventFormState],
  event: Event,
) {
  if (key === "poster") return nextValue instanceof File;
  if (key === "category_id")
    return Number(nextValue) !== (event.category_id ?? 0);
  if (key === "quota") {
    const currentQuota = event.quota ?? "";
    return nextValue !== currentQuota;
  }

  if (key === "event_date") {
    return nextValue !== toInputDate(event.event_date ?? event.event_datetime);
  }

  if (key === "start_time") return nextValue !== toInputTime(event.start_time);
  if (key === "end_time") return nextValue !== toInputTime(event.end_time);

  return nextValue !== event[key as keyof Event];
}

function buildChangedEventPayload(form: EventFormState, event: Event) {
  const payload: Partial<EventPayload> = {};

  (Object.keys(form) as Array<keyof EventFormState>).forEach((key) => {
    const value = form[key];
    if (value === "" || value === null || value === undefined) return;

    if (hasEventValueChanged(key, value, event)) {
      if (key === "quota") {
        payload.quota = Number(value);
      } else if (key === "poster") {
        payload.poster = value as File;
      } else {
        payload[key] = value as never;
      }
    }
  });

  return payload;
}

type CategoryComparableEvent = {
  category_id?: number | null;
  category?: string | CategoryObject | null;
};

function eventUsesCategory(
  event: CategoryComparableEvent,
  category: EventCategory,
) {
  if (event.category_id != null && Number(event.category_id) === category.id) {
    return true;
  }

  if (typeof event.category === "string") {
    return (
      event.category.trim().toLowerCase() ===
      category.category_name.trim().toLowerCase()
    );
  }

  if (event.category && typeof event.category === "object") {
    const eventCategoryName = event.category.category_name;

    return (
      event.category.id === category.id ||
      (typeof eventCategoryName === "string" &&
        eventCategoryName.trim().toLowerCase() ===
          category.category_name.trim().toLowerCase())
    );
  }

  return false;
}

function getCategoryUsageCount(
  category: EventCategory,
  events: CategoryComparableEvent[],
) {
  return events.filter((event) => eventUsesCategory(event, category)).length;
}

// ─── 3D Icon ─────────────────────────────────────────────────────────────────
function Icon3D({
  children,
  variant = "teal",
  size = "md",
}: {
  children: React.ReactNode;
  variant?: "teal" | "blue" | "green" | "gold" | "red" | "gray";
  size?: "sm" | "md";
}) {
  const variants = {
    teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
    blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
    green: "from-[#0D5C3A] via-[#0F7047] to-[#0D5C3A] text-white",
    gold: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
    red: "from-red-500 via-red-600 to-red-700 text-white",
    gray: "from-gray-400 via-gray-500 to-gray-600 text-white",
  };

  const sizes = {
    sm: "w-7 h-7 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
  };

  return (
    <span
      className={`${sizes[size]} inline-flex items-center justify-center bg-gradient-to-br ${variants[variant]} shadow-lg shadow-[#0D5C3A]/20 border border-white/40 ring-1 ring-[#D4AF37]/20`}
    >
      <span className="drop-shadow-sm">{children}</span>
    </span>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="bg-white border border-[#0D5C3A]/10 rounded-2xl p-4 shadow-sm animate-pulse">
      <div className="h-4 bg-[#E8F5E9] rounded w-3/4 mb-3" />
      <div className="h-3 bg-[#E8F5E9]/70 rounded w-1/4 mb-4" />
      <div className="h-3 bg-[#E8F5E9]/70 rounded w-1/2 mb-2" />
      <div className="h-3 bg-[#E8F5E9]/70 rounded w-2/3" />
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub: string;
  accent?: string;
}) {
  return (
    <div
      className={`bg-white rounded-2xl border p-4 flex flex-col gap-1 shadow-sm ${
        accent ? `border-l-4 ${accent}` : "border-[#0D5C3A]/10"
      }`}
    >
      <p className="text-xs text-[#0D5C3A]/60">{label}</p>
      <p
        className={`text-3xl font-bold ${accent ? "text-[#0D5C3A]" : "text-[#0D5C3A]"}`}
      >
        {value}
      </p>
      <p className="text-xs text-[#0D5C3A]/50">{sub}</p>
    </div>
  );
}

const broadcastTargetDescriptions: Record<
  EventBroadcastTarget,
  { label: string; description: string }
> = {
  all: {
    label: "Semua alumni",
    description:
      "Pesan massal akan dikirim ke seluruh alumni yang memiliki nomor HP valid.",
  },
  registered: {
    label: "Terdaftar event",
    description:
      "Pesan massal hanya dikirim ke alumni yang sudah terdaftar pada event ini.",
  },
  custom: {
    label: "Nomor manual",
    description:
      "Pesan massal hanya dikirim ke daftar nomor yang Anda masukkan satu per satu.",
  },
};

function EventCategorySection({
  categories,
  events,
  isLoading,
  isError,
  isUsageLoading,
  isUsageUnavailable,
  actionError,
  onRetry,
  onCreate,
  onEdit,
  onDelete,
}: {
  categories: EventCategory[];
  events: Event[];
  isLoading: boolean;
  isError: boolean;
  isUsageLoading: boolean;
  isUsageUnavailable: boolean;
  actionError: string | null;
  onRetry: () => void;
  onCreate: () => void;
  onEdit: (category: EventCategory) => void;
  onDelete: (category: EventCategory) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mb-5 rounded-2xl border border-gray-100 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        aria-controls="event-category-management"
        className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left transition hover:bg-gray-50"
      >
        <div className="min-w-0">
          <h2 className="text-base font-bold text-gray-800">
            Kelola Kategori Event
          </h2>
          <p className="text-xs text-gray-400">
            Kelola kategori yang digunakan pada data event
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {!isLoading && !isError && (
            <span className="hidden rounded-full bg-[#7AB2B2]/10 px-2.5 py-1 text-xs font-semibold text-[#2D7EA0] sm:inline">
              {categories.length} kategori
            </span>
          )}

          <span
            className={`text-gray-400 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : ""
            }`}
          >
            ▾
          </span>
        </div>
      </button>

      {isExpanded && (
        <div
          id="event-category-management"
          className="space-y-4 border-t border-gray-100 px-5 pb-5 pt-4"
        >
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onCreate}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0D5C3A]/20 transition-all"
            >
              <Plus size={16} />
              Tambah Kategori
            </button>
          </div>

          {actionError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {actionError}
            </div>
          )}

          {isLoading && (
            <div className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-400">
              Memuat kategori...
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">
              <p>Gagal memuat kategori event.</p>
              <button
                type="button"
                onClick={onRetry}
                className="mt-2 font-semibold text-[#2D7EA0] hover:underline"
              >
                Coba lagi
              </button>
            </div>
          )}

          {!isLoading && !isError && categories.length === 0 && (
            <div className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-400">
              Belum ada kategori event
            </div>
          )}

          {!isLoading && !isError && categories.length > 0 && (
            <div className="cursor-default overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full cursor-default overflow-hidden rounded-xl">
                <thead className="cursor-default bg-[#7AB2B2]/20">
                  <tr>
                    <th className="cursor-default px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Nama kategori
                    </th>
                    <th className="cursor-default px-3 py-2 text-left text-xs font-semibold text-gray-700">
                      Deskripsi
                    </th>
                    <th className="cursor-default px-3 py-2 text-center text-xs font-semibold text-gray-700">
                      Jumlah event
                    </th>
                    <th className="w-56 cursor-default px-3 py-2 text-center text-xs font-semibold text-gray-700">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="cursor-default">
                  {categories.map((category) => {
                    const usageCount = getCategoryUsageCount(category, events);
                    const deleteDisabled =
                      isUsageLoading || isUsageUnavailable || usageCount > 0;
                    const deleteTitle = isUsageLoading
                      ? "Sedang memeriksa penggunaan kategori"
                      : isUsageUnavailable
                        ? "Penggunaan kategori belum dapat diverifikasi"
                        : usageCount > 0
                          ? "Kategori masih digunakan oleh event"
                          : "Hapus kategori";

                    return (
                      <tr
                        key={category.id}
                        className="cursor-default border-b border-gray-200 transition-colors hover:bg-gray-50"
                      >
                        <td className="cursor-default px-3 py-2">
                          <span className="cursor-default text-sm font-semibold text-gray-800">
                            {category.category_name}
                          </span>
                        </td>
                        <td className="max-w-md cursor-default px-3 py-2 text-xs text-gray-500">
                          {category.description || "-"}
                        </td>
                        <td className="cursor-default px-3 py-2 text-center">
                          <span className="inline-flex min-w-8 cursor-default items-center justify-center rounded-lg bg-[#7AB2B2]/20 px-2.5 py-1 text-xs font-medium text-cyan-700">
                            {isUsageLoading || isUsageUnavailable
                              ? "..."
                              : usageCount}
                          </span>
                        </td>
                        <td className="w-56 cursor-default px-3 py-2">
                          <div className="flex cursor-default items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEdit(category)}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-[#2D7EA0] transition-colors hover:bg-[#7AB2B2]/10"
                              title={`Ubah ${category.category_name}`}
                              aria-label={`Ubah ${category.category_name}`}
                            >
                              <Pencil size={15} strokeWidth={2.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDelete(category)}
                              disabled={deleteDisabled}
                              title={deleteTitle}
                              aria-label={`Hapus ${category.category_name}`}
                              className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-red-400 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              <Trash2 size={15} strokeWidth={2.5} />
                            </button>
                          </div>
                          {usageCount > 0 && !isUsageLoading && (
                            <p className="mt-0.5 cursor-default whitespace-nowrap text-center text-[11px] text-gray-400">
                              Kategori masih digunakan oleh event
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryFormModal({
  mode,
  category,
  onClose,
  onSuccess,
}: {
  mode: CategoryFormMode;
  category: EventCategory | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const createCategory = useCreateEventCategory();
  const updateCategory = useUpdateEventCategory();
  const [categoryName, setCategoryName] = useState(
    () => category?.category_name ?? "",
  );
  const [description, setDescription] = useState(
    () => category?.description ?? "",
  );
  const [fieldError, setFieldError] = useState("");
  const mutation = mode === "create" ? createCategory : updateCategory;
  const isPending = mutation.isPending;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedName = categoryName.trim();
    if (!normalizedName) {
      setFieldError("Nama kategori wajib diisi.");
      return;
    }

    setFieldError("");
    const payload = {
      category_name: normalizedName,
      description: description.trim() || null,
    };

    if (mode === "edit" && category) {
      updateCategory.mutate(
        { id: category.id, data: payload },
        {
          onSuccess: () => {
            onSuccess("Kategori event berhasil diperbarui");
            onClose();
          },
          onError: (error) => {
            const errors = getApiFieldErrors(error);
            setFieldError(errors.category_name?.[0] ?? "");
          },
        },
      );
      return;
    }

    createCategory.mutate(payload, {
      onSuccess: () => {
        onSuccess("Kategori event berhasil ditambahkan");
        onClose();
      },
      onError: (error) => {
        const errors = getApiFieldErrors(error);
        setFieldError(errors.category_name?.[0] ?? "");
      },
    });
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              {mode === "create" ? "Tambah Kategori" : "Ubah Kategori"}
            </h3>
            <p className="mt-1 text-xs text-gray-400">
              Kategori akan tersedia pada formulir event.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="rounded-xl p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-60"
            aria-label="Tutup modal kategori"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {mutation.error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {getApiErrorMessage(
                mutation.error,
                "Gagal memproses kategori event",
              )}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Nama kategori <span className="text-red-400">*</span>
            </label>
            <FormInput
              value={categoryName}
              onChange={(event) => {
                setCategoryName(event.target.value);
                setFieldError("");
              }}
              maxLength={100}
              placeholder="Contoh: Seminar"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#3EBDAF]"
            />
            {fieldError && (
              <p className="mt-1.5 text-xs text-red-500">{fieldError}</p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Deskripsi
            </label>
            <FormTextarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder="Deskripsi singkat kategori"
              className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#3EBDAF]"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isPending || !categoryName.trim()}
              className="rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-[#0D5C3A]/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending
                ? "Menyimpan..."
                : mode === "create"
                  ? "Tambah Kategori"
                  : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Create/Edit Event Modal ──────────────────────────────────────────────────
function EventFormModal({
  isOpen,
  mode,
  event,
  onClose,
  onSuccess,
}: {
  isOpen: boolean;
  mode: EventFormMode;
  event: Event | null;
  onClose: () => void;
  onSuccess?: (message: string) => void;
}) {
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  const {
    data: categories = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
  } = useEventCategories();

  const [form, setForm] = useState<EventFormState>(initialEventForm);
  const [formErrors, setFormErrors] = useState<EventFormErrors>({});

  useEffect(() => {
    if (!isOpen) return;

    if (mode === "edit" && event) {
      const matchedCategory = categories.find(
        (category) => category.category_name === event.category,
      );

      queueMicrotask(() => {
        setForm({
          category_id:
            event.category_id ?? matchedCategory?.id ?? categories[0]?.id ?? 0,
          event_title: event.event_title ?? "",
          description: event.description ?? "",
          location: event.location ?? "",
          event_date: toInputDate(event.event_date ?? event.event_datetime),
          start_time: toInputTime(event.start_time),
          end_time: toInputTime(event.end_time),
          quota: event.quota ?? "",
          poster: null,
        });
        setFormErrors({});
      });

      return;
    }

    queueMicrotask(() => {
      setForm({
        ...initialEventForm,
        category_id: categories[0]?.id ?? 0,
        poster: null,
      });
      setFormErrors({});
    });
  }, [isOpen, mode, event, categories]);

  if (!isOpen) return null;

  const isPending = createEvent.isPending || updateEvent.isPending;
  const isError = createEvent.isError || updateEvent.isError;

  const errorMessage = createEvent.isError
    ? getApiErrorMessage(createEvent.error, "Gagal menyimpan event")
    : updateEvent.isError
      ? getApiErrorMessage(updateEvent.error, "Gagal menyimpan event")
      : "Gagal menyimpan event";

  const getFieldError = (field: keyof EventFormState) =>
    formErrors[field]?.[0] ?? "";

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === "file" && "files" in e.target) {
      const files = (e.target as HTMLInputElement).files;
      const file = files && files.length > 0 ? files[0] : null;

      if (file && !isValidPoster(file)) {
        setFormErrors((prev) => ({
          ...prev,
          poster: ["Poster harus JPG, JPEG, PNG, atau WebP dan maksimal 5MB."],
        }));
        setForm((prev) => ({
          ...prev,
          [name]: null,
        }));
        return;
      }

      setFormErrors((prev) => ({ ...prev, poster: undefined }));
      setForm((prev) => ({
        ...prev,
        [name]: file,
      }));
      return;
    }

    setFormErrors((prev) => ({ ...prev, [name]: undefined }));
    setForm((prev) => ({
      ...prev,
      [name]: name === "category_id" ? Number(value) : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: EventFormErrors = {};
    const today = getTodayDateInput();

    if (!form.category_id) {
      nextErrors.category_id = ["Kategori wajib dipilih."];
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.event_date)) {
      nextErrors.event_date = ["Tanggal event harus berformat YYYY-MM-DD."];
    } else if (form.event_date < today) {
      nextErrors.event_date = [
        "Tanggal event tidak boleh lebih awal dari hari ini.",
      ];
    }

    if (form.start_time && form.end_time && form.end_time <= form.start_time) {
      nextErrors.end_time = ["Jam selesai harus lebih besar dari jam mulai."];
    }

    if (form.poster && !isValidPoster(form.poster)) {
      nextErrors.poster = [
        "Poster harus JPG, JPEG, PNG, atau WebP dan maksimal 5MB.",
      ];
    }

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors);
      return;
    }

    const payload: EventPayload = {
      category_id: form.category_id,
      event_title: form.event_title,
      description: form.description,
      location: form.location,
      event_date: form.event_date,
      start_time: form.start_time,
      end_time: form.end_time,
      poster: form.poster,
      ...(form.quota === "" ? {} : { quota: form.quota }),
    };

    if (mode === "edit" && event) {
      const changedPayload = buildChangedEventPayload(form, event);

      updateEvent.mutate(
        {
          id: event.id,
          data: changedPayload,
        },
        {
          onSuccess: () => {
            setFormErrors({});
            if (onSuccess) onSuccess("Event berhasil diperbarui!");
            onClose();
          },
          onError: (error) => {
            setFormErrors(getApiFieldErrors(error));
          },
        },
      );

      return;
    }

    createEvent.mutate(payload, {
      onSuccess: () => {
        setFormErrors({});
        if (onSuccess) onSuccess("Event berhasil ditambahkan!");
        onClose();
      },
      onError: (error) => {
        setFormErrors(getApiFieldErrors(error));
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-lg">
            {mode === "edit" ? "Ubah Event" : "Buat Event Baru"}
          </h3>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Kategori
              </label>

              <div className="relative">
                <FormSelect
                  name="category_id"
                  value={form.category_id}
                  onChange={handleChange}
                  disabled={isCategoryLoading || categories.length === 0}
                  className="w-full appearance-none border border-gray-200 rounded-xl px-3 py-2.5 pr-10 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-white cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                  required
                >
                  {isCategoryLoading && (
                    <option value={0}>Memuat kategori...</option>
                  )}

                  {!isCategoryLoading && categories.length === 0 && (
                    <option value={0}>Kategori belum tersedia</option>
                  )}

                  {!isCategoryLoading &&
                    categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.category_name}
                      </option>
                    ))}
                </FormSelect>

                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  ▾
                </span>
              </div>

              {isCategoryError && (
                <p className="text-xs text-red-500 mt-1">
                  Gagal memuat kategori event.
                </p>
              )}
              {getFieldError("category_id") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("category_id")}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Poster Event (Opsional)
              </label>

              {mode === "edit" && event?.poster_url && !form.poster && (
                <div className="mb-3">
                  <img
                    src={event.poster_url}
                    alt="Poster saat ini"
                    className="h-24 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}

              {form.poster && (
                <div className="mb-3">
                  <img
                    src={URL.createObjectURL(form.poster)}
                    alt="Pratinjau poster"
                    className="h-24 object-cover rounded-xl border border-gray-200"
                  />
                </div>
              )}

              <FormInput
                type="file"
                name="poster"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#7AB2B2]/10 file:text-[#236175] hover:file:bg-[#7AB2B2]/20"
              />
              <p className="text-xs text-gray-400 mt-1">
                Format: JPG, JPEG, PNG, WebP (Maks. 5 MB)
              </p>
              {getFieldError("poster") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("poster")}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Judul Event
              </label>
              <FormInput
                type="text"
                name="event_title"
                value={form.event_title}
                onChange={handleChange}
                placeholder="Contoh: Reuni Akbar 2025"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                required
              />
              {getFieldError("event_title") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("event_title")}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Deskripsi
              </label>
              <FormTextarea
                name="description"
                value={form.description}
                onChange={handleChange}
                placeholder="Contoh: Reuni alumni kelulusan 2010-2015"
                rows={2}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] resize-none"
              />
              {getFieldError("description") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("description")}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Lokasi
              </label>
              <FormInput
                type="text"
                name="location"
                value={form.location}
                onChange={handleChange}
                placeholder="Contoh: Aula Pesantren"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                required
              />
              {getFieldError("location") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("location")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Tanggal Event
                </label>
                <FormInput
                  type="date"
                  name="event_date"
                  value={form.event_date}
                  onChange={handleChange}
                  min={getTodayDateInput()}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                  required
                />
                {getFieldError("event_date") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getFieldError("event_date")}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Jam Mulai
                </label>
                <FormInput
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                  required
                />
                {getFieldError("start_time") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getFieldError("start_time")}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Jam Selesai
                </label>
                <FormInput
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                  required
                />
                {getFieldError("end_time") && (
                  <p className="text-xs text-red-500 mt-1">
                    {getFieldError("end_time")}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Kuota Peserta
              </label>
              <FormInput
                type="number"
                name="quota"
                value={form.quota}
                onChange={handleChange}
                placeholder="Kosongkan jika tidak ada batasan kuota"
                min={1}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
              />
              {getFieldError("quota") && (
                <p className="text-xs text-red-500 mt-1">
                  {getFieldError("quota")}
                </p>
              )}
            </div>

            {isError && (
              <div className="rounded-xl px-4 py-3 text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-colors active:scale-[0.98]"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={
                isPending ||
                isCategoryLoading ||
                categories.length === 0 ||
                !form.category_id
              }
              className="flex-1 bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0D5C3A]/20 flex items-center justify-center gap-2"
            >
              {isPending && (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              )}
              {isPending
                ? "Menyimpan..."
                : mode === "edit"
                  ? "Perbarui"
                  : "Simpan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function BroadcastModal({
  event,
  isOpen,
  onClose,
}: {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    target,
    manualNumbers,
    customMessage,
    successMessage,
    errorMessage,
    isSendConfirmOpen,
    sendDetail,
    preview,
    previewData,
    sendEventBroadcast,
    parsedNumbers,
    estimatedTargets,
    isMessageTooLong,
    updateManualNumber,
    addManualNumber,
    removeManualNumber,
    setCustomMessage,
    handleTargetChange,
    confirmSubmit,
    cancelConfirmSubmit,
    targetLabel,
  } = useEventBroadcastForm(event);
  const previewMessage = sanitizeBroadcastMessage(previewData?.message) || "";

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Pesan Massal WA
            </h3>
            <p className="text-sm text-gray-400">{event.event_title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(formEvent) => formEvent.preventDefault()}
          className="p-6 space-y-5"
        >
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              label="Alumni Ber-HP"
              value={
                preview.isLoading
                  ? "..."
                  : (previewData?.breakdown.total_all ?? 0)
              }
              sub="Total alumni dengan nomor"
              accent="border-[#7AB2B2]"
            />
            <StatCard
              label="Terdaftar Event"
              value={
                preview.isLoading
                  ? "..."
                  : (previewData?.breakdown.total_registered ?? 0)
              }
              sub="Alumni yang sudah daftar"
              accent="border-blue-400"
            />
            <StatCard
              label="Estimasi Penerima"
              value={preview.isLoading ? "..." : estimatedTargets}
              sub="Target pesan massal saat ini"
              accent="border-[#7AB2B2]"
            />
            {target === "custom" && (
              <StatCard
                label="Nomor Manual"
                value={parsedNumbers.validNumbers.length}
                sub={`Duplikat otomatis dihapus${
                  previewData?.breakdown.total_custom !== undefined
                    ? ` • Pratinjau: ${previewData.breakdown.total_custom}`
                    : ""
                }`}
                accent="border-green-400"
              />
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Penerima
                </label>
                <div className="relative">
                  <FormSelect
                    value={target}
                    onChange={(e) =>
                      handleTargetChange(e.target.value as EventBroadcastTarget)
                    }
                    className="w-full appearance-none px-4 py-2.5 pr-10 border border-gray-200 rounded-xl text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-gray-50 cursor-pointer"
                  >
                    <option value="all">
                      Semua alumni yang punya nomor HP
                    </option>

                    <option value="registered">
                      Alumni yang sudah daftar event
                    </option>

                    <option value="custom">Nomor manual</option>
                  </FormSelect>

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ▾
                  </span>
                </div>
                <div className="mt-3 flex gap-3 rounded-xl border border-[#7AB2B2]/20 bg-[#7AB2B2]/10 p-3 text-sm text-teal-800">
                  <Info className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium">
                      {broadcastTargetDescriptions[target].label}
                    </p>
                    <p className="mt-0.5 text-xs text-[#236175]">
                      {broadcastTargetDescriptions[target].description}
                    </p>
                  </div>
                </div>
              </div>

              {target === "custom" && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Nomor HP Tujuan
                    </label>
                    <button
                      type="button"
                      onClick={addManualNumber}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-[#7AB2B2]/10 px-3 py-1.5 text-xs font-medium text-[#236175] transition-colors hover:bg-[#7AB2B2]/20"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Tambah
                    </button>
                  </div>
                  <div className="space-y-2">
                    {manualNumbers.map((number, index) => (
                      <div
                        key={`event-manual-number-${index}`}
                        className="flex items-center gap-2"
                      >
                        <FormInput
                          type="tel"
                          value={number}
                          onChange={(e) =>
                            updateManualNumber(index, e.target.value)
                          }
                          placeholder={`Nomor ${index + 1}, contoh: 081234567890`}
                          className="text-gray-500 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-gray-50"
                        />
                        <button
                          type="button"
                          onClick={() => removeManualNumber(index)}
                          aria-label={`Hapus nomor ${index + 1}`}
                          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-red-100 text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={
                            manualNumbers.length === 1 && !number.trim()
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Nomor valid: {parsedNumbers.validNumbers.length}
                    {parsedNumbers.invalidCount > 0
                      ? ` • Tidak valid: ${parsedNumbers.invalidCount}`
                      : ""}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Pesan Khusus
                  </label>
                  <span
                    className={`text-xs ${
                      isMessageTooLong ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {customMessage.length}/1000
                  </span>
                </div>
                <FormTextarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Kosongkan jika ingin memakai pesan default"
                  rows={6}
                  className="text-gray-500 w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-gray-50 resize-none"
                />
                {isMessageTooLong && (
                  <p className="text-xs text-red-500 mt-1">
                    Pesan khusus maksimal 1000 karakter.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Pratinjau Pesan
                </label>
                <span className="text-xs bg-[#7AB2B2]/10 text-[#2D7EA0] border border-teal-200 px-2 py-0.5 rounded-full font-medium">
                  {target}
                </span>
              </div>
              <div className="min-h-[320px] text-gray-700 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm">
                {target === "custom" && parsedNumbers.validNumbers.length === 0
                  ? "Masukkan nomor manual untuk menghitung target khusus."
                  : preview.isLoading
                    ? "Memuat pratinjau..."
                    : preview.isError
                      ? getApiErrorMessage(
                          preview.error,
                          "Gagal memuat pratinjau",
                        )
                      : previewMessage || "Pratinjau belum tersedia"}
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm space-y-2">
              <p>{successMessage}</p>
              {sendDetail?.senderStatus !== undefined && (
                <p className="text-xs">
                  Status pengirim: {String(sendDetail.senderStatus)}
                </p>
              )}
              {sendDetail?.blockedReason !== undefined && (
                <p className="text-xs">
                  Blocked reason: {String(sendDetail.blockedReason)}
                </p>
              )}
              {sendDetail?.fonnte !== undefined && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">
                    Detail teknis Fonnte
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 text-gray-600">
                    {JSON.stringify(sendDetail.fonnte, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          {(errorMessage || sendEventBroadcast.isError) && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm space-y-2">
              <p>
                {errorMessage ||
                  getApiErrorMessage(
                    sendEventBroadcast.error,
                    "Pesan massal belum berhasil dikirim. Silakan coba lagi.",
                  )}
              </p>
              {sendDetail?.senderStatus !== undefined && (
                <p className="text-xs">
                  Status pengirim: {String(sendDetail.senderStatus)}
                </p>
              )}
              {sendDetail?.blockedReason !== undefined && (
                <p className="text-xs">
                  Blocked reason: {String(sendDetail.blockedReason)}
                </p>
              )}
              {sendDetail?.fonnte !== undefined && (
                <details className="text-xs">
                  <summary className="cursor-pointer font-medium">
                    Detail teknis Fonnte
                  </summary>
                  <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-white/70 p-3 text-gray-600">
                    {JSON.stringify(sendDetail.fonnte, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-red-500 text-white text-sm font-semibold hover:bg-red-600 transition-colors active:scale-[0.98]"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = "/admin/broadcast";
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] text-white text-sm font-semibold transition-all shadow-md shadow-[#0D5C3A]/20"
            >
              Buka Pesan Manual
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        isOpen={isSendConfirmOpen}
        title="Kirim pesan massal WhatsApp?"
        message={`Target: ${targetLabel}. Jumlah penerima: ${estimatedTargets}. Event: ${event.event_title}.`}
        confirmLabel="Kirim"
        tone="default"
        loading={sendEventBroadcast.isPending}
        onCancel={cancelConfirmSubmit}
        onConfirm={confirmSubmit}
      />
    </div>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <div className="mt-1 text-sm font-medium text-gray-800 break-words">
        {value ?? "-"}
      </div>
    </div>
  );
}

function EventRegistrationsModal({
  event,
  isOpen,
  onClose,
}: {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const { data, isLoading, isError, error } = useEventRegistrations(
    event?.id ?? null,
    undefined,
    100,
  );

  if (!isOpen || !event) return null;

  const summary = data?.summary;
  const registrations = data?.registrations ?? [];
  const quotaFull = summary?.is_quota_full ?? event.is_quota_full;
  const quotaMessage =
    summary?.quota_message ||
    event.quota_message ||
    "Kuota penuh, segera hubungi penyelenggara";
  const quotaValue = summary?.quota ?? event.quota;
  const quotaUsed =
    summary?.quota_used ?? event.quota_used ?? event.registered ?? 0;
  const remainingQuota = summary?.remaining_quota ?? event.remaining_quota;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              Detail Pendaftar Event
            </h3>
            <p className="text-sm text-gray-400 mt-1">{event.event_title}</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup daftar pendaftar"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <StatCard
              label="Total Terdaftar"
              value={summary?.total_registered ?? registrations.length}
              sub="Pendaftar event"
              accent="border-blue-400"
            />
            <StatCard
              label="Total Hadir"
              value={summary?.total_attended ?? 0}
              sub="Sudah memindai QR"
              accent="border-emerald-400"
            />
            <StatCard
              label="Kuota"
              value={
                quotaValue === null || quotaValue === undefined
                  ? "Tidak terbatas"
                  : `${quotaUsed}/${quotaValue}`
              }
              sub="Terpakai/kapasitas"
              accent="border-[#7AB2B2]"
            />
            <StatCard
              label="Sisa Kuota"
              value={
                remainingQuota === null || remainingQuota === undefined
                  ? "Tidak terbatas"
                  : remainingQuota
              }
              sub="Dari backend"
              accent="border-[#7AB2B2]"
            />
          </div>

          {quotaFull && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {quotaMessage}
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {getApiErrorMessage(error, "Gagal memuat data pendaftar")}
            </div>
          )}

          <div className="overflow-x-auto border border-gray-100 rounded-2xl">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {[
                    "Nama",
                    "Email",
                    "No HP",
                    "Tahun Kelulusan",
                    "Status pendaftaran / kehadiran",
                    "Jam daftar",
                    "Waktu pemindaian QR",
                  ].map((header) => (
                    <th
                      key={header}
                      className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3].map((item) => (
                    <tr
                      key={item}
                      className="border-b border-gray-50 animate-pulse"
                    >
                      {Array.from({ length: 7 }).map((_, index) => (
                        <td key={index} className="px-4 py-3">
                          <div className="h-4 bg-gray-100 rounded w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : registrations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-gray-400">
                      Belum ada pendaftar untuk event ini
                    </td>
                  </tr>
                ) : (
                  registrations.map((registration, index) => {
                    const attendance = registration.attendance;
                    const registeredAt =
                      registration.registered_at || attendance?.registered_at;
                    const attendanceStatus = attendance?.status || "-";

                    return (
                      <tr
                        key={registration.id ?? index}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-gray-800">
                          {registration.user?.name ??
                            `Pengguna #${registration.user_id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {registration.user?.email ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {registration.user?.phone ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {registration.user?.angkatan ??
                            registration.user?.graduation_year ??
                            "-"}
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                          {registration.status} / {attendanceStatus}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTimeIndonesia(registeredAt)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {formatDateTimeIndonesia(attendance?.scanned_at)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventDetailModal({
  eventId,
  fallbackEvent,
  categories,
  isOpen,
  onClose,
}: {
  eventId: number | null;
  fallbackEvent: Event | null;
  categories: EventCategory[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const {
    data: detailEvent,
    isLoading,
    isError,
    error,
    isFetching,
  } = useEvent(eventId ?? 0, isOpen ? 5000 : false);

  if (!isOpen) return null;

  const event = detailEvent ?? fallbackEvent;
  const { date, time } = event
    ? parseEventDate(event)
    : { date: "-", time: "-" };
  const registered = event ? getRegisteredCount(event) : 0;
  const quotaPercent = event ? getQuotaPercent(event) : 0;
  const isUnpublished = event
    ? getEventPublicationStatus(event) === "inactive"
    : false;
  const detailStatusLabel = event
    ? isUnpublished
      ? "Tidak Dipublikasikan"
      : getEventTimeStatus(event)
    : "";
  const detailStatusStyle =
    detailStatusLabel === "Tidak Dipublikasikan"
      ? "border-yellow-400 bg-yellow-100/70 text-yellow-700"
      : detailStatusLabel === "Mendatang"
        ? "border-blue-400 bg-blue-100/70 text-blue-700"
        : "border-green-400 bg-green-100/70 text-green-700";

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">
              Detail Event
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {isFetching ? "Memperbarui data..." : "Data event terbaru"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup detail event"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isLoading && !event && (
            <div className="space-y-3">
              <div className="h-5 bg-gray-100 rounded w-2/3 animate-pulse" />
              <div className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-16 bg-gray-100 rounded-xl animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}

          {isError && !event && (
            <div className="rounded-xl px-4 py-3 text-sm bg-red-50 text-red-600 border border-red-100">
              {getApiErrorMessage(error, "Gagal memuat detail event")}
            </div>
          )}

          {event && (
            <>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-44 shrink-0">
                  {event.poster_url ? (
                    <img
                      src={event.poster_url}
                      alt={event.event_title}
                      className="h-44 w-full rounded-2xl border border-gray-100 object-cover bg-gray-50"
                    />
                  ) : (
                    <div className="h-44 w-full rounded-2xl border border-dashed border-gray-200 bg-gray-50 grid place-items-center text-sm text-gray-400">
                      Tanpa poster
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${detailStatusStyle}`}
                    >
                      {detailStatusLabel}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${getEventCategoryStyle(
                        event.category,
                        event.category_id,
                        categories,
                      )}`}
                    >
                      {getEventCategoryLabel(event.category)}
                    </span>
                    {event.is_quota_full && (
                      <span className="text-xs bg-red-50 text-red-600 border border-red-100 px-2.5 py-1 rounded-full font-medium">
                        Penuh
                      </span>
                    )}
                  </div>

                  <h4 className="text-xl font-bold text-gray-800 leading-tight">
                    {event.event_title}
                  </h4>
                  <p className="mt-3 text-sm text-gray-500 whitespace-pre-wrap">
                    {event.description || "Tidak ada deskripsi."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                  label="Terdaftar"
                  value={registered}
                  sub="Peserta saat ini"
                  accent="border-blue-400"
                />
                <StatCard
                  label="Kuota"
                  value={getQuotaLabel(event)}
                  sub="Kapasitas awal"
                  accent="border-[#7AB2B2]"
                />
                <StatCard
                  label="Sisa Kuota"
                  value={getRemainingQuotaLabel(event)}
                  sub="Update otomatis"
                  accent="border-emerald-400"
                />
                <StatCard
                  label="Terisi"
                  value={event.quota ? `${quotaPercent}%` : "-"}
                  sub="Persentase"
                  accent="border-[#7AB2B2]"
                />
              </div>

              {event.is_quota_full && (
                <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                  {event.quota_message ||
                    "Kuota penuh, segera hubungi penyelenggara"}
                </div>
              )}

              {event.quota && (
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1.5">
                    <span>Progres kuota</span>
                    <span className="font-medium">
                      {registered} / {event.quota}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="bg-[#3EBDAF] h-2.5 rounded-full transition-all"
                      style={{ width: `${quotaPercent}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <DetailItem label="Tanggal" value={date} />
                <DetailItem
                  label="Waktu"
                  value={`${time} - ${event.end_time?.slice(0, 5) || "-"}`}
                />
                <DetailItem label="Lokasi" value={event.location} />
                <DetailItem label="Kategori" value={event.category ?? "-"} />
                <DetailItem
                  label="Dibuat"
                  value={
                    event.created_at
                      ? new Date(event.created_at).toLocaleString("id-ID")
                      : "-"
                  }
                />
                <DetailItem
                  label="Diperbarui"
                  value={
                    event.updated_at
                      ? new Date(event.updated_at).toLocaleString("id-ID")
                      : "-"
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Event Card (Mendatang) ───────────────────────────────────────────────────
function EventCardUpcoming({
  event,
  categoryStyle,
  onDetail,
  onEdit,
  onTogglePublish,
  onBroadcast,
  onRegistrations,
  isToggling,
  statusLabel = "Mendatang",
}: {
  event: Event;
  categoryStyle: string;
  onDetail: (event: Event) => void;
  onEdit: (event: Event) => void;
  onTogglePublish: (event: Event) => void;
  onBroadcast: (event: Event) => void;
  onRegistrations: (event: Event) => void;
  isToggling: boolean;
  statusLabel?: "Mendatang" | "Tidak Dipublikasikan";
}) {
  const { date, time } = parseEventDate(event);
  const registered = getRegisteredCount(event);
  const remainingQuota = getRemainingQuota(event);
  const pct = getQuotaPercent(event);
  const published = isEventPublished(event);
  const isUnpublished = statusLabel === "Tidak Dipublikasikan";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail ${event.event_title}`}
      onClick={() => onDetail(event)}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.target !== keyboardEvent.currentTarget) return;
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          onDetail(event);
        }
      }}
      className="relative h-full bg-white rounded-2xl p-5 shadow-sm cursor-pointer transform-gpu transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D7EA0]/40"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-base leading-tight">
          {event.event_title}
        </h3>
        <span
          className={`ml-2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            isUnpublished
              ? "border-yellow-400 bg-yellow-100/70 text-yellow-700"
              : "border-blue-400 bg-blue-100/70 text-blue-700"
          }`}
        >
          {statusLabel}
        </span>
        {event.is_quota_full && (
          <span className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
            Penuh
          </span>
        )}
      </div>

      <span
        className={`inline-block rounded-full px-3 py-1 mb-3 text-xs font-medium ${categoryStyle}`}
      >
        {getEventCategoryLabel(event.category)}
      </span>

      <div className="space-y-1.5 text-sm text-gray-500">
        <div className="flex items-center gap-2">
          <Icon3D size="sm" variant="teal">
            <CalendarDays size={15} />
          </Icon3D>
          <span>
            {date} • {time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Icon3D size="sm" variant="blue">
            <MapPin size={15} />
          </Icon3D>
          <span>{event.location}</span>
        </div>
      </div>

      <div className="mt-4">
        {event.quota === null ||
        event.quota === undefined ||
        event.quota_status === "unlimited" ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <p className="font-medium">Kuota: Tidak terbatas</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Sisa kuota: Tidak terbatas
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-1.5">
              <span>Kuota</span>
              <span className="font-medium">
                {registered}/{event.quota}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-1.5">
              Sisa kuota: {remainingQuota ?? 0}
            </p>

            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#3EBDAF] h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-1 text-right">
              {registered} terdaftar
            </p>
          </>
        )}
        {event.is_quota_full && (
          <p className="text-xs text-red-500 mt-2">
            {event.quota_message || "Kuota penuh, segera hubungi penyelenggara"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onRegistrations(event);
          }}
          className="text-xs bg-blue-400 text-white hover:bg-blue-700 py-2 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Users size={13} />
          Pendaftar
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onEdit(event);
          }}
          className="text-xs bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] text-white hover:from-[#0A4D30] hover:to-[#073D26] py-2 rounded-lg shadow-md shadow-[#0D5C3A]/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Pencil size={13} />
          Ubah
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onBroadcast(event);
          }}
          className="text-xs bg-emerald-600 text-white hover:bg-emerald-700 py-2 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Megaphone size={13} />
          WA
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onTogglePublish(event);
          }}
          disabled={isToggling}
          title={published ? "Batalkan publikasi event" : "Publikasikan event"}
          className={`col-span-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white shadow-sm hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none ${
            published
              ? "bg-amber-500 hover:bg-amber-600"
              : "bg-[#3EBDAF] hover:bg-[#32A99D]"
          }`}
        >
          <Power size={13} />
          {isToggling
            ? "Memproses..."
            : published
              ? "Batalkan Publikasi"
              : "Publikasikan"}
        </button>
      </div>
    </div>
  );
}

// ─── Event Card (Selesai) ─────────────────────────────────────────────────────
function EventCardDone({
  event,
  categoryStyle,
  onDetail,
  onEdit,
  onTogglePublish,
  onBroadcast,
  onRegistrations,
  isToggling,
  statusLabel = "Selesai",
}: {
  event: Event;
  categoryStyle: string;
  onDetail: (event: Event) => void;
  onEdit: (event: Event) => void;
  onTogglePublish: (event: Event) => void;
  onBroadcast: (event: Event) => void;
  onRegistrations: (event: Event) => void;
  isToggling: boolean;
  statusLabel?: "Selesai" | "Tidak Dipublikasikan";
}) {
  const { date, time } = parseEventDate(event);
  const registered = getRegisteredCount(event);
  const remainingQuota = getRemainingQuota(event);
  const pct = getQuotaPercent(event);
  const published = isEventPublished(event);
  const isUnpublished = statusLabel === "Tidak Dipublikasikan";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Lihat detail ${event.event_title}`}
      onClick={() => onDetail(event)}
      onKeyDown={(keyboardEvent) => {
        if (keyboardEvent.target !== keyboardEvent.currentTarget) return;
        if (keyboardEvent.key === "Enter" || keyboardEvent.key === " ") {
          keyboardEvent.preventDefault();
          onDetail(event);
        }
      }}
      className="relative h-full bg-white rounded-2xl p-5 shadow-sm cursor-pointer transform-gpu transition-all duration-300 ease-out hover:z-10 hover:scale-[1.02] hover:shadow-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#2D7EA0]/40"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-800 text-base leading-tight">
          {event.event_title}
        </h3>

        <span
          className={`ml-2 whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-medium ${
            isUnpublished
              ? "border-yellow-400 bg-yellow-100/70 text-yellow-700"
              : "border-green-400 bg-green-100/70 text-green-700"
          }`}
        >
          {statusLabel}
        </span>
        {event.is_quota_full && (
          <span className="text-xs bg-red-500 text-white px-2.5 py-1 rounded-full font-semibold whitespace-nowrap">
            Penuh
          </span>
        )}
      </div>

      <span
        className={`inline-block rounded-full px-3 py-1 mb-3 text-xs font-medium ${categoryStyle}`}
      >
        {getEventCategoryLabel(event.category)}
      </span>

      <div className="space-y-1.5 text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <Icon3D size="sm" variant="gray">
            <CalendarDays size={15} />
          </Icon3D>
          <span>
            {date} • {time}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Icon3D size="sm" variant="blue">
            <MapPin size={15} />
          </Icon3D>
          <span>{event.location}</span>
        </div>
      </div>

      <div>
        {event.quota === null ||
        event.quota === undefined ||
        event.quota_status === "unlimited" ? (
          <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600">
            <p className="font-medium">Kuota: Tidak terbatas</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Sisa kuota: Tidak terbatas
            </p>
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm text-gray-600 mb-1.5">
              <span>Kuota</span>
              <span className="font-medium">
                {registered} / {event.quota}
              </span>
            </div>

            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#3EBDAF] h-2 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>

            <p className="text-xs text-gray-400 mt-1 text-right">
              {pct}% terisi
              {remainingQuota !== null ? ` • sisa ${remainingQuota}` : ""}
            </p>
          </>
        )}
        {event.is_quota_full && (
          <p className="text-xs text-red-500 mt-2">
            {event.quota_message || "Kuota penuh, segera hubungi penyelenggara"}
          </p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onRegistrations(event);
          }}
          className="text-xs bg-blue-500 text-white hover:bg-blue-600 py-2 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Users size={13} />
          Pendaftar
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onEdit(event);
          }}
          className="text-xs bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] text-white hover:from-[#0A4D30] hover:to-[#073D26] py-2 rounded-lg shadow-md shadow-[#0D5C3A]/20 hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Pencil size={13} />
          Ubah
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onBroadcast(event);
          }}
          className="text-xs bg-emerald-500 text-white hover:bg-emerald-600 py-2 rounded-lg shadow-sm hover:shadow-lg transition-all flex items-center justify-center gap-1.5"
        >
          <Megaphone size={13} />
          WA
        </button>

        <button
          type="button"
          onClick={(clickEvent) => {
            clickEvent.stopPropagation();
            onTogglePublish(event);
          }}
          disabled={isToggling}
          title={published ? "Batalkan publikasi event" : "Publikasikan event"}
          className={`col-span-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs text-black shadow-sm hover:shadow-lg transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 disabled:shadow-none ${
            published
              ? "bg-amber-300 hover:bg-amber-400"
              : "bg-[#3EBDAF] hover:bg-[#32A99D]"
          }`}
        >
          <Power size={13} />
          {isToggling
            ? "Memproses..."
            : published
              ? "Batalkan Publikasi"
              : "Publikasikan"}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function KelolEventPage() {
  const [search, setSearch] = useState("");
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventModalMode, setEventModalMode] = useState<EventFormMode>("create");
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [detailEvent, setDetailEvent] = useState<Event | null>(null);
  const [registrationsEvent, setRegistrationsEvent] = useState<Event | null>(
    null,
  );
  const [broadcastEvent, setBroadcastEvent] = useState<Event | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Event | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalMode, setCategoryModalMode] =
    useState<CategoryFormMode>("create");
  const [selectedCategory, setSelectedCategory] =
    useState<EventCategory | null>(null);
  const [categoryDeleteTarget, setCategoryDeleteTarget] =
    useState<EventCategory | null>(null);
  const [categoryActionError, setCategoryActionError] = useState<string | null>(
    null,
  );
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [activeTab, setActiveTab] = useState<
    "upcoming" | "done" | "unpublished"
  >("upcoming");
  const [currentPage, setCurrentPage] = useState(1);

  const showToast = (
    message: string,
    type: "success" | "error" = "success",
  ) => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const {
    data: events = [],
    isLoading,
    isError,
    error,
  } = useEvents(search, 100, undefined, undefined, 5000);
  const {
    data: categories = [],
    isLoading: categoriesLoading,
    isError: categoriesError,
    refetch: refetchCategories,
  } = useEventCategories();
  const {
    data: categoryUsageEvents = [],
    isLoading: categoryUsageLoading,
    isError: categoryUsageError,
  } = useEvents("", 100, undefined, undefined, 5000);

  const deleteCategory = useDeleteEventCategory();
  const toggleEvent = useToggleEvent();

  const handleCreate = () => {
    setEventModalMode("create");
    setSelectedEvent(null);
    setIsEventModalOpen(true);
  };

  const handleEdit = (event: Event) => {
    setEventModalMode("edit");
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleDetail = (event: Event) => {
    setDetailEvent(event);
  };

  const handleRegistrations = (event: Event) => {
    setRegistrationsEvent(event);
  };

  const handleCloseEventModal = () => {
    setIsEventModalOpen(false);
    setSelectedEvent(null);
  };

  const handleCreateCategory = () => {
    setCategoryActionError(null);
    setCategoryModalMode("create");
    setSelectedCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleEditCategory = (category: EventCategory) => {
    setCategoryActionError(null);
    setCategoryModalMode("edit");
    setSelectedCategory(category);
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setSelectedCategory(null);
  };

  const handleDeleteCategory = (category: EventCategory) => {
    const usageCount = getCategoryUsageCount(category, categoryUsageEvents);
    if (categoryUsageLoading || categoryUsageError || usageCount > 0) return;

    setCategoryActionError(null);
    setCategoryDeleteTarget(category);
  };

  const handleConfirmCategoryDelete = () => {
    if (!categoryDeleteTarget) return;

    deleteCategory.mutate(categoryDeleteTarget.id, {
      onSuccess: () => {
        setCategoryDeleteTarget(null);
        setCategoryActionError(null);
        showToast("Kategori event berhasil dihapus");
      },
      onError: (error) => {
        setCategoryDeleteTarget(null);
        setCategoryActionError(
          getApiErrorMessage(error, "Gagal memproses kategori event"),
        );
      },
    });
  };

  const handleTogglePublish = (event: Event) => {
    setToggleTarget(event);
  };

  const handleConfirmTogglePublish = () => {
    if (!toggleTarget) return;

    const wasPublished = isEventPublished(toggleTarget);

    toggleEvent.mutate(toggleTarget.id, {
      onSuccess: () => {
        setToggleTarget(null);
        showToast(
          wasPublished
            ? "Publikasi event berhasil dibatalkan"
            : "Event berhasil dipublikasikan",
        );
      },
      onError: (error) => {
        setToggleTarget(null);
        showToast(
          getApiErrorMessage(error, "Gagal mengubah status publikasi event"),
          "error",
        );
      },
    });
  };

  const handleOpenBroadcast = (event: Event) => {
    setBroadcastEvent(event);
  };

  const filtered = events;

  const upcoming = filtered.filter(
    (event) =>
      getEventPublicationStatus(event) === "active" &&
      getEventTimeStatus(event) === "Mendatang",
  );
  const done = filtered.filter(
    (event) =>
      getEventPublicationStatus(event) === "active" &&
      getEventTimeStatus(event) === "Selesai",
  );
  const unpublished = filtered.filter(
    (event) => getEventPublicationStatus(event) === "inactive",
  );

  const eventsPerPage = 3;
  const activeEvents =
    activeTab === "upcoming"
      ? upcoming
      : activeTab === "done"
        ? done
        : unpublished;
  const totalPages = Math.max(
    1,
    Math.ceil(activeEvents.length / eventsPerPage),
  );
  const effectiveCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (effectiveCurrentPage - 1) * eventsPerPage;
  const paginatedEvents = activeEvents.slice(
    pageStartIndex,
    pageStartIndex + eventsPerPage,
  );

  const totalPeserta = events.reduce((sum, event) => {
    return sum + (event.quota_used ?? event.registered ?? 0);
  }, 0);

  return (
    <AdminLayout title="Kelola Event">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 p-5 hover:shadow-lg hover:shadow-[#0D5C3A]/10 transition-all duration-300 hover:-translate-y-1">
          <p className="text-[#0D5C3A]/70 text-xs font-semibold uppercase tracking-wide">
            Total Event
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Icon3D variant="teal" size="md">
              <CalendarDays size={20} strokeWidth={2.5} />
            </Icon3D>
            <h2 className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : events.length}
            </h2>
          </div>
          <p className="text-[#0D5C3A]/50 text-xs mt-2">Semua event</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 p-5 hover:shadow-lg hover:shadow-[#0D5C3A]/10 transition-all duration-300 hover:-translate-y-1">
          <p className="text-[#0D5C3A]/70 text-xs font-semibold uppercase tracking-wide">
            Event Mendatang
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Icon3D variant="blue" size="md">
              <CalendarDays size={20} strokeWidth={2.5} />
            </Icon3D>
            <h2 className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : upcoming.length}
            </h2>
          </div>
          <p className="text-[#0D5C3A]/50 text-xs mt-2">Event aktif</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 p-5 hover:shadow-lg hover:shadow-[#0D5C3A]/10 transition-all duration-300 hover:-translate-y-1">
          <p className="text-[#0D5C3A]/70 text-xs font-semibold uppercase tracking-wide">
            Event Selesai
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Icon3D variant="green" size="md">
              <CalendarDays size={20} strokeWidth={2.5} />
            </Icon3D>
            <h2 className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : done.length}
            </h2>
          </div>
          <p className="text-[#0D5C3A]/50 text-xs mt-2">Event selesai</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 p-5 hover:shadow-lg hover:shadow-[#0D5C3A]/10 transition-all duration-300 hover:-translate-y-1">
          <p className="text-[#0D5C3A]/70 text-xs font-semibold uppercase tracking-wide">
            Total Peserta
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Icon3D variant="gold" size="md">
              <Users size={20} strokeWidth={2.5} />
            </Icon3D>
            <h2 className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : totalPeserta}
            </h2>
          </div>
          <p className="text-[#0D5C3A]/50 text-xs mt-2">Total peserta</p>
        </div>
      </div>

      <EventCategorySection
        categories={categories}
        events={categoryUsageEvents}
        isLoading={categoriesLoading}
        isError={categoriesError}
        isUsageLoading={categoryUsageLoading}
        isUsageUnavailable={categoryUsageError}
        actionError={categoryActionError}
        onRetry={() => void refetchCategories()}
        onCreate={handleCreateCategory}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">
              Manajemen Event
            </h2>
            <p className="text-xs text-gray-400">Kelola semua data acara</p>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-md shadow-[#0D5C3A]/20"
          >
            <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-white/20 shadow-inner border border-white/30">
              <Plus size={16} />
            </span>
            Buat Event Baru
          </button>
        </div>

        <SearchInput
          leadingIcon={<Search size={16} className="text-gray-400" />}
          wrapperClassName="flex items-center gap-2 w-full px-4 py-2.5 border border-gray-200 rounded-xl mb-4 focus-within:border-[#3EBDAF] bg-white"
          placeholder="Cari event..."
          value={search}
          onValueChange={(value) => {
            setSearch(value);
            setCurrentPage(1);
          }}
          className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
        />

        {isLoading && (
          <div className="space-y-6">
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-4 animate-pulse" />
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <CardSkeleton key={i} />
                ))}
              </div>
            </div>
          </div>
        )}

        {isError && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="text-sm text-red-500 font-medium">
              Gagal memuat data event
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {getApiErrorMessage(
                error,
                "Data event belum berhasil dimuat. Silakan coba lagi.",
              )}
            </p>
          </div>
        )}

        {!isLoading && !isError && (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p className="text-4xl mb-3">📭</p>
                <p className="text-sm">Tidak ada event ditemukan</p>
              </div>
            ) : (
              <>
                <div className="mb-4 flex w-fit flex-wrap gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    onClick={() => {
                      setActiveTab("upcoming");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "upcoming"
                        ? "border border-blue-300 bg-blue-100/70 text-blue-700 shadow-sm"
                        : "border border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Mendatang ({upcoming.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("done");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "done"
                        ? "border border-green-300 bg-green-100/70 text-green-700 shadow-sm"
                        : "border border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Selesai ({done.length})
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("unpublished");
                      setCurrentPage(1);
                    }}
                    className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                      activeTab === "unpublished"
                        ? "border border-yellow-300 bg-yellow-100/70 text-yellow-700 shadow-sm"
                        : "border border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Tidak Dipublikasikan ({unpublished.length})
                  </button>
                </div>

                {activeTab === "upcoming" && (
                  <div>
                    {upcoming.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-2xl">
                        <p className="text-4xl mb-3">📅</p>
                        <p className="text-sm">Tidak ada event mendatang</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedEvents.map((e) => (
                          <EventCardUpcoming
                            key={e.id}
                            event={e}
                            categoryStyle={getEventCategoryStyle(
                              e.category,
                              e.category_id,
                              categories,
                            )}
                            onDetail={handleDetail}
                            onEdit={handleEdit}
                            onTogglePublish={handleTogglePublish}
                            onBroadcast={handleOpenBroadcast}
                            onRegistrations={handleRegistrations}
                            isToggling={
                              toggleEvent.isPending && toggleTarget?.id === e.id
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "done" && (
                  <div>
                    {done.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-2xl">
                        <p className="text-4xl mb-3">🕒</p>
                        <p className="text-sm">Tidak ada event selesai</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedEvents.map((e) => (
                          <EventCardDone
                            key={e.id}
                            event={e}
                            categoryStyle={getEventCategoryStyle(
                              e.category,
                              e.category_id,
                              categories,
                            )}
                            onDetail={handleDetail}
                            onEdit={handleEdit}
                            onTogglePublish={handleTogglePublish}
                            onBroadcast={handleOpenBroadcast}
                            onRegistrations={handleRegistrations}
                            isToggling={
                              toggleEvent.isPending && toggleTarget?.id === e.id
                            }
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "unpublished" && (
                  <div>
                    {unpublished.length === 0 ? (
                      <div className="text-center py-12 text-gray-400 bg-white border border-gray-100 rounded-2xl">
                        <p className="text-sm">
                          Tidak ada event yang belum dipublikasikan
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {paginatedEvents.map((event) => {
                          const cardProps = {
                            event,
                            categoryStyle: getEventCategoryStyle(
                              event.category,
                              event.category_id,
                              categories,
                            ),
                            onDetail: handleDetail,
                            onEdit: handleEdit,
                            onTogglePublish: handleTogglePublish,
                            onBroadcast: handleOpenBroadcast,
                            onRegistrations: handleRegistrations,
                            isToggling:
                              toggleEvent.isPending &&
                              toggleTarget?.id === event.id,
                            statusLabel: "Tidak Dipublikasikan" as const,
                          };

                          return event.status_event === "Selesai" ? (
                            <EventCardDone key={event.id} {...cardProps} />
                          ) : (
                            <EventCardUpcoming key={event.id} {...cardProps} />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeEvents.length > eventsPerPage && (
                  <div className="mt-5 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-xs text-gray-400">
                      Menampilkan {pageStartIndex + 1}-
                      {Math.min(
                        pageStartIndex + eventsPerPage,
                        activeEvents.length,
                      )}
                      dari {activeEvents.length} event
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(Math.max(1, effectiveCurrentPage - 1))
                        }
                        disabled={effectiveCurrentPage === 1}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Sebelumnya
                      </button>

                      {Array.from(
                        { length: totalPages },
                        (_, index) => index + 1,
                      ).map((page) => (
                        <button
                          type="button"
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition ${
                            effectiveCurrentPage === page
                              ? "border-[#0D5C3A] bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20"
                              : "border-gray-200 text-gray-500 hover:bg-gray-50"
                          }`}
                        >
                          {page}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() =>
                          setCurrentPage(
                            Math.min(totalPages, effectiveCurrentPage + 1),
                          )
                        }
                        disabled={effectiveCurrentPage === totalPages}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <p className="text-center text-xs text-[#0D5C3A]/40 pb-4">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </p>

      {isCategoryModalOpen && (
        <CategoryFormModal
          key={`${categoryModalMode}-${selectedCategory?.id ?? "new"}`}
          mode={categoryModalMode}
          category={selectedCategory}
          onClose={handleCloseCategoryModal}
          onSuccess={showToast}
        />
      )}

      <EventFormModal
        isOpen={isEventModalOpen}
        mode={eventModalMode}
        event={selectedEvent}
        onClose={handleCloseEventModal}
        onSuccess={showToast}
      />

      <EventDetailModal
        eventId={detailEvent?.id ?? null}
        fallbackEvent={detailEvent}
        categories={categories}
        isOpen={!!detailEvent}
        onClose={() => setDetailEvent(null)}
      />

      <EventRegistrationsModal
        event={registrationsEvent}
        isOpen={!!registrationsEvent}
        onClose={() => setRegistrationsEvent(null)}
      />

      {broadcastEvent && (
        <BroadcastModal
          event={broadcastEvent}
          isOpen={!!broadcastEvent}
          onClose={() => setBroadcastEvent(null)}
        />
      )}

      <ConfirmDialog
        isOpen={!!toggleTarget}
        title={
          toggleTarget && isEventPublished(toggleTarget)
            ? "Batalkan publikasi event?"
            : "Publikasikan event?"
        }
        message={
          toggleTarget && isEventPublished(toggleTarget)
            ? "Yakin ingin membatalkan publikasi event ini? Event tidak akan tampil untuk alumni."
            : "Yakin ingin memublikasikan event ini? Event akan tampil untuk alumni."
        }
        confirmLabel={
          toggleTarget && isEventPublished(toggleTarget)
            ? "Batalkan Publikasi"
            : "Publikasikan"
        }
        tone={
          toggleTarget && isEventPublished(toggleTarget) ? "danger" : "default"
        }
        loading={toggleEvent.isPending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={handleConfirmTogglePublish}
      />

      <ConfirmDialog
        isOpen={!!categoryDeleteTarget}
        title="Hapus kategori?"
        message={
          categoryDeleteTarget
            ? `Kategori "${categoryDeleteTarget.category_name}" akan dihapus permanen.`
            : "Kategori ini akan dihapus permanen."
        }
        confirmLabel="Hapus"
        loading={deleteCategory.isPending}
        onCancel={() => setCategoryDeleteTarget(null)}
        onConfirm={handleConfirmCategoryDelete}
      />

      {toast && <FeedbackToast type={toast.type} message={toast.message} />}
    </AdminLayout>
  );
}

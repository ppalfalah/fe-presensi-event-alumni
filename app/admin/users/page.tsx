"use client";

import { useState, type ReactNode } from "react";
import {
  Download,
  Edit3,
  Trash2,
  X,
  Users,
  UserCheck,
  Clock3,
  Clock,
  CalendarPlus,
  Calendar,
  MapPin,
  CheckCircle,
  UserCog,
  Search,
  AlertCircle,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import FeedbackToast from "@/app/components/FeedbackToast";
import { FormInput, FormSelect } from "@/app/components/FormControl";
import SearchInput from "@/app/components/SearchInput";
import DomicileFormFields from "@/app/components/DomicileFormFields";
import { formatDomicileName } from "@/lib/formatters";
import {
  useProvinces,
  useCities,
  useDistricts,
  useVillages,
} from "@/hooks/useRegions";
import type { UpdateUserPayload, User, UserStatus } from "@/hooks/admin/users";
import {
  type UserSortKey,
  type UserStatusAction,
  type BulkUserStatusAction,
  type UserStatusTarget,
  useUsersPage,
} from "./_hooks/useUsersPage";
import {
  formatDate,
  formatLabel,
  getUserPhone,
  getStatusClass,
  getStatusLabel,
  isAdminUser,
} from "./_utils/userFormatters";

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: "pending", label: "Menunggu Persetujuan" },
  { value: "active", label: "Aktif" },
  { value: "inactive", label: "Nonaktif" },
  { value: "rejected", label: "Ditolak" },
];

const BULK_ACTION_BY_STATUS: Partial<
  Record<
    UserStatus,
    { action: UserStatusAction; label: string; className: string }
  >
> = {
  pending: {
    action: "approve",
    label: "Setujui Semua",
    className: "bg-[#2D7EA0] text-white hover:bg-[#236175]",
  },
  active: {
    action: "deactivate",
    label: "Nonaktifkan Semua",
    className: "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50",
  },
  inactive: {
    action: "activate",
    label: "Aktifkan Semua",
    className: "bg-[#2D7EA0] text-white hover:bg-[#236175]",
  },
  rejected: {
    action: "approve",
    label: "Setujui Ulang Semua",
    className: "bg-[#2D7EA0] text-white hover:bg-[#236175]",
  },
};

const GENDER_OPTIONS = ["Laki-laki", "Perempuan"];
const USER_TABLE_HEADERS: Array<{ label: string; sortKey: UserSortKey }> = [
  { label: "Nama", sortKey: "name" },
  { label: "Email", sortKey: "email" },
  { label: "Nomor Telepon", sortKey: "phone" },
  { label: "Peran", sortKey: "role" },
  { label: "Status", sortKey: "status" },
  { label: "Tanggal Dibuat", sortKey: "created_at" },
];

type EditUserForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  graduation_year: string;
  birth_date: string;
  status: UserStatus;
  status_reason: string;
  domicile_province_code: string;
  domicile_city_code: string;
  domicile_district_code: string;
  domicile_village_code: string;
  domicile_postal_code: string;
  domicile_address: string;
};

function getKnownUserStatus(status?: UserStatus | null): UserStatus {
  return status ?? "pending";
}

function getInputValue(value?: string | null) {
  return value ?? "";
}

function getDateInputValue(value?: string | null) {
  if (!value) return "";
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

type UserWithAvatar = User & {
  avatar_url?: string | null;
};

function getUserAvatarUrl(user: User) {
  return (user as UserWithAvatar).avatar_url?.trim() || null;
}

function Icon3D({
  children,
  variant = "teal",
  size = "md",
}: {
  children: ReactNode;
  variant?: "teal" | "blue" | "green" | "red" | "gray" | "yellow";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
    blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
    green: "from-[#0D5C3A] via-[#0F7047] to-[#0D5C3A] text-white",
    red: "from-red-500 via-red-600 to-red-700 text-white",
    gray: "from-gray-300 via-gray-400 to-gray-500 text-white",
    yellow: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
  };

  const sizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
    lg: "w-14 h-14 rounded-2xl",
  };

  return (
    <span
      className={`${sizes[size]} shrink-0 overflow-visible inline-flex items-center justify-center bg-gradient-to-br ${variants[variant]} shadow-lg shadow-[#0D5C3A]/20 border border-white/40 ring-1 ring-[#D4AF37]/20`}
    >
      <span className="inline-flex items-center justify-center leading-none drop-shadow-sm">
        {children}
      </span>
    </span>
  );
}

function TableSkeleton({ showSelection }: { showSelection: boolean }) {
  const columnCount = showSelection ? 8 : 7;

  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b border-gray-200 animate-pulse">
          {Array.from({ length: columnCount }, (_, index) => index + 1).map(
            (j) => (
              <td key={j} className="p-5">
                <div className="h-4 bg-gray-100 rounded w-3/4" />
              </td>
            ),
          )}
        </tr>
      ))}
    </>
  );
}

interface EditUserModalProps {
  initial: User;
  onClose: () => void;
  onSubmit: (data: UpdateUserPayload) => void;
  loading: boolean;
}

function validateDomicile(values: Partial<EditUserForm>) {
  const errors: Record<string, string> = {};

  if (values.domicile_city_code && !values.domicile_province_code) {
    errors.domicile_province_code = "Provinsi wajib dipilih.";
  }
  if (values.domicile_district_code && !values.domicile_city_code) {
    errors.domicile_city_code = "Kabupaten/kota wajib dipilih.";
  }
  if (values.domicile_village_code && !values.domicile_district_code) {
    errors.domicile_district_code = "Kecamatan wajib dipilih.";
  }
  if (values.domicile_postal_code && values.domicile_postal_code.length > 10) {
    errors.domicile_postal_code = "Kode pos maksimal 10 karakter.";
  }
  if (values.domicile_address && values.domicile_address.length > 1000) {
    errors.domicile_address = "Alamat maksimal 1000 karakter.";
  }

  return errors;
}

function EditUserModal({
  initial,
  onClose,
  onSubmit,
  loading,
}: EditUserModalProps) {
  const [form, setForm] = useState<EditUserForm>({
    first_name: getInputValue(initial.first_name),
    last_name: getInputValue(initial.last_name),
    email: getInputValue(initial.email),
    phone: getInputValue(initial.phone),
    gender: getInputValue(initial.gender),
    graduation_year: getInputValue(initial.graduation_year),
    birth_date: getDateInputValue(initial.birth_date),
    status: getKnownUserStatus(initial.status),
    status_reason: getInputValue(initial.status_reason),
    domicile_province_code: getInputValue(initial.domicile?.province?.code),
    domicile_city_code: getInputValue(initial.domicile?.city?.code),
    domicile_district_code: getInputValue(initial.domicile?.district?.code),
    domicile_village_code: getInputValue(initial.domicile?.village?.code),
    domicile_postal_code: getInputValue(initial.domicile?.postal_code),
    domicile_address: getInputValue(initial.domicile?.address),
  });
  const genderOptions = Array.from(
    new Set([...GENDER_OPTIONS, getInputValue(initial.gender)]),
  ).filter(Boolean);
  const set = <K extends keyof EditUserForm>(key: K, value: EditUserForm[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 text-lg">Ubah Pengguna</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Nama Depan
              </label>
              <FormInput
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Nama Belakang
              </label>
              <FormInput
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Email
            </label>
            <FormInput
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Nomor Telepon
            </label>
            <FormInput
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Jenis Kelamin
              </label>
              <FormSelect
                value={form.gender}
                onChange={(e) => set("gender", e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-white"
              >
                <option value="">Pilih jenis kelamin</option>
                {genderOptions.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Tahun Kelulusan
              </label>
              <FormInput
                value={form.graduation_year}
                onChange={(e) => set("graduation_year", e.target.value)}
                inputMode="numeric"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Tanggal Lahir
            </label>
            <FormInput
              type="date"
              value={form.birth_date}
              onChange={(e) => set("birth_date", e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block">
              Status
            </label>
            <FormSelect
              value={form.status}
              onChange={(e) => {
                const nextStatus = e.target.value as UserStatus;
                setForm((current) => ({
                  ...current,
                  status: nextStatus,
                  status_reason: ["inactive", "rejected"].includes(nextStatus)
                    ? current.status_reason
                    : "",
                }));
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] bg-white"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </FormSelect>
          </div>
          {["inactive", "rejected"].includes(form.status) && (
            <div>
              <label className="text-xs font-medium text-gray-600 mb-1 block font-semibold text-red-700">
                Alasan Keterangan (Wajib)
              </label>
              <textarea
                value={form.status_reason}
                onChange={(e) => set("status_reason", e.target.value)}
                placeholder={
                  form.status === "inactive"
                    ? "Masukkan alasan mengapa akun dinonaktifkan..."
                    : "Masukkan alasan mengapa pendaftaran ditolak..."
                }
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
              />
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 mt-2">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">
              Domisili Saat Ini (Opsional)
            </h4>
            <DomicileFormFields
              values={form}
              onChange={(field, value) => set(field, value)}
              errors={validateDomicile(form)}
              theme="admin"
            />
          </div>
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center active:scale-[0.98]"
          >
            Batal
          </button>

          <button
            onClick={() => {
              const errors = validateDomicile(form);
              if (Object.keys(errors).length === 0) {
                onSubmit(form);
              }
            }}
            disabled={loading || Object.keys(validateDomicile(form)).length > 0 || (["inactive", "rejected"].includes(form.status) && !form.status_reason.trim())}
            className="flex-1 bg-[#2D7EA0] hover:bg-[#236175] disabled:bg-[#A8D5D5] text-white py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            Perbarui
          </button>
        </div>
      </div>
    </div>
  );
}

import { usePresencesByUser } from "@/hooks/admin/usePresences";

interface PresenceRecord {
  id: number;
  event_id?: number;
  status?: string;
  scanned_at: string;
  event?: {
    id?: number;
    event_title?: string;
    event_date?: string;
    start_time?: string;
    end_time?: string;
    location?: string;
    status_event?: string;
  };
}

function formatHistoryDate(date?: string) {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

function formatHistoryTime(time?: string) {
  if (!time) return "";
  return time.slice(0, 5);
}

function formatHistoryScannedAt(date?: string) {
  if (!date) return "-";
  try {
    const value = new Date(date);
    const formattedDate = value.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedTime = value.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} • ${formattedTime} WIB`;
  } catch {
    return date;
  }
}

function exportPresencesToCsv(userName: string, presences: PresenceRecord[]) {
  const BOM = "\uFEFF";
  const headers = [
    "No",
    "Nama Event",
    "Tanggal Event",
    "Jam Mulai",
    "Jam Selesai",
    "Lokasi",
    "Status Kehadiran",
    "Waktu Presensi",
  ];
  const rows = presences.map((p, i) => [
    String(i + 1),
    `"${(p.event?.event_title || "-").replace(/"/g, '""')}"`,
    p.event?.event_date
      ? formatHistoryDate(p.event.event_date)
      : "-",
    formatHistoryTime(p.event?.start_time) || "-",
    formatHistoryTime(p.event?.end_time) || "-",
    `"${(p.event?.location || "-").replace(/"/g, '""')}"`,
    p.status || "Hadir",
    p.scanned_at ? new Date(p.scanned_at).toLocaleString("id-ID") : "-",
  ]);
  const csv =
    BOM + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const safeName = userName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  link.href = url;
  link.download = `riwayat_kehadiran_${safeName}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function UserPresenceHistoryModal({
  user,
  onClose,
}: {
  user: User;
  onClose: () => void;
}) {
  const {
    data: presenceData,
    isLoading: loadingPresences,
    isError: presenceError,
  } = usePresencesByUser(user.id);
  const presences: PresenceRecord[] =
    presenceData?.data?.presences ||
    presenceData?.data?.history ||
    presenceData?.data ||
    [];
  const presenceList = Array.isArray(presences) ? presences : [];

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="presence-history-title"
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="min-w-0">
            <h2
              id="presence-history-title"
              className="text-lg font-bold text-gray-900"
            >
              Riwayat Kehadiran
            </h2>
            <p className="mt-0.5 truncate text-sm font-medium text-gray-600">
              {user.name}
            </p>
            <p className="truncate text-xs text-gray-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="Tutup riwayat kehadiran"
          >
            <X size={18} />
          </button>
        </div>

        {user.domicile && (
          <div className="border-b border-gray-100 bg-[#7AB2B2]/5 px-5 py-3 text-xs text-gray-700">
            <span className="font-semibold text-gray-800">Domisili: </span>
            {user.domicile.address || "—"}, {user.domicile.village?.name || ""},{" "}
            {user.domicile.district?.name || ""},{" "}
            {formatDomicileName(user.domicile.city?.name)},{" "}
            {user.domicile.province?.name || ""} (Kode Pos:{" "}
            {user.domicile.postal_code || "—"})
          </div>
        )}

        <div className="border-b border-gray-100 bg-[#7AB2B2]/10 px-5 py-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[#236175]">
              Total kehadiran: {loadingPresences ? "..." : presenceList.length}{" "}
              event
            </p>
          </div>
          {presenceList.length > 0 && (
            <button
              type="button"
              onClick={() => exportPresencesToCsv(user.name, presenceList)}
              className="flex items-center gap-1.5 rounded-lg bg-[#2D7EA0] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#236175]"
            >
              <Download size={13} strokeWidth={2.5} />
              Ekspor CSV
            </button>
          )}
        </div>

        <div className="max-h-[65vh] overflow-y-auto p-5">
          {loadingPresences ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse space-y-3"
                >
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              ))}
            </div>
          ) : presenceError ? (
            <div className="text-center py-8 space-y-2">
              <AlertCircle size={32} className="mx-auto text-red-400" />
              <p className="text-sm font-semibold text-gray-700">
                Gagal memuat data
              </p>
              <p className="text-xs text-gray-400">
                Silakan tutup dan coba lagi.
              </p>
            </div>
          ) : presenceList.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Clock size={32} className="mx-auto text-gray-300" />
              <p className="text-sm font-semibold text-gray-700">
                Belum ada riwayat kehadiran
              </p>
              <p className="text-xs text-gray-400">
                Pengguna ini belum pernah melakukan presensi.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {presenceList.map((presence) => (
                <div
                  key={presence.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <h3 className="text-sm font-bold text-gray-800">
                        {presence.event?.event_title || "Event tidak tersedia"}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Calendar size={14} className="shrink-0" />
                        <span>
                          {formatHistoryDate(presence.event?.event_date)}
                          {presence.event?.start_time && (
                            <>
                              {" "}
                              • {formatHistoryTime(presence.event.start_time)}
                              {presence.event.end_time
                                ? ` - ${formatHistoryTime(presence.event.end_time)}`
                                : ""}{" "}
                              WIB
                            </>
                          )}
                        </span>
                      </div>
                      {presence.event?.location && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin size={14} className="shrink-0" />
                          <span>{presence.event.location}</span>
                        </div>
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-600">
                      <CheckCircle size={12} />
                      Hadir
                    </span>
                  </div>
                  <div className="mt-4 flex items-start gap-2 border-t border-gray-100 pt-3 text-xs text-gray-500">
                    <Clock
                      size={14}
                      className="mt-0.5 shrink-0 text-teal-600"
                    />
                    <span>
                      Diverifikasi:{" "}
                      <span className="font-medium text-gray-700">
                        {formatHistoryScannedAt(presence.scanned_at)}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const {
    allVisibleSelected,
    bulkActionLoading,
    cancelDelete,
    clearSelectedUsers,
    confirmDelete,
    currentPage,
    deleteUser,
    deleteTarget,
    feedback,
    goToPage,
    handleDelete,
    handleExport,
    handleSort,
    handleSubmit,
    isBulkSelectable,
    isError,
    isLoading,
    pageEnd,
    pageStart,
    paginatedUsers,
    paginationRange,
    perPage,
    runBulkAction,
    search,
    selected,
    selectedUserIds,
    selectedUsers,
    setSearch,
    setSelected,
    setPerPage,
    setStatusFilter,
    sortBy,
    sortDirection,
    stats,
    statusFilter,
    someVisibleSelected,
    toggleSelectAll,
    toggleUserSelection,
    totalFilteredUsers,
    totalPages,
    updateUser,
    closeModal,
    provinceFilter,
    cityFilter,
    districtFilter,
    villageFilter,
    setProvinceFilter,
    setCityFilter,
    setDistrictFilter,
    setVillageFilter,
    requestStatusUpdate: runRequestStatusUpdate,
    confirmStatusUpdate: runConfirmStatusUpdate,
    statusTarget,
    cancelStatusUpdate: runCancelStatusUpdate,
    updateUserStatus,
  } = useUsersPage();
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [bulkActionTarget, setBulkActionTarget] = useState<BulkUserStatusAction | null>(null);
  const [bulkReason, setBulkReason] = useState("");

  const handleBulkActionClick = () => {
    if (!bulkAction) return;
    setBulkActionTarget(bulkAction.action);
    setBulkReason("");
  };

  const requestStatusUpdate = (target: UserStatusTarget) => {
    setStatusReason("");
    runRequestStatusUpdate(target);
  };

  const cancelStatusUpdate = () => {
    setStatusReason("");
    runCancelStatusUpdate();
  };

  const confirmStatusUpdate = (reason?: string) => {
    setStatusReason("");
    runConfirmStatusUpdate(reason);
  };

  const { data: provinces = [] } = useProvinces();
  const { data: cities = [] } = useCities(provinceFilter);
  const { data: districts = [] } = useDistricts(cityFilter);
  const { data: villages = [] } = useVillages(districtFilter);

  const statusTabs = [
    { value: "all" as const, label: "Semua", count: stats.totalUsers },
    {
      value: "pending" as const,
      label: "Menunggu Persetujuan",
      count: stats.pendingUsers,
    },
    { value: "active" as const, label: "Aktif", count: stats.activeUsers },
    {
      value: "inactive" as const,
      label: "Nonaktif",
      count: stats.inactiveUsers,
    },
    {
      value: "rejected" as const,
      label: "Ditolak",
      count: stats.rejectedUsers,
    },
  ];
  const bulkAction =
    statusFilter === "all"
      ? null
      : (BULK_ACTION_BY_STATUS[statusFilter] ?? null);

  const handleStatusTabChange = (
    value: (typeof statusTabs)[number]["value"],
  ) => {
    clearSelectedUsers();
    setStatusFilter(value);
  };

  return (
    <AdminLayout title="Kelola Alumni">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-5">
        {[
          {
            title: "Total Pengguna",
            value: isLoading ? "..." : stats.totalUsers,
            desc: "Pengguna terdaftar",
            icon: <Users size={20} strokeWidth={2.5} />,
            variant: "teal" as const,
          },
          {
            title: "Aktif",
            value: isLoading ? "..." : stats.activeUsers,
            desc: "Pengguna aktif",
            icon: <UserCheck size={20} strokeWidth={2.5} />,
            variant: "green" as const,
          },
          {
            title: "Menunggu Persetujuan",
            value: isLoading ? "..." : stats.pendingUsers,
            desc: "Perlu ditinjau admin",
            icon: <Clock3 size={20} strokeWidth={2.5} />,
            variant: "yellow" as const,
          },
          {
            title: "Nonaktif",
            value: isLoading ? "..." : stats.inactiveUsers,
            desc: "Akun dinonaktifkan",
            icon: <AlertCircle size={20} strokeWidth={2.5} />,
            variant: "red" as const,
          },
          {
            title: "Bulan Ini",
            value: isLoading ? "..." : stats.monthUsers,
            desc: "Pengguna baru",
            icon: <CalendarPlus size={20} strokeWidth={2.5} />,
            variant: "blue" as const,
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-[#0D5C3A]/10"
          >
            <p className="text-[#0D5C3A]/70 text-xs font-semibold uppercase tracking-wide">
              {item.title}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <Icon3D variant={item.variant} size="md">
                {item.icon}
              </Icon3D>
              <h2 className="text-3xl font-bold text-[#0D5C3A]">
                {item.value}
              </h2>
            </div>
            <p className="text-[#0D5C3A]/50 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-md shadow-[#0D5C3A]/5 overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-[#E8F5E9] to-white border-b border-[#0D5C3A]/10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Icon3D variant="teal" size="md">
              <UserCog size={20} strokeWidth={2.5} />
            </Icon3D>
            <div>
              <h2 className="text-[#0D5C3A] text-xl font-bold">
                Manajemen Alumni
              </h2>
              <p className="text-[#0D5C3A]/60 text-xs mt-1">
                Kelola data alumni aplikasi presensi event
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {([ "pdf","excel"] as const).map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                disabled={isLoading || totalFilteredUsers === 0}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#0D5C3A]/15 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#0D5C3A]/20 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                <Download size={15} strokeWidth={2.5} />
                {format === "excel" ? "Excel" : "PDF"}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          <SearchInput
            leadingIcon={<Search size={16} className="text-[#0D5C3A]/45" />}
            wrapperClassName="flex items-center gap-2 w-full px-4 py-2.5 border border-[#0D5C3A]/15 rounded-xl mb-4 focus-within:border-[#0D5C3A] focus-within:ring-2 focus-within:ring-[#0D5C3A]/10 bg-white"
            placeholder="Cari nama atau email..."
            value={search}
            onValueChange={setSearch}
            className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
          />

          <div className="mb-4 grid grid-cols-1 sm:grid-cols-4 gap-3 border border-[#0D5C3A]/10 rounded-2xl p-4 bg-[#E8F5E9]/35">
            <div>
              <label className="text-[10px] font-semibold text-[#0D5C3A]/65 uppercase tracking-wider block mb-1">
                Filter Provinsi
              </label>
              <FormSelect
                value={provinceFilter}
                onChange={(e) => setProvinceFilter(e.target.value)}
                className="w-full border border-[#0D5C3A]/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 bg-white"
              >
                <option value="">Semua Provinsi</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#0D5C3A]/65 uppercase tracking-wider block mb-1">
                Filter Kota/Kabupaten
              </label>
              <FormSelect
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                disabled={!provinceFilter}
                className="w-full border border-[#0D5C3A]/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 bg-white disabled:opacity-50"
              >
                <option value="">Semua Kota/Kabupaten</option>
                {cities.map((c) => (
                  <option key={c.code} value={c.code}>
                    {formatDomicileName(c.name)}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#0D5C3A]/65 uppercase tracking-wider block mb-1">
                Filter Kecamatan
              </label>
              <FormSelect
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                disabled={!cityFilter}
                className="w-full border border-[#0D5C3A]/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 bg-white disabled:opacity-50"
              >
                <option value="">Semua Kecamatan</option>
                {districts.map((d) => (
                  <option key={d.code} value={d.code}>
                    {d.name}
                  </option>
                ))}
              </FormSelect>
            </div>
            <div>
              <label className="text-[10px] font-semibold text-[#0D5C3A]/65 uppercase tracking-wider block mb-1">
                Filter Desa/Kelurahan
              </label>
              <FormSelect
                value={villageFilter}
                onChange={(e) => setVillageFilter(e.target.value)}
                disabled={!districtFilter}
                className="w-full border border-[#0D5C3A]/15 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10 bg-white disabled:opacity-50"
              >
                <option value="">Semua Desa/Kelurahan</option>
                {villages.map((v) => (
                  <option key={v.code} value={v.code}>
                    {v.name}
                  </option>
                ))}
              </FormSelect>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-[#0D5C3A]/10 bg-[#E8F5E9]/50 p-1">
            {statusTabs.map((tab) => (
              <button
                type="button"
                key={tab.value}
                onClick={() => handleStatusTabChange(tab.value)}
                className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                  statusFilter === tab.value
                    ? "bg-white text-[#0D5C3A] shadow-sm ring-1 ring-[#D4AF37]/20"
                    : "text-[#0D5C3A]/55 hover:text-[#0D5C3A]"
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {bulkAction && selectedUsers.length > 0 && (
            <div className="mb-4 flex flex-col gap-3 rounded-xl border border-[#D4AF37]/25 bg-[#D4AF37]/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-[#0D5C3A]">
                {bulkActionLoading
                  ? "Memproses..."
                  : `${selectedUsers.length} pengguna dipilih`}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleBulkActionClick}
                  disabled={bulkActionLoading || selectedUsers.length === 0}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${bulkAction.className}`}
                >
                  {bulkAction.label}
                </button>
                <button
                  type="button"
                  onClick={clearSelectedUsers}
                  disabled={bulkActionLoading}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batal Pilih
                </button>
              </div>
            </div>
          )}

          {isError && (
            <div className="text-center py-8">
              <div className="flex justify-center mb-3">
                <Icon3D variant="red" size="md">
                  <AlertCircle size={20} strokeWidth={2.5} />
                </Icon3D>
              </div>
              <p className="text-sm text-red-500 font-medium">
                Gagal memuat data pengguna
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Data belum bisa dimuat. Periksa koneksi, lalu coba lagi.
              </p>
            </div>
          )}

          {!isError && (
            <div className="overflow-x-auto rounded-xl border border-[#0D5C3A]/10">
              <table className="w-full min-w-[900px] overflow-hidden rounded-xl">
                <thead className="bg-gradient-to-r from-[#E8F5E9] to-white">
                  <tr>
                    {statusFilter !== "all" && (
                      <th className="w-10 px-2.5 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={allVisibleSelected}
                          onChange={toggleSelectAll}
                          disabled={
                            bulkActionLoading ||
                            !paginatedUsers.some(isBulkSelectable)
                          }
                          aria-label="Pilih semua pengguna yang tampil"
                          aria-checked={
                            allVisibleSelected
                              ? true
                              : someVisibleSelected
                                ? "mixed"
                                : false
                          }
                          title="Pilih semua pengguna yang tampil"
                          className="h-4 w-4 rounded border-gray-300 accent-[#2D7EA0] disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </th>
                    )}
                    {USER_TABLE_HEADERS.map((header) => (
                      <th
                        key={header.sortKey}
                        className={`px-2.5 py-2 text-[11px] font-semibold text-[#0D5C3A] ${
                          ["name", "email", "phone"].includes(header.sortKey)
                            ? "text-left"
                            : "text-center"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleSort(header.sortKey)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded px-1 py-0.5 transition hover:bg-white/70 hover:text-[#0D5C3A]"
                        >
                          {header.label}
                          <span
                            className={
                              sortBy === header.sortKey
                                ? "text-[#D4AF37]"
                                : "text-[#0D5C3A]/25"
                            }
                            aria-hidden="true"
                          >
                            {sortBy === header.sortKey
                              ? sortDirection === "asc"
                                ? "↑"
                                : "↓"
                              : "↕"}
                          </span>
                        </button>
                      </th>
                    ))}
                    <th className="px-2.5 py-2 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton showSelection={statusFilter !== "all"} />
                  ) : totalFilteredUsers === 0 ? (
                    <tr>
                      <td
                        colSpan={statusFilter === "all" ? 7 : 8}
                        className="text-center py-8 text-gray-400"
                      >
                        <div className="flex justify-center mb-3">
                          <Icon3D variant="gray" size="md">
                            <Users size={20} strokeWidth={2.5} />
                          </Icon3D>
                        </div>
                        <p className="text-xs">
                          {search
                            ? "Pengguna tidak ditemukan"
                            : "Belum ada data pengguna"}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user, index) => {
                      const canSelect =
                        statusFilter !== "all" && isBulkSelectable(user);
                      const avatarUrl = getUserAvatarUrl(user);
                      const selectionTitle =
                        statusFilter === "all"
                          ? "Pilih salah satu tab status untuk aksi massal"
                          : isAdminUser(user)
                            ? "Admin tidak dapat diproses secara massal"
                            : canSelect
                              ? `Pilih ${user.name}`
                              : "Akun Anda sendiri tidak dapat diproses secara massal";

                      return (
                        <tr
                          key={user.id}
                          onClick={() => setHistoryUser(user)}
                          className={`cursor-pointer border-b border-[#0D5C3A]/10 transition-colors ${
                            selectedUserIds.has(user.id)
                              ? "bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25"
                              : index % 2 === 0
                                ? "bg-white hover:bg-[#E8F5E9]/50"
                                : "bg-[#E8F5E9]/25 hover:bg-[#E8F5E9]/60"
                          }`}
                        >
                          {statusFilter !== "all" && (
                            <td className="p-3">
                              <input
                                type="checkbox"
                                onClick={(event) => event.stopPropagation()}
                                checked={selectedUserIds.has(user.id)}
                                onChange={() => toggleUserSelection(user)}
                                disabled={bulkActionLoading || !canSelect}
                                aria-label={selectionTitle}
                                title={selectionTitle}
                                className="h-4 w-4 rounded border-gray-300 accent-[#2D7EA0] disabled:cursor-not-allowed disabled:opacity-40"
                              />
                            </td>
                          )}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cover bg-center text-[11px] font-bold text-white ${
                                  avatarUrl
                                    ? "bg-gray-100 ring-1 ring-[#D4AF37]/30"
                                    : "bg-gradient-to-br from-[#0D5C3A] to-[#073D26]"
                                }`}
                                style={
                                  avatarUrl
                                    ? {
                                        backgroundImage: `url("${avatarUrl}")`,
                                      }
                                    : undefined
                                }
                                aria-label={
                                  avatarUrl
                                    ? `Foto profil ${user.name}`
                                    : undefined
                                }
                              >
                                {!avatarUrl &&
                                  (user.name?.[0]?.toUpperCase() ?? "U")}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold text-[#0D5C3A]">
                                  {user.name}
                                </span>
                                {user.domicile?.city?.name && (
                                  <span className="text-[10px] text-[#0D5C3A]/45 font-normal mt-0.5 flex items-center gap-0.5">
                                    <MapPin
                                      size={8}
                                      className="text-[#0D5C3A]/40 shrink-0"
                                    />
                                    {formatDomicileName(user.domicile.city.name)},{" "}
                                    {user.domicile.province?.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-[#0D5C3A]/60 text-xs">
                            {user.email}
                          </td>
                          <td className="p-3 text-[#0D5C3A]/60 text-xs">
                            {getUserPhone(user)}
                          </td>
                          <td className="p-3 text-center">
                            <span className="inline-block px-2.5 py-1 bg-[#D4AF37]/10 text-[#0D5C3A] border border-[#D4AF37]/20 rounded-lg text-xs font-medium">
                              {formatLabel(user.role)}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span
                                className={`inline-block px-2.5 py-1 rounded-lg text-xs font-medium ${getStatusClass(user.status)}`}
                              >
                                {getStatusLabel(user.status)}
                              </span>
                              {user.status_reason && (
                                <span
                                  className="text-[10px] text-[#0D5C3A]/50 italic max-w-[120px] truncate"
                                  title={user.status_reason}
                                >
                                  Ket: {user.status_reason}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-[#0D5C3A]/60 text-xs">
                            {formatDate(user.created_at)}
                          </td>
                          <td className="p-3">
                            <div className="flex flex-wrap justify-end gap-1.5">
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setHistoryUser(user);
                                }}
                                className="rounded-lg p-1 text-teal-600 transition-colors hover:bg-teal-50"
                                title="Riwayat Kehadiran"
                                aria-label={`Riwayat kehadiran ${user.name}`}
                              >
                                <Clock3 size={14} strokeWidth={2.5} />
                              </button>

                              {!isAdminUser(user) && user.status === "pending" && (
                                <>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      requestStatusUpdate({ user, status: "active", action: "approve" });
                                    }}
                                    className="rounded-lg p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
                                    title="Setujui Pendaftaran"
                                    aria-label={`Setujui ${user.name}`}
                                  >
                                    <UserCheck size={14} strokeWidth={2.5} />
                                  </button>
                                  <button
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      requestStatusUpdate({ user, status: "rejected", action: "reject" });
                                    }}
                                    className="rounded-lg p-1 text-red-500 transition-colors hover:bg-red-50"
                                    title="Tolak Pendaftaran"
                                    aria-label={`Tolak ${user.name}`}
                                  >
                                    <X size={14} strokeWidth={2.5} />
                                  </button>
                                </>
                              )}

                              {!isAdminUser(user) && user.status === "active" && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    requestStatusUpdate({ user, status: "inactive", action: "deactivate" });
                                  }}
                                  className="rounded-lg p-1 text-orange-500 transition-colors hover:bg-orange-50"
                                  title="Nonaktifkan Pengguna"
                                  aria-label={`Nonaktifkan ${user.name}`}
                                >
                                  <AlertCircle size={14} strokeWidth={2.5} />
                                </button>
                              )}

                              {!isAdminUser(user) && user.status === "inactive" && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    requestStatusUpdate({ user, status: "active", action: "activate" });
                                  }}
                                  className="rounded-lg p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
                                  title="Aktifkan Pengguna"
                                  aria-label={`Aktifkan ${user.name}`}
                                >
                                  <UserCheck size={14} strokeWidth={2.5} />
                                </button>
                              )}

                              {!isAdminUser(user) && user.status === "rejected" && (
                                <button
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    requestStatusUpdate({ user, status: "active", action: "approve" });
                                  }}
                                  className="rounded-lg p-1 text-emerald-600 transition-colors hover:bg-emerald-50"
                                  title="Setujui Ulang"
                                  aria-label={`Setujui ulang ${user.name}`}
                                >
                                  <UserCheck size={14} strokeWidth={2.5} />
                                </button>
                              )}

                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setSelected(user);
                                }}
                                className="rounded-lg p-1 text-[#2D7EA0] transition-colors hover:bg-[#7AB2B2]/10"
                                title="Ubah"
                                aria-label={`Ubah ${user.name}`}
                              >
                                <Edit3 size={14} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleDelete(user);
                                }}
                                disabled={deleteUser.isPending}
                                className="rounded-lg p-1 text-red-400 transition-colors hover:bg-red-50 disabled:opacity-50"
                                title="Hapus"
                                aria-label={`Hapus ${user.name}`}
                              >
                                <Trash2 size={14} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isLoading && !isError && totalFilteredUsers > 0 && (
            <div className="mt-4 flex flex-col gap-3 border-t border-[#0D5C3A]/10 pt-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-4">
                <p className="text-xs text-[#0D5C3A]/60">
                  Menampilkan {pageStart}-{pageEnd} dari {totalFilteredUsers}{" "}
                  pengguna
                </p>
                <label className="flex items-center gap-2 text-xs text-[#0D5C3A]/60">
                  Tampilkan
                  <FormSelect
                    value={perPage}
                    onChange={(event) => setPerPage(Number(event.target.value))}
                    className="rounded-lg border border-[#0D5C3A]/15 bg-white px-2 py-1.5 text-xs font-medium outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/10"
                  >
                    {[10, 25, 50, 100].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </FormSelect>
                  data per halaman
                </label>
              </div>

              <nav
                aria-label="Navigasi halaman pengguna"
                className="flex flex-wrap items-center gap-1.5"
              >
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-lg border border-[#0D5C3A]/15 px-3 py-1.5 text-xs text-[#0D5C3A]/65 transition hover:bg-[#E8F5E9] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Sebelumnya
                </button>

                {paginationRange.map((item) =>
                  typeof item === "number" ? (
                    <button
                      type="button"
                      key={item}
                      onClick={() => goToPage(item)}
                      aria-current={item === currentPage ? "page" : undefined}
                      className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        item === currentPage
                          ? "bg-[#0D5C3A] text-white"
                          : "border border-[#0D5C3A]/15 text-[#0D5C3A]/65 hover:bg-[#E8F5E9]"
                      }`}
                    >
                      {item}
                    </button>
                  ) : (
                    <span key={item} className="px-1 text-xs text-gray-400">
                      …
                    </span>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="rounded-lg border border-[#0D5C3A]/15 px-3 py-1.5 text-xs text-[#0D5C3A]/65 transition hover:bg-[#E8F5E9] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>

      <footer className="mt-6 text-center text-[#0D5C3A]/40 text-xs">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </footer>

      {selected && (
        <EditUserModal
          initial={selected}
          onClose={closeModal}
          onSubmit={handleSubmit}
          loading={updateUser.isPending}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Hapus pengguna?"
        message={
          deleteTarget
            ? `Pengguna "${deleteTarget.name}" akan dihapus permanen dari daftar.`
            : "Pengguna ini akan dihapus permanen dari daftar."
        }
        confirmLabel="Hapus"
        loading={deleteUser.isPending}
        onCancel={cancelDelete}
        onConfirm={confirmDelete}
      />

      {statusTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${
                ["deactivate", "reject"].includes(statusTarget.action)
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-600"
              }`}>
                {["deactivate", "reject"].includes(statusTarget.action) ? (
                  <AlertCircle size={22} strokeWidth={2.5} />
                ) : (
                  <CheckCircle size={22} strokeWidth={2.5} />
                )}
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {statusTarget.action === "approve" && "Setujui Pendaftaran"}
                {statusTarget.action === "reject" && "Tolak Pendaftaran"}
                {statusTarget.action === "deactivate" && "Nonaktifkan Akun"}
                {statusTarget.action === "activate" && "Aktifkan Akun"}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              {statusTarget.action === "approve" && `Apakah Anda yakin ingin menyetujui pendaftaran "${statusTarget.user.name}"?`}
              {statusTarget.action === "reject" && `Apakah Anda yakin ingin menolak pendaftaran "${statusTarget.user.name}"?`}
              {statusTarget.action === "deactivate" && `Apakah Anda yakin ingin menonaktifkan akun "${statusTarget.user.name}"?`}
              {statusTarget.action === "activate" && `Apakah Anda yakin ingin mengaktifkan kembali akun "${statusTarget.user.name}"?`}
            </p>

            {["deactivate", "reject"].includes(statusTarget.action) && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-red-700 mb-1.5 block">
                  Alasan Keterangan (Wajib)
                </label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder={
                    statusTarget.action === "deactivate"
                      ? "Masukkan alasan mengapa akun dinonaktifkan..."
                      : "Masukkan alasan mengapa pendaftaran ditolak..."
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={cancelStatusUpdate}
                disabled={updateUserStatus.isPending}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => confirmStatusUpdate(statusReason)}
                disabled={
                  updateUserStatus.isPending || 
                  (["deactivate", "reject"].includes(statusTarget.action) && !statusReason.trim())
                }
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  ["deactivate", "reject"].includes(statusTarget.action)
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#0D5C3A] hover:bg-[#073D26] text-white"
                }`}
              >
                {updateUserStatus.isPending && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {bulkActionTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2.5 rounded-xl ${
                ["deactivate", "reject"].includes(bulkActionTarget)
                  ? "bg-red-50 text-red-500"
                  : "bg-emerald-50 text-emerald-600"
              }`}>
                {["deactivate", "reject"].includes(bulkActionTarget) ? (
                  <AlertCircle size={22} strokeWidth={2.5} />
                ) : (
                  <CheckCircle size={22} strokeWidth={2.5} />
                )}
              </div>
              <h3 className="font-semibold text-gray-800 text-lg">
                {bulkActionTarget === "approve" && "Setujui Pendaftaran Massal"}
                {bulkActionTarget === "reject" && "Tolak Pendaftaran Massal"}
                {bulkActionTarget === "deactivate" && "Nonaktifkan Akun Massal"}
                {bulkActionTarget === "activate" && "Aktifkan Akun Massal"}
              </h3>
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Apakah Anda yakin ingin memproses status untuk <strong>{selectedUsers.length}</strong> pengguna terpilih?
            </p>

            {["deactivate", "reject"].includes(bulkActionTarget) && (
              <div className="mb-4">
                <label className="text-xs font-semibold text-red-700 mb-1.5 block">
                  Alasan Keterangan Massal (Wajib)
                </label>
                <textarea
                  value={bulkReason}
                  onChange={(e) => setBulkReason(e.target.value)}
                  placeholder={
                    bulkActionTarget === "deactivate"
                      ? "Masukkan alasan mengapa akun-akun ini dinonaktifkan..."
                      : "Masukkan alasan mengapa pendaftaran-pendaftaran ini ditolak..."
                  }
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBulkActionTarget(null)}
                disabled={bulkActionLoading}
                className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-600 py-2 rounded-xl text-sm font-medium transition-colors active:scale-[0.98] disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  runBulkAction(bulkActionTarget, bulkReason);
                  setBulkActionTarget(null);
                }}
                disabled={
                  bulkActionLoading || 
                  (["deactivate", "reject"].includes(bulkActionTarget) && !bulkReason.trim())
                }
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                  ["deactivate", "reject"].includes(bulkActionTarget)
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-[#0D5C3A] hover:bg-[#073D26] text-white"
                }`}
              >
                {bulkActionLoading && (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                Konfirmasi
              </button>
            </div>
          </div>
        </div>
      )}

      {historyUser && (
        <UserPresenceHistoryModal
          user={historyUser}
          onClose={() => setHistoryUser(null)}
        />
      )}

      {feedback && (
        <FeedbackToast type={feedback.type} message={feedback.message} />
      )}
    </AdminLayout>
  );
}

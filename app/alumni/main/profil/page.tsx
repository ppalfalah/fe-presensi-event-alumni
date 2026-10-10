"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Calendar,
  GraduationCap,
  Edit3,
  Save,
  X,
  Camera,
  Loader2,
  AlertCircle,
  LogOut,
  ChevronRight,
  Trash2,
  MapPin,
} from "lucide-react";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import FeedbackToast from "@/app/components/FeedbackToast";
import { FormInput, FormSelect } from "@/app/components/FormControl";
import { formatDomicileName } from "@/lib/formatters";

import {
  useProfile,
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
} from "@/hooks/alumni/useProfile";

import type { UpdateProfilePayload } from "@/types/profile";
import { clearAuthStorage, getApiErrorMessage, getImageUrl } from "@/lib/api";
import { stopHeartbeat } from "@/lib/heartbeat";
import DomicileFormFields from "@/app/components/DomicileFormFields";

/* ─── Skeleton loader ─────────────────────────────────────── */
function ProfileSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex flex-col items-center gap-3 mb-6">
        <div className="w-24 h-24 rounded-full bg-slate-200" />
        <div className="h-5 w-36 bg-slate-200 rounded-lg" />
        <div className="h-4 w-24 bg-slate-100 rounded-lg" />
      </div>

      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 py-3.5 border-b border-slate-100"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-20 bg-slate-100 rounded" />
            <div className="h-4 w-40 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Avatar section ──────────────────────────────────────── */
function AvatarSection({
  name,
  avatarUrl,
  onToast,
}: {
  name: string;
  avatarUrl?: string | null;
  onToast: (type: "success" | "error", message: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadAvatar, isPending } = useUploadAvatar();
  const { mutate: deleteAvatar, isPending: isDeleting } = useDeleteAvatar();
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "A";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      onToast("error", "Ukuran foto maksimal 2 MB. Silakan pilih foto yang lebih kecil.");
      e.target.value = "";
      return;
    }

    uploadAvatar(file, {
      onSuccess: () => onToast("success", "Foto profil berhasil diperbarui"),
      onError: (err: unknown) => {
        onToast(
          "error",
          getApiErrorMessage(err, "Foto profil belum berhasil diperbarui.")
        );
      },
    });
    e.target.value = "";
  }

  function handleDeleteAvatar() {
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeleteAvatar() {
    deleteAvatar(undefined, {
      onSuccess: () => {
        setIsDeleteConfirmOpen(false);
        onToast("success", "Foto profil berhasil dihapus");
      },
      onError: (err: unknown) => {
        setIsDeleteConfirmOpen(false);
        onToast(
          "error",
          getApiErrorMessage(err, "Foto profil belum berhasil dihapus.")
        );
      },
    });
  }

  return (
    <div className="flex flex-col items-center gap-3 mb-5">
      <div className="relative">
        {avatarUrl ? (
          <img
            src={getImageUrl(avatarUrl)}
            alt={name}
            className="w-24 h-24 rounded-full object-cover ring-4 ring-[#B2DE96]/30"
          />
        ) : (
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold text-white ring-4 ring-[#B2DE96]/30"
            style={{
              background: "linear-gradient(135deg, #5ab494 0%, #41A07E 100%)",
            }}
          >
            {initials}
          </div>
        )}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={isPending || isDeleting}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#41A07E] text-white flex items-center justify-center shadow-md transition hover:bg-[#357f65] active:scale-95 disabled:opacity-70"
        >
          {isPending ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Camera size={14} />
          )}
        </button>

        {avatarUrl && (
          <button
            type="button"
            onClick={handleDeleteAvatar}
            disabled={isPending || isDeleting}
            className="absolute top-0 right-0 w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md transition hover:bg-red-600 active:scale-95 disabled:opacity-70"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </button>
        )}

        <FormInput
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <ConfirmDialog
        isOpen={isDeleteConfirmOpen}
        title="Hapus foto profil?"
        message="Foto profil Anda akan dihapus dari akun alumni."
        confirmLabel="Hapus"
        loading={isDeleting}
        onCancel={() => setIsDeleteConfirmOpen(false)}
        onConfirm={confirmDeleteAvatar}
      />

      <div className="text-center">
        <p className="font-bold text-slate-800 text-lg leading-tight">
          {name}
        </p>
        <p className="text-xs text-[#41A07E] font-medium mt-0.5">
          Alumni Terdaftar
        </p>
      </div>
    </div>
  );
}

/* ─── Info Row ────────────────────────────────────────────── */
function InfoRow({
  icon: Icon,
  label,
  value,
  editing,
  children,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  editing?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-[#B2DE96]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={15} className="text-[#41A07E]" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 mb-0.5">{label}</p>

        {editing && children ? (
          children
        ) : (
          <p className="text-sm font-medium text-slate-700 truncate">
            {value || "—"}
          </p>
        )}
      </div>
    </div>
  );
}

/* ─── Edit Input ──────────────────────────────────────────── */
function EditInput({
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <FormInput
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-xl border border-[#41A07E]/30 bg-[#B2DE96]/10 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#41A07E] focus:ring-2 focus:ring-[#B2DE96]/30 transition"
    />
  );
}

function validateDomicile(values: UpdateProfilePayload) {
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

/* ─── Main Profile Page ───────────────────────────────────── */
export default function AlumniProfilePage() {
  const router = useRouter();

  const { data: profile, isLoading, isError, error } = useProfile();
  const { mutate: updateProfile, isPending: isSaving } = useUpdateProfile();

  const [isEditing, setIsEditing] = useState(false);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const [draft, setDraft] = useState<UpdateProfilePayload>({});

  const serverError = isError
    ? getApiErrorMessage(error, "Profil belum berhasil dimuat. Silakan coba lagi.")
    : null;

  function showToast(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }

  function startEdit() {
    if (!profile) return;

    setDraft({
      first_name: profile.first_name || "",
      last_name: profile.last_name || "",
      phone: profile.phone || "",
      gender: profile.gender || "",
      graduation_year: profile.graduation_year
        ? String(profile.graduation_year)
        : "",
      birth_date: profile.birth_date || "",
      domicile_province_code: profile.domicile?.province?.code || "",
      domicile_city_code: profile.domicile?.city?.code || "",
      domicile_district_code: profile.domicile?.district?.code || "",
      domicile_village_code: profile.domicile?.village?.code || "",
      domicile_postal_code: profile.domicile?.postal_code || "",
      domicile_address: profile.domicile?.address || "",
    });

    setIsEditing(true);
  }

  function cancelEdit() {
    setDraft({});
    setIsEditing(false);
  }

  function handleSave() {
    const errors = validateDomicile(draft);
    if (Object.keys(errors).length > 0) {
      showToast("error", Object.values(errors)[0]);
      return;
    }

    updateProfile(draft, {
      onSuccess: () => {
        setIsEditing(false);
        setDraft({});
        showToast("success", "Profil berhasil diperbarui!");
      },
      onError: (err: unknown) => {
        const msg = getApiErrorMessage(
          err,
          "Profil belum berhasil disimpan. Silakan coba lagi."
        );
        showToast("error", msg);
      },
    });
  }

  function handleLogout() {
    stopHeartbeat();
    clearAuthStorage();
    window.location.replace("/alumni/login");
  }

  function formatDate(dateStr?: string | null) {
    if (!dateStr) return "—";

    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(dateStr));
  }

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Profil Saya</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Memuat informasi akun alumni
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
          <ProfileSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Profil Saya</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola informasi akun alumni Anda
          </p>
        </div>

        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={22} className="text-red-500" />
          </div>

          <p className="font-semibold text-slate-800 mb-1">
            Gagal Memuat Profil
          </p>

          <p className="text-sm text-slate-500">
            {serverError || "Silakan masuk ulang untuk memuat profil."}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#41A07E] hover:bg-[#357f65]"
          >
            Masuk Ulang
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${profile.first_name || ""} ${
    profile.last_name || ""
  }`.trim();

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            Profil Saya
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Kelola informasi akun Anda
          </p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={startEdit}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-[#41A07E] bg-[#B2DE96]/20 hover:bg-[#B2DE96]/30 transition"
          >
            <Edit3 size={13} />
            Ubah
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 bg-red-50 border-2 border-red-200 hover:bg-red-100 hover:border-red-300 transition active:scale-[0.98]"
            >
              <X size={13} />
              Batal
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#41A07E] hover:bg-[#357f65] shadow-sm transition active:scale-95 disabled:opacity-70"
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Save size={13} />
              )}
              Simpan
            </button>
          </div>
        )}
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-4">
        <AvatarSection
          name={fullName || "Alumni"}
          avatarUrl={profile.avatar_url}
          onToast={showToast}
        />

        <InfoRow
          icon={User}
          label="Nama Depan"
          value={profile.first_name || ""}
          editing={isEditing}
        >
          <EditInput
            value={draft.first_name ?? ""}
            onChange={(v) => setDraft({ ...draft, first_name: v })}
            placeholder="Nama depan"
          />
        </InfoRow>

        <InfoRow
          icon={User}
          label="Nama Belakang"
          value={profile.last_name || ""}
          editing={isEditing}
        >
          <EditInput
            value={draft.last_name ?? ""}
            onChange={(v) => setDraft({ ...draft, last_name: v })}
            placeholder="Nama belakang"
          />
        </InfoRow>

        <InfoRow
          icon={Mail}
          label="Email"
          value={profile.email || ""}
          editing={false}
        />

        <InfoRow
          icon={Phone}
          label="No Telp"
          value={profile.phone || ""}
          editing={isEditing}
        >
          <EditInput
            value={draft.phone ?? ""}
            onChange={(v) => setDraft({ ...draft, phone: v })}
            type="tel"
            placeholder="No telepon"
          />
        </InfoRow>

        <InfoRow
          icon={User}
          label="Jenis Kelamin"
          value={profile.gender || ""}
          editing={isEditing}
        >
          <FormSelect
            value={draft.gender ?? ""}
            onChange={(e) =>
              setDraft({
                ...draft,
                gender: e.target.value as "Laki-laki" | "Perempuan",
              })
            }
            className="w-full rounded-xl border border-[#41A07E]/30 bg-[#B2DE96]/10 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#41A07E] focus:ring-2 focus:ring-[#B2DE96]/30 transition"
          >
            <option value="">Pilih jenis kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </FormSelect>
        </InfoRow>

        <InfoRow
          icon={GraduationCap}
          label="Angkatan (Tahun Lulus)"
          value={
            profile.graduation_year ? String(profile.graduation_year) : ""
          }
          editing={isEditing}
        >
          <FormSelect
            value={draft.graduation_year ?? ""}
            onChange={(e) =>
              setDraft({ ...draft, graduation_year: e.target.value })
            }
            className="w-full rounded-xl border border-[#41A07E]/30 bg-[#B2DE96]/10 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#41A07E] focus:ring-2 focus:ring-[#B2DE96]/30 transition"
          >
            <option value="">Pilih tahun</option>
            {Array.from({ length: 50 }, (_, i) => {
              const year = new Date().getFullYear() - i;

              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </FormSelect>
        </InfoRow>

        <InfoRow
          icon={Calendar}
          label="Tanggal Lahir"
          value={formatDate(profile.birth_date)}
          editing={isEditing}
        >
          <EditInput
            value={draft.birth_date ?? ""}
            onChange={(v) => setDraft({ ...draft, birth_date: v })}
            type="date"
          />
        </InfoRow>

        {/* Domicile View Mode */}
        {!isEditing && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-2">Domisili</h3>
            {profile.domicile ? (
              <>
                <InfoRow
                  icon={MapPin}
                  label="Alamat Lengkap"
                  value={profile.domicile.address || "—"}
                />
                <InfoRow
                  icon={MapPin}
                  label="Wilayah"
                  value={`${profile.domicile.village?.name || ""}, ${profile.domicile.district?.name || ""}, ${formatDomicileName(profile.domicile.city?.name)}, ${profile.domicile.province?.name || ""}`}
                />
                <InfoRow
                  icon={MapPin}
                  label="Kode Pos"
                  value={profile.domicile.postal_code || "—"}
                />
              </>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle size={16} className="shrink-0" />
                  <span className="text-xs font-medium">Domisili belum diisi</span>
                </div>
                <button
                  type="button"
                  onClick={startEdit}
                  className="text-xs font-semibold text-[#41A07E] hover:underline"
                >
                  Lengkapi Domisili
                </button>
              </div>
            )}
          </div>
        )}

        {/* Domicile Edit Mode */}
        {isEditing && (
          <div className="border-t border-slate-100 mt-4 pt-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">Domisili</h3>
            <DomicileFormFields
              values={draft}
              onChange={(field, value) => setDraft(prev => ({ ...prev, [field]: value }))}
              errors={validateDomicile(draft)}
              theme="alumni-profile"
            />
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="rounded-2xl bg-white shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        <button
          type="button"
          onClick={() => router.push("/alumni/change-password")}
          className="w-full flex items-center justify-between px-4 py-4 text-sm text-slate-700 hover:bg-slate-50 transition"
        >
          <span className="font-medium">Ganti Kata Sandi</span>
          <ChevronRight size={16} className="text-slate-400" />
        </button>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full flex items-center justify-between px-4 py-4 text-sm text-red-500 hover:bg-red-50 transition"
        >
          <span className="font-semibold flex items-center gap-2">
            <LogOut size={15} />
            Keluar
          </span>
          <ChevronRight size={16} className="text-red-300" />
        </button>
      </div>

      <p className="text-center text-xs text-slate-400 pb-6">
        Bergabung sejak{" "}
        {profile.created_at
          ? new Intl.DateTimeFormat("id-ID", {
              month: "short",
              year: "numeric",
            }).format(new Date(profile.created_at))
          : "—"}
      </p>

      {toast && (
        <FeedbackToast
          type={toast.type}
          message={toast.message}
          variant="mobile"
        />
      )}
    </div>
  );
}

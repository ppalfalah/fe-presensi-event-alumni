"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Phone } from "lucide-react";
import { useLogin } from "@/hooks/alumni/useLogin";
import { useRegister } from "@/hooks/alumni/useRegister";
import type { LoginPayload, RegisterPayload } from "@/types/auth";
import { FormInput, FormSelect } from "@/app/components/FormControl";
import { getApiErrorMessage } from "@/lib/api";
import { GoogleLoginButton, GoogleRegisterButton } from "./GoogleAuthButtons";
import SuccessModal from "./SuccessModal";
import DomicileFormFields from "@/app/components/DomicileFormFields";

type Tab = "masuk" | "daftar";

interface AuthCardProps {
  defaultTab?: Tab;
}

/* ─── Reusable field ──────────────────────────────────────── */
function Field({
  label,
  children,
  error,
  success,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  success?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs font-medium text-red-500">
          <AlertCircle size={12} />
          {error}
        </p>
      )}
      {!error && success && (
        <p className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <CheckCircle2 size={12} />
          {success}
        </p>
      )}
    </div>
  );
}

function Input({
  className = "",
  hasError = false,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  return (
    <FormInput
      aria-invalid={hasError || undefined}
      className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:ring-2 ${
        hasError
          ? "border-red-300 focus:border-red-400 focus:ring-red-100"
          : "border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50"
      } ${className}`}
      {...props}
    />
  );
}

const fieldLabels: Record<string, string> = {
  first_name: "Nama depan",
  last_name: "Nama belakang",
  gender: "Jenis kelamin",
  email: "Email",
  phone: "Nomor telepon",
  graduation_year: "Tahun lulus",
  birth_date: "Tanggal lahir",
  password: "Kata sandi",
  password_confirmation: "Konfirmasi kata sandi",
};

function getFieldLabel(field: string) {
  return fieldLabels[field] ?? field.replaceAll("_", " ");
}

type RegisterField = keyof RegisterPayload;
type RegisterErrors = Partial<Record<RegisterField, string>>;
type LoginErrors = Partial<Record<keyof LoginPayload, string>>;

const REGISTER_APPROVAL_MESSAGE =
  "Registrasi berhasil. Akun Anda menunggu persetujuan admin sebelum dapat digunakan.";

const registerErrorFields = [
  "first_name",
  "last_name",
  "gender",
  "email",
  "phone",
  "graduation_year",
  "birth_date",
  "password",
  "password_confirmation",
  "domicile_province_code",
  "domicile_city_code",
  "domicile_district_code",
  "domicile_village_code",
  "domicile_postal_code",
  "domicile_address",
] as const satisfies readonly RegisterField[];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[0-9+\-\s()]{8,20}$/;

function getPasswordStrength(password: string) {
  const checks = [
    password.length >= 8,
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;

  if (!password) {
    return {
      score: 0,
      label: "Belum diisi",
      color: "bg-slate-200",
      textColor: "text-slate-500",
    };
  }
  if (score <= 2) {
    return {
      score,
      label: "Lemah",
      color: "bg-red-400",
      textColor: "text-red-500",
    };
  }
  if (score === 3) {
    return {
      score,
      label: "Cukup",
      color: "bg-amber-400",
      textColor: "text-amber-500",
    };
  }
  if (score === 4) {
    return {
      score,
      label: "Kuat",
      color: "bg-[#0D5C3A]",
      textColor: "text-[#0D5C3A]",
    };
  }
  return {
    score,
    label: "Sangat kuat",
    color: "bg-[#0D5C3A]",
    textColor: "text-[#0D5C3A]",
  };
}

function PasswordStrength({ password }: { password: string }) {
  const strength = getPasswordStrength(password);
  const requirements = [
    { met: password.length >= 8, label: "8 karakter" },
    { met: /[A-Z]/.test(password), label: "huruf besar" },
    { met: /\d/.test(password), label: "angka" },
    { met: /[^A-Za-z0-9]/.test(password), label: "simbol" },
  ];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center gap-2">
        <div className="grid flex-1 grid-cols-5 gap-1">
          {Array.from({ length: 5 }, (_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full ${
                index < strength.score ? strength.color : "bg-slate-100"
              }`}
            />
          ))}
        </div>
        <span
          className={`w-20 text-right text-xs font-semibold ${strength.textColor}`}
        >
          {strength.label}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {requirements.map((item) => (
          <span
            key={item.label}
            className={`rounded-full px-2 py-1 text-[11px] font-medium ${
              item.met
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ─── Login Form ──────────────────────────────────────────── */
function LoginForm() {
  const [form, setForm] = useState<LoginPayload>({
    email: "",
    password: "",
    remember: false,
    role: "alumni",
  });
  const [submitted, setSubmitted] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const { mutate: login, isPending, error } = useLogin();

  const serverError = error
    ? getApiErrorMessage(error, "Email atau kata sandi salah.")
    : null;

  const loginErrors: LoginErrors = {
    email: !form.email.trim()
      ? "Email wajib diisi."
      : !emailPattern.test(form.email)
        ? "Email harus berisi alamat yang benar."
        : undefined,
    password: !form.password ? "Kata sandi wajib diisi." : undefined,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (loginErrors.email || loginErrors.password) return;
    login(form);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {(serverError || googleError) && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
          {serverError || googleError}
        </div>
      )}

      {/* Google OAuth Button */}
      <GoogleLoginButton
        onError={(error) => setGoogleError(error)}
        disabled={isPending}
      />

      <div className="relative flex items-center gap-3 my-1">
        <div className="flex-1 border-t border-slate-200"></div>
        <span className="text-xs font-medium text-slate-400 uppercase">
          atau
        </span>
        <div className="flex-1 border-t border-slate-200"></div>
      </div>

      <Field label="Email" error={submitted ? loginErrors.email : undefined}>
        <Input
          type="email"
          placeholder="masukkan alamat email Anda"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          hasError={submitted && Boolean(loginErrors.email)}
        />
      </Field>

      <Field
        label="Kata Sandi"
        error={submitted ? loginErrors.password : undefined}
      >
        <div className="relative">
          <Input
            type={showPass ? "text" : "password"}
            placeholder="masukkan kata sandi Anda"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hasError={submitted && Boolean(loginErrors.password)}
            className="pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPass(!showPass)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
          >
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </Field>

      <div className="flex flex-col gap-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-slate-300 accent-[#0D5C3A]"
            checked={form.remember}
            onChange={(e) => setForm({ ...form, remember: e.target.checked })}
          />
          <span className="text-sm text-slate-600">Ingat Saya</span>
        </label>
        <Link
          href="/forgot-password"
          className="text-sm font-medium text-[#0D5C3A] hover:text-[#084028] transition"
        >
          Lupa kata sandi ?
        </Link>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="mt-1 w-full rounded-xl bg-[#0D5C3A] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#E8F5E9]/45 transition-colors hover:bg-[#084028] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "Memproses..." : "Masuk dengan Email"}
      </button>
    </form>
  );
}

/* ─── Register Form ───────────────────────────────────────── */
function RegisterForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [form, setForm] = useState<RegisterPayload>({
    first_name: "",
    last_name: "",
    gender: "Laki-laki",
    email: "",
    phone: "",
    graduation_year: "",
    birth_date: "",
    password: "",
    password_confirmation: "",
    domicile_province_code: "",
    domicile_city_code: "",
    domicile_district_code: "",
    domicile_village_code: "",
    domicile_postal_code: "",
    domicile_address: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState(
    REGISTER_APPROVAL_MESSAGE,
  );
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<RegisterField, boolean>>
  >({});
  const [googleError, setGoogleError] = useState<string | null>(null);
  const { mutate: register, isPending, error } = useRegister();
  const [oauthCompleted, setOauthCompleted] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const registerErrorData = error?.response?.data;
  const serverError =
    typeof registerErrorData?.message === "string" &&
    registerErrorData.message.trim()
      ? registerErrorData.message
      : error
        ? getApiErrorMessage(
            error,
            "Pendaftaran belum berhasil. Periksa kembali data Anda.",
          )
        : null;
  const fieldErrors = getRegisterFieldErrors(registerErrorData?.errors);

  const localErrors = getRegisterErrors(form);

  function setField<K extends RegisterField>(
    field: K,
    value: RegisterPayload[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setTouched((current) => ({ ...current, [field]: true }));
  }

  function showFieldError(field: RegisterField) {
    return submitted || touched[field];
  }

  function getError(field: RegisterField) {
    if (showFieldError(field) && localErrors[field]) return localErrors[field];
    return fieldErrors[field];
  }

  function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setSubmitted(true);
  if (Object.values(localErrors).some(Boolean)) return;

  // ✅ CREATE PAYLOAD
  const payload: RegisterPayload = { ...form };

  // ✅ ADD temp_token if available
  if (tempToken) {
    payload.temp_token = tempToken;
  }

  register(payload, {
    onSuccess: (response) => {
      setSuccessMessage(response.message?.trim() || REGISTER_APPROVAL_MESSAGE);
      setShowSuccessModal(true);

      // Clear OAuth data
      if (tempToken) {
        sessionStorage.removeItem("oauth_temp_token");
        sessionStorage.removeItem("oauth_user_data");
        setTempToken(null);
        setOauthCompleted(false);
      }
    },
  });
}


  function handleSuccessModalClose() {
    setShowSuccessModal(false);
    onSwitchToLogin();
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {(serverError || googleError) && (
          <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 border border-red-100">
            <p className="font-semibold mb-1">{serverError || googleError}</p>
            {Object.keys(fieldErrors).length > 0 && (
              <ul className="list-disc list-inside text-xs mt-2 space-y-1">
                {Object.entries(fieldErrors).map(([field, errors]) => (
                  <li key={field}>
                    <strong>{getFieldLabel(field)}:</strong> {errors}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Google OAuth Button */}
        <GoogleRegisterButton
          onError={(error) => {
            setGoogleError(error);
            setOauthCompleted(false);
            setTempToken(null); // Clear on error
          }}
          onSuccess={(token, userData) => {
            // ✅ STORE TOKEN
            setTempToken(token);
            setOauthCompleted(true);
            setGoogleError(null);
            sessionStorage.setItem("oauth_temp_token", token);

            // Pre-fill form
            setForm((prev) => ({
              ...prev,
              first_name: userData.first_name || prev.first_name,
              last_name: userData.last_name || prev.last_name,
              email: userData.email || prev.email,
            }));
          }}
          disabled={isPending || oauthCompleted}
        />

        <div className="relative flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-slate-200"></div>
          <span className="text-xs font-medium text-slate-400 uppercase">
            atau daftar dengan email
          </span>
          <div className="flex-1 border-t border-slate-200"></div>
        </div>

        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 gap-3">
          <Field label="Nama Depan" error={getError("first_name")}>
            <Input
              type="text"
              placeholder="nama depan anda"
              value={form.first_name}
              onChange={(e) => setField("first_name", e.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, first_name: true }))
              }
              hasError={Boolean(getError("first_name"))}
            />
          </Field>
          <Field label="Nama Belakang" error={getError("last_name")}>
            <Input
              type="text"
              placeholder="nama belakang anda"
              value={form.last_name}
              onChange={(e) => setField("last_name", e.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, last_name: true }))
              }
              hasError={Boolean(getError("last_name"))}
            />
          </Field>
        </div>

        <Field label="Jenis Kelamin" error={getError("gender")}>
          <FormSelect
            value={form.gender}
            onChange={(e) => setField("gender", e.target.value)}
            onBlur={() =>
              setTouched((current) => ({ ...current, gender: true }))
            }
            aria-invalid={Boolean(getError("gender")) || undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 ${
              getError("gender")
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50"
            }`}
          >
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </FormSelect>
        </Field>

        <Field label="Email" error={getError("email")}>
          <Input
            type="email"
            placeholder="masukkan alamat email Anda"
            value={form.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() =>
              setTouched((current) => ({ ...current, email: true }))
            }
            hasError={Boolean(getError("email"))}
            readOnly={oauthCompleted}
          />
        </Field>

        <Field label="No Telp" error={getError("phone")}>
          <div className="relative">
            <Input
              type="tel"
              placeholder="masukkan no telp Anda"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, phone: true }))
              }
              hasError={Boolean(getError("phone"))}
              className="pl-10"
            />
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
          </div>
        </Field>

        <Field
          label="Angkatan (Tahun Lulus)"
          error={getError("graduation_year")}
        >
          <FormSelect
            value={form.graduation_year}
            onChange={(e) => setField("graduation_year", e.target.value)}
            onBlur={() =>
              setTouched((current) => ({ ...current, graduation_year: true }))
            }
            aria-invalid={Boolean(getError("graduation_year")) || undefined}
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 ${
              getError("graduation_year")
                ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                : "border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50"
            }`}
          >
            <option value="">Pilih Tahun Lulus</option>
            {Array.from({ length: 50 }, (_, i) => {
              const year = new Date().getFullYear() - i;
              return (
                <option key={year} value={year}>
                  {year}
                </option>
              );
            })}
          </FormSelect>
        </Field>

        <Field label="Tanggal Lahir" error={getError("birth_date")}>
          <div className="relative">
            <Input
              type="date"
              value={form.birth_date}
              onChange={(e) => setField("birth_date", e.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, birth_date: true }))
              }
              max={new Date().toISOString().split("T")[0]}
              hasError={Boolean(getError("birth_date"))}
              className="pr-4"
            />
          </div>
        </Field>

        <Field label="Kata Sandi" error={getError("password")}>
          <div className="relative">
            <Input
              type={showPass ? "text" : "password"}
              placeholder="masukkan kata sandi Anda (min. 8 karakter)"
              value={form.password}
              onChange={(e) => setField("password", e.target.value)}
              onBlur={() =>
                setTouched((current) => ({ ...current, password: true }))
              }
              minLength={8}
              hasError={Boolean(getError("password"))}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <PasswordStrength password={form.password} />
        </Field>

        <Field
          label="Konfirmasi Kata Sandi"
          error={getError("password_confirmation")}
          success={
            form.password_confirmation && !getError("password_confirmation")
              ? "Kata sandi sudah sama."
              : undefined
          }
        >
          <div className="relative">
            <Input
              type={showConfirmPass ? "text" : "password"}
              placeholder="ulangi kata sandi Anda"
              value={form.password_confirmation}
              onChange={(e) =>
                setField("password_confirmation", e.target.value)
              }
              onBlur={() =>
                setTouched((current) => ({
                  ...current,
                  password_confirmation: true,
                }))
              }
              minLength={8}
              hasError={Boolean(getError("password_confirmation"))}
              className="pr-11"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
            >
              {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </Field>

        <div className="border-t border-slate-100 pt-4 mt-2">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">
            Domisili Saat Ini (Wajib)
          </h3>
          <DomicileFormFields
            values={form}
            onChange={(field, value) => setField(field, value)}
            errors={Object.keys(localErrors).reduce<Record<string, string>>(
              (acc, key) => {
                if (localErrors[key as RegisterField]) {
                  acc[key] = localErrors[key as RegisterField]!;
                }
                return acc;
              },
              {},
            )}
            theme="alumni"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="mt-1 w-full rounded-xl bg-[#0D5C3A] py-3.5 text-sm font-semibold text-white shadow-md shadow-[#E8F5E9]/45 transition-colors hover:bg-[#084028] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Memproses..." : "Daftar"}
        </button>
      </form>

      {/* Success Modal - rendered outside form so the fixed overlay covers entire viewport */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Registrasi Berhasil!"
        message={successMessage}
        onClose={handleSuccessModalClose}
      />
    </>
  );
}

function getRegisterErrors(form: RegisterPayload): RegisterErrors {
  const errors: RegisterErrors = {};
  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().split("T")[0];

  if (!form.first_name.trim()) errors.first_name = "Nama depan wajib diisi.";
  if (!form.last_name.trim()) errors.last_name = "Nama belakang wajib diisi.";
  if (!form.gender) errors.gender = "Jenis kelamin wajib dipilih.";
  if (!form.email.trim()) {
    errors.email = "Email wajib diisi.";
  } else if (!emailPattern.test(form.email)) {
    errors.email = "Email harus berisi alamat yang benar.";
  }
  if (!form.phone.trim()) {
    errors.phone = "Nomor telepon wajib diisi.";
  } else if (!phonePattern.test(form.phone.trim())) {
    errors.phone = "Nomor telepon belum sesuai.";
  }
  if (!form.graduation_year) {
    errors.graduation_year = "Tahun lulus wajib dipilih.";
  } else {
    const graduationYear = Number(form.graduation_year);
    if (
      Number.isNaN(graduationYear) ||
      graduationYear < currentYear - 49 ||
      graduationYear > currentYear
    ) {
      errors.graduation_year = "Tahun lulus belum sesuai.";
    }
  }
  if (!form.birth_date) {
    errors.birth_date = "Tanggal lahir wajib diisi.";
  } else if (form.birth_date > today) {
    errors.birth_date = "Tanggal lahir tidak boleh melebihi hari ini.";
  }
  if (!form.password) {
    errors.password = "Kata sandi wajib diisi.";
  } else if (form.password.length < 8) {
    errors.password = `Kata sandi minimal 8 karakter (${8 - form.password.length} lagi).`;
  }
  if (!form.password_confirmation) {
    errors.password_confirmation = "Konfirmasi kata sandi wajib diisi.";
  } else if (form.password !== form.password_confirmation) {
    errors.password_confirmation = "Konfirmasi kata sandi tidak sama.";
  }

  // Domicile validation (Wajib)
  if (!form.domicile_province_code) {
    errors.domicile_province_code = "Provinsi wajib dipilih.";
  }
  if (!form.domicile_city_code) {
    errors.domicile_city_code = "Kabupaten/kota wajib dipilih.";
  }
  if (!form.domicile_district_code) {
    errors.domicile_district_code = "Kecamatan wajib dipilih.";
  }
  if (!form.domicile_village_code) {
    errors.domicile_village_code = "Kelurahan/desa wajib dipilih.";
  }
  if (!form.domicile_postal_code?.trim()) {
    errors.domicile_postal_code = "Kode pos wajib diisi.";
  } else if (form.domicile_postal_code.length > 10) {
    errors.domicile_postal_code = "Kode pos maksimal 10 karakter.";
  }
  if (!form.domicile_address?.trim()) {
    errors.domicile_address = "Alamat wajib diisi.";
  } else if (form.domicile_address.length > 1000) {
    errors.domicile_address = "Alamat maksimal 1000 karakter.";
  }

  return errors;
}

function getRegisterFieldErrors(errors: unknown): RegisterErrors {
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) {
    return {};
  }

  return registerErrorFields.reduce<RegisterErrors>((result, field) => {
    const value = (errors as Record<string, unknown>)[field];
    const messages = Array.isArray(value) ? value : [value];
    const message = messages
      .filter((item): item is string => typeof item === "string")
      .join(", ");

    if (message) {
      result[field] = message;
    }

    return result;
  }, {});
}

/* ─── Main AuthCard ───────────────────────────────────────── */
export default function AuthCard({ defaultTab = "masuk" }: AuthCardProps) {
  const [activeTab, setActiveTab] = useState<Tab>(defaultTab);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const standalone = 
        window.matchMedia("(display-mode: standalone)").matches || 
        (navigator as Navigator & { standalone?: boolean }).standalone;
      
      const frameId = requestAnimationFrame(() => {
        setIsStandalone(!!standalone);
      });
      return () => cancelAnimationFrame(frameId);
    }
  }, []);

  return (
    <div className="min-h-dvh w-full flex items-start justify-center px-3 sm:px-4 md:px-8 pt-8 sm:pt-10 md:pt-12 pb-8 bg-gradient-to-br from-[#E8F5E9]/70 via-[#F4F9F6] to-white">
      <div className="w-full max-w-sm md:max-w-md min-w-0">
        {/* App logo and label */}
        <div className="flex items-center gap-2 mb-5">
          <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-lg bg-white shadow">
            <img
              src="/images/logo-pesantren.png"
              alt="Logo Pondok Pesantren Al-Qur'an Al-Falah"
              className="h-full w-full object-contain"
            />
          </span>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-wider text-[#0D5C3A] uppercase">
              Al-Falah
            </span>
            <span className="text-[9px] text-slate-500 font-medium tracking-wider uppercase -mt-0.5">
              Alumni Portal
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 leading-tight mb-1">
          Mulai Sekarang
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Daftar atau masuk untuk mulai menggunakan aplikasi
        </p>

        {/* Card */}
        <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-xl shadow-[#0D5C3A]/5 p-4 sm:p-6 border border-emerald-50">
          {/* Tabs */}
          <div className="flex mb-6 rounded-xl bg-slate-100 p-1">
            {(["masuk", "daftar"] as Tab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? "bg-[#0D5C3A] text-white shadow-sm"
                    : "text-slate-500 hover:text-[#0D5C3A]"
                }`}
              >
                {tab === "masuk" ? "Masuk" : "Daftar"}
              </button>
            ))}
          </div>

          {/* Form */}
          {activeTab === "masuk" ? (
            <LoginForm />
          ) : (
            <RegisterForm onSwitchToLogin={() => setActiveTab("masuk")} />
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-500 leading-relaxed px-2">
          Dengan mendaftar, Anda menyetujui{" "}
          <Link
            href="/terms"
            className="font-semibold text-slate-700 underline underline-offset-2"
          >
            Ketentuan Layanan
          </Link>{" "}
          dan{" "}
          <Link
            href="/privacy"
            className="font-semibold text-slate-700 underline underline-offset-2"
          >
            Persetujuan Pemrosesan Data
          </Link>
        </p>

        {/* Back to Home Link */}
        {!isStandalone && (
          <div className="text-center mt-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D5C3A] hover:text-[#D4AF37] transition-colors"
            >
              ← Kembali ke Halaman Utama
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

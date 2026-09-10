"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { FormInput } from "@/app/components/FormControl";
import { useChangePassword } from "@/hooks/alumni/useChangePassword";
import { getApiErrorMessage, clearAuthStorage } from "@/lib/api";
import { stopHeartbeat } from "@/lib/heartbeat";

export default function AlumniChangePasswordPage() {
  const router = useRouter();
  const changePassword = useChangePassword();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [success, setSuccess] = useState(false);

  function validate(): string | null {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return "Semua field wajib diisi.";
    }
    if (newPassword.length < 8) {
      return "Kata sandi baru minimal 8 karakter.";
    }
    if (newPassword !== confirmPassword) {
      return "Konfirmasi kata sandi tidak cocok.";
    }
    if (currentPassword === newPassword) {
      return "Kata sandi baru tidak boleh sama dengan kata sandi lama.";
    }
    return null;
  }

  function handleSubmit() {
    setFormError("");
    const err = validate();
    if (err) {
      setFormError(err);
      return;
    }

    changePassword.mutate(
      {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      },
      {
        onSuccess: () => {
          setSuccess(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");

          // Auto redirect to login after 2 seconds (backend revokes other tokens)
          setTimeout(() => {
            stopHeartbeat();
            clearAuthStorage();
            router.push("/alumni/login");
          }, 2000);
        },
        onError: (error: unknown) => {
          setFormError(
            getApiErrorMessage(
              error,
              "Kata sandi belum berhasil diubah. Periksa kembali kata sandi Anda."
            )
          );
        },
      }
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Kata Sandi Berhasil Diubah!
          </h2>
          <p className="text-sm text-slate-500">
            Anda akan dialihkan ke halaman masuk...
          </p>
          <div className="mt-4">
            <Loader2 size={20} className="animate-spin text-emerald-500 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-emerald-50 to-gray-100">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="flex items-center gap-3 px-4 py-3.5 max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition active:scale-95"
          >
            <ArrowLeft size={18} className="text-slate-600" />
          </button>
          <h1 className="text-base font-bold text-slate-800">Ganti Kata Sandi</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 max-w-lg mx-auto space-y-5">
        {/* Info banner */}
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-100">
          <ShieldCheck size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800">
              Keamanan Akun
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Setelah kata sandi berhasil diubah, Anda akan diminta masuk ulang
              untuk keamanan.
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl bg-white shadow-sm border border-slate-100 p-5 space-y-5">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kata Sandi Lama
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <KeyRound size={16} className="text-slate-400" />
              </div>
              <FormInput
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => {
                  setCurrentPassword(e.target.value);
                  setFormError("");
                }}
                placeholder="Masukkan kata sandi lama"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <KeyRound size={16} className="text-slate-400" />
              </div>
              <FormInput
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setFormError("");
                }}
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {newPassword.length > 0 && newPassword.length < 8 && (
              <p className="text-xs text-amber-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                Minimal 8 karakter ({8 - newPassword.length} lagi)
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Konfirmasi Kata Sandi Baru
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                <KeyRound size={16} className="text-slate-400" />
              </div>
              <FormInput
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setFormError("");
                }}
                placeholder="Ulangi kata sandi baru"
                className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm text-slate-800 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                <AlertCircle size={12} />
                Kata sandi tidak cocok
              </p>
            )}
          </div>
        </div>

        {/* Error message */}
        {formError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{formError}</p>
          </div>
        )}

        {/* API error */}
        {changePassword.isError && !formError && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">
              {getApiErrorMessage(
                changePassword.error,
                "Kata sandi belum berhasil diubah. Periksa kembali kata sandi Anda."
              )}
            </p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={changePassword.isPending}
          className="w-full py-3.5 rounded-xl bg-[#16a34a] text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#15803d] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {changePassword.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Mengubah Kata Sandi...
            </>
          ) : (
            <>
              <ShieldCheck size={16} />
              Ubah Kata Sandi
            </>
          )}
        </button>
      </div>
    </div>
  );
}

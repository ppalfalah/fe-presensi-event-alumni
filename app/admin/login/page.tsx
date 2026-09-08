"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormInput } from "@/app/components/FormControl";
import { API_BASE_URL, toFriendlyErrorMessage } from "@/lib/api";
import { startHeartbeat } from "@/lib/heartbeat";

type LoginResponse = {
  success: boolean;
  message: string;
  data: {
    user: {
      id: number;
      name: string;
      first_name?: string | null;
      last_name?: string | null;
      email: string;
      phone: string | null;
      angkatan: string | null;
      role: string;
      admin_level?: "super_admin" | "admin" | null;
      status?: "active" | "inactive" | null;
      email_verified_at: string | null;
      created_at: string;
      updated_at: string;
    };
    access_token: string;
    token_type: string;
  };
};

const AdminLogin = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("error") === "inactive") {
        setTimeout(() => {
          setErrorMessage(
            "Akun admin sedang dinonaktifkan. Hubungi super admin.",
          );
        }, 0);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          role: "admin",
        }),
      });

      const result: LoginResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Email atau password salah");
      }

      const { user, access_token, token_type } = result.data;

      if (user.role !== "admin") {
        throw new Error("Akun ini bukan admin.");
      }

      if (user.status === "inactive") {
        throw new Error(
          "Akun admin sedang dinonaktifkan. Hubungi super admin.",
        );
      }

      // Simpan di sessionStorage (hilang saat browser ditutup)
      sessionStorage.setItem("access_token", access_token);
      sessionStorage.setItem("token_type", token_type);
      sessionStorage.setItem("user", JSON.stringify(user));
      sessionStorage.setItem("role", user.role);
      sessionStorage.removeItem("just_logged_out");

      // Mulai heartbeat untuk menjaga token tetap hidup
      startHeartbeat();

      router.replace("/admin/dashboard");
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(
          toFriendlyErrorMessage(
            error.message,
            "Masuk belum berhasil. Periksa kembali email dan kata sandi Anda.",
          ),
        );
      } else {
        setErrorMessage("Masuk belum berhasil. Silakan coba lagi.");
      }
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* ── Left Panel ── */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white p-12 flex-col justify-center relative overflow-hidden">
        {/* Islamic Geometric Pattern Background */}
        <div className="absolute inset-0 opacity-[0.15]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="islamic-pattern"
                width="80"
                height="80"
                patternUnits="userSpaceOnUse"
              >
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="0.5"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="25"
                  fill="none"
                  stroke="#D4AF37"
                  strokeWidth="0.5"
                />
                <path
                  d="M40,5 L40,75 M5,40 L75,40"
                  stroke="#D4AF37"
                  strokeWidth="0.5"
                />
                <path
                  d="M12,12 L68,68 M68,12 L12,68"
                  stroke="#D4AF37"
                  strokeWidth="0.5"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#islamic-pattern)" />
          </svg>
        </div>

        {/* Decorative Top Border with Calligraphy Style */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70"></div>
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-70"></div>

        {/* Ornamental Corner Decorations */}
        <div className="absolute top-8 left-8 w-20 h-20 border-t-2 border-l-2 border-[#D4AF37]/40 rounded-tl-3xl"></div>
        <div className="absolute top-8 right-8 w-20 h-20 border-t-2 border-r-2 border-[#D4AF37]/40 rounded-tr-3xl"></div>
        <div className="absolute bottom-8 left-8 w-20 h-20 border-b-2 border-l-2 border-[#D4AF37]/40 rounded-bl-3xl"></div>
        <div className="absolute bottom-8 right-8 w-20 h-20 border-b-2 border-r-2 border-[#D4AF37]/40 rounded-br-3xl"></div>

        <div className="relative z-10 max-w-xl mx-auto">
          {/* Header with Islamic Calligraphy Accent */}
          <div className="text-center mb-8">
            {/* Logo Pesantren */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                {/* Glow effect behind logo */}
                <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-2xl"></div>
                <div className="relative w-28 h-28">
                  <img
                    src="/images/logo-pesantren.png"
                    alt="Logo Pondok Pesantren Al-Qur'an Al-Falah"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            </div>

            <div className="inline-block relative">
              {/* Decorative Frame */}
              {/* <div className="absolute -inset-4 border-2 border-[#D4AF37]/30 rounded-2xl transform rotate-1"></div> */}
              <div className="relative px-6 py-4">
                <div className="text-center">
                  <h1 className="text-2xl font-bold text-[#D4AF37] tracking-wide">
                    Pondok Pesantren Al-Qur&apos;an Al-Falah
                  </h1>
                  <p className="text-[#E8F5E9]/90 text-xs font-medium uppercase tracking-widest mt-1">
                    Cicalengka - Nagreg, Bandung
                  </p>
                  <div className="mt-2 pt-2 border-t border-[#D4AF37]/30">
                    <p className="text-[#D4AF37] text-xs font-semibold uppercase tracking-wider">
                      Portal Administrator
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Arabic Calligraphy Style Greeting */}
            <div className="mt-6 text-[#D4AF37] font-serif italic text-lg">
              <p className="tracking-wider">
                بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
              </p>
              <p className="text-xs text-[#E8F5E9]/70 mt-1 not-italic font-sans">
                Bismillahirrahmanirrahim
              </p>
            </div>
          </div>

          {/* Hadith Quote with Decorative Frame */}
          <div className="relative mt-8 p-6 bg-white/5 backdrop-blur-sm rounded-xl border-l-4 border-[#D4AF37]">
            <div className="absolute top-2 left-4 text-[#D4AF37]/30 text-4xl font-serif leading-none">
              &ldquo;
            </div>
            <div className="absolute bottom-2 right-4 text-[#D4AF37]/30 text-4xl font-serif leading-none">
              &rdquo;
            </div>
            <blockquote className="relative text-[#E8F5E9]/90 text-sm leading-relaxed text-center italic px-6">
              Barangsiapa memudahkan urusan orang yang kesulitan, maka Allah
              akan memudahkan urusannya di dunia dan akhirat
            </blockquote>
            <p className="text-center text-[#D4AF37] text-xs mt-3 font-medium tracking-wide">
              — HR. Muslim
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white p-6 sm:p-8 min-h-screen">
        <div className="w-full max-w-md">
          {/* Logo & Title for Mobile Screen */}
          <div className="flex flex-col items-center mb-6 md:hidden">
            <div className="w-20 h-20 relative mb-3">
              <div className="absolute inset-0 bg-[#D4AF37]/10 rounded-full blur-xl"></div>
              <img
                src="/images/logo-pesantren.png"
                alt="Logo Pondok Pesantren Al-Qur'an Al-Falah"
                className="w-full h-full object-contain relative z-10"
              />
            </div>
            <h1 className="text-base font-bold text-[#0D5C3A] text-center tracking-wide leading-tight">
              Pondok Pesantren Al-Qur&apos;an Al-Falah
            </h1>
            <p className="text-[#0D5C3A]/60 text-[10px] font-semibold uppercase tracking-wider mt-0.5">
              Portal Administrator
            </p>
          </div>

          <div className="text-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              Masuk sebagai Admin
            </h2>
            <p className="text-gray-500 mt-0.5 text-xs">
              Assalamualaikum, Selamat Datang Kembali
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Email Administrator
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </span>
                <FormInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@pesantren.com"
                  className="text-gray-500 w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8F5E9]/50 focus:border-[#0D5C3A] bg-gray-50"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Kata Sandi
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </span>
                <FormInput
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi admin"
                  className="text-gray-500 w-full pl-9 pr-10 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#E8F5E9]/50 focus:border-[#0D5C3A] bg-gray-50"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    )}
                  </svg>
                </button>
              </div>
            </div>

            {/* Lupa kata sandi */}
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-[#0D5C3A] hover:text-[#084028] hover:underline transition-colors"
              >
                Lupa kata sandi?
              </Link>
            </div>

            {/* Error dari API */}
            {errorMessage && (
              <div className="p-2.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                </svg>
                {errorMessage}
              </div>
            )}

            {/* Security notice */}
            <div className="p-2.5 bg-[#E8F5E9]/30 rounded-xl border border-[#0D5C3A]/20 text-[#0D5C3A] text-xs flex items-start gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
              <span>
                <strong>Peringatan Keamanan:</strong> Pastikan Anda memiliki
                izin akses sebelum masuk. Setiap aktivitas admin akan tercatat
                dalam catatan sistem.
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 px-4 bg-[#0D5C3A] text-white font-semibold rounded-xl shadow hover:bg-[#084028] transition-colors disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              {isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Memproses...
                </>
              ) : (
                "Masuk ke Dasboard Admin"
              )}
            </button>

            <div className="text-center text-gray-500 text-xs">
              <p>atau</p>
              <Link
                href="/"
                className="inline-block mt-1 text-[#0D5C3A] hover:text-[#084028] hover:underline text-xs transition-colors"
              >
                ← Kembali ke Halaman Utama
              </Link>
            </div>
          </form>

          <p className="mt-4 text-center text-gray-400 text-xs">
            Jika Anda bukan administrator, silakan masuk sebagai alumni
          </p>
          <p className="mt-1 text-center text-slate-300 text-xs">
            Dilindungi dengan enkripsi end-to-end | Dasboard Admin v1.0.0
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

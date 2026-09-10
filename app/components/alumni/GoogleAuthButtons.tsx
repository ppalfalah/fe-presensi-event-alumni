"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { handleOAuthError } from "@/lib/oauthErrorHandler";
import type {
  ApiResponse,
  OAuthRedirectResponse,
  LoginResponse,
  RegistrationCallbackResponse,
  ApiError,
} from "@/lib/types/oauth";
import { AxiosError } from "axios";

interface GoogleLoginButtonProps {
  onError: (error: string) => void;
  disabled?: boolean;
}

export function GoogleLoginButton({
  onError,
  disabled,
}: GoogleLoginButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hasProcessedCallback = useRef(false);

  // Handle Google OAuth callback
  useEffect(() => {
    // Avoid processing twice
    if (hasProcessedCallback.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      hasProcessedCallback.current = true;
      if (typeof window !== "undefined") {
        router.replace(window.location.pathname);
      }
      setTimeout(() => onError("Login dengan Google dibatalkan."), 0);
      return;
    }

    if (code && state) {
      hasProcessedCallback.current = true;

      // Process callback outside of effect using queueMicrotask
      queueMicrotask(async () => {
        setLoading(true);

        try {
          const response = await api.get<ApiResponse<LoginResponse>>(
            `/auth/google/login/callback`,
            { params: { code, state } },
          );

          if (response.data.success && response.data.data) {
            const { user, access_token } = response.data.data;

            localStorage.setItem("alumni_token", access_token);
            localStorage.setItem("user", JSON.stringify(user));
            sessionStorage.setItem("alumni_token", access_token);
            sessionStorage.setItem("user", JSON.stringify(user));

            // Clean up URL parameters immediately to prevent issues on reload or tab switch
            if (typeof window !== "undefined") {
              router.replace(window.location.pathname);
            }

            router.push("/alumni/main/dashboard");
          }
        } catch (err) {
          if (typeof window !== "undefined") {
            router.replace(window.location.pathname);
          }
          const errorMessage = handleOAuthError(err as AxiosError<ApiError>, {
            onNotFound: () => {
              setTimeout(() => router.push("/alumni/register"), 3000);
            },
          });
          onError(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    }
  }, [searchParams, onError, router]);

  const handleGoogleLogin = async () => {
    setLoading(true);

    try {
      const response = await api.get<ApiResponse<OAuthRedirectResponse>>(
        "/auth/google/login/redirect",
      );

      if (response.data.success && response.data.data) {
        window.location.href = response.data.data.authorization_url;
      }
    } catch (err) {
      const errorMessage = handleOAuthError(err as AxiosError<ApiError>);
      onError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:border-[#0D5C3A] hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? "Memproses..." : "Masuk dengan Google"}
    </button>
  );
}

interface GoogleRegisterButtonProps {
  onError: (error: string) => void;
  onSuccess: (tempToken: string, userData: Record<string, string>) => void;
  disabled?: boolean;
}

export function GoogleRegisterButton({
  onError,
  onSuccess,
  disabled,
}: GoogleRegisterButtonProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const hasProcessedCallback = useRef(false);

  // Handle Google OAuth callback for registration
  useEffect(() => {
    // Avoid processing twice
    if (hasProcessedCallback.current) return;

    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error) {
      hasProcessedCallback.current = true;
      if (typeof window !== "undefined") {
        router.replace(window.location.pathname);
      }
      setTimeout(() => onError("Pendaftaran dengan Google dibatalkan."), 0);
      return;
    }

    if (code && state) {
      hasProcessedCallback.current = true;

      // Process callback outside of effect using queueMicrotask
      queueMicrotask(async () => {
        setLoading(true);

        try {
          const response = await api.get<
            ApiResponse<RegistrationCallbackResponse>
          >(`/auth/google/register/callback`, { params: { code, state } });

          if (response.data.success && response.data.data) {
            sessionStorage.setItem(
              "oauth_temp_token",
              response.data.data.temp_token,
            );
            sessionStorage.setItem(
              "oauth_user_data",
              JSON.stringify(response.data.data.user_data),
            );

            // Clean up URL parameters immediately to prevent other components (like Login) from trying to use them
            if (typeof window !== "undefined") {
              router.replace(window.location.pathname);
            }

            onSuccess(
              response.data.data.temp_token,
              response.data.data.user_data,
            );
          }
        } catch (err) {
          if (typeof window !== "undefined") {
            router.replace(window.location.pathname);
          }
          const errorMessage = handleOAuthError(err as AxiosError<ApiError>, {
            onConflict: () => {
              setTimeout(() => router.push("/alumni/login"), 3000);
            },
          });
          onError(errorMessage);
        } finally {
          setLoading(false);
        }
      });
    }
  }, [searchParams, onError, onSuccess, router]);

  const handleGoogleRegister = async () => {
    setLoading(true);

    try {
      const response = await api.get<ApiResponse<OAuthRedirectResponse>>(
        "/auth/google/register/redirect",
      );

      if (response.data.success && response.data.data) {
        window.location.href = response.data.data.authorization_url;
      }
    } catch (err) {
      const errorMessage = handleOAuthError(err as AxiosError<ApiError>);
      onError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleRegister}
      disabled={loading || disabled}
      className="w-full flex items-center justify-center gap-3 rounded-xl border-2 border-[#D4AF37] bg-gradient-to-r from-[#D4AF37]/10 to-[#D4AF37]/5 px-4 py-3 text-sm font-semibold text-[#9A7A1A] shadow-sm transition-all hover:border-[#B8941F] hover:from-[#D4AF37]/20 hover:to-[#D4AF37]/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      {loading ? "Memproses..." : "Daftar dengan Google (Direkomendasikan)"}
    </button>
  );
}

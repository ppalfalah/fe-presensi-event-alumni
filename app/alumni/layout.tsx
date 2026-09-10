"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { QueryClientProvider } from "@tanstack/react-query";
import queryClient from "@/lib/queryClient";
import { startHeartbeat, stopHeartbeat } from "@/lib/heartbeat";
import { clearAuthStorage } from "@/lib/api";

const ALUMNI_LOGIN_PATH = "/alumni/login";
const ALUMNI_REGISTER_PATH = "/alumni/register";
const ALUMNI_DASHBOARD_PATH = "/alumni/main/dashboard";

function isPublicAlumniPage(pathname: string) {
  return pathname === ALUMNI_LOGIN_PATH || pathname === ALUMNI_REGISTER_PATH;
}

function getAlumniToken() {
  return localStorage.getItem("alumni_token") || sessionStorage.getItem("alumni_token");
}

function clearAlumniToken() {
  clearAuthStorage();
}

export default function AlumniLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const isPublicPage = isPublicAlumniPage(pathname);

  const [authorized, setAuthorized] = useState(() => isPublicPage);
  const isCurrentlyAuthorized = authorized;

  useEffect(() => {
    const verifyAccess = () => {
      const token = getAlumniToken();

      if (isPublicPage) {
        if (token) {
          router.replace(ALUMNI_DASHBOARD_PATH);
          return;
        }

        setAuthorized(true);
        return;
      }

      if (!token) {
        clearAlumniToken();
        stopHeartbeat();
        setAuthorized(false);
        if (typeof window !== "undefined" && sessionStorage.getItem("just_logged_out") === "true") {
          window.history.back();
          return;
        }
        router.replace(ALUMNI_LOGIN_PATH);
        return;
      }

      // Token valid — mulai heartbeat untuk menjaga sesi
      startHeartbeat();
      setAuthorized(true);
    };

    const frameId = window.requestAnimationFrame(verifyAccess);

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isPublicPage, pathname, router]);

  if (!isCurrentlyAuthorized) {
    if (isPublicPage) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Memverifikasi Akses Alumni...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-dvh bg-gray-100 overflow-x-hidden">
        <main className="w-full min-w-0">
          {children}
        </main>
      </div>
    </QueryClientProvider>
  );
}


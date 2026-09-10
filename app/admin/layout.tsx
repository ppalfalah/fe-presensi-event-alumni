"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { startHeartbeat, stopHeartbeat } from "@/lib/heartbeat";
import { API_BASE_URL, clearAuthStorage } from "@/lib/api";
import { SidebarProvider, useSidebar } from "@/context/SidebarContext";

const ADMIN_LOGIN_PATH = "/admin/login";
const ADMIN_DASHBOARD_PATH = "/admin/dashboard";

function getAdminCredentials() {
  return {
    token: localStorage.getItem("access_token") || sessionStorage.getItem("access_token") || localStorage.getItem("token"),
    role: localStorage.getItem("role") || sessionStorage.getItem("role"),
  };
}

function clearAdminCredentials() {
  clearAuthStorage();
}

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed } = useSidebar();
  return <div className={`admin-layout ${isCollapsed ? "sidebar-collapsed" : ""}`}>{children}</div>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Synchronous check during render to prevent Back button cache bypass
  const isLoginPage = pathname === ADMIN_LOGIN_PATH;

  const [authorized, setAuthorized] = useState(() => isLoginPage);
  const isCurrentlyAuthorized = authorized;

  useEffect(() => {
    const verifyAccess = async () => {
      const { token, role } = getAdminCredentials();

      if (pathname === ADMIN_LOGIN_PATH) {
        if (token && role === "admin") {
          router.replace(ADMIN_DASHBOARD_PATH);
          return;
        }

        setAuthorized(true);
        return;
      }

      if (!token || role !== "admin") {
        clearAdminCredentials();
        stopHeartbeat();
        setAuthorized(false);
        if (typeof window !== "undefined" && sessionStorage.getItem("just_logged_out") === "true") {
          window.history.back();
          return;
        }
        router.replace(ADMIN_LOGIN_PATH);
        return;
      }

      // Mulai heartbeat & tandai authorized agar layout tidak berkedip
      startHeartbeat();
      setAuthorized(true);

      // Ambil profil admin terbaru dari backend
      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (response.status === 401) {
          clearAdminCredentials();
          stopHeartbeat();
          setAuthorized(false);
          router.replace(ADMIN_LOGIN_PATH);
          return;
        }

        const result = await response.json();
        if (result.success && result.data?.user) {
          const user = result.data.user;

          if (user.role !== "admin") {
            clearAdminCredentials();
            stopHeartbeat();
            setAuthorized(false);
            router.replace(ADMIN_LOGIN_PATH);
            return;
          }

          if (user.status === "inactive") {
            clearAdminCredentials();
            stopHeartbeat();
            setAuthorized(false);
            router.replace(`${ADMIN_LOGIN_PATH}?error=inactive`);
            return;
          }

          // Simpan data terbaru ke storage
          localStorage.setItem("user", JSON.stringify(user));
          localStorage.setItem("role", user.role);
          sessionStorage.setItem("user", JSON.stringify(user));
          sessionStorage.setItem("role", user.role);
        }
      } catch (error) {
        console.error("Gagal melakukan verifikasi profil admin terbaru:", error);
      }
    };

    verifyAccess();
  }, [pathname, router]);

  if (!isCurrentlyAuthorized) {
    if (pathname === ADMIN_LOGIN_PATH) {
      return null;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 border-4 border-[#2D7EA0] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Memverifikasi Akses Admin...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
}



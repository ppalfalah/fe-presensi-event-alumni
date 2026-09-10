"use client";

import { useEffect, useState } from "react";

export interface AuthUser {
  id: number;
  first_name: string;
  last_name?: string | null;
  name?: string | null;
  email: string;
  phone?: string | null;
  gender?: string | null;
  role: string;
  admin_level?: "super_admin" | "admin" | null;
  status?: "active" | "inactive" | null;
  created_at?: string;
  updated_at?: string;
}

export function isAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin";
}

export function isSuperAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin" && user?.admin_level === "super_admin";
}

export function isRegularAdmin(user: AuthUser | null | undefined): boolean {
  return user?.role === "admin" && user?.admin_level === "admin";
}

export const permissions = {
  canManageAdmins: (user: AuthUser | null | undefined) => isSuperAdmin(user),
  canManageAlumni: (user: AuthUser | null | undefined) => isAdmin(user),
  canManageEvents: (user: AuthUser | null | undefined) => isAdmin(user),
  canManageSettings: (user: AuthUser | null | undefined) => isAdmin(user),
};

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const loadUser = () => {
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user") || sessionStorage.getItem("user");
        if (stored) {
          try {
            setUser(JSON.parse(stored));
          } catch (e) {
            console.error("Failed to parse user from storage:", e);
          }
        } else {
          setUser(null);
        }
      }
    };

    loadUser();

    // Listen to changes in storage to keep user sync
    window.addEventListener("storage", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
    };
  }, []);

  return user;
}

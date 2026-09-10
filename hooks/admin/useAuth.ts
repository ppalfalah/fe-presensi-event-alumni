import { useMutation } from "@tanstack/react-query";
import { fetchAPI, clearAuthStorage } from "@/lib/api";
import { startHeartbeat, stopHeartbeat } from "@/lib/heartbeat";
import type { AdminAuthResponse } from "@/types/auth";

// Login admin
export function useLogin() {
  return useMutation<AdminAuthResponse, Error, { email: string; password: string }>({
    mutationFn: (credentials) =>
      fetchAPI("/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    onSuccess: (data) => {
      localStorage.setItem("access_token", data.token);
      localStorage.setItem("role", data.user.role);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      sessionStorage.setItem("access_token", data.token);
      sessionStorage.setItem("role", data.user.role);
      if (data.user) {
        sessionStorage.setItem("user", JSON.stringify(data.user));
      }
      
      startHeartbeat();
    },
  });
}

// Logout
export function useLogout() {
  return useMutation({
    mutationFn: () =>
      fetchAPI("/logout", { method: "POST" }),
    onSuccess: () => {
      stopHeartbeat();
      clearAuthStorage();
    },
  });
}
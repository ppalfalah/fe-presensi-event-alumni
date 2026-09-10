import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { startHeartbeat } from "@/lib/heartbeat";
import type { LoginPayload, LoginAuthResponse } from "@/types/auth";

async function loginFn(payload: LoginPayload): Promise<LoginAuthResponse> {
  const { data } = await api.post<LoginAuthResponse>("/auth/login", payload);

  if (!data.data?.access_token) {
    throw new Error("Token login tidak tersedia.");
  }

  return data;
}

export function useLogin() {
  const router = useRouter();

  return useMutation<LoginAuthResponse, Error, LoginPayload>(
    {
      mutationFn: loginFn,
      onSuccess: (response) => {
        const token = response.data.access_token;

        // Simpan token di localStorage & sessionStorage agar multi-tab tetap aktif
        localStorage.setItem("alumni_token", token);
        sessionStorage.setItem("alumni_token", token);
        sessionStorage.removeItem("just_logged_out");

        // Mulai heartbeat untuk menjaga token tetap hidup
        startHeartbeat();

        router.replace("/alumni/main/dashboard");
      },
    }
  );
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api, { fetchAPI } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminProfile {
	name: string;
	email: string;
	avatar_url?: string | null;
}

export interface SystemStatus {
	database: "Connected" | "Disconnected";
	whatsapp_api: "Connected" | "Disconnected";
	system: "Online" | "Offline";
}

export type WAProvider = "fonnte";

export interface WAConfig {
	provider: WAProvider;
	api_url: string;
	api_token: string;
	sender_number: string;
	sender_status?: "active" | "blocked" | "unknown";
	blocked_reason?: string | null;
	is_configured?: boolean;
	connected?: boolean;
	can_edit?: boolean;
	last_tested_at?: string | null;
}

export interface WATestResponse {
	success?: boolean;
	status?: "connected" | "disconnected" | "blocked" | "error";
	message?: string;
	sender_number?: string;
	sender_status?: "active" | "blocked" | "unknown";
	blocked_reason?: string;
	fonnte?: unknown;
}

export interface UpdateProfilePayload {
	name: string;
	email: string;
}

export interface UpdatePasswordPayload {
	old_password: string;
	new_password: string;
}

// ─── Admin Profile ────────────────────────────────────────────────────────────

// GET profil admin via /auth/me
export function useAdminProfile() {
	return useQuery<AdminProfile>({
		queryKey: ["admin-profile"],
		queryFn: async () => {
			const { data } = await api.get("/auth/me");
			const user = data.data.user;

			return {
				name: [user.first_name, user.last_name]
					.filter(Boolean)
					.join(" "),
				email: user.email,
				avatar_url: user.avatar_url ?? null,
			};
		},
	});
}

// PUT update profil admin via /auth/profile
export function useUpdateAdminProfile() {
	const queryClient = useQueryClient();

	return useMutation<AdminProfile, Error, UpdateProfilePayload>({
		mutationFn: async (payload) => {
			const normalizedName = payload.name
				.trim()
				.replace(/\s+/g, " ");

			const [firstName, ...lastNameParts] =
				normalizedName.split(" ");

			const lastName = lastNameParts.join(" ");

			const { data } = await api.put("/auth/profile", {
				first_name: firstName,
				last_name: lastName || null,
				email: payload.email.trim().toLowerCase(),
			});

			const user = data.data.user;

			return {
				name: [user.first_name, user.last_name]
					.filter(Boolean)
					.join(" "),
				email: user.email,
				avatar_url: user.avatar_url ?? null,
			};
		},

		onSuccess: (updatedProfile) => {
			queryClient.setQueryData<AdminProfile>(
				["admin-profile"],
				updatedProfile,
			);
		},
	});
}

// POST upload avatar admin via /auth/profile/avatar
export function useUploadAdminAvatar() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async (file: File) => {
			const formData = new FormData();
			formData.append("avatar", file);
			const { data } = await api.post("/auth/profile/avatar", formData, {
				headers: { "Content-Type": "multipart/form-data" },
			});
			return data.data as { avatar_url: string };
		},
		onSuccess: ({ avatar_url }) => {
			queryClient.setQueryData<AdminProfile>(["admin-profile"], (old) =>
				old ? { ...old, avatar_url } : old
			);
		},
	});
}

// DELETE hapus avatar admin via /auth/profile/avatar
export function useDeleteAdminAvatar() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await api.delete("/auth/profile/avatar");
			return data;
		},
		onSuccess: () => {
			queryClient.setQueryData<AdminProfile>(["admin-profile"], (old) =>
				old ? { ...old, avatar_url: null } : old
			);
		},
	});
}

// ─── Password ─────────────────────────────────────────────────────────────────

// PUT ganti password admin
export function useUpdatePassword() {
	return useMutation({
		mutationFn: (data: {
			current_password: string;
			new_password: string;
			new_password_confirmation: string;
		}) =>
			fetchAPI("/admin/change-password", {
				method: "PUT",
				body: JSON.stringify(data),
			}),
	});
}

// ─── WhatsApp API Config ──────────────────────────────────────────────────────

// GET konfigurasi WA API
export function useWAConfig() {
	return useQuery<WAConfig>({
		queryKey: ["wa-config"],
		queryFn: () => fetchAPI("/settings/whatsapp"),
	});
}

// PUT simpan konfigurasi WA API
export function useUpdateWAConfig(options?: {
	onSuccess?: (data: WAConfig) => void;
}) {
	const queryClient = useQueryClient();
	return useMutation<WAConfig, Error, WAConfig>({
		mutationFn: (data) =>
			fetchAPI("/settings/whatsapp", {
				method: "PUT",
				body: JSON.stringify(data),
			}),
		onSuccess: (data) => {
			queryClient.invalidateQueries({ queryKey: ["wa-config"] });
			options?.onSuccess?.(data);
		},
	});
}

// POST test koneksi WA API
export function useTestWAConnection() {
	return useMutation<WATestResponse, Error, Partial<WAConfig> | void>({
		mutationFn: (data) =>
			fetchAPI("/settings/whatsapp/test", {
				method: "POST",
				body: data ? JSON.stringify(data) : undefined,
			}),
	});
}

// ─── System Status ────────────────────────────────────────────────────────────

// GET status sistem (database, WA API, server)
export function useSystemStatus() {
	return useQuery<SystemStatus>({
		queryKey: ["system-status"],
		queryFn: () => fetchAPI("/settings/status"),
		refetchInterval: 30000, // auto refresh tiap 30 detik
	});
}

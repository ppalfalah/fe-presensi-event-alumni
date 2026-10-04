"use client";

import { useRef, useState, type ReactNode } from "react";
import {
	MoreVertical,
	CheckCircle2,
	XCircle,
	Camera,
	Edit3,
	Eye,
	EyeOff,
	KeyRound,
	Loader2,
	PlugZap,
	Save,
	ShieldAlert,
	Trash2,
	UserRound,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import { FormInput } from "@/app/components/FormControl";
import { getApiErrorMessage, getImageUrl } from "@/lib/api";
import { useSettingsPage } from "./_hooks/useSettingsPage";
import { DEFAULT_FONNTE_API_URL } from "./_utils/waConfig";

// ─── Section Card ─────────────────────────────────────────────────────────────
function Icon3D({
	children,
	variant = "teal",
	size = "md",
}: {
	children: ReactNode;
	variant?: "teal" | "blue" | "green" | "red" | "gray" | "yellow";
	size?: "sm" | "md" | "lg";
}) {
	const variants = {
		teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
		blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
		green: "from-emerald-500 via-emerald-600 to-emerald-700 text-white",
		red: "from-red-500 via-red-600 to-red-700 text-white",
		gray: "from-gray-300 via-gray-400 to-gray-500 text-white",
		yellow: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
	};

	const sizes = {
		sm: "w-8 h-8 rounded-xl",
		md: "w-11 h-11 rounded-2xl",
		lg: "w-14 h-14 rounded-2xl",
	};

	return (
		<span
			className={`${sizes[size]} shrink-0 overflow-visible inline-flex items-center justify-center bg-gradient-to-br ${variants[variant]} shadow-lg shadow-[#0D5C3A]/20 border border-white/40 ring-1 ring-[#D4AF37]/20`}
		>
			<span className="inline-flex items-center justify-center leading-none drop-shadow-sm">
				{children}
			</span>
		</span>
	);
}

function SectionCard({
	title,
	desc,
	icon,
	variant = "teal",
	children,
}: {
	title: string;
	desc: string;
	icon: ReactNode;
	variant?: "teal" | "blue" | "green" | "red" | "gray" | "yellow";
	children: ReactNode;
}) {
	return (
		<section className="overflow-hidden rounded-2xl border border-[#0D5C3A]/10 bg-white shadow-md shadow-[#0D5C3A]/5">
			<div className="flex items-center gap-3 border-b border-[#0D5C3A]/10 bg-gradient-to-r from-[#E8F5E9] to-white px-5 py-4">
				<Icon3D variant={variant} size="md">
					{icon}
				</Icon3D>
				<div>
					<h2 className="text-base font-bold text-[#0D5C3A]">{title}</h2>
					<p className="mt-1 text-xs text-[#0D5C3A]/60">{desc}</p>
				</div>
			</div>
			<div className="p-5">{children}</div>
		</section>
	);
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SettingsPage() {
	// WhatsApp/Fonnte UI is temporarily hidden while the integration is paused.
	const showWhatsAppSettings = false;
	const {
		canEditWA,
		confirmPassword,
		deleteAvatar,
		effectiveApiToken,
		effectiveApiUrl,
		effectiveEmail,
		effectiveName,
		effectiveSenderNumber,
		editingWA,
		handleCancelEditWA,
		handleSaveWAConfig,
		handleStartEditWA,
		handleTestWA,
		isWABlocked,
		isWAConfigError,
		isWAConfigured,
		isWATestSuccess,
		loadingProfile,
		loadingWA,
		newPassword,
		oldPassword,
		profile,
		readOnlyConnected,
		saveWAConfig,
		savingWA,
		setApiToken,
		setConfirmPassword,
		setEmail,
		setName,
		setNewPassword,
		setOldPassword,
		setSenderNumber,
		setShowToken,
		setWAFormError,
		showToken,
		testError,
		testResult,
		testingWA,
		updatePassword,
		updateProfile,
		uploadAvatar,
		waConfig,
		waConfigError,
		waError,
		waFormError,
		waSuccess,
	} = useSettingsPage();

	const avatarFileRef = useRef<HTMLInputElement>(null);
	const [isAvatarPreviewOpen, setIsAvatarPreviewOpen] = useState(false);
	const [isDeleteAvatarConfirmOpen, setIsDeleteAvatarConfirmOpen] = useState(false);
	const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
	const [profilePopup, setProfilePopup] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [passwordPopup, setPasswordPopup] = useState<{
		type: "success" | "error";
		message: string;
	} | null>(null);
	const [passwordVisibility, setPasswordVisibility] = useState({
		old: false,
		new: false,
		confirm: false,
	});
	const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

	const handleSaveProfileWithPopup = () => {
		const nextName = effectiveName.trim().replace(/\s+/g, " ");
		const nextEmail = effectiveEmail.trim().toLowerCase();

		if (!nextName || !nextEmail) {
			setProfilePopup({
				type: "error",
				message: "Nama dan email administrator wajib diisi.",
			});
			return;
		}

		if (!EMAIL_REGEX.test(nextEmail)) {
			setProfilePopup({
				type: "error",
				message: "Format email tidak valid. Contoh: admin@pesantren.ac.id",
			});
			return;
		}

		updateProfile.mutate(
			{
				name: nextName,
				email: nextEmail,
			},
			{
				onSuccess: () => {
					setName(null);
					setEmail(null);

					setProfilePopup({
						type: "success",
						message: "Profil administrator berhasil diperbarui.",
					});
				},
				onError: (error) => {
					setProfilePopup({
						type: "error",
						message: getApiErrorMessage(
							error,
							"Profil administrator gagal diperbarui.",
						),
					});
				},
			},
		);
	};

	const handleUpdatePasswordWithPopup = () => {
		setPasswordPopup(null);

		if (!oldPassword.trim()) {
			setPasswordPopup({
				type: "error",
				message: "Kata sandi lama wajib diisi.",
			});
			return;
		}

		if (!newPassword.trim()) {
			setPasswordPopup({
				type: "error",
				message: "Kata sandi baru wajib diisi.",
			});
			return;
		}

		if (newPassword.length < 8) {
			setPasswordPopup({
				type: "error",
				message: "Kata sandi baru minimal 8 karakter.",
			});
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordPopup({
				type: "error",
				message: "Kata sandi baru dan konfirmasi tidak cocok.",
			});
			return;
		}

		if (oldPassword === newPassword) {
			setPasswordPopup({
				type: "error",
				message: "Kata sandi baru tidak boleh sama dengan kata sandi lama.",
			});
			return;
		}

		updatePassword.mutate(
			{
				current_password: oldPassword,
				new_password: newPassword,
				new_password_confirmation: confirmPassword,
			},
			{
				onSuccess: () => {
					setOldPassword("");
					setNewPassword("");
					setConfirmPassword("");
					setPasswordVisibility({
						old: false,
						new: false,
						confirm: false,
					});
					setPasswordPopup({
						type: "success",
						message: "Kata sandi administrator berhasil diperbarui.",
					});
				},
				onError: (error) => {
					setPasswordPopup({
						type: "error",
						message: getApiErrorMessage(
							error,
							"Kata sandi belum berhasil diperbarui. Periksa kembali kata sandi lama Anda.",
						),
					});
				},
			},
		);
	};

	return (
		<AdminLayout title="Pengaturan Sistem">
					
					<div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
						{/* ── Left Column ── */}
						<div className="xl:col-span-3 space-y-5">
							{/* Profil Admin */}
							<SectionCard
								title="Profil Administrator"
								desc="Informasi akun dan identitas admin"
								icon={<UserRound size={20} strokeWidth={2.5} />}
								variant="teal"
							>
								<div className="grid grid-cols-1 gap-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:items-start">
									{/* Foto Profil */}
									<div className="flex flex-col items-center rounded-2xl border border-[#0D5C3A]/10 bg-gradient-to-b from-[#E8F5E9] to-white p-4 text-center shadow-sm lg:items-center">
										<div className="mb-4 flex items-center gap-2 text-sm font-semibold text-[#0D5C3A]">
											<Camera size={16} strokeWidth={2.5} />
											<span>Foto Profil</span>
										</div>

										<div className="relative w-full">
											{/* Menu aksi foto profil */}
											<div className="absolute right-0 top-0 z-20">
												<button
													type="button"
													onClick={() => setIsAvatarMenuOpen((current) => !current)}
													className="flex h-9 w-9 items-center justify-center rounded-xl text-[#0D5C3A]/60 transition hover:bg-white hover:text-[#0D5C3A] hover:shadow-sm"
													aria-label="Menu foto profil"
													aria-expanded={isAvatarMenuOpen}
												>
													<MoreVertical size={19} />
												</button>

												{isAvatarMenuOpen && (
													<div className="absolute right-0 mt-2 w-36 overflow-hidden rounded-xl border border-[#0D5C3A]/10 bg-white py-1.5 text-left shadow-xl">
														<button
															type="button"
															disabled={!profile?.avatar_url}
															onClick={() => {
																setIsAvatarMenuOpen(false);
																setIsAvatarPreviewOpen(true);
															}}
															className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#0D5C3A]/70 transition hover:bg-[#E8F5E9] hover:text-[#0D5C3A] disabled:cursor-not-allowed disabled:opacity-40"
														>
															<Eye size={16} />
															Lihat
														</button>

														<button
															type="button"
															disabled={uploadAvatar.isPending || deleteAvatar.isPending}
															onClick={() => {
																setIsAvatarMenuOpen(false);
																avatarFileRef.current?.click();
															}}
															className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-[#0D5C3A]/70 transition hover:bg-[#E8F5E9] hover:text-[#0D5C3A] disabled:cursor-not-allowed disabled:opacity-40"
														>
															{uploadAvatar.isPending ? (
																<Loader2 size={16} className="animate-spin" />
															) : (
																<Edit3 size={16} />
															)}
															Ubah
														</button>

														<button
															type="button"
															disabled={!profile?.avatar_url || uploadAvatar.isPending || deleteAvatar.isPending}
															onClick={() => {
																setIsAvatarMenuOpen(false);
																setIsDeleteAvatarConfirmOpen(true);
															}}
															className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
														>
															{deleteAvatar.isPending ? (
																<Loader2 size={16} className="animate-spin" />
															) : (
																<Trash2 size={16} />
															)}
															Hapus
														</button>
													</div>
												)}
											</div>

											<div className="flex justify-center pt-2">
												{profile?.avatar_url ? (
													<img
														src={getImageUrl(profile.avatar_url)}
														alt={profile?.name ?? "Admin"}
														className="h-24 w-24 rounded-full object-cover ring-4 ring-[#D4AF37]/30 shadow-md"
													/>
												) : (
													<div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#0D5C3A] to-[#073D26] text-3xl font-bold text-white ring-4 ring-[#D4AF37]/30 shadow-md">
														{loadingProfile
															? "..."
															: (profile?.name?.[0]?.toUpperCase() ?? "A")}
													</div>
												)}
											</div>

											<input
												ref={avatarFileRef}
												type="file"
												accept=".jpg,.jpeg,.png,image/jpeg,image/png"
												className="hidden"
												onChange={(e) => {
													const file = e.target.files?.[0];

													if (file) {
														const allowedTypes = ["image/jpeg", "image/png"];

														if (!allowedTypes.includes(file.type)) {
															setProfilePopup({
																type: "error",
																message: "Format file harus JPG, JPEG, atau PNG.",
															});
															e.target.value = "";
															return;
														}

														if (file.size > 2 * 1024 * 1024) {
															setProfilePopup({
																type: "error",
																message: "Ukuran file maksimal 2 MB.",
															});
															e.target.value = "";
															return;
														}

														uploadAvatar.mutate(file);
													}
												}}
											/>
										</div>

										<span className="mt-4 inline-block rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 py-1 text-xs font-semibold text-[#0D5C3A]">
											Administrator
										</span>
										<p className="mt-3 text-xs leading-5 text-[#0D5C3A]/50">
											JPG, JPEG atau PNG. Maksimal 2 MB.
										</p>
									</div>

									{/* Informasi Akun */}
									<div className="space-y-4">
										<div>
											<label className="mb-1.5 block text-sm font-semibold text-[#0D5C3A]">
												Nama Administrator
											</label>
											<FormInput
												type="text"
												value={effectiveName}
												onChange={(e) => setName(e.target.value)}
												placeholder={
													loadingProfile ? "Memuat..." : "Nama administrator"
												}
												disabled={loadingProfile}
												className="w-full rounded-xl border border-[#0D5C3A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/15 disabled:bg-[#E8F5E9]/60"
											/>
										</div>

										<div>
											<label className="mb-1.5 block text-sm font-semibold text-[#0D5C3A]">
												Email Administrator
											</label>
											<FormInput
												type="email"
												value={effectiveEmail}
												onChange={(e) => setEmail(e.target.value)}
												placeholder={
													loadingProfile ? "Memuat..." : "email@pesantren.ac.id"
												}
												disabled={loadingProfile}
												className="w-full rounded-xl border border-[#0D5C3A]/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/15 disabled:bg-[#E8F5E9]/60"
											/>
										</div>


										<button
											onClick={handleSaveProfileWithPopup}
											disabled={updateProfile.isPending || loadingProfile}
											className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0D5C3A]/15 transition-all hover:shadow-lg hover:shadow-[#0D5C3A]/20 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
										>
											{updateProfile.isPending && (
												<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
											)}
											Simpan Profil
										</button>
									</div>
								</div>
							</SectionCard>

							{/* Keamanan */}
							<SectionCard
								title="Keamanan Akun"
								desc="Ubah kata sandi administrator"
								icon={<KeyRound size={20} strokeWidth={2.5} />}
								variant="yellow"
							>
								<div className="space-y-4">
									{[
										{
											key: "old" as const,
											label: "Kata Sandi Lama",
											value: oldPassword,
											set: setOldPassword,
											placeholder: "Masukkan kata sandi lama",
										},
										{
											key: "new" as const,
											label: "Kata Sandi Baru",
											value: newPassword,
											set: setNewPassword,
											placeholder: "Minimal 8 karakter",
										},
										{
											key: "confirm" as const,
											label: "Konfirmasi Kata Sandi Baru",
											value: confirmPassword,
											set: setConfirmPassword,
											placeholder: "Ulangi kata sandi baru",
										},
									].map((field) => (
										<div key={field.key}>
											<label className="block text-sm font-semibold text-[#0D5C3A] mb-1.5">
												{field.label}
											</label>
											<div className="relative">
												<FormInput
													type={passwordVisibility[field.key] ? "text" : "password"}
													value={field.value}
													onChange={(e) => field.set(e.target.value)}
													placeholder={field.placeholder}
													className="w-full rounded-xl border border-[#0D5C3A]/15 bg-white px-4 py-3 pr-12 text-sm outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#0D5C3A]/15"
												/>
												<button
													type="button"
													onClick={() =>
														setPasswordVisibility((current) => ({
															...current,
															[field.key]: !current[field.key],
														}))
													}
													className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0D5C3A]/45 transition hover:text-[#0D5C3A]"
													aria-label={
														passwordVisibility[field.key]
															? `Sembunyikan ${field.label.toLowerCase()}`
															: `Tampilkan ${field.label.toLowerCase()}`
													}
												>
													{passwordVisibility[field.key] ? (
														<EyeOff size={18} />
													) : (
														<Eye size={18} />
													)}
												</button>
											</div>
										</div>
									))}


									<button
										onClick={handleUpdatePasswordWithPopup}
										disabled={updatePassword.isPending}
										className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
									>
										{updatePassword.isPending && (
											<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
										)}
										Perbarui Kata Sandi
									</button>
								</div>
							</SectionCard>

							{/* Konfigurasi WhatsApp API */}
							{showWhatsAppSettings && <SectionCard
								title="Konfigurasi Pesan Massal WhatsApp"
								desc="Atur koneksi Fonnte untuk pesan massal WhatsApp"
								icon={<PlugZap size={20} strokeWidth={2.5} />}
								variant="blue"
							>
									<div className="space-y-5">
										<div className="p-4 bg-[#7AB2B2]/10 border border-[#7AB2B2]/20 rounded-2xl flex items-start gap-3">
											<CheckCircle2 className="w-5 h-5 text-[#2D7EA0] mt-0.5" />
											<div>
												<p className="text-sm font-semibold text-gray-800">
											Penyedia aktif: Fonnte
												</p>
												<p className="text-xs text-gray-500 mt-1">
											Pengaturan ini dipakai untuk pesan massal WA dan uji koneksi
													sebelum pengiriman massal.
												</p>
											</div>
										</div>

										{loadingWA ? (
											<div className="p-5 border border-gray-100 rounded-2xl bg-gray-50 text-sm text-gray-500">
												Memuat konfigurasi WhatsApp...
											</div>
										) : isWAConfigError ? (
											<div className="p-5 border border-red-100 rounded-2xl bg-red-50 text-sm text-red-500">
												{getApiErrorMessage(
													waConfigError,
													"Gagal memuat konfigurasi WhatsApp",
												)}
											</div>
										) : readOnlyConnected ? (
											<div className="space-y-4">
												<div className="p-5 bg-green-50 border border-green-200 rounded-2xl">
													<div className="flex items-start justify-between gap-4">
														<div>
															<p className="text-sm font-semibold text-green-700">
														Status terhubung
															</p>
															<p className="text-xs text-green-600 mt-1">
														Konfigurasi tersimpan siap dipakai untuk pesan massal.
															</p>
														</div>
														<span className="px-3 py-1 rounded-full bg-white text-green-700 border border-green-200 text-xs font-semibold">
															{waConfig?.sender_status ?? "active"}
														</span>
													</div>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
													{[
												{ label: "Penyedia", value: waConfig?.provider ?? "fonnte" },
														{ label: "URL API", value: DEFAULT_FONNTE_API_URL },
														{ label: "Nomor Pengirim", value: waConfig?.sender_number ?? "-" },
														{ label: "Token", value: waConfig?.api_token || "Token tersimpan" },
														{
															label: "Koneksi",
													value: waConfig?.connected ? "Terhubung" : "Terputus",
														},
														{
															label: "Terakhir dites",
															value: waConfig?.last_tested_at ?? "-",
														},
													].map((item) => (
														<div
															key={item.label}
															className="p-4 border border-gray-100 rounded-2xl bg-gray-50"
														>
															<p className="text-xs font-semibold text-gray-400 uppercase">
																{item.label}
															</p>
															<p className="text-sm font-semibold text-gray-800 mt-1 break-words">
																{item.value}
															</p>
														</div>
													))}
												</div>
											</div>
										) : (
											<div className="space-y-5">
												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
												Penyedia
													</label>
													<FormInput
														type="text"
														value="fonnte"
														disabled
														className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none text-sm bg-gray-50 text-gray-500"
													/>
												</div>

												<div>
													<label className="block text-sm font-medium text-gray-700 mb-1.5">
														URL API Fonnte
													</label>
													<FormInput
														type="text"
														value={effectiveApiUrl}
														readOnly
														disabled
														className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none text-sm bg-gray-50 text-gray-500"
													/>
												</div>

												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">
												Token API
													</label>
													<div className="relative">
														<FormInput
															type={showToken ? "text" : "password"}
															value={effectiveApiToken}
															onChange={(e) => {
																setApiToken(e.target.value);
																setWAFormError("");
															}}
															placeholder={
																isWAConfigured
															? "Biarkan token tersamarkan jika tidak diganti"
															: "Masukkan token API"
															}
															disabled={loadingWA || savingWA}
															className="w-full px-5 py-4 pr-12 border border-gray-200 rounded-2xl outline-none focus:border-[#3EBDAF] focus:ring-2 focus:ring-[#7AB2B2]/20 text-sm disabled:bg-gray-50"
														/>
														<button
															type="button"
															onClick={() => setShowToken(!showToken)}
															className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
															aria-label={
																showToken
																	? "Sembunyikan token"
																	: "Tampilkan token"
															}
														>
															{showToken ? (
																<EyeOff className="w-5 h-5" />
															) : (
																<Eye className="w-5 h-5" />
															)}
														</button>
													</div>
													<p className="text-xs text-gray-400 mt-1">
														{isWAConfigured
													? "Token tersimpan ditampilkan dalam bentuk tersamarkan dari layanan."
															: "Token wajib diisi untuk konfigurasi baru."}
													</p>
												</div>

												<div>
													<label className="block text-sm font-semibold text-gray-700 mb-2">
											Nomor Pengirim
													</label>
													<FormInput
														type="text"
														value={effectiveSenderNumber}
														onChange={(e) => {
															setSenderNumber(e.target.value.replace(/\D/g, ""));
															setWAFormError("");
														}}
														placeholder="628123456789"
														disabled={loadingWA || savingWA}
														className="w-full px-5 py-4 border border-gray-200 rounded-2xl outline-none focus:border-[#3EBDAF] focus:ring-2 focus:ring-[#7AB2B2]/20 text-sm disabled:bg-gray-50"
													/>
													<p className="text-xs text-gray-400 mt-1">
														Format: angka saja, diawali 62.
													</p>
												</div>
											</div>
										)}

									{/* Test result */}
									{isWATestSuccess && (
										<div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-start gap-2">
											<CheckCircle2 className="w-5 h-5 mt-0.5" />
											<div>
												<p className="font-semibold">
													Koneksi Fonnte berhasil
												</p>
												<p className="text-green-600 mt-1">
													{testResult?.message ??
												"Nomor pengirim siap dipakai untuk pesan massal WA."}
												</p>
											</div>
										</div>
									)}
									{isWABlocked && (
										<div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start gap-2">
											<ShieldAlert className="w-5 h-5 mt-0.5" />
											<div>
												<p className="font-semibold">
													Nomor WhatsApp terindikasi terblokir
												</p>
												<p className="text-red-500 mt-1">
													{testResult?.blocked_reason ??
														testResult?.message ??
												"Jangan lanjutkan pengiriman massal sampai nomor pengirim aktif kembali di Fonnte."}
												</p>
											</div>
										</div>
									)}
									{testError && (
										<div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm flex items-start gap-2">
											<ShieldAlert className="w-5 h-5 mt-0.5" />
											<div>
										<p className="font-semibold">Uji koneksi gagal</p>
												<p className="mt-1">{testError}</p>
											</div>
										</div>
									)}
									{waFormError && (
										<div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-500 text-sm flex items-start gap-2">
											<ShieldAlert className="w-5 h-5 mt-0.5" />
											<div>
										<p className="font-semibold">Formulir belum valid</p>
												<p className="mt-1">{waFormError}</p>
											</div>
										</div>
									)}

									{saveWAConfig.isSuccess && (
										<p className="text-sm text-green-600 flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4" /> Konfigurasi WA API
											berhasil disimpan
										</p>
									)}
									{saveWAConfig.isError && (
										<p className="text-sm text-red-500 flex items-center gap-2">
											<ShieldAlert className="w-4 h-4" />{" "}
											{getApiErrorMessage(
												saveWAConfig.error,
												"Gagal menyimpan konfigurasi WA",
											)}
										</p>
									)}

									<div className="flex flex-wrap gap-3">
										<button
											onClick={handleTestWA}
											disabled={loadingWA || testingWA}
											className="px-6 py-4 border-2 border-[#3EBDAF] text-[#2D7EA0] rounded-2xl font-semibold hover:bg-[#7AB2B2]/10 transition-colors disabled:opacity-50 flex items-center gap-2"
										>
											{testingWA ? (
												<span className="w-4 h-4 border-2 border-[#3EBDAF] border-t-transparent rounded-full animate-spin" />
											) : (
												<PlugZap className="w-5 h-5" />
											)}
										Uji Koneksi
										</button>
										{readOnlyConnected ? (
											<button
												onClick={handleStartEditWA}
												disabled={!canEditWA}
												className="flex-1 min-w-48 py-4 bg-[#2D7EA0] hover:bg-[#236175] text-white rounded-2xl font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
											>
												<Edit3 className="w-5 h-5" />
												Ubah
											</button>
										) : (
											<>
												{isWAConfigured && (
													<button
														onClick={handleCancelEditWA}
														disabled={savingWA}
														className="px-6 py-4 border-2 border-gray-200 text-gray-600 rounded-2xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50"
													>
														Batal
													</button>
												)}
												<button
													onClick={handleSaveWAConfig}
													disabled={savingWA || loadingWA}
													className="flex-1 min-w-48 py-4 bg-[#2D7EA0] hover:bg-[#236175] text-white rounded-2xl font-semibold shadow hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
												>
													{savingWA && (
														<span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
													)}
													{!savingWA && <Save className="w-5 h-5" />}
													Simpan Konfigurasi
												</button>
											</>
											)}
									</div>
									<div className="sr-only" aria-live="polite">
									{loadingWA ? "memuat" : ""}
									{readOnlyConnected ? "terhubung dan hanya baca" : ""}
									{editingWA ? "mengubah" : ""}
									{savingWA ? "menyimpan" : ""}
									{testingWA ? "menguji" : ""}
									{waError ? "gagal" : ""}
									{waSuccess ? "berhasil" : ""}
									</div>
								</div>
							</SectionCard>}
						</div>

					</div>

					<footer className="mt-6 text-center text-[#0D5C3A]/40 text-xs pb-4">
						© 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
					</footer>

					{isAvatarPreviewOpen && profile?.avatar_url && (
						<div
							className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
							onClick={() => setIsAvatarPreviewOpen(false)}
						>
							<div
								className="w-full max-w-xl rounded-3xl bg-white p-4 shadow-2xl"
								onClick={(event) => event.stopPropagation()}
							>
								<div className="mb-4 flex items-center justify-between gap-3 px-1">
									<div>
										<h3 className="text-base font-bold text-gray-800">Foto Profil</h3>
										<p className="mt-0.5 text-xs text-gray-400">
											{profile?.name ?? "Administrator"}
										</p>
									</div>
									<button
										type="button"
										onClick={() => setIsAvatarPreviewOpen(false)}
										className="rounded-xl px-3 py-2 text-sm font-medium text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
									>
										Tutup
									</button>
								</div>

								<div className="overflow-hidden rounded-2xl bg-gray-100">
									<img
										src={getImageUrl(profile.avatar_url)}
										alt={profile?.name ?? "Foto profil admin"}
										className="max-h-[65vh] w-full object-contain"
									/>
								</div>

								<div className="mt-4 flex justify-end gap-3">
									<button
										type="button"
										onClick={() => setIsDeleteAvatarConfirmOpen(true)}
										disabled={deleteAvatar.isPending}
										className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
									>
										<Trash2 size={16} />
										Hapus Foto
									</button>
								</div>
							</div>
						</div>
					)}

					{profilePopup && (
						<div
							className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
							onClick={() => setProfilePopup(null)}
						>
							<div
								className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
								onClick={(event) => event.stopPropagation()}
							>
								<div
									className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
										profilePopup.type === "success"
											? "bg-emerald-50 text-emerald-500"
											: "bg-red-50 text-red-500"
									}`}
								>
									{profilePopup.type === "success" ? (
										<CheckCircle2 size={30} />
									) : (
										<XCircle size={30} />
									)}
								</div>

								<h3 className="text-lg font-bold text-gray-800">
									{profilePopup.type === "success" ? "Berhasil" : "Gagal"}
								</h3>

								<p className="mt-2 text-sm leading-6 text-gray-500">
									{profilePopup.message}
								</p>

								<button
									type="button"
									onClick={() => setProfilePopup(null)}
									className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
										profilePopup.type === "success"
											? "bg-[#2D7EA0] hover:bg-[#236175]"
											: "bg-red-500 hover:bg-red-600"
									}`}
								>
									Oke
								</button>
							</div>
						</div>
					)}


					{passwordPopup && (
						<div
							className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
							onClick={() => setPasswordPopup(null)}
						>
							<div
								className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl"
								onClick={(event) => event.stopPropagation()}
							>
								<div
									className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
										passwordPopup.type === "success"
											? "bg-emerald-50 text-emerald-500"
											: "bg-red-50 text-red-500"
									}`}
								>
									{passwordPopup.type === "success" ? (
										<CheckCircle2 size={30} />
									) : (
										<XCircle size={30} />
									)}
								</div>

								<h3 className="text-lg font-bold text-gray-800">
									{passwordPopup.type === "success" ? "Berhasil" : "Gagal"}
								</h3>

								<p className="mt-2 text-sm leading-6 text-gray-500">
									{passwordPopup.message}
								</p>

								<button
									type="button"
									onClick={() => setPasswordPopup(null)}
									className={`mt-5 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] ${
										passwordPopup.type === "success"
											? "bg-[#2D7EA0] hover:bg-[#236175]"
											: "bg-red-500 hover:bg-red-600"
									}`}
								>
									Oke
								</button>
							</div>
						</div>
					)}

					<ConfirmDialog
						isOpen={isDeleteAvatarConfirmOpen}
						title="Hapus foto profil?"
						message="Foto profil akan dihapus dan avatar akan kembali menggunakan inisial nama administrator."
						confirmLabel="Hapus"
						tone="danger"
						loading={deleteAvatar.isPending}
						onCancel={() => setIsDeleteAvatarConfirmOpen(false)}
						onConfirm={() => {
							deleteAvatar.mutate(undefined, {
								onSuccess: () => {
									setIsDeleteAvatarConfirmOpen(false);
									setIsAvatarPreviewOpen(false);
								},
							});
						}}
					/>
		</AdminLayout>
	);
}

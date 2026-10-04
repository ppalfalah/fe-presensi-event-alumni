"use client";

import { useState, useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  UserCheck,
  UserX,
  ShieldAlert,
  Search,
  Plus,
  Edit3,
  Trash2,
  AlertCircle,
  X,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import ConfirmDialog from "@/app/components/ConfirmDialog";
import FeedbackToast from "@/app/components/FeedbackToast";
import { FormInput, FormSelect } from "@/app/components/FormControl";
import { useAuthUser, isSuperAdmin } from "@/hooks/admin/useAuthUser";
import {
  useAdmins,
  useCreateAdmin,
  useUpdateAdmin,
  useUpdateAdminStatus,
  useDeleteAdmin,
  type AdminAccount,
  type CreateAdminPayload,
  type UpdateAdminPayload,
} from "@/hooks/admin/useAdminAccounts";
import { getApiErrorMessage } from "@/lib/api";

type FormMode = "create" | "edit";

type AdminFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  admin_level: "admin" | "super_admin";
  password?: string;
  password_confirmation?: string;
  understand_super_admin?: boolean;
};

function Icon3D({
  children,
  variant = "teal",
  size = "md",
}: {
  children: ReactNode;
  variant?: "teal" | "blue" | "green" | "gold" | "red" | "gray" | "yellow";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
    blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
    green: "from-emerald-500 via-emerald-600 to-emerald-700 text-white",
    gold: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
    red: "from-red-500 via-red-600 to-red-700 text-white",
    gray: "from-gray-400 via-gray-500 to-gray-600 text-white",
    yellow: "from-yellow-500 via-yellow-600 to-yellow-700 text-white",
  };

  const sizes = {
    sm: "w-8 h-8 rounded-xl",
    md: "w-10 h-10 rounded-2xl",
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

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((i) => (
        <tr key={i} className="border-b border-[#0D5C3A]/10 animate-pulse">
          {Array.from({ length: 7 }, (_, index) => index).map((j) => (
            <td key={j} className="p-5">
              <div className="h-4 bg-[#E8F5E9] rounded w-3/4" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export default function AdminManagementPage() {
  const router = useRouter();
  const currentUser = useAuthUser();

  // Redirect if not super admin
  useEffect(() => {
    if (
      currentUser &&
      currentUser.role === "admin" &&
      !isSuperAdmin(currentUser)
    ) {
      router.replace("/admin/dashboard?error=forbidden");
    }
  }, [currentUser, router]);

  // Query Params & Filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [adminLevel, setAdminLevel] = useState("");
  const [page, setPage] = useState(1);

  // API query
  const {
    data: responseData,
    isLoading,
    isError,
  } = useAdmins({
    search,
    status,
    adminLevel,
    page,
  });

  const admins = responseData?.data?.admins || [];
  const totalAdmins = responseData?.data?.total || 0;
  const totalPages = responseData?.data?.last_page || 1;

  // Mutations
  const createMutation = useCreateAdmin();
  const updateMutation = useUpdateAdmin();
  const statusMutation = useUpdateAdminStatus();
  const deleteMutation = useDeleteAdmin();

  // Feedback State
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Modals & Dialogs State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>("create");
  const [selectedAdmin, setSelectedAdmin] = useState<AdminAccount | null>(null);

  // Confirmation State
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<AdminAccount | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminAccount | null>(null);

  // Form State
  const [formValues, setFormValues] = useState<AdminFormValues>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "",
    admin_level: "admin",
    password: "",
    password_confirmation: "",
    understand_super_admin: false,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Reset form helper
  const resetForm = () => {
    setFormValues({
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      gender: "",
      admin_level: "admin",
      password: "",
      password_confirmation: "",
      understand_super_admin: false,
    });
    setFormErrors({});
    setSelectedAdmin(null);
  };

  // Open create form
  const handleOpenCreate = () => {
    resetForm();
    setFormMode("create");
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEdit = (admin: AdminAccount) => {
    resetForm();
    setFormMode("edit");
    setSelectedAdmin(admin);
    setFormValues({
      first_name: admin.first_name || "",
      last_name: admin.last_name || "",
      email: admin.email || "",
      phone: admin.phone || "",
      gender: admin.gender || "",
      admin_level: admin.admin_level || "admin",
      password: "",
      password_confirmation: "",
      understand_super_admin: admin.admin_level === "super_admin",
    });
    setIsFormOpen(true);
  };

  // Client Validation
  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formValues.first_name?.trim()) {
      errors.first_name = "Nama depan wajib diisi.";
    }

    if (!formValues.email?.trim()) {
      errors.email = "Email wajib diisi.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      errors.email = "Format email tidak valid.";
    }

    if (!formValues.gender) {
      errors.gender = "Jenis kelamin wajib dipilih.";
    }

    if (!formValues.admin_level) {
      errors.admin_level = "Level admin wajib dipilih.";
    }

    if (
      formValues.admin_level === "super_admin" &&
      !formValues.understand_super_admin
    ) {
      errors.understand_super_admin =
        "Anda harus mencentang persetujuan pengelolaan.";
    }

    if (formMode === "create") {
      if (!formValues.password) {
        errors.password = "Password minimal 8 karakter.";
      } else if (formValues.password.length < 8) {
        errors.password = "Password minimal 8 karakter.";
      }

      if (formValues.password !== formValues.password_confirmation) {
        errors.password_confirmation = "Konfirmasi password tidak sama.";
      }
    } else if (formValues.password) {
      if (formValues.password.length < 8) {
        errors.password = "Password minimal 8 karakter.";
      }

      if (formValues.password !== formValues.password_confirmation) {
        errors.password_confirmation = "Konfirmasi password tidak sama.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload: CreateAdminPayload & UpdateAdminPayload = {
      first_name: formValues.first_name.trim(),
      last_name: formValues.last_name.trim(),
      email: formValues.email.trim().toLowerCase(),
      phone: formValues.phone.trim(),
      gender: formValues.gender,
      admin_level: formValues.admin_level,
    };
    
    if (formValues.password) {
      payload.password = formValues.password;
      payload.password_confirmation = formValues.password_confirmation;
    }

    if (formMode === "create") {
      createMutation.mutate(payload, {
        onSuccess: () => {
          setIsFormOpen(false);
          resetForm();
          showFeedback("success", "Admin berhasil dibuat.");
        },
        onError: (err) => {
          const errMsg = getApiErrorMessage(err, "Gagal membuat admin.");
          showFeedback("error", errMsg);
        },
      });
    } else if (formMode === "edit" && selectedAdmin) {
      updateMutation.mutate(
        { id: selectedAdmin.id, data: payload },
        {
          onSuccess: () => {
            setIsFormOpen(false);
            resetForm();
            showFeedback("success", "Profil admin berhasil diperbarui.");
          },
          onError: (err) => {
            const errMsg = getApiErrorMessage(err, "Gagal memperbarui admin.");
            showFeedback("error", errMsg);
          },
        },
      );
    }
  };

  // Status Change Dialog
  const handleOpenStatusDialog = (admin: AdminAccount) => {
    if (admin.id === currentUser?.id) {
      showFeedback("error", "Anda tidak dapat menonaktifkan akun sendiri.");
      return;
    }
    setStatusTarget(admin);
    setIsStatusDialogOpen(true);
  };

  const handleConfirmStatusChange = () => {
    if (!statusTarget) return;

    const nextStatus = statusTarget.status === "active" ? "inactive" : "active";
    statusMutation.mutate(
      { id: statusTarget.id, status: nextStatus },
      {
        onSuccess: () => {
          setIsStatusDialogOpen(false);
          setStatusTarget(null);
          showFeedback(
            "success",
            `Admin berhasil ${nextStatus === "active" ? "diaktifkan" : "dinonaktifkan"}.`,
          );
        },
        onError: (err) => {
          setIsStatusDialogOpen(false);
          const errMsg = getApiErrorMessage(
            err,
            "Gagal mengubah status admin.",
          );
          showFeedback("error", errMsg);
        },
      },
    );
  };

  // Delete Dialog
  const handleOpenDeleteDialog = (admin: AdminAccount) => {
    if (admin.id === currentUser?.id) {
      showFeedback("error", "Anda tidak dapat menghapus akun sendiri.");
      return;
    }
    setDeleteTarget(admin);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;

    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
        showFeedback("success", "Akun admin berhasil dihapus.");
      },
      onError: (err) => {
        setIsDeleteDialogOpen(false);
        const errMsg = getApiErrorMessage(err, "Gagal menghapus akun admin.");
        showFeedback("error", errMsg);
      },
    });
  };

  // Date formatter helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  };

  // Stats
  const superAdminCount =
    responseData?.data?.admins.filter((a) => a.admin_level === "super_admin")
      .length || 0;
  const activeCount =
    responseData?.data?.admins.filter((a) => a.status === "active").length || 0;
  const inactiveCount =
    responseData?.data?.admins.filter((a) => a.status === "inactive").length ||
    0;

  return (
    <>
      <AdminLayout title="Kelola Admin">
        {/* Top Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          {[
            {
              title: "Total Administrator",
              value: isLoading ? "..." : totalAdmins,
              desc: "Total akun pengelola",
              icon: <Users size={20} strokeWidth={2.5} />,
              variant: "teal" as const,
            },
            {
              title: "Super Admin",
              value: isLoading ? "..." : superAdminCount,
              desc: "Pengelola level tertinggi",
              icon: <ShieldAlert size={20} strokeWidth={2.5} />,
              variant: "gold" as const,
            },
            {
              title: "Admin Aktif",
              value: isLoading ? "..." : activeCount,
              desc: "Siap bertugas",
              icon: <UserCheck size={20} strokeWidth={2.5} />,
              variant: "green" as const,
            },
            {
              title: "Admin Nonaktif",
              value: isLoading ? "..." : inactiveCount,
              desc: "Akses dibatasi sementara",
              icon: <UserX size={20} strokeWidth={2.5} />,
              variant: "red" as const,
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-sm shadow-[#0D5C3A]/5 p-4"
            >
              <p className="text-[#0D5C3A]/60 text-xs">{item.title}</p>
              <div className="flex items-center gap-3 mt-1">
                <Icon3D variant={item.variant} size="md">
                  {item.icon}
                </Icon3D>
                <h2 className="text-3xl font-bold text-[#0D5C3A]">
                  {item.value}
                </h2>
              </div>
              <p className="text-[#0D5C3A]/50 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm shadow-[#0D5C3A]/5 overflow-hidden border border-[#0D5C3A]/10">
          {/* Table Header Accent */}
          <div className="p-5 bg-[#0D5C3A]/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Icon3D variant="teal" size="md">
                <ShieldAlert size={20} strokeWidth={2.5} />
              </Icon3D>
              <div>
                <h2 className="text-[#0D5C3A] text-xl font-bold">
                  Daftar Administrator
                </h2>
                <p className="text-[#0D5C3A]/60 text-xs mt-1">
                  Kelola level hak akses dan status admin
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-md shadow-[#0D5C3A]/20"
            >
              <Plus size={16} strokeWidth={2.5} />
              Tambah Admin
            </button>
          </div>

          {/* Filter Section */}
          <div className="p-5 border-b border-gray-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative flex items-center border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-[#2D7EA0] bg-white">
                <Search size={16} className="text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Cari nama atau email..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
                />
              </div>

              {/* Level Filter */}
              <div className="relative">
                <FormSelect
                  value={adminLevel}
                  onChange={(e) => {
                    setAdminLevel(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/20 focus:border-[#2D7EA0] bg-white"
                >
                  <option value="">Semua Level</option>
                  <option value="super_admin">Super Admin</option>
                  <option value="admin">Admin</option>
                </FormSelect>
              </div>

              {/* Status Filter */}
              <div className="relative">
                <FormSelect
                  value={status}
                  onChange={(e) => {
                    setStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/20 focus:border-[#2D7EA0] bg-white"
                >
                  <option value="">Semua Status</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Nonaktif</option>
                </FormSelect>
              </div>
            </div>
          </div>

          {/* Table Area */}
          {isError ? (
            <div className="text-center py-12">
              <div className="flex justify-center mb-3">
                <Icon3D variant="red" size="md">
                  <AlertCircle size={20} strokeWidth={2.5} />
                </Icon3D>
              </div>
              <p className="text-sm text-red-500 font-medium">
                Gagal memuat data administrator
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Ada masalah pada koneksi ke server, silakan coba lagi.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#0D5C3A]/10">
              <table className="w-full min-w-[800px] overflow-hidden rounded-xl">
                <thead className="bg-gradient-to-r from-[#E8F5E9] to-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Nama
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Nomor Telepon
                    </th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Level
                    </th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Status
                    </th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Dibuat
                    </th>
                    <th className="px-6 py-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : admins.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-center py-12 text-gray-400"
                      >
                        <p className="text-sm">
                          Tidak ada admin yang ditemukan.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    admins.map((admin, index) => {
                      const isSelf = admin.id === currentUser?.id;
                      const fullName =
                        `${admin.first_name} ${admin.last_name || ""}`.trim();
                      return (
                        <tr
                          key={admin.id}
                          className={`transition-colors border-b border-[#0D5C3A]/10 ${
                            isSelf
                              ? "bg-cyan-50/50 hover:bg-cyan-50"
                              : index % 2 === 0
                                ? "bg-white hover:bg-[#E8F5E9]/50"
                                : "bg-[#E8F5E9]/25 hover:bg-[#E8F5E9]/60"
                          }`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#7AB2B2] to-[#2D7EA0] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                                {admin.first_name[0]?.toUpperCase()}
                              </div>
                              <span className="text-sm font-semibold text-gray-800">
                                {fullName}{" "}
                                {isSelf && (
                                  <span className="text-[10px] bg-[#0D5C3A] text-white px-1.5 py-0.5 rounded font-normal ml-1">
                                    Saya
                                  </span>
                                )}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {admin.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {admin.phone || "-"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <span
                              className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg ${
                                admin.admin_level === "super_admin"
                                  ? "bg-red-50 text-red-600 border border-red-100"
                                  : "bg-blue-50 text-blue-600 border border-blue-100"
                              }`}
                            >
                              {admin.admin_level === "super_admin"
                                ? "Super Admin"
                                : "Admin"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleOpenStatusDialog(admin)}
                              disabled={isSelf}
                              className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
                                isSelf
                                  ? "cursor-not-allowed opacity-60"
                                  : "hover:brightness-95 active:scale-95"
                              } ${
                                admin.status === "active"
                                  ? "bg-green-50 text-green-600 border border-green-100"
                                  : "bg-gray-100 text-gray-500 border border-gray-200"
                              }`}
                              title={
                                isSelf
                                  ? "Tidak bisa mengubah status sendiri"
                                  : "Klik untuk ubah status"
                              }
                            >
                              {admin.status === "active" ? "Aktif" : "Nonaktif"}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                            {formatDate(admin.created_at)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleOpenEdit(admin)}
                                className="rounded-lg p-1.5 text-[#2D7EA0] transition-colors hover:bg-[#7AB2B2]/10"
                                title="Ubah Profil"
                              >
                                <Edit3 size={15} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => handleOpenDeleteDialog(admin)}
                                disabled={isSelf}
                                className={`rounded-lg p-1.5 text-red-400 transition-colors ${
                                  isSelf
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:bg-red-50"
                                }`}
                                title={
                                  isSelf
                                    ? "Tidak bisa menghapus akun sendiri"
                                    : "Hapus Admin"
                                }
                              >
                                <Trash2 size={15} strokeWidth={2.5} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && totalAdmins > 0 && (
            <div className="p-4 border-t border-gray-150 flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Menampilkan {admins.length} dari {totalAdmins} admin
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40"
                >
                  Sebelumnya
                </button>
                <span className="text-xs font-semibold text-gray-700 flex items-center px-2">
                  Halaman {page} dari {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                  className="px-3 py-1 text-xs border border-gray-200 rounded-lg text-gray-600 disabled:opacity-40"
                >
                  Berikutnya
                </button>
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 text-center text-[#0D5C3A]/40 text-xs pb-4">
          © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an
          Al-Falah
        </footer>
      </AdminLayout>

      {/* CREATE & EDIT FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800 text-lg">
                {formMode === "create"
                  ? "Tambah Administrator Baru"
                  : "Edit Profil Administrator"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {/* First Name */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Nama Depan *
                  </label>
                  <FormInput
                    value={formValues.first_name}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        first_name: e.target.value,
                      })
                    }
                    className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 ${
                      formErrors.first_name
                        ? "border-red-500"
                        : "border-gray-200"
                    }`}
                  />
                  {formErrors.first_name && (
                    <p className="text-red-500 text-[10px] mt-1">
                      {formErrors.first_name}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-xs font-medium text-gray-600 mb-1 block">
                    Nama Belakang
                  </label>
                  <FormInput
                    value={formValues.last_name}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        last_name: e.target.value,
                      })
                    }
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Email *
                </label>
                <FormInput
                  type="email"
                  value={formValues.email}
                  onChange={(e) =>
                    setFormValues({ ...formValues, email: e.target.value })
                  }
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 ${
                    formErrors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
                {formErrors.email && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Nomor Telepon
                </label>
                <FormInput
                  value={formValues.phone}
                  onChange={(e) =>
                    setFormValues({ ...formValues, phone: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Jenis Kelamin *
                </label>
                <FormSelect
                  value={formValues.gender}
                  onChange={(e) =>
                    setFormValues({ ...formValues, gender: e.target.value })
                  }
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 bg-white ${
                    formErrors.gender ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </FormSelect>
                {formErrors.gender && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {formErrors.gender}
                  </p>
                )}
              </div>

              {/* Admin Level */}
              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">
                  Level Otoritas *
                </label>
                <FormSelect
                  value={formValues.admin_level}
                  onChange={(e) => {
                    const val = e.target.value as "admin" | "super_admin";
                    setFormValues({
                      ...formValues,
                      admin_level: val,
                      understand_super_admin:
                        val === "super_admin"
                          ? formValues.understand_super_admin
                          : false,
                    });
                  }}
                  className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 bg-white ${
                    formErrors.admin_level
                      ? "border-red-500"
                      : "border-gray-200"
                  }`}
                >
                  <option value="admin">Admin Biasa</option>
                  <option value="super_admin">Super Admin</option>
                </FormSelect>
                <p className="text-[10px] text-gray-400 mt-1 italic">
                  {formValues.admin_level === "super_admin"
                    ? "* Super Admin: Memiliki kontrol penuh, termasuk mengelola akun admin lain."
                    : "* Admin: Hanya dapat mengelola event, presensi, broadcast, dan kelola alumni."}
                </p>
                {formErrors.admin_level && (
                  <p className="text-red-500 text-[10px] mt-1">
                    {formErrors.admin_level}
                  </p>
                )}
              </div>

              {/* Confirmation checkbox if super admin */}
              {formValues.admin_level === "super_admin" && (
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="understand_super_admin"
                    checked={formValues.understand_super_admin}
                    onChange={(e) =>
                      setFormValues({
                        ...formValues,
                        understand_super_admin: e.target.checked,
                      })
                    }
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 accent-[#2D7EA0]"
                  />
                  <label
                    htmlFor="understand_super_admin"
                    className="text-xs text-red-700 font-medium cursor-pointer"
                  >
                    Saya memahami bahwa akun ini dapat mengelola, menonaktifkan,
                    atau menghapus admin lainnya. *
                  </label>
                </div>
              )}
              {formValues.admin_level === "super_admin" &&
                formErrors.understand_super_admin && (
                  <p className="text-red-500 text-[10px]">
                    {formErrors.understand_super_admin}
                  </p>
                )}

              {/* Passwords Section */}
              <div className="border-t border-gray-100 pt-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-700">
                  {formMode === "create"
                    ? "Kata Sandi Akun"
                    : "Ubah Kata Sandi (Opsional)"}
                </h4>

                <div className="grid grid-cols-2 gap-3">
                  {/* Password */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Kata Sandi
                    </label>
                    <FormInput
                      type="password"
                      value={formValues.password || ""}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          password: e.target.value,
                        })
                      }
                      placeholder={
                        formMode === "edit" ? "Kosongkan jika tak diubah" : ""
                      }
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 ${
                        formErrors.password
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {formErrors.password && (
                      <p className="text-red-500 text-[10px] mt-1">
                        {formErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Password Confirmation */}
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">
                      Konfirmasi Sandi
                    </label>
                    <FormInput
                      type="password"
                      value={formValues.password_confirmation || ""}
                      onChange={(e) =>
                        setFormValues({
                          ...formValues,
                          password_confirmation: e.target.value,
                        })
                      }
                      placeholder={
                        formMode === "edit" ? "Kosongkan jika tak diubah" : ""
                      }
                      className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 ${
                        formErrors.password_confirmation
                          ? "border-red-500"
                          : "border-gray-200"
                      }`}
                    />
                    {formErrors.password_confirmation && (
                      <p className="text-red-500 text-[10px] mt-1">
                        {formErrors.password_confirmation}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="border-t border-gray-100 pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  className="flex-1 bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] disabled:bg-gray-300 text-white py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0D5C3A]/20 flex items-center justify-center gap-2"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  )}
                  {formMode === "create" ? "Simpan" : "Perbarui"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM STATUS DIALOG */}
      <ConfirmDialog
        isOpen={isStatusDialogOpen}
        title={
          statusTarget?.status === "active"
            ? "Nonaktifkan admin ini?"
            : "Aktifkan admin ini?"
        }
        message={
          statusTarget?.status === "active"
            ? `Akun "${statusTarget.first_name} ${statusTarget.last_name || ""}" tidak akan bisa masuk ke sistem sampai diaktifkan kembali.`
            : `Akun "${statusTarget?.first_name} ${statusTarget?.last_name || ""}" akan diberikan akses kembali untuk mengelola sistem.`
        }
        confirmLabel={
          statusTarget?.status === "active" ? "Nonaktifkan" : "Aktifkan"
        }
        loading={statusMutation.isPending}
        tone={statusTarget?.status === "active" ? "danger" : "default"}
        onCancel={() => setIsStatusDialogOpen(false)}
        onConfirm={handleConfirmStatusChange}
      />

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Hapus akun admin?"
        message={
          deleteTarget
            ? `Akun pengelola "${deleteTarget.first_name} ${deleteTarget.last_name || ""}" akan dihapus permanen dan sesi aktifnya akan dicabut.`
            : "Akun pengelola ini akan dihapus permanen dari sistem."
        }
        confirmLabel="Hapus"
        loading={deleteMutation.isPending}
        tone="danger"
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleConfirmDelete}
      />

      {/* FEEDBACK TOAST */}
      {feedback && (
        <FeedbackToast type={feedback.type} message={feedback.message} />
      )}
    </>
  );
}

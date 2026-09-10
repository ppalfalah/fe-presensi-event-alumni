"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type GetUsersParams,
  type UpdateUserPayload,
  type User,
  type UserStatus,
  useBulkUpdateUserStatus,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserStatus,
  useUsers,
  getUsers,
} from "@/hooks/admin/users";
import { useDebounce } from "@/hooks/useDebounce";
import { getApiErrorMessage } from "@/lib/api";
import {
  exportUsersToExcel,
  exportUsersToPdf,
  isAdminUser,
} from "../_utils/userFormatters";

export type UserStatusFilter = "all" | UserStatus;
export type UserStatusAction = "approve" | "reject" | "deactivate" | "activate";
export type BulkUserStatusAction =
  | "approve"
  | "deactivate"
  | "activate"
  | "reject";
export type UserSortKey =
  | "name"
  | "email"
  | "phone"
  | "role"
  | "status"
  | "created_at";
export type SortDirection = "asc" | "desc";
export type PaginationItem = number | "start-ellipsis" | "end-ellipsis";

export type UserStatusTarget = {
  user: User;
  status: Exclude<UserStatus, "pending">;
  action: UserStatusAction;
};

function getPaginationRange(
  currentPage: number,
  totalPages: number,
): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 4) {
    return [1, 2, 3, 4, 5, "end-ellipsis", totalPages];
  }

  if (currentPage >= totalPages - 3) {
    return [
      1,
      "start-ellipsis",
      totalPages - 4,
      totalPages - 3,
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  return [
    1,
    "start-ellipsis",
    currentPage - 1,
    currentPage,
    currentPage + 1,
    "end-ellipsis",
    totalPages,
  ];
}

function getCurrentAdminId() {
  if (typeof window === "undefined") return null;

  try {
    const storedUser = localStorage.getItem("user") || sessionStorage.getItem("user");
    if (!storedUser) return null;

    const id = Number((JSON.parse(storedUser) as { id?: unknown }).id);
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export function useUsersPage() {
  const [selected, setSelected] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [statusFilter, setStatusFilterState] =
    useState<UserStatusFilter>("all");
  const [statusTarget, setStatusTarget] = useState<UserStatusTarget | null>(
    null,
  );
  const [selectedUserIds, setSelectedUserIds] = useState<Set<number>>(
    () => new Set(),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPageState] = useState(10);
  const [sortBy, setSortBy] = useState<UserSortKey | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [provinceFilter, setProvinceFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const queryParams = useMemo<GetUsersParams>(() => {
    const p: GetUsersParams = {
      page: currentPage,
      per_page: perPage,
    };
    if (debouncedSearch.trim()) p.search = debouncedSearch.trim();
    if (statusFilter !== "all") p.status = statusFilter;
    if (provinceFilter) p.domicile_province_code = provinceFilter;
    if (cityFilter) p.domicile_city_code = cityFilter;
    if (districtFilter) p.domicile_district_code = districtFilter;
    if (villageFilter) p.domicile_village_code = villageFilter;
    if (sortBy) {
      p.sort_by = sortBy;
      p.sort_dir = sortDirection;
    }
    return p;
  }, [
    currentPage,
    perPage,
    debouncedSearch,
    statusFilter,
    provinceFilter,
    cityFilter,
    districtFilter,
    villageFilter,
    sortBy,
    sortDirection,
  ]);

  const { data: usersData, isLoading, isError } = useUsers(queryParams);

  // Wrap paginatedUsers in useMemo to prevent unnecessary re-renders
  const paginatedUsers = useMemo(
    () => usersData?.users ?? [],
    [usersData?.users],
  );
  const totalFilteredUsers = usersData?.total ?? 0;
  const totalPages = Math.max(1, usersData?.last_page ?? 1);
  const visiblePage = Math.min(currentPage, totalPages);

  // Status stats
  const { data: allUsersData } = useUsers({ per_page: 1 });
  const { data: activeUsersData } = useUsers({ per_page: 1, status: "active" });
  const { data: pendingUsersData } = useUsers({
    per_page: 1,
    status: "pending",
  });
  const { data: inactiveUsersData } = useUsers({
    per_page: 1,
    status: "inactive",
  });
  const { data: rejectedUsersData } = useUsers({
    per_page: 1,
    status: "rejected",
  });

  const stats = useMemo(
    () => ({
      totalUsers: allUsersData?.total ?? 0,
      activeUsers: activeUsersData?.total ?? 0,
      pendingUsers: pendingUsersData?.total ?? 0,
      inactiveUsers: inactiveUsersData?.total ?? 0,
      rejectedUsers: rejectedUsersData?.total ?? 0,
      monthUsers: allUsersData?.total ?? 0,
    }),
    [
      allUsersData,
      activeUsersData,
      pendingUsersData,
      inactiveUsersData,
      rejectedUsersData,
    ],
  );

  const handleProvinceFilterChange = (val: string) => {
    setProvinceFilter(val);
    setCityFilter("");
    setDistrictFilter("");
    setVillageFilter("");
    setCurrentPage(1);
  };
  const handleCityFilterChange = (val: string) => {
    setCityFilter(val);
    setDistrictFilter("");
    setVillageFilter("");
    setCurrentPage(1);
  };
  const handleDistrictFilterChange = (val: string) => {
    setDistrictFilter(val);
    setVillageFilter("");
    setCurrentPage(1);
  };
  const handleVillageFilterChange = (val: string) => {
    setVillageFilter(val);
    setCurrentPage(1);
  };
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUser = useUpdateUser();
  const updateUserStatus = useUpdateUserStatus();
  const bulkUpdateUserStatus = useBulkUpdateUserStatus();
  const deleteUser = useDeleteUser();
  const currentAdminId = getCurrentAdminId();

  const pageStart =
    totalFilteredUsers === 0 ? 0 : (visiblePage - 1) * perPage + 1;
  const pageEnd = Math.min(visiblePage * perPage, totalFilteredUsers);
  const paginationRange = getPaginationRange(visiblePage, totalPages);

  const isBulkSelectable = (user: User) =>
    statusFilter !== "all" &&
    user.status === statusFilter &&
    !isAdminUser(user) &&
    user.id !== currentAdminId;

  const selectableVisibleUsers = useMemo(
    () =>
      statusFilter === "all"
        ? []
        : paginatedUsers.filter(
            (user) =>
              user.status === statusFilter &&
              !isAdminUser(user) &&
              user.id !== currentAdminId,
          ),
    [paginatedUsers, currentAdminId, statusFilter],
  );

  const selectedUsers = useMemo(
    () => paginatedUsers.filter((user) => selectedUserIds.has(user.id)),
    [paginatedUsers, selectedUserIds],
  );

  const allVisibleSelected =
    selectableVisibleUsers.length > 0 &&
    selectableVisibleUsers.every((user) => selectedUserIds.has(user.id));
  const someVisibleSelected = selectableVisibleUsers.some((user) =>
    selectedUserIds.has(user.id),
  );

  const closeModal = () => setSelected(null);
  const clearFeedbackTimeout = () => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current);
      feedbackTimeoutRef.current = null;
    }
  };
  const showFeedback = (nextFeedback: {
    type: "success" | "error";
    message: string;
  }) => {
    clearFeedbackTimeout();
    setFeedback(nextFeedback);
    feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => clearFeedbackTimeout, []);

  const setSearch = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const setStatusFilter = (value: UserStatusFilter) => {
    setStatusFilterState(value);
    setSelectedUserIds(new Set());
    setCurrentPage(1);
  };

  const setPerPage = (value: number) => {
    setPerPageState(value);
    setCurrentPage(1);
  };

  const handleSort = (column: UserSortKey) => {
    if (sortBy === column) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
  };

  const toggleUserSelection = (user: User) => {
    if (bulkUpdateUserStatus.isPending || !isBulkSelectable(user)) return;

    setSelectedUserIds((current) => {
      const next = new Set(current);
      if (next.has(user.id)) next.delete(user.id);
      else next.add(user.id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (bulkUpdateUserStatus.isPending || selectableVisibleUsers.length === 0) {
      return;
    }

    setSelectedUserIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) {
        selectableVisibleUsers.forEach((user) => next.delete(user.id));
      } else {
        selectableVisibleUsers.forEach((user) => next.add(user.id));
      }
      return next;
    });
  };

  const clearSelectedUsers = () => setSelectedUserIds(new Set());

  const runBulkAction = (action: BulkUserStatusAction, reason?: string) => {
    const eligibleUsers = selectedUsers.filter((user) => {
      if (!isBulkSelectable(user)) return false;

      if (action === "approve") {
        return user.status === "pending" || user.status === "rejected";
      }

      if (action === "activate") {
        return user.status === "inactive";
      }

      if (action === "deactivate") {
        return user.status === "active";
      }

      return user.status === "pending";
    });

    if (eligibleUsers.length === 0) {
      showFeedback({
        type: "error",
        message: "Tidak ada pengguna yang sesuai untuk aksi ini.",
      });
      return;
    }

    const targetStatus: Exclude<UserStatus, "pending"> =
      action === "approve" || action === "activate"
        ? "active"
        : action === "deactivate"
          ? "inactive"
          : "rejected";

    const successMessages: Record<BulkUserStatusAction, string> = {
      approve:
        statusFilter === "rejected"
          ? "Persetujuan ulang massal selesai."
          : "Persetujuan massal selesai.",
      activate: "Pengaktifan massal selesai.",
      deactivate: "Penonaktifan massal selesai.",
      reject: "Penolakan massal selesai.",
    };

    setFeedback(null);
    bulkUpdateUserStatus.mutate(
      {
        userIds: eligibleUsers.map((user) => user.id),
        status: targetStatus,
        reason,
      },
      {
        onSuccess: (result) => {
          clearSelectedUsers();
          const { updated_count: updatedCount, skipped_count: skippedCount } =
            result.data;
          const skippedSummary =
            skippedCount > 0 ? `, ${skippedCount} pengguna dilewati` : "";

          showFeedback({
            type: "success",
            message: `${successMessages[action]} ${updatedCount} pengguna diperbarui${skippedSummary}.`,
          });
        },
        onError: (error) => {
          clearSelectedUsers();
          showFeedback({
            type: "error",
            message: getApiErrorMessage(error, "Aksi massal gagal diproses."),
          });
        },
      },
    );
  };

  const handleSubmit = (data: UpdateUserPayload) => {
    if (!selected) return;
    if (isAdminUser(selected)) {
      setSelected(null);
      showFeedback({
        type: "error",
        message: "Pengguna dengan peran admin tidak dapat diubah",
      });
      return;
    }

    setFeedback(null);
    updateUser.mutate(
      { id: selected.id, data },
      {
        onSuccess: () => {
          setSelected(null);
          showFeedback({
            type: "success",
            message: "Pengguna berhasil diperbarui",
          });
        },
        onError: (error) => {
          showFeedback({
            type: "error",
            message: getApiErrorMessage(error, "Gagal memperbarui pengguna"),
          });
        },
      },
    );
  };

  const handleDelete = (user: User) => {
    if (isAdminUser(user)) {
      showFeedback({
        type: "error",
        message: "Pengguna dengan peran admin tidak dapat dihapus",
      });
      return;
    }

    setDeleteTarget(user);
  };

  const cancelDelete = () => setDeleteTarget(null);
  const cancelStatusUpdate = () => setStatusTarget(null);

  const requestStatusUpdate = (target: UserStatusTarget) => {
    if (isAdminUser(target.user) || !target.user.status) return;
    setStatusTarget(target);
  };

  const confirmStatusUpdate = (reason?: string) => {
    if (!statusTarget) return;

    setFeedback(null);
    updateUserStatus.mutate(
      { id: statusTarget.user.id, status: statusTarget.status, reason },
      {
        onSuccess: () => {
          const successMessages: Record<UserStatusAction, string> = {
            approve: "Pengguna berhasil disetujui",
            reject: "Pengguna berhasil ditolak",
            deactivate: "Pengguna berhasil dinonaktifkan",
            activate: "Pengguna berhasil diaktifkan",
          };

          setStatusTarget(null);
          showFeedback({
            type: "success",
            message: successMessages[statusTarget.action],
          });
        },
        onError: (error) => {
          setStatusTarget(null);
          showFeedback({
            type: "error",
            message: getApiErrorMessage(
              error,
              "Gagal mengubah status pengguna",
            ),
          });
        },
      },
    );
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    setFeedback(null);
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        showFeedback({ type: "success", message: "Pengguna berhasil dihapus" });
      },
      onError: (error) => {
        setDeleteTarget(null);
        showFeedback({
          type: "error",
          message: getApiErrorMessage(error, "Gagal menghapus pengguna"),
        });
      },
    });
  };

  const handleExport = async (format: "excel" | "pdf") => {
    if (totalFilteredUsers === 0) {
      showFeedback({
        type: "error",
        message: "Tidak ada data pengguna untuk diekspor",
      });
      return;
    }

    const preparedPdfWindow =
      format === "pdf"
        ? window.open("", "_blank", "width=1120,height=800")
        : null;

    if (format === "pdf" && !preparedPdfWindow) {
      showFeedback({
        type: "error",
        message: "Popup PDF diblokir browser. Izinkan popup lalu coba lagi",
      });
      return;
    }

    try {
      const allParams = {
        ...queryParams,
        page: 1,
        per_page: Math.max(10, totalFilteredUsers),
      };
      const result = await getUsers(allParams);
      const allUsers = result.users;

      if (format === "pdf") {
        const opened = exportUsersToPdf(allUsers, preparedPdfWindow);
        showFeedback({
          type: opened ? "success" : "error",
          message: opened
            ? "Data pengguna siap dicetak atau disimpan sebagai PDF"
            : "Popup PDF diblokir browser. Izinkan popup lalu coba lagi",
        });
      } else {
        exportUsersToExcel(allUsers);
        showFeedback({
          type: "success",
          message: "Data pengguna berhasil diekspor ke Excel",
        });
      }
    } catch (err) {
      preparedPdfWindow?.close();
      showFeedback({
        type: "error",
        message: getApiErrorMessage(err, "Gagal menyiapkan data pengguna untuk diekspor"),
      });
    }
  };

  return {
    allVisibleSelected,
    bulkActionLoading: bulkUpdateUserStatus.isPending,
    clearSelectedUsers,
    cancelDelete,
    cancelStatusUpdate,
    confirmDelete,
    confirmStatusUpdate,
    deleteUser,
    deleteTarget,
    feedback,
    goToPage,
    handleSort,
    isBulkSelectable,
    handleDelete,
    handleExport,
    handleSubmit,
    isError,
    isLoading,
    pageEnd,
    pageStart,
    paginatedUsers,
    paginationRange,
    perPage,
    search: searchQuery,
    requestStatusUpdate,
    runBulkAction,
    selected,
    selectedUserIds,
    selectedUsers,
    setSearch,
    setSelected,
    setPerPage,
    setStatusFilter,
    sortBy,
    sortDirection,
    stats,
    statusFilter,
    statusTarget,
    someVisibleSelected,
    toggleSelectAll,
    toggleUserSelection,
    totalFilteredUsers,
    totalPages,
    currentPage: visiblePage,
    updateUser,
    updateUserStatus,
    users: paginatedUsers,
    closeModal,
    provinceFilter,
    cityFilter,
    districtFilter,
    villageFilter,
    setProvinceFilter: handleProvinceFilterChange,
    setCityFilter: handleCityFilterChange,
    setDistrictFilter: handleDistrictFilterChange,
    setVillageFilter: handleVillageFilterChange,
  };
}

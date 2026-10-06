"use client";

import { useState } from "react";
import {
  AlertTriangle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  Clock,
  Filter,
  KeyRound,
  MapPin,
  RefreshCw,
  Tag,
} from "lucide-react";
import {
  getNotificationApiErrorMessage,
  useMarkAllAsRead,
  useMarkAsRead,
  useMyNotifications,
  useUnreadCount,
  type AlumniNotification,
} from "@/hooks/alumni/useAlumniHooks";

type FilterTab = "all" | "unread" | "read";

function formatDateTime(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(value?: string) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(value?: string) {
  if (!value) return "";

  const parts = value.split(":");
  if (parts.length >= 2) return `${parts[0]}:${parts[1]} WIB`;

  return value;
}

function getNotificationText(notification: AlumniNotification) {
  if (notification.type === "password_changed") {
    return {
      title: notification.title || "Password akun berhasil diperbarui",
      message:
        notification.message ||
        "Password akun Anda berhasil diperbarui. Jika Anda merasa tidak melakukan perubahan ini, segera hubungi admin.",
    };
  }

  return {
    title:
      notification.title ||
      notification.data?.event_title ||
      "Notifikasi Alumni",
    message: notification.message || notification.body || "",
  };
}

function getCategory(notification: AlumniNotification) {
  const data = notification.data;
  const directCategory = notification.category;

  if (typeof data?.category === "string") return data.category;
  if (typeof data?.category_name === "string") return data.category_name;
  if (typeof directCategory === "string") return directCategory;

  return "";
}

function renderNotificationIcon(notification: AlumniNotification) {
  if (notification.type === "password_changed") {
    return <KeyRound className="h-5 w-5" />;
  }

  if (notification.type === "event_starting_soon") {
    return <AlertTriangle className="h-5 w-5" />;
  }

  if (notification.type === "upcoming_event") {
    return <Calendar className="h-5 w-5" />;
  }

  return <Bell className="h-5 w-5" />;
}

function NotificationCard({
  notification,
  isMarkingAsRead,
  onMarkAsRead,
}: {
  notification: AlumniNotification;
  isMarkingAsRead: boolean;
  onMarkAsRead: (id: number) => void;
}) {
  const { title, message } = getNotificationText(notification);
  const isRead = notification.is_read === true;
  const isPriority =
    notification.type === "event_starting_soon" ||
    notification.priority === "high";
  const eventTitle = notification.data?.event_title;
  const startsAt = notification.data?.starts_at;
  const startTime = notification.data?.start_time;
  const endTime = notification.data?.end_time;
  const location = notification.data?.location;
  const category = getCategory(notification);
  const canMarkAsRead = !isRead && typeof notification.id === "number";

  const handleMarkAsRead = () => {
    if (canMarkAsRead && !isMarkingAsRead) {
      onMarkAsRead(notification.id as number);
    }
  };

  return (
    <article
      role={canMarkAsRead ? "button" : undefined}
      tabIndex={canMarkAsRead ? 0 : undefined}
      onClick={handleMarkAsRead}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleMarkAsRead();
        }
      }}
      className={`rounded-2xl border p-4 shadow-sm ${
        !isRead
          ? "border-teal-200 bg-teal-50/70 ring-1 ring-teal-100"
          : isPriority
          ? "border-amber-200 bg-amber-50 ring-2 ring-amber-100"
          : "border-gray-100 bg-white"
      } ${canMarkAsRead ? "cursor-pointer transition-colors hover:bg-teal-50" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl ${
            isPriority
              ? "bg-amber-500 text-white"
              : "bg-teal-50 text-teal-700"
          }`}
        >
          {renderNotificationIcon(notification)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                isRead
                  ? "bg-gray-100 text-gray-500"
                  : "bg-teal-600 text-white"
              }`}
            >
              {isRead ? (
                <Check className="h-3 w-3" />
              ) : (
                <Bell className="h-3 w-3" />
              )}
              {isRead ? "Sudah dibaca" : "Belum dibaca"}
            </span>

            {isPriority && (
              <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                Prioritas tinggi
              </span>
            )}

            {notification.created_at && (
              <span className="text-[11px] font-medium text-gray-400">
                {formatDateTime(notification.created_at)}
              </span>
            )}
          </div>

          <h2
            className={`mt-1 text-base font-bold leading-snug ${
              isPriority ? "text-amber-950" : "text-gray-900"
            }`}
          >
            {title}
          </h2>

          {message && (
            <p
              className={`mt-1 text-sm leading-relaxed ${
                isPriority ? "text-amber-900" : "text-gray-500"
              }`}
            >
              {message}
            </p>
          )}

          {canMarkAsRead && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleMarkAsRead();
              }}
              disabled={isMarkingAsRead}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-teal-700 shadow-sm ring-1 ring-teal-100 transition-colors hover:bg-teal-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {isMarkingAsRead ? "Menandai..." : "Tandai sudah dibaca"}
            </button>
          )}

          {notification.type === "password_changed" && (
            <p className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium leading-relaxed text-red-700">
              Jika Anda tidak melakukan perubahan ini, segera hubungi admin
              untuk mengamankan akun.
            </p>
          )}

          {(eventTitle || startsAt || startTime || location || category) && (
            <div className="mt-3 space-y-2 rounded-xl border border-white/70 bg-white/75 p-3">
              {eventTitle && (
                <p className="text-sm font-semibold leading-snug text-gray-800">
                  {eventTitle}
                </p>
              )}

              <div className="space-y-1.5 text-xs text-gray-500">
                {startsAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
                    <span>{formatDate(startsAt)}</span>
                  </div>
                )}

                {(startTime || endTime) && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
                    <span>
                      {formatTime(startTime)}
                      {endTime ? ` - ${formatTime(endTime)}` : ""}
                    </span>
                  </div>
                )}

                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
                    <span className="min-w-0 truncate">{location}</span>
                  </div>
                )}

                {category && (
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 flex-shrink-0 text-teal-600" />
                    <span>{category}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function NotificationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
        >
          <div className="flex gap-3">
            <div className="h-10 w-10 flex-shrink-0 animate-pulse rounded-2xl bg-gray-200" />
            <div className="w-full space-y-3">
              <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "unread", label: "Belum Dibaca" },
  { key: "read", label: "Sudah Dibaca" },
];


export default function AlumniNotificationsPage() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const {
    data: notifications = [],
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useMyNotifications();

  const {
    data: unreadCountData,
    refetch: refetchUnreadCount,
    isFetching: isFetchingUnreadCount,
  } = useUnreadCount();

  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      refetchUnreadCount(),
    ]);
  };

  const isRefreshing = isFetching || isFetchingUnreadCount;

  const readCount = notifications.filter(
    (notification) => notification.is_read === true
  ).length;
  const localUnreadCount = notifications.length - readCount;
  const unreadCount = unreadCountData?.unread_count ?? localUnreadCount;
  const mutationError = markAsRead.error ?? markAllAsRead.error;

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter((notification) => {
    if (activeFilter === "unread") return notification.is_read !== true;
    if (activeFilter === "read") return notification.is_read === true;
    return true;
  });

  const getEmptyMessage = () => {
    if (activeFilter === "unread")
      return "Tidak ada notifikasi yang belum dibaca.";
    if (activeFilter === "read")
      return "Tidak ada notifikasi yang sudah dibaca.";
    return "Informasi akun dan event alumni akan muncul di sini.";
  };

  const getEmptyTitle = () => {
    if (activeFilter === "unread") return "Semua sudah dibaca";
    if (activeFilter === "read") return "Belum ada yang dibaca";
    return "Belum ada notifikasi";
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Notifikasi</h1>
          <p className="mt-0.5 text-xs text-gray-400">
            Pembaruan akun dan informasi event alumni
          </p>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="hidden items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:inline-flex"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              {markAllAsRead.isPending ? "Menandai..." : "Tandai semua"}
            </button>
          )}

          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-gray-600 shadow-sm ring-1 ring-gray-100 transition-colors hover:bg-gray-50 disabled:opacity-60"
            aria-label="Muat ulang notifikasi"
          >
            <RefreshCw
              className={`h-4.5 w-4.5 ${
                isRefreshing ? "animate-spin" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      {!isLoading && !isError && notifications.length > 0 && (
        <div className="flex items-center gap-1 rounded-2xl bg-gray-100/80 p-1">
          {FILTER_TABS.map((tab) => {
            const isActive = activeFilter === tab.key;
            const count =
              tab.key === "all"
                ? notifications.length
                : tab.key === "unread"
                ? unreadCount
                : readCount;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-white text-teal-700 shadow-sm ring-1 ring-gray-200/60"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.key === "all" && <Filter className="h-3 w-3" />}
                {tab.key === "unread" && <Bell className="h-3 w-3" />}
                {tab.key === "read" && <Check className="h-3 w-3" />}
                {tab.label}
                <span
                  className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                    isActive
                      ? tab.key === "unread" && count > 0
                        ? "bg-teal-600 text-white"
                        : "bg-gray-200 text-gray-600"
                      : "bg-gray-200/80 text-gray-500"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && !isError && notifications.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-teal-100 bg-teal-50 p-3">
            <p className="text-2xl font-bold text-teal-700">{unreadCount}</p>
            <p className="text-xs font-medium text-teal-700/70">
              Belum dibaca
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-2xl font-bold text-gray-900">{readCount}</p>
            <p className="text-xs font-medium text-gray-400">Sudah dibaca</p>
          </div>
        </div>
      )}

      {mutationError && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {getNotificationApiErrorMessage(
            mutationError,
            "Gagal memperbarui status baca notifikasi."
          )}
        </div>
      )}

      {isLoading ? (
        <NotificationSkeleton />
      ) : isError ? (
        <div className="rounded-2xl border border-red-100 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h2 className="mt-3 text-base font-bold text-gray-900">
            Gagal memuat notifikasi
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            {getNotificationApiErrorMessage(
              error,
              "Silakan coba muat ulang halaman."
            )}
          </p>
          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-700"
          >
            Coba lagi
          </button>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
            {activeFilter === "unread" ? (
              <CheckCheck className="h-6 w-6" />
            ) : activeFilter === "read" ? (
              <Bell className="h-6 w-6" />
            ) : (
              <Bell className="h-6 w-6" />
            )}
          </div>
          <h2 className="mt-3 text-base font-bold text-gray-900">
            {getEmptyTitle()}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-400">
            {getEmptyMessage()}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {unreadCount > 0 && activeFilter !== "read" && (
            <button
              type="button"
              onClick={() => markAllAsRead.mutate()}
              disabled={markAllAsRead.isPending}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60 sm:hidden"
            >
              <CheckCheck className="h-4 w-4" />
              {markAllAsRead.isPending
                ? "Menandai..."
                : "Tandai semua sudah dibaca"}
            </button>
          )}

          {filteredNotifications.map((notification, index) => (
            <NotificationCard
              key={notification.id ?? `${notification.type}-${index}`}
              notification={notification}
              isMarkingAsRead={
                markAsRead.isPending && markAsRead.variables === notification.id
              }
              onMarkAsRead={(id) => markAsRead.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

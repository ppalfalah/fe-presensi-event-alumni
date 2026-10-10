"use client";

import { useRouter } from "next/navigation";
import {
  useMyProfile,
  useAlumniEvents,
  useMyPresences,
  useMyRecommendations,
  useMyNotifications,
  useAlumniEngagementSummary,
} from "@/hooks/alumni/useAlumniHooks";
import type { AlumniNotification } from "@/hooks/alumni/useAlumniHooks";
import { Icon } from "@/app/components/alumni/Icon";
import EngagementProgressCard from "@/app/components/alumni/dashboard/EngagementProgressCard";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Event {
  id: number;
  event_title: string;
  event_datetime: string;
  location: string;
  category?: unknown;
  category_name?: string;
  status_event?: string;
}

interface Presence {
  id: number;
  event_id: number;
  scanned_at: string;
  event?: {
    event_title: string;
    event_datetime?: string;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function isToday(datetime: string) {
  // Extract just the date part to avoid UTC midnight interpretation
  const datePart = datetime.split("T")[0];
  const now = new Date();
  const nowDateStr = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return datePart === nowDateStr;
}

function formatDate(datetime?: string) {
  if (!datetime) return "-";

  return new Date(datetime).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(datetime?: string) {
  if (!datetime) return "";

  return (
    new Date(datetime).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    }) + " WIB"
  );
}

function formatShort(datetime: string) {
  const d = new Date(datetime);

  return `${d.getDate()} ${d.toLocaleString("id-ID", {
    month: "short",
  })} • ${d.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function getDayNum(datetime: string) {
  return new Date(datetime).getDate();
}

function getCategoryName(event: Pick<Event, "category" | "category_name">) {
  if (event.category && typeof event.category === "object") {
    const category = event.category as {
      category_name?: string;
      name?: string;
    };

    return category.category_name ?? category.name ?? event.category_name ?? "";
  }

  return event.category_name ?? "";
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function Skeleton({ className }: { className: string }) {
  return <div className={`bg-gray-200 rounded-xl animate-pulse ${className}`} />;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AlumniDashboard() {
  const router = useRouter();

  const { data: profile, isLoading: loadingProfile } = useMyProfile();
  const { data: events = [], isLoading: loadingEvents } = useAlumniEvents();
  const { data: presences = [], isLoading: loadingPresences } = useMyPresences();
  const { data: recommendations = [], isLoading: loadingRec } =
    useMyRecommendations();
  const { data: notifications = [] } = useMyNotifications();
  const {
    data: engagement,
    isError: engagementError,
    isLoading: loadingEngagement,
  } = useAlumniEngagementSummary();

  const firstName = profile?.first_name ?? "Alumni";

  const todayEvents = events.filter((event: Event) =>
    isToday(event.event_datetime)
  );

  const upcomingEvents = events
    .filter((event: Event) => {
      const eventDate = new Date(
        event.event_datetime.includes("T")
          ? event.event_datetime
          : event.event_datetime + "T00:00"
      );
      return eventDate > new Date() && !isToday(event.event_datetime);
    })
    .slice(0, 3);

  const recommendedEvents = recommendations.slice(0, 3);
  const recentPresences = presences.slice(0, 3);

  const unreadNotification = notifications.filter(
    (notification: AlumniNotification) => notification.is_read !== true
  )[0];

  return (
    <>
      {/* Greeting */}
      <div>
        {loadingProfile ? (
          <Skeleton className="h-6 w-48 mb-1" />
        ) : (
          <h1 className="text-xl font-bold text-gray-900">
            Assalamu&apos;alaikum, {firstName}
          </h1>
        )}

        <p className="text-sm text-gray-400 mt-0.5">
          Selamat datang di Sistem Presensi Alumni
        </p>
      </div>

      {/* Notification Banner */}
      {unreadNotification && (
        <div
          className="rounded-2xl p-4 flex items-start gap-3 cursor-pointer active:opacity-90 bg-[#0D5C3A]"
          onClick={() => router.push("/alumni/main/notifikasi")}
        >
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 text-white">
            <svg
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"
              />
            </svg>
          </div>

          <div className="min-w-0">
            <p className="text-white font-semibold text-sm leading-tight">
              {unreadNotification.title}
            </p>
            <p className="text-[#E8F5E9] text-xs mt-1 leading-relaxed line-clamp-2">
              {unreadNotification.message ?? unreadNotification.body}
            </p>
          </div>
        </div>
      )}

      <EngagementProgressCard
        engagement={engagement}
        isError={engagementError}
        isLoading={loadingEngagement}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-50">
          {loadingPresences ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">
              {presences.length}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-0.5">Event diikuti</p>
        </div>

        <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-50">
          {loadingEvents || loadingPresences ? (
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900">
              {Math.max(0, events.length - presences.length)}
            </p>
          )}

          <p className="text-xs text-gray-400 mt-0.5">Event tidak diikuti</p>
        </div>
      </div>

      {/* Rekomendasi Event */}
      {loadingRec ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-24 w-full rounded-2xl" />
        </div>
      ) : recommendedEvents.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900">
              Rekomendasi Untuk Anda
            </h2>
            <span className="text-[11px] bg-[#E8F5E9] text-[#0D5C3A] px-2.5 py-1 rounded-full font-semibold border border-emerald-100/50">
              Berdasarkan minat
            </span>
          </div>

          <div className="space-y-2">
            {recommendedEvents.map((event: Event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-4 shadow-sm border border-gray-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] bg-[#E8F5E9] text-[#0D5C3A] border border-[#0D5C3A]/10 px-2 py-0.5 rounded font-semibold">
                        Rekomendasi
                      </span>
                      {getCategoryName(event) && (
                        <span className="min-w-0 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded font-medium truncate">
                          {getCategoryName(event)}
                        </span>
                      )}
                    </div>

                    <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                      {event.event_title}
                    </p>

                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Icon
                          name="calendar"
                          className="w-3.5 h-3.5 flex-shrink-0 text-[#0D5C3A]"
                        />
                        <span className="truncate">
                          {formatDate(event.event_datetime)}
                          {formatTime(event.event_datetime)
                            ? ` • ${formatTime(event.event_datetime)}`
                            : ""}
                        </span>
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Icon
                          name="pin"
                          className="w-3.5 h-3.5 flex-shrink-0 text-[#0D5C3A]"
                        />
                        <span className="truncate">{event.location}</span>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push(`/alumni/main/events/${event.id}`)}
                    className="text-xs text-white px-3 py-1.5 rounded-lg font-medium flex-shrink-0 bg-[#0D5C3A] hover:bg-[#084028] transition"
                  >
                    Detail
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Event Hari Ini */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Event Hari Ini</h2>
        </div>

        {loadingEvents ? (
          <Skeleton className="h-20 w-full" />
        ) : todayEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center text-gray-400 text-sm border border-gray-50">
            Tidak ada event hari ini
          </div>
        ) : (
          <div className="space-y-2">
            {todayEvents.map((event: Event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm border border-gray-50"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#0D5C3A]"
                >
                  <span className="text-white font-bold text-lg">
                    {getDayNum(event.event_datetime)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {event.event_title}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Icon name="clock" className="w-3.5 h-3.5" />
                    <span>
                      {new Date(event.event_datetime).toLocaleTimeString(
                        "id-ID",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                    <span className="mx-1">·</span>
                    <Icon name="pin" className="w-3.5 h-3.5" />
                    <span className="truncate">{event.location}</span>
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/alumni/main/events/${event.id}`)}
                  className="text-xs border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg flex-shrink-0"
                >
                  Detail
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Event Mendatang */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Event Mendatang</h2>
        </div>

        {loadingEvents ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-14 w-full" />
            ))}
          </div>
        ) : upcomingEvents.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center text-gray-400 text-sm border border-gray-50">
            Tidak ada event mendatang
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingEvents.map((event: Event) => (
              <div
                key={event.id}
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm border border-gray-50"
              >
                <div className="min-w-0 mr-3">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {event.event_title}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatShort(event.event_datetime)}
                  </p>
                </div>

                <button
                  onClick={() => router.push(`/alumni/main/events/${event.id}`)}
                  className="text-xs text-white px-4 py-2 rounded-xl font-medium flex-shrink-0 bg-[#0D5C3A] hover:bg-[#084028] transition"
                >
                  Lihat
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Riwayat Kehadiran */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-900">Riwayat Kehadiran</h2>
          {presences.length > 0 && (
            <button
              onClick={() => router.push("/alumni/main/riwayat")}
              className="text-xs text-[#0D5C3A] font-semibold hover:underline"
            >
              Lihat Semua
            </button>
          )}
        </div>

        {loadingPresences ? (
          <div className="space-y-2">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-14 w-full" />
            ))}
          </div>
        ) : recentPresences.length === 0 ? (
          <div className="bg-white rounded-2xl p-4 text-center text-gray-400 text-sm border border-gray-50">
            Belum ada riwayat kehadiran
          </div>
        ) : (
          <div className="space-y-2">
            {recentPresences.map((presence: Presence) => (
              <div
                key={presence.id}
                className="bg-white rounded-2xl px-4 py-3.5 flex items-center justify-between shadow-sm border border-gray-50"
              >
                <div className="min-w-0 mr-3">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {presence.event?.event_title ??
                      `Event #${presence.event_id}`}
                  </p>

                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDate(presence.scanned_at)}
                  </p>
                </div>

                <span className="text-xs bg-[#E8F5E9] text-[#0D5C3A] border border-[#E8F5E9] px-3 py-1.5 rounded-xl font-medium flex-shrink-0">
                  Hadir
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

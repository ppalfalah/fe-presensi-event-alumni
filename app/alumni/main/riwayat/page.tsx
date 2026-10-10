"use client";

import { useRouter } from "next/navigation";
import SearchInput from "@/app/components/SearchInput";
import { useMyPresencesInfinite } from "@/hooks/alumni/useAlumniHooks";
import { usePresenceHistoryFilters } from "@/hooks/alumni/usePresenceHistoryFilters";
import type { PresenceHistoryItem } from "@/hooks/alumni/queries/presences";
import {
  Search,
  Calendar,
  MapPin,
  CheckCircle,
  ChevronRight,
  Clock,
  Award,
  ArrowLeft,
  AlertTriangle,
} from "lucide-react";

// Safe localized date/time formatting helpers
function formatDate(dateStr?: string) {
  if (!dateStr) return "Waktu tidak ditentukan";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function formatTime(timeStr?: string) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

function formatScannedAt(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const formattedDate = d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    const formattedTime = d.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${formattedDate} • ${formattedTime} WIB`;
  } catch {
    return dateStr || "";
  }
}

export default function AlumniPresenceHistoryPage() {
  const router = useRouter();

  // Use the new infinite query hook (10 items per page)
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useMyPresencesInfinite(10);

  // Flatten the loaded pages of history items
  const presences = data?.pages.flatMap((page) => page.history || []) || [];
  const totalPresences = data?.pages[0]?.total || 0;

  // Search filter
  const { filteredPresences, searchQuery, setSearchQuery } =
    usePresenceHistoryFilters(presences as PresenceHistoryItem[]);

  if (isLoading) {
    return (
      <div className="space-y-5 pb-6">
        {/* Header & Back Button */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/alumni/main/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Riwayat Kehadiran</h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Daftar kegiatan pondok pesantren yang telah Anda hadiri
            </p>
          </div>
        </div>

        {/* Skeleton Stat Card */}
        <div className="bg-gray-200 rounded-3xl p-5 h-28 animate-pulse shadow-sm border border-gray-100" />

        {/* Skeleton Search */}
        <div className="bg-gray-200 rounded-2xl h-10 w-full animate-pulse border border-gray-100" />

        {/* Skeleton list */}
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 animate-pulse"
            >
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-5 bg-gray-200 rounded-full w-14" />
              </div>
              <div className="h-5 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="space-y-5 pb-6">
        {/* Header & Back Button */}
        <div className="space-y-3">
          <button
            onClick={() => router.push("/alumni/main/dashboard")}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dasbor</span>
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Riwayat Kehadiran</h1>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 text-center text-gray-500 border border-red-100 shadow-sm space-y-4">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-800">Gagal memuat riwayat kehadiran</p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              Terjadi masalah saat mengambil data dari server. Silakan periksa koneksi Anda dan coba lagi.
            </p>
          </div>
          <button
            onClick={() => refetch()}
            className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
          >
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header & Back Button */}
      <div className="space-y-3">
        <button
          onClick={() => router.push("/alumni/main/dashboard")}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Dasbor</span>
        </button>

        <div>
          <h1 className="text-xl font-bold text-gray-900">Riwayat Kehadiran</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Daftar kegiatan pondok pesantren yang telah Anda hadiri
          </p>
        </div>
      </div>

      {/* Summary Stat Card */}
      {totalPresences > 0 && (
        <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-3xl p-5 text-white shadow-sm border border-teal-100 flex items-center justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <span className="text-[10px] uppercase tracking-wider font-bold text-teal-100">
              Pencapaian Kehadiran
            </span>
            <h2 className="text-2xl font-black">{totalPresences} Event</h2>
            <p className="text-[11px] text-teal-50 leading-relaxed">
              Anda aktif berpartisipasi dalam agenda silaturahmi pondok pesantren.
            </p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm flex-shrink-0">
            <Award className="w-6 h-6 text-white" />
          </div>
        </div>
      )}

      {/* Search Bar */}
      {presences.length > 0 && (
        <SearchInput
          leadingIcon={
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          }
          wrapperClassName="relative"
          placeholder="Cari berdasarkan nama event atau lokasi..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
        />
      )}

      {/* Main List Area */}
      {filteredPresences.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm space-y-3">
          <Clock className="w-10 h-10 text-gray-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-gray-700">
              {presences.length === 0
                ? "Belum Ada Riwayat Kehadiran"
                : "Tidak Menemukan Hasil"}
            </p>
            <p className="text-xs text-gray-400 max-w-xs mx-auto leading-relaxed">
              {presences.length === 0
                ? "Anda belum pernah tercatat hadir melalui pemindaian QR Code. Silakan ikuti event pesantren mendatang."
                : "Coba cari dengan kata kunci lain atau periksa kembali ejaan Anda."}
            </p>
          </div>
          {presences.length === 0 && (
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => router.push("/alumni/main/events")}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                Cari Event
              </button>
              <button
                onClick={() => router.push("/alumni/main/scan")}
                className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm"
              >
                Pindai QR Presensi
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPresences.map((p: PresenceHistoryItem) => {
            const eventId = p.event?.id || p.event_id;
            const eventTitle = p.event?.event_title || "Event tidak tersedia";
            const eventDate = p.event?.event_date
              ? formatDate(p.event.event_date)
              : p.event?.event_datetime
                ? formatDate(p.event.event_datetime.split("T")[0])
                : "Waktu tidak ditentukan";
            const eventTime = p.event?.start_time
              ? ` • ${formatTime(p.event.start_time)}${
                  p.event.end_time ? ` - ${formatTime(p.event.end_time)}` : ""
                } WIB`
              : "";

            return (
              <div
                key={p.id}
                onClick={() => {
                  if (p.event?.id) {
                    router.push(`/alumni/main/events/${eventId}`);
                  }
                }}
                className={`bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4 group ${
                  p.event?.id ? "cursor-pointer" : "cursor-default"
                }`}
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="space-y-1 min-w-0">
                    <h3 className={`font-bold text-gray-800 text-sm leading-snug transition-colors ${
                      p.event?.id ? "group-hover:text-teal-600" : ""
                    }`}>
                      {eventTitle}
                    </h3>

                    {/* Waktu Pelaksanaan Acara */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="truncate">
                        {eventDate}{eventTime}
                      </span>
                    </div>

                    {/* Lokasi */}
                    {p.event?.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{p.event.location}</span>
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-1 rounded-lg font-bold flex-shrink-0 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                    Hadir
                  </span>
                </div>

                {/* Footer Card: Waktu Scan Presensi */}
                <div className="border-t border-gray-50 pt-3 flex flex-col gap-2 text-[11px] text-gray-400 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-1 min-w-0">
                    <Clock className="w-3.5 h-3.5 text-teal-600 flex-shrink-0 mt-0.5" />
                    <span className="truncate">
                      Diverifikasi:{" "}
                      <span className="font-medium text-gray-600">
                        {formatScannedAt(p.scanned_at)}
                      </span>
                    </span>
                  </div>
                  {p.event?.id && (
                    <div className="flex items-center gap-0.5 text-teal-600 font-bold group-hover:translate-x-0.5 transition-transform self-end sm:self-auto">
                      <span>Detail Event</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Load More Button */}
          {hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="w-full sm:w-auto px-6 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-sm font-semibold rounded-2xl shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isFetchingNextPage ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Memuat...</span>
                  </>
                ) : (
                  <span>Muat Lebih Banyak</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


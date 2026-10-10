"use client";

import { useRouter } from "next/navigation";
import SearchInput from "@/app/components/SearchInput";
import { useAlumniEvents } from "@/hooks/alumni/useAlumniHooks";
import { AlumniEvent, useEventFilters } from "@/hooks/alumni/useEventFilters";
import { Search, Calendar, MapPin, Users, ChevronRight, Tag } from "lucide-react";
import { getImageUrl } from "@/lib/api";

function formatDate(dateStr?: string) {
  if (!dateStr) return "-";

  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(timeStr?: string) {
  if (!timeStr) return "";
  // format HH:MM:SS to HH:MM
  const parts = timeStr.split(":");
  if (parts.length >= 2) {
    return `${parts[0]}:${parts[1]}`;
  }
  return timeStr;
}

function getQuotaText(event: AlumniEvent) {
  if (event.quota === null || event.quota_status === "unlimited") {
    return "Kuota tidak terbatas";
  }

  return `Sisa kuota: ${event.remaining_quota ?? 0} dari ${event.quota}`;
}

export default function AlumniEventsPage() {
  const router = useRouter();
  const { data: events = [], isLoading } = useAlumniEvents();
  const {
    categories,
    filteredEvents,
    searchQuery,
    selectedCategory,
    setSearchQuery,
    setSelectedCategory,
  } = useEventFilters(events);

  return (
    <div className="space-y-5">
      {/* Header Halaman */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Daftar Event</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Ikuti berbagai kegiatan alumni pondok pesantren
          </p>
        </div>
      </div>

      {/* Pencarian dan Filter Kategori */}
      <div className="space-y-3">
        <SearchInput
          leadingIcon={
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
          }
          wrapperClassName="relative"
          placeholder="Cari event atau lokasi..."
          value={searchQuery}
          onValueChange={setSearchQuery}
          className="w-full bg-white pl-10 pr-4 py-2.5 rounded-2xl border border-gray-100 shadow-sm text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0D5C3A] focus:ring-1 focus:ring-[#0D5C3A] transition-colors"
        />

        {/* Kategori Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${selectedCategory === category
                  ? "bg-[#0D5C3A] text-white shadow-md shadow-[#E8F5E9]/40"
                  : "bg-white text-gray-500 border border-gray-100 hover:bg-[#E8F5E9]/50 hover:text-[#0D5C3A]"
                }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Daftar Event */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm space-y-3 animate-pulse">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-5 bg-gray-200 rounded-full w-16" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
              <div className="h-10 bg-gray-200 rounded-xl w-full" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm space-y-2">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium">Belum ada event aktif saat ini</p>
          <p className="text-xs text-gray-400">Silakan periksa kembali nanti untuk melihat event terbaru.</p>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 border border-gray-100 shadow-sm space-y-2">
          <Calendar className="w-10 h-10 text-gray-300 mx-auto" />
          <p className="text-sm font-medium">Tidak ada event yang ditemukan</p>
          <p className="text-xs text-gray-400">Silakan cari dengan kata kunci lain atau pilih kategori berbeda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event: AlumniEvent) => (
            <div
              key={event.id}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="flex flex-col h-full">
                {event.poster_url && (
                  <div className="w-full h-40 mb-3 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={getImageUrl(event.poster_url)} alt={event.event_title} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} loading="lazy" />
                  </div>
                )}
                {/* Atas: Kategori & Status */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="min-w-0 text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    <span className="truncate">{event.category?.category_name || "Kategori"}</span>
                  </span>

                  {event.is_registered ? (
                    <span className="text-[10px] bg-[#E8F5E9] text-[#0D5C3A] border border-[#0D5C3A]/10 px-2 py-0.5 rounded font-semibold">
                      Terdaftar
                    </span>
                  ) : (
                    <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded font-semibold">
                      Belum Terdaftar
                    </span>
                  )}
                </div>

                {/* Judul Event */}
                <h3 className="font-bold text-gray-800 text-base leading-snug">
                  {event.event_title}
                </h3>

                {/* Deskripsi Singkat */}
                {(event.description || event.event_description) && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                    {event.description || event.event_description}
                  </p>
                )}

                {/* Informasi Meta */}
                <div className="mt-3.5 space-y-1.5 border-t border-gray-50 pt-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5 text-[#0D5C3A] flex-shrink-0" />
                    <span className="min-w-0">
                      {formatDate(event.event_date)} • {formatTime(event.start_time)} - {formatTime(event.end_time)} WIB
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <MapPin className="w-3.5 h-3.5 text-[#0D5C3A] flex-shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-[#0D5C3A] flex-shrink-0" />
                    <span>{getQuotaText(event)}</span>
                  </div>
                  {event.is_quota_full && (
                    <p className="text-xs text-red-500 pl-5">
                      {event.quota_message || "Kuota penuh, segera hubungi penyelenggara"}
                    </p>
                  )}
                </div>
              </div>

              {/* Tombol Detail */}
              <button
                onClick={() => router.push(`/alumni/main/events/${event.id}`)}
                className="w-full mt-4 rounded-xl bg-[#0D5C3A] py-2.5 text-xs font-semibold text-white shadow-md shadow-[#E8F5E9]/40 transition-colors hover:bg-[#084028] active:scale-[0.98] flex items-center justify-center gap-1"
              >
                <span>Lihat Detail & Pendaftaran</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

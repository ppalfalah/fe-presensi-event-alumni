"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  CalendarDays,
  ClipboardList,
  Download,
  FileText,
  Inbox,
  MapPin,
  Search,
  TrendingUp,
  Users,
  X,
} from "lucide-react";

import AdminLayout from "@/app/components/AdminLayout";
import FeedbackToast from "@/app/components/FeedbackToast";
import { FormSelect } from "@/app/components/FormControl";
import type {
  AttendanceByAngkatan,
  AttendanceByDomicile,
} from "@/hooks/admin/useAttendances";
import { useReportsPage } from "./_hooks/useReportsPage";

import {
  formatDate,
  formatDateTimeIndonesia,
  formatDomicile,
  type ReportEvent,
} from "./_utils/reportFormatters";

type AttendanceSortColumn = "angkatan" | "domicile";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function capitalizeStatus(value?: string | null) {
  if (!value) return "-";

  return value.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatShortEventDate(dateStr?: string | null) {
  if (!dateStr) return "-";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\./g, "");
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <tr key={i} className="border-b border-[#0D5C3A]/10 animate-pulse">
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} className="p-3">
              <div className="h-4 bg-[#E8F5E9] rounded w-3/4 mx-auto" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500">
        Halaman {currentPage} dari {totalPages}
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Sebelumnya
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            className={`h-8 min-w-8 rounded-lg px-2 text-xs font-semibold transition ${
              page === currentPage
                ? "bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20"
                : "border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-gray-200 px-3 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Berikutnya
        </button>
      </div>
    </div>
  );
}

function AngkatanBreakdownChart({
  items,
  expanded,
  onToggle,
}: {
  items: AttendanceByAngkatan[];
  expanded: boolean;
  onToggle: () => void;
}) {

  if (items.length === 0) {
    return (
      <div className="flex h-[174px] items-center justify-center text-xs text-gray-400">
        Belum ada data Tahun Kelulusan
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => b.total - a.total);
  const visibleItems = expanded ? sortedItems : sortedItems.slice(0, 5);
  const maxTotal = Math.max(...visibleItems.map((item) => item.total), 1);

  return (
    <div className="mt-3 flex h-[174px] flex-col">
      <div
        className={`min-h-0 flex-1 space-y-2 pr-1 ${
          expanded ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {visibleItems.map((item, index) => {
          const barWidth =
            item.total > 0
              ? Math.max(4, Math.round((item.total / maxTotal) * 100))
              : 0;

          return (
            <div
              key={`${item.angkatan}-${index}`}
              className="flex items-center gap-2 text-[11px]"
              title={`Tahun Kelulusan ${item.angkatan}: ${item.total} kehadiran`}
              aria-label={`Tahun Kelulusan ${item.angkatan}, ${item.total} kehadiran`}
            >
              <span className="w-28 shrink-0 truncate text-gray-600 sm:w-36 font-medium">
                Tahun {item.angkatan}
              </span>
              <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#0D5C3A] to-[#3EBDAF]"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right font-bold text-[#0D5C3A]">
                {item.total}
              </span>
            </div>
          );
        })}
      </div>

      {items.length > 5 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 self-start text-[11px] font-semibold text-[#0D5C3A] transition hover:text-[#0A4D30]"
        >
          {expanded ? "Tampilkan ringkas" : `Lihat semua (${items.length})`}
        </button>
      )}
    </div>
  );
}

function DomicileBreakdownChart({
  items,
  expanded,
  onToggle,
}: {
  items: AttendanceByDomicile[];
  expanded: boolean;
  onToggle: () => void;
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-[174px] items-center justify-center text-xs text-gray-400">
        Belum ada data domisili
      </div>
    );
  }

  const sortedItems = [...items].sort((a, b) => b.total - a.total);
  const visibleItems = expanded ? sortedItems : sortedItems.slice(0, 5);
  const maxTotal = Math.max(...visibleItems.map((item) => item.total), 1);

  return (
    <div className="mt-3 flex h-[174px] flex-col">
      <div
        className={`min-h-0 flex-1 space-y-2 pr-1 ${
          expanded ? "overflow-y-auto" : "overflow-hidden"
        }`}
      >
        {visibleItems.map((item, index) => {
          const label = formatDomicile(item.city_name, item.province_name);
          const barWidth =
            item.total > 0
              ? Math.max(4, Math.round((item.total / maxTotal) * 100))
              : 0;

          return (
            <div
              key={`${item.city_code ?? "unknown"}-${index}`}
              className="flex items-center gap-2 text-[11px]"
              title={`${label}: ${item.total} kehadiran`}
              aria-label={`${label}, ${item.total} kehadiran`}
            >
              <span className="w-28 shrink-0 truncate text-gray-600 sm:w-36 font-medium">
                {label}
              </span>
              <div className="h-3 min-w-0 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#2D7EA0] to-[#7AB2B2]"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right font-bold text-[#236175]">
                {item.total}
              </span>
            </div>
          );
        })}
      </div>

      {items.length > 5 && (
        <button
          type="button"
          onClick={onToggle}
          className="mt-2 self-start text-[11px] font-semibold text-[#2D7EA0] transition hover:text-[#236175]"
        >
          {expanded ? "Tampilkan ringkas" : `Lihat semua (${items.length})`}
        </button>
      )}
    </div>
  );
}

// ─── Icon 3D ──────────────────────────────────────────────────────────────────
function Icon3D({
  children,
  variant = "teal",
  size = "md",
}: {
  children: ReactNode;
  variant?: "teal" | "blue" | "green" | "gold" | "red" | "amber" | "gray";
  size?: "sm" | "md" | "lg";
}) {
  const variants = {
    teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
    blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
    green: "from-[#0D5C3A] via-[#0F7047] to-[#0D5C3A] text-white",
    gold: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
    red: "from-red-500 via-red-600 to-red-700 text-white",
    amber: "from-amber-500 via-amber-600 to-amber-700 text-white",
    gray: "from-gray-400 via-gray-500 to-gray-600 text-white",
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const {
    attendanceErrorMessage,
    attendanceByAngkatan,
    attendanceByDomicile,
    attendanceCurrentPage,
    attendanceLastPage,
    attendanceParams,
    avgRate,
    attendances,
    events,
    feedback,
    getHadir,
    getRate,
    handleDownload,
    isAttendanceError,
    isExporting,
    isInitialAttendanceLoading,
    exportingFormat,
    loadingAttendances,
    loadingEvents,
    refetchAttendances,
    selectedEventMetadata,
    selectedEventId,
    setAttendanceParams,
    setSelectedEventId,
    selesai,
    totalAttendances,
    totalHadir,
  } = useReportsPage();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [eventPage, setEventPage] = useState(1);
  const [showAllDomiciles, setShowAllDomiciles] = useState(false);
  const [showAllCohorts, setShowAllCohorts] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const EVENT_PER_PAGE = 5;

  const eventTotalPages = Math.max(
    1,
    Math.ceil(events.length / EVENT_PER_PAGE),
  );

  const safeEventPage = Math.min(eventPage, eventTotalPages);

  const paginatedEvents = useMemo(() => {
    const start = (safeEventPage - 1) * EVENT_PER_PAGE;
    return events.slice(start, start + EVENT_PER_PAGE);
  }, [events, safeEventPage]);

  const openEventDetail = (eventId: number) => {
    setAttendanceSearch("");
    setAttendanceParams((previous) => ({
      ...previous,
      search: undefined,
      page: 1,
    }));
    setSelectedEventId(eventId);
    setShowAllDomiciles(false);
    setShowAllCohorts(false);
    setIsEventModalOpen(true);
  };

  const handleAttendanceSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const search = attendanceSearch.trim();
    setAttendanceParams((previous) => ({
      ...previous,
      search: search || undefined,
      page: 1,
    }));
  };

  const handleClearAttendanceSearch = () => {
    setAttendanceSearch("");
    setAttendanceParams((previous) => ({
      ...previous,
      search: undefined,
      page: 1,
    }));
  };

  const handleAttendanceSort = (column: AttendanceSortColumn) => {
    setAttendanceParams((previous) => ({
      ...previous,
      sort_by: column,
      sort_dir:
        previous.sort_by === column && previous.sort_dir === "asc"
          ? "desc"
          : "asc",
      page: 1,
    }));
  };

  const getAttendanceSortIndicator = (column: AttendanceSortColumn) => {
    if (attendanceParams.sort_by !== column) return "↕";
    return attendanceParams.sort_dir === "desc" ? "↓" : "↑";
  };

  const handleAttendancePageChange = (page: number) => {
    setAttendanceParams((previous) => ({ ...previous, page }));
  };

  const closeEventDetail = () => {
    setIsEventModalOpen(false);
  };

  return (
    <AdminLayout title="Riwayat Kehadiran">

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {[
          {
            label: "Total",
            value: loadingEvents ? "..." : selesai,
            sub: "Event Terlaksana",
            icon: (
              <Icon3D variant="teal" size="md">
                <CalendarDays size={20} strokeWidth={2.5} />
              </Icon3D>
            ),
          },
          {
            label: "Peserta",
            value: loadingEvents ? "..." : totalHadir,
            sub: "Total Kehadiran",
            icon: (
              <Icon3D variant="gold" size="md">
                <Users size={20} strokeWidth={2.5} />
              </Icon3D>
            ),
          },
          {
            label: "Rate",
            value:
              loadingEvents
                ? "..."
                : `${avgRate}%`,
            sub: "zata-rata Kehadiran",
            icon: (
              <Icon3D variant="green" size="md">
                <TrendingUp size={20} strokeWidth={2.5} />
              </Icon3D>
            ),
          },
        ].map((s, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-[#0D5C3A]/10 shadow-sm shadow-[#0D5C3A]/5 p-4"
          >
            <p className="text-[#0D5C3A]/60 text-xs">{s.label}</p>
            <div className="flex items-center gap-3 mt-1">
              {s.icon}
              <h2 className="text-3xl font-bold text-[#0D5C3A]">{s.value}</h2>
            </div>
            <p className="text-[#0D5C3A]/50 text-xs mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Pilih Event ── */}
      <section className="min-w-0 bg-white rounded-2xl p-5 shadow-sm shadow-[#0D5C3A]/5 border border-[#0D5C3A]/10 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <Icon3D variant="teal" size="md">
            <CalendarDays size={20} strokeWidth={2.5} />
          </Icon3D>
          <div>
            <h2 className="text-base font-bold text-[#0D5C3A] mb-1">
              Pilih Event untuk Detail Kehadiran
            </h2>
            <p className="text-[#0D5C3A]/60 text-xs">
              Pilih event atau klik baris event di bawah untuk melihat detail
              kehadiran.
            </p>
          </div>
        </div>

        <div className="relative">
          <FormSelect
            value={selectedEventId ?? ""}
            onChange={(e) => {
              const eventId = Number(e.target.value) || null;
              if (eventId) {
                openEventDetail(eventId);
              } else {
                setAttendanceSearch("");
                setAttendanceParams((previous) => ({
                  ...previous,
                  search: undefined,
                  page: 1,
                }));
                setSelectedEventId(null);
              }
            }}
            className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm text-gray-700 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] focus:border-transparent cursor-pointer"
          >
            <option value="">Pilih event...</option>

            {events.map((event: ReportEvent) => (
              <option key={event.id} value={event.id}>
                {formatShortEventDate(event.event_date ?? event.event_datetime)}{" "}
                - {event.event_title}
              </option>
            ))}
          </FormSelect>

          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            ▾
          </span>
        </div>
      </section>

      {/* ── Semua Event Table ── */}
      <section className="bg-white rounded-2xl p-5 shadow-md shadow-[#0D5C3A]/5 border border-[#0D5C3A]/10">
        <div className="flex items-center gap-3 mb-4">
          <Icon3D variant="teal" size="md">
            <ClipboardList size={20} strokeWidth={2.5} />
          </Icon3D>

          <div>
            <h2 className="text-base font-bold text-[#0D5C3A] mb-1">
              Semua Event
            </h2>
            <p className="text-[#0D5C3A]/60 text-xs">
              Klik salah satu event untuk melihat detail kehadiran.
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[#0D5C3A]/10">
          <div className="w-full max-w-full overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-xs">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[25%]" />
                <col className="w-[15%]" />
              </colgroup>

              <thead className="bg-gradient-to-r from-[#E8F5E9] to-white">
                <tr>
                  <th className="p-3 text-center font-semibold text-[#0D5C3A] rounded-l-xl">
                    Event
                  </th>
                  <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                    Tanggal
                  </th>
                  <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                    Hadir
                  </th>
                  <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                    Tingkat Kehadiran
                  </th>
                  <th className="p-3 text-center font-semibold text-[#0D5C3A] rounded-r-xl">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {loadingEvents ? (
                  <TableSkeleton cols={5} />
                ) : events.length === 0 ? (

                  <tr>
                    <td
                      colSpan={5}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      <Icon3D variant="gray" size="lg">
                        <Inbox size={26} strokeWidth={2.5} />
                      </Icon3D>
                      <p className="mt-3">Belum ada data event</p>
                    </td>
                  </tr>

                ) : (

                  paginatedEvents.map((e: ReportEvent) => {
                    const hadir = getHadir(e.id);
                    const rate = getRate(e.id, e.quota);

                    return (
                      <tr
                        key={e.id}
                        onClick={() => openEventDetail(e.id)}
                        className="cursor-pointer border-b border-[#0D5C3A]/5 transition-colors hover:bg-[#E8F5E9]/35"
                      >
                        <td className="p-3 font-medium text-gray-800">
                          <div className="flex min-w-0 items-center gap-3">
                            <Icon3D variant="teal" size="sm">
                              <FileText size={15} strokeWidth={2.5} />
                            </Icon3D>
                            <span
                              className="min-w-0 truncate"
                              title={e.event_title}
                            >
                              {e.event_title}
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-center text-gray-500 whitespace-nowrap">
                          {formatShortEventDate(
                            e.event_date ?? e.event_datetime,
                          )}
                        </td>

                        <td className="p-3 text-center font-bold text-[#2D7EA0]">
                          {hadir}
                        </td>

                        <td className="p-3">
                          <div className="flex items-center justify-center gap-3">
                            <div className="h-2 w-28 rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-[#3EBDAF] transition-all"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {rate}%
                            </span>
                          </div>
                        </td>

                        <td className="p-3 text-center">
                          <span
                            className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-medium ${
                              String(e.status_event).toLowerCase() === "selesai"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                                : String(e.status_event).toLowerCase() ===
                                    "mendatang"
                                  ? "border-amber-200 bg-amber-50 text-amber-600"
                                  : "border-gray-200 bg-gray-50 text-gray-600"
                            }`}

                          >
                            {capitalizeStatus(e.status_event)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {!loadingEvents && events.length > 0 && (
            <Pagination
              currentPage={safeEventPage}
              totalPages={eventTotalPages}
              onPageChange={setEventPage}
            />
          )}
        </div>
      </section>

      <footer className="mt-6 text-center text-[#0D5C3A]/40 text-xs pb-4">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </footer>

      {/* ── Event Detail Modal ── */}
      {isEventModalOpen && selectedEventId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeEventDetail}
        >
          <div
            className="w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <Icon3D variant="teal" size="md">
                    <CalendarDays size={20} strokeWidth={2.5} />
                  </Icon3D>

                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-gray-900">
                      {selectedEventMetadata?.event_title ??
                        "Detail Kehadiran Event"}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      Detail kehadiran event
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[#2D7EA0]" />
                    {formatDate(selectedEventMetadata?.event_date)}
                  </span>

                  {selectedEventMetadata?.location && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-[#2D7EA0]" />
                      {selectedEventMetadata.location}
                    </span>
                  )}

                  <span className="font-semibold text-[#2D7EA0]">
                    Total kehadiran:{" "}
                    {isInitialAttendanceLoading
                      ? "Memuat..."
                      : isAttendanceError
                        ? "Gagal dimuat"
                        : totalAttendances}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {(["PDF", "Excel"] as const).map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => void handleDownload(format)}
                    disabled={isExporting}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] px-3 py-2 text-xs font-semibold text-white transition-all shadow-md shadow-[#0D5C3A]/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download size={13} strokeWidth={2.5} />
                    {exportingFormat === format ? "Menyiapkan..." : format}
                  </button>

                ))}

                <button
                  type="button"
                  onClick={closeEventDetail}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:bg-gray-50 hover:text-gray-700"
                  aria-label="Tutup popup"
                >
                  <X size={17} />
                </button>
              </div>
            </div>

            {/* Modal breakdown and table */}
            <div className="max-h-[70vh] overflow-y-auto p-5">
              {isInitialAttendanceLoading ? (
                <div className="space-y-4" aria-label="Memuat data kehadiran">
                  <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className="h-[224px] animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                      />
                    ))}
                  </div>
                  <div className="h-40 animate-pulse rounded-xl border border-gray-100 bg-gray-50" />
                </div>

              ) : isAttendanceError ? (

                <div className="flex min-h-64 flex-col items-center justify-center rounded-xl border border-red-100 bg-red-50/60 px-5 py-10 text-center">
                  <p className="text-sm font-bold text-red-700">
                    Data kehadiran gagal dimuat.
                  </p>

                  <p className="mt-1 max-w-lg text-xs text-red-600">
                    {attendanceErrorMessage}
                  </p>
                  <button
                    type="button"
                    onClick={() => void refetchAttendances()}
                    disabled={loadingAttendances}
                    className="mt-4 rounded-xl bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loadingAttendances ? "Mencoba..." : "Coba Lagi"}
                  </button>
                </div>
              ) : (
                <>

                  <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                    <section className="h-[252px] overflow-hidden rounded-xl border border-[#0D5C3A]/10 bg-[#0D5C3A]/[0.03] p-4">
                      <h3 className="text-sm font-bold text-[#0D5C3A]">
                        Kehadiran berdasarkan Tahun Kelulusan
                      </h3>
                      <AngkatanBreakdownChart
                        items={attendanceByAngkatan}
                        expanded={showAllCohorts}
                        onToggle={() =>
                          setShowAllCohorts((previous) => !previous)
                        }
                      />
                    </section>

                    <section className="h-[252px] overflow-hidden rounded-xl border border-[#2D7EA0]/10 bg-[#2D7EA0]/[0.03] p-4">
                      <h3 className="text-sm font-bold text-[#236175]">
                        Kehadiran berdasarkan Domisili
                      </h3>
                      <DomicileBreakdownChart
                        items={attendanceByDomicile}
                        expanded={showAllDomiciles}
                        onToggle={() =>
                          setShowAllDomiciles((previous) => !previous)
                        }
                      />
                    </section>
                  </div>

                  {/* Search Attendance */}
                  <form
                    onSubmit={handleAttendanceSearch}
                    className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <div className="relative flex-1">
                      <Search
                        size={16}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />

                      <input
                        type="text"
                        value={attendanceSearch}
                        onChange={(e) => setAttendanceSearch(e.target.value)}
                        placeholder="Cari nama, email, atau nomor HP..."
                        className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-[#2D7EA0] focus:ring-2 focus:ring-[#2D7EA0]/20"
                      />

                      {attendanceSearch && (
                        <button
                          type="button"
                          onClick={handleClearAttendanceSearch}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
                          aria-label="Hapus pencarian"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>

                    <button
                      type="submit"
                      disabled={loadingAttendances}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4D30] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <Search size={15} />
                      Cari
                    </button>
                  </form>

                  <div className="overflow-hidden rounded-xl border border-[#0D5C3A]/10">
                    <div className="w-full overflow-x-auto">
                      <table className="w-full min-w-[1180px] text-xs">
                        <thead className="bg-gradient-to-r from-[#E8F5E9] to-white border-b border-[#0D5C3A]/10">
                          <tr>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A] rounded-l-xl">
                          Nama
                        </th>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                          Email
                        </th>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                          No HP
                        </th>

                        <th className="p-0 text-center font-semibold text-[#0D5C3A]">
                          <button
                            type="button"
                            onClick={() => handleAttendanceSort("angkatan")}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1 px-3 py-3 transition hover:bg-[#0D5C3A]/5"
                            title="Urutkan berdasarkan Tahun Kelulusan"
                          >
                            Tahun Kelulusan
                            <span className="text-[11px] text-[#2D7EA0]">
                              {getAttendanceSortIndicator("angkatan")}
                            </span>
                          </button>
                        </th>

                        <th className="p-0 text-center font-semibold text-[#0D5C3A]">
                          <button
                            type="button"
                            onClick={() => handleAttendanceSort("domicile")}
                            className="inline-flex w-full cursor-pointer items-center justify-center gap-1 px-3 py-3 transition hover:bg-[#0D5C3A]/5"
                            title="Urutkan berdasarkan domisili"
                          >
                            Domisili
                            <span className="text-[11px] text-[#2D7EA0]">
                              {getAttendanceSortIndicator("domicile")}
                            </span>
                          </button>
                        </th>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                          Jam Daftar
                        </th>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A]">
                          Waktu Hadir / Scan QR
                        </th>
                        <th className="p-3 text-center font-semibold text-[#0D5C3A] rounded-r-xl">
                          Status Hadir
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {loadingAttendances ? (
                        <TableSkeleton cols={8} />
                      ) : attendances.length === 0 ? (
                        <tr>
                          <td
                            colSpan={8}
                            className="py-10 text-center text-sm text-gray-400"
                          >
                            {attendanceParams.search
                              ? "Tidak ada data kehadiran yang cocok dengan pencarian."
                              : "Belum ada data kehadiran untuk event ini."}
                          </td>
                        </tr>
                      ) : (
                        attendances.map((attendance, i: number) => {
                          const nested = attendance.attendance;
                          const scannedAt =
                            nested?.scanned_at || attendance.scanned_at;
                          const status =
                            nested?.status || attendance.status || "hadir";
                          const normalizedStatus = String(status)
                            .toLowerCase()
                            .trim();
                          const statusClass =
                            normalizedStatus === "hadir"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-600"
                              : normalizedStatus === "registered"
                                ? "border-blue-200 bg-blue-50 text-blue-600"
                                : normalizedStatus === "tidak hadir"
                                  ? "border-red-200 bg-red-50 text-red-600"
                                  : "border-gray-200 bg-gray-50 text-gray-600";
                          return (
                            <tr
                              key={attendance.id ?? i}
                              className="border-b border-gray-100 transition-colors odd:bg-white even:bg-blue-50 hover:bg-blue-100"
                            >
                              <td className="p-3 font-medium text-gray-800">
                                {attendance.user?.name ??
                                  `Pengguna #${attendance.user_id}`}
                              </td>

                              <td className="p-3 text-center text-gray-500">
                                {attendance.user?.email ?? "-"}
                              </td>

                              <td className="p-3 text-center text-gray-500">
                                {attendance.user?.phone ?? "-"}
                              </td>

                              <td className="p-3 text-center text-gray-500">
                                {attendance.user?.angkatan ??
                                  attendance.user?.graduation_year ??
                                  "-"}
                              </td>

                              <td className="p-3 text-center text-gray-500">
                                {formatDomicile(
                                  attendance.user?.domicile?.city?.name,
                                  attendance.user?.domicile?.province?.name,
                                  "-",
                                )}
                              </td>

                              <td className="p-3 text-center text-gray-500 whitespace-nowrap">
                                {formatDateTimeIndonesia(nested?.registered_at)}
                              </td>

                              <td className="p-3 text-center text-gray-500 whitespace-nowrap">
                                {formatDateTimeIndonesia(scannedAt)}
                              </td>

                              <td className="p-3 text-center">
                                <span
                                  className={`inline-block rounded-lg border px-2.5 py-1 text-xs font-medium ${statusClass}`}
                                >
                                  {capitalizeStatus(String(status))}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {!loadingAttendances && attendances.length > 0 && (
                  <Pagination
                    currentPage={attendanceCurrentPage}
                    totalPages={attendanceLastPage}
                    onPageChange={handleAttendancePageChange}
                  />
                )}

                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {feedback && (
        <FeedbackToast type={feedback.type} message={feedback.message} />
      )}
    </AdminLayout>
  );
}
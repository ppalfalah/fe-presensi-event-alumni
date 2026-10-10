"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  AlertCircle,
  BarChart3,
  GraduationCap,
  Inbox,
  Search,
  Target,
  Users,
} from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import EngagementSegmentBadge from "@/app/components/EngagementSegmentBadge";
import { FormSelect } from "@/app/components/FormControl";
import SearchInput from "@/app/components/SearchInput";
import { useDebounce } from "@/hooks/useDebounce";
import {
  type EngagementMappingItem,
  useEngagementMapping,
} from "@/hooks/admin/useEngagementMapping";
import { formatDomicileName } from "@/lib/formatters";
import {
  ENGAGEMENT_SEGMENTS,
  clampEngagementPercentage,
  getEngagementSegmentConfig,
} from "@/lib/engagement";
import { getApiErrorMessage } from "@/lib/api";

const PER_PAGE_OPTIONS = [10, 25, 50];

function Icon3D({
  children,
  variant = "teal",
}: {
  children: ReactNode;
  variant?: "teal" | "blue" | "green" | "gold" | "amber" | "gray" | "red";
}) {
  const variants = {
    teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
    blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
    green: "from-[#0D5C3A] via-[#0F7047] to-[#0D5C3A] text-white",
    gold: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
    amber: "from-amber-500 via-amber-600 to-amber-700 text-white",
    gray: "from-gray-400 via-gray-500 to-gray-600 text-white",
    red: "from-red-500 via-red-600 to-red-700 text-white",
  };

  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/40 bg-gradient-to-br shadow-lg shadow-[#0D5C3A]/20 ring-1 ring-[#D4AF37]/20 ${variants[variant]}`}
    >
      {children}
    </span>
  );
}

function TableSkeleton() {
  return (
    <>
      {[1, 2, 3, 4, 5].map((item) => (
        <tr key={item} className="animate-pulse border-b border-[#0D5C3A]/10">
          {Array.from({ length: 7 }).map((_, index) => (
            <td key={index} className="p-3">
              <div className="mx-auto h-4 w-3/4 rounded bg-[#E8F5E9]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function getUserName(item: EngagementMappingItem) {
  const user = item.user;
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return fullName || user.name || `Alumni #${user.id}`;
}

function getDomicileText(item: EngagementMappingItem) {
  const city = formatDomicileName(item.user.domicile?.city?.name);
  const province = item.user.domicile?.province?.name;

  return [city, province].filter(Boolean).join(", ") || "-";
}

function getPaginationRange(currentPage: number, lastPage: number) {
  const pages = new Set([
    1,
    lastPage,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= lastPage)
    .sort((a, b) => a - b);
}

export default function EngagementMappingPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [segment, setSegment] = useState("");
  const debouncedSearch = useDebounce(search, 400);
  const debouncedGraduationYear = useDebounce(graduationYear, 400);

  const { data, error, isError, isFetching, isLoading } = useEngagementMapping({
    page,
    perPage,
    search: debouncedSearch.trim(),
    graduationYear: debouncedGraduationYear.trim(),
    segment,
  });

  const items = data?.items ?? [];
  const summary = data?.summary;
  const total = data?.total ?? 0;
  const currentPage = data?.current_page ?? page;
  const lastPage = Math.max(1, data?.last_page ?? 1);
  const paginationRange = useMemo(
    () => getPaginationRange(currentPage, lastPage),
    [currentPage, lastPage],
  );
  const eligibleEvents = summary?.calculation?.eligible_events ?? 0;
  const segmentCounts = summary?.segment_counts_current_page ?? {};
  const pageStart = total === 0 ? 0 : (currentPage - 1) * perPage + 1;
  const pageEnd = Math.min(total, currentPage * perPage);

  return (
    <AdminLayout title="Statistik Kehadiran Alumni">
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-[#0D5C3A]/10 bg-white p-4 shadow-sm shadow-[#0D5C3A]/5">
          <p className="text-xs text-[#0D5C3A]/60">Total Alumni</p>
          <div className="mt-1 flex items-center gap-3">
            <Icon3D variant="teal">
              <Users size={20} strokeWidth={2.5} />
            </Icon3D>
            <p className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : total}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#0D5C3A]/50">Sesuai filter aktif</p>
        </div>

        <div className="rounded-2xl border border-[#0D5C3A]/10 bg-white p-4 shadow-sm shadow-[#0D5C3A]/5">
          <p className="text-xs text-[#0D5C3A]/60">Event Eligible</p>
          <div className="mt-1 flex items-center gap-3">
            <Icon3D variant="gold">
              <Target size={20} strokeWidth={2.5} />
            </Icon3D>
            <p className="text-3xl font-bold text-[#0D5C3A]">
              {isLoading ? "..." : eligibleEvents}
            </p>
          </div>
          <p className="mt-1 text-xs text-[#0D5C3A]/50">
            Event selesai yang masuk perhitungan
          </p>
        </div>

        <div className="rounded-2xl border border-[#0D5C3A]/10 bg-white p-4 shadow-sm shadow-[#0D5C3A]/5 sm:col-span-2 lg:col-span-1">
          <p className="text-xs text-[#0D5C3A]/60">Segment Halaman Ini</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {ENGAGEMENT_SEGMENTS.map((segmentName) => {
              const config = getEngagementSegmentConfig(segmentName);
              return (
                <span
                  key={segmentName}
                  className="rounded-lg border border-[#0D5C3A]/10 bg-[#E8F5E9] px-2 py-1 text-[11px] font-semibold text-[#0D5C3A]/70"
                >
                  {config.arabicLabel} ({segmentName}): {segmentCounts[segmentName] ?? 0}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl bg-white shadow-sm shadow-[#0D5C3A]/5 border border-[#0D5C3A]/10">
        <div className="flex flex-col gap-4 bg-[#0D5C3A]/10 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <Icon3D variant="green">
              <BarChart3 size={20} strokeWidth={2.5} />
            </Icon3D>
            <div>
              <h1 className="text-xl font-bold text-[#0D5C3A]">
                Mapping Engagement Alumni
              </h1>
              <p className="mt-1 text-xs text-[#0D5C3A]/60">
                Segment ditentukan berdasarkan persentase keharien alumni di
                tiap event.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px_220px_120px]">
            <SearchInput
              leadingIcon={<Search size={16} className="text-gray-400" />}
              wrapperClassName="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 focus-within:border-[#3EBDAF]"
              placeholder="Cari nama, email, atau tahun kelulusan..."
              value={search}
              onValueChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm outline-none"
            />

            <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5">
              <GraduationCap size={16} className="shrink-0 text-gray-400" />
              <input
                value={graduationYear}
                onChange={(event) => {
                  setGraduationYear(event.target.value);
                  setPage(1);
                }}
                placeholder="Tahun Kelulusan"
                inputMode="numeric"
                className="min-w-0 flex-1 bg-transparent text-sm text-gray-800 outline-none placeholder:text-gray-400"
              />
            </div>

            <FormSelect
              value={segment}
              onChange={(event) => {
                setSegment(event.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3EBDAF]"
            >
              <option value="">Semua Segment</option>
              {ENGAGEMENT_SEGMENTS.map((segmentName) => {
                const config = getEngagementSegmentConfig(segmentName);
                return (
                  <option key={segmentName} value={segmentName}>
                    {config.arabicLabel} ({segmentName})
                  </option>
                );
              })}
            </FormSelect>

            <FormSelect
              value={perPage}
              onChange={(event) => {
                setPerPage(Number(event.target.value));
                setPage(1);
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#3EBDAF]"
            >
              {PER_PAGE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option} / halaman
                </option>
              ))}
            </FormSelect>
          </div>

          {isError && (
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p>{getApiErrorMessage(error)}</p>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-[#0D5C3A]/10">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[1040px] text-xs">
                <thead className="bg-gradient-to-r from-[#E8F5E9] to-white border-b border-[#0D5C3A]/10">
                  <tr>
                    <th className="p-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Nama Alumni
                    </th>
                    <th className="p-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Email
                    </th>
                    <th className="p-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Tahun Kelulusan
                    </th>
                    <th className="p-3 text-left text-[11px] font-semibold text-[#0D5C3A]">
                      Domisili
                    </th>
                    <th className="p-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Kehadiran
                    </th>
                    <th className="p-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Persentase
                    </th>
                    <th className="p-3 text-center text-[11px] font-semibold text-[#0D5C3A]">
                      Segment
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center">
                        <Icon3D variant="gray">
                          <Inbox size={20} strokeWidth={2.5} />
                        </Icon3D>
                        <p className="mt-3 text-sm font-semibold text-gray-600">
                          Tidak ada alumni yang cocok dengan filter.
                        </p>
                        {eligibleEvents === 0 && (
                          <p className="mt-1 text-xs text-gray-400">
                            Belum ada event yang masuk perhitungan engagement.
                          </p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    items.map((item, index) => {
                      const percentage = clampEngagementPercentage(
                        item.attendance?.percentage,
                      );

                      return (
                        <tr
                          key={item.user.id}
                          className={`border-b border-[#0D5C3A]/10 transition-colors ${
                            index % 2 === 0
                              ? "bg-white hover:bg-[#E8F5E9]/50"
                              : "bg-[#E8F5E9]/25 hover:bg-[#E8F5E9]/60"
                          }`}
                        >
                          <td className="p-3 font-semibold text-gray-800">
                            {getUserName(item)}
                          </td>
                          <td className="p-3 text-gray-500">
                            {item.user.email}
                          </td>
                          <td className="p-3 text-center text-gray-500">
                            {item.user.graduation_year ?? "-"}
                          </td>
                          <td className="p-3 text-gray-500">
                            {getDomicileText(item)}
                          </td>
                          <td className="p-3 text-center font-semibold text-gray-700">
                            {item.attendance?.attended_events ?? 0}/
                            {item.attendance?.total_events ?? 0}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-center gap-3">
                              <div className="h-2 w-24 rounded-full bg-gray-100">
                                <div
                                  className="h-2 rounded-full bg-gradient-to-r from-[#0D5C3A] to-[#0F7047]"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <span className="w-10 text-right font-semibold text-gray-700">
                                {percentage}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <EngagementSegmentBadge segment={item.segment} />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {!isLoading && total > 0 && (
              <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                <p className="text-xs text-gray-500">
                  Menampilkan {pageStart}-{pageEnd} dari {total} alumni
                  {isFetching ? " (memperbarui...)" : ""}
                </p>

                <nav
                  aria-label="Navigasi halaman engagement"
                  className="flex flex-wrap items-center gap-1.5"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.max(1, current - 1))
                    }
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Sebelumnya
                  </button>

                  {paginationRange.map((pageNumber) => (
                    <button
                      key={pageNumber}
                      type="button"
                      onClick={() => setPage(pageNumber)}
                      aria-current={
                        pageNumber === currentPage ? "page" : undefined
                      }
                      className={`min-w-8 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                        pageNumber === currentPage
                          ? "bg-[#0D5C3A] text-white shadow-md shadow-[#0D5C3A]/20"
                          : "border border-gray-200 text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() =>
                      setPage((current) => Math.min(lastPage, current + 1))
                    }
                    disabled={currentPage === lastPage}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Berikutnya
                  </button>
                </nav>
              </div>
            )}
          </div>
        </div>
      </section>

      <footer className="mt-6 text-center text-xs text-[#0D5C3A]/40">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </footer>
    </AdminLayout>
  );
}

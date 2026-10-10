"use client";

import { useState } from "react";
import { Clipboard, ClipboardCheck, Info, MessageCircle } from "lucide-react";
import AdminLayout from "@/app/components/AdminLayout";
import { FormSelect, FormTextarea } from "@/app/components/FormControl";
import { getApiErrorMessage } from "@/lib/api";
import { useEventBroadcastPreview } from "@/hooks/admin/useBroadcast";
import { useEvents, type Event } from "@/hooks/admin/useEvents";
import { sanitizeBroadcastMessage } from "../events/_utils/eventFormatters";

function formatEventDate(event: Event | null) {
  const dateSource = event?.event_date || event?.event_datetime;

  if (!dateSource) return "-";

  const date = new Date(dateSource);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BroadcastPage() {
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [editedMessage, setEditedMessage] = useState("");
  const [hasEditedMessage, setHasEditedMessage] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const { data: events = [], isLoading: loadingEvents } = useEvents();
  const selectedEvent =
    events.find((event: Event) => event.id === selectedEventId) ?? null;
  const preview = useEventBroadcastPreview(selectedEventId, "all");
  const templateMessage = sanitizeBroadcastMessage(preview.data?.message) || "";
  const message = hasEditedMessage ? editedMessage : templateMessage;
  const isMessageTooLong = message.length > 1000;
  const canContinue = Boolean(message.trim()) && !isMessageTooLong;

  const resetCopyStatus = () => setCopyStatus(false);

  const copyMessage = async () => {
    if (!message.trim()) return;

    try {
      await navigator.clipboard.writeText(message.trim());
      setCopyStatus(true);
      window.setTimeout(() => setCopyStatus(false), 2500);
    } catch {
      setCopyStatus(false);
    }
  };

  const openWhatsApp = () => {
    if (!canContinue) return;

    // Menyalin dimulai dari aksi klik yang sama, lalu WhatsApp dibuka tanpa
    // menunggu proses clipboard agar tidak terkena pemblokir pop-up browser.
    void copyMessage();
    window.open(
      `https://wa.me/?text=${encodeURIComponent(message.trim())}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <AdminLayout title="Siapkan Pesan WhatsApp">
      <div className="rounded-2xl border border-[#0D5C3A]/10 bg-white shadow-sm shadow-[#0D5C3A]/5">
        <div className="border-b border-[#0D5C3A]/10 px-5 py-4">
          <h2 className="text-base font-bold text-[#0D5C3A]">
            Buat Pesan untuk Event
          </h2>
          <p className="mt-1 text-xs text-[#0D5C3A]/60">
            Pilih event untuk membuat template pesan. Pesan dapat Anda ubah
            sebelum dilanjutkan ke WhatsApp.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Event
            </label>

            <div className="relative max-w-2xl">
              <FormSelect
                value={selectedEventId ?? ""}
                onChange={(event) => {
                  resetCopyStatus();
                  setHasEditedMessage(false);
                  setEditedMessage("");
                  setSelectedEventId(Number(event.target.value) || null);
                }}
                disabled={loadingEvents}
                className="w-full appearance-none rounded-xl border border-[#0D5C3A]/20 bg-[#F1F8F4] px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="">
                  {loadingEvents ? "Memuat event..." : "Pilih event"}
                </option>

                {events.map((event: Event) => (
                  <option key={event.id} value={event.id}>
                    {event.event_title}
                  </option>
                ))}
              </FormSelect>
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                ▾
              </span>
            </div>

            <p className="mt-1 text-xs text-gray-400">
              {selectedEvent
                ? `${formatEventDate(selectedEvent)} - ${selectedEvent.location}`
                : "Pilih event untuk membuat template pesan otomatis."}
            </p>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <label className="block text-sm font-medium text-gray-700">
                Pesan WhatsApp
              </label>
              <span
                className={`text-xs ${
                  isMessageTooLong ? "text-red-500" : "text-gray-400"
                }`}
              >
                {message.length}/1000
              </span>
            </div>
            <FormTextarea
              value={message}
              onChange={(event) => {
                resetCopyStatus();
                setHasEditedMessage(true);
                setEditedMessage(event.target.value);
              }}
              disabled={!selectedEventId || preview.isLoading}
              placeholder={
                selectedEventId
                  ? "Template pesan sedang dibuat..."
                  : "Pilih event terlebih dahulu"
              }
              rows={14}
              className="min-h-[320px] w-full resize-y rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 focus:outline-none focus:ring-2 focus:ring-[#7AB2B2] disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            {isMessageTooLong && (
              <p className="mt-1 text-xs text-red-500">
                Pesan maksimal 1000 karakter.
              </p>
            )}
            {selectedEventId && preview.isError && (
              <p className="mt-1 text-xs text-red-500">
                {getApiErrorMessage(preview.error, "Gagal membuat template pesan.")}
              </p>
            )}
          </div>

          <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              Saat WhatsApp terbuka, pilih penerima pesan. Pesan ini juga akan
              disalin otomatis agar dapat ditempel jika diperlukan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyMessage()}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-xl border border-[#0D5C3A]/20 bg-white px-4 py-2.5 text-sm font-semibold text-[#0D5C3A] transition-colors hover:bg-[#F1F8F4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {copyStatus ? (
                <ClipboardCheck className="h-4 w-4" />
              ) : (
                <Clipboard className="h-4 w-4" />
              )}
              {copyStatus ? "Pesan tersalin" : "Salin Pesan"}
            </button>
            <button
              type="button"
              onClick={openWhatsApp}
              disabled={!canContinue}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#0D5C3A]/20 transition-all hover:from-[#0A4D30] hover:to-[#073D26] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              Lanjutkan ke WhatsApp
            </button>
          </div>
        </div>
      </div>

      <p className="mt-6 pb-4 text-center text-xs text-[#0D5C3A]/40">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </p>
    </AdminLayout>
  );
}

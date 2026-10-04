"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import AdminLayout from "@/app/components/AdminLayout";
import Image from "next/image";
import QRCode from "qrcode";
import { AlertCircle, CalendarDays, CheckCircle, Clock, Copy, Download, ExternalLink, MapPin, QrCode, Timer, Sparkles, } from "lucide-react";
import FeedbackToast from "@/app/components/FeedbackToast";
import { FormInput, FormSelect } from "@/app/components/FormControl";
import { useEvents, useGenerateQR, useEventQr, type Event, type EventQrCode, } from "@/hooks/admin/useEvents";
import { getApiErrorMessage } from "@/lib/api";
// ─── QR Placeholder SVG ───────────────────────────────────────────────────────
function QRPlaceholder({ size = 120, muted = false, }: {
    size?: number;
    muted?: boolean;
}) {
    const color = muted ? "#d1d5db" : "#0D5C3A";
    return (<svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">

      <rect x="5" y="5" width="35" height="35" rx="4" stroke={color} strokeWidth="5" fill="none"/>

      <rect x="14" y="14" width="17" height="17" rx="2" fill={color}/>

      <rect x="60" y="5" width="35" height="35" rx="4" stroke={color} strokeWidth="5" fill="none"/>

      <rect x="69" y="14" width="17" height="17" rx="2" fill={color}/>

      <rect x="5" y="60" width="35" height="35" rx="4" stroke={color} strokeWidth="5" fill="none"/>

      <rect x="14" y="69" width="17" height="17" rx="2" fill={color}/>

      <rect x="60" y="60" width="8" height="8" rx="1" fill={color}/>

      <rect x="74" y="60" width="8" height="8" rx="1" fill={color}/>

      <rect x="88" y="60" width="8" height="8" rx="1" fill={color}/>

      <rect x="60" y="74" width="8" height="8" rx="1" fill={color}/>

      <rect x="74" y="74" width="8" height="8" rx="1" fill={color}/>

      <rect x="88" y="88" width="8" height="8" rx="1" fill={color}/>

      <rect x="60" y="88" width="8" height="8" rx="1" fill={color}/>

    </svg>);
}
// ─── Icon 3D ──────────────────────────────────────────────────────────────────
function Icon3D({ children, variant = "teal", size = "md", }: {
    children: ReactNode;
    variant?: "teal" | "blue" | "green" | "gold" | "amber" | "gray";
    size?: "sm" | "md" | "lg";
}) {
    const variants = {
        teal: "from-[#0D5C3A] via-[#0A4D30] to-[#073D26] text-white",
        blue: "from-[#2D7EA0] via-[#236175] to-[#1A4D5C] text-white",
        green: "from-[#0D5C3A] via-[#0F7047] to-[#0D5C3A] text-white",
        gold: "from-[#D4AF37] via-[#B8941F] to-[#9A7A1A] text-white",
        amber: "from-amber-500 via-amber-600 to-amber-700 text-white",
        gray: "from-gray-400 via-gray-500 to-gray-600 text-white",
    };
    const sizes = {
        sm: "w-8 h-8 rounded-xl",
        md: "w-11 h-11 rounded-2xl",
        lg: "w-14 h-14 rounded-2xl",
    };
    return (<span className={`${sizes[size]} shrink-0 overflow-visible inline-flex items-center justify-center bg-gradient-to-br ${variants[variant]} shadow-lg shadow-[#0D5C3A]/20 border border-white/40 ring-1 ring-[#D4AF37]/20`}>

      <span className="inline-flex items-center justify-center leading-none drop-shadow-sm">

        {children}

      </span>

    </span>);
}
// ─── QR Display ───────────────────────────────────────────────────────────────
function QRDisplay({ src }: {
    src?: string | null;
}) {
    if (src) {
        return (<Image src={src} alt="QR Code" width={240} height={240} className="w-full h-full object-contain rounded-lg" unoptimized/>);
    }
    return <QRPlaceholder size={150} muted/>;
}
// ─── Skeleton ─────────────────────────────────────────────────────────────────
function EventCardSkeleton() {
    return (<div className="bg-white border border-[#0D5C3A]/10 rounded-2xl p-4 animate-pulse shadow-sm">

      <div className="h-4 bg-[#E8F5E9] rounded w-3/4 mb-3"/>

      <div className="h-3 bg-[#E8F5E9]/70 rounded w-1/2 mb-2"/>

      <div className="h-3 bg-[#E8F5E9]/70 rounded w-2/3"/>

    </div>);
}
// ─── Helpers ─────────────────────────────────────────────────────────────────
function downloadDataUrl({ dataUrl, fileName, }: {
    dataUrl: string;
    fileName: string;
}) {
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
}
function formatEventDate(event: Event) {
    const rawDate = event.event_date || event.event_datetime;
    if (!rawDate)
        return "-";
    const d = new Date(rawDate);
    if (Number.isNaN(d.getTime()))
        return "-";
    return d.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}
function getQrPayload(qrCode?: EventQrCode | null) {
    return qrCode?.qr_payload?.trim() || qrCode?.qr_token?.trim() || "";
}
// ─── Event List Card ──────────────────────────────────────────────────────────
function EventListCard({ event, active, onClick, }: {
    event: Event;
    active: boolean;
    onClick: () => void;
}) {
    return (<button type="button" onClick={onClick} className={`w-full text-left rounded-2xl border p-4 transition-all shadow-sm hover:shadow-md ${active
            ? "border-[#D4AF37] bg-[#E8F5E9] shadow-md"
            : "border-[#0D5C3A]/10 bg-white hover:border-[#0D5C3A]/30 hover:bg-[#E8F5E9]/30"}`}>

      <div className="flex items-start justify-between gap-3">

        <div className="min-w-0">

          <p className="font-semibold text-[#0D5C3A] text-sm truncate">

            {event.event_title}

          </p>

          <div className="flex items-center gap-2 mt-2 text-xs text-[#0D5C3A]/60">

            <Icon3D size="sm" variant="teal">

              <CalendarDays size={14}/>

            </Icon3D>

            <span>{formatEventDate(event)}</span>

          </div>

          <div className="flex items-center gap-2 mt-1.5 text-xs text-[#0D5C3A]/60 min-w-0">

            <Icon3D size="sm" variant="blue">

              <MapPin size={14}/>

            </Icon3D>

            <span className="truncate">{event.location}</span>

          </div>

        </div>

        <span className={`text-xs px-2.5 py-0.5 rounded-full whitespace-nowrap ${active
            ? "bg-[#D4AF37]/20 text-[#9A7A1A] border border-[#D4AF37]/30"
            : "bg-[#0D5C3A]/10 text-[#0D5C3A] border border-[#0D5C3A]/20"}`}>

          {event.category}

        </span>

      </div>

    </button>);
}
// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateQRPage() {
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [durationDays, setDurationDays] = useState<number>(1);
    const [generatedQr, setGeneratedQr] = useState<EventQrCode | null>(null);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isGeneratingQrImage, setIsGeneratingQrImage] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const EVENTS_PER_PAGE = 8;
    const [isQrModalOpen, setIsQrModalOpen] = useState(false);
    const [feedback, setFeedback] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);
    const { data: events = [], isLoading: loadingEvents, isError: eventsError, } = useEvents("", 100);
    const [copySuccess, setCopySuccess] = useState(false);
    const { data: activeQr, isLoading: loadingQr, isError: activeQrError, } = useEventQr(selectedId);
    const generateQR = useGenerateQR();
    const selectedEvent = events.find((event) => event.id === selectedId) ?? null;
    const displayedQr = generatedQr ?? activeQr ?? null;
    const qrPayload = getQrPayload(displayedQr);
    useEffect(() => {
        if (!qrPayload) {
            return;
        }
        let isMounted = true;
        const generateQrDataUrl = async () => {
            try {
                setIsGeneratingQrImage(true);
                const dataUrl = await QRCode.toDataURL(qrPayload, {
                    errorCorrectionLevel: "M",
                    margin: 2,
                    scale: 12,
                    color: {
                        dark: "#111827",
                        light: "#ffffff",
                    },
                });
                if (isMounted) {
                    setQrDataUrl(dataUrl);
                }
            }
            catch (error) {
                console.error(error);
                if (isMounted) {
                    setQrDataUrl(null);
                }
            }
            finally {
                if (isMounted) {
                    setIsGeneratingQrImage(false);
                }
            }
        };
        generateQrDataUrl();
        return () => {
            isMounted = false;
        };
    }, [qrPayload]);
    const totalPages = Math.max(1, Math.ceil(events.length / EVENTS_PER_PAGE));
    const paginatedEvents = useMemo(() => {
        const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
        const endIndex = startIndex + EVENTS_PER_PAGE;
        return events.slice(startIndex, endIndex);
    }, [events, currentPage]);
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);
    const handleSelectEvent = (event: Event) => {
        setSelectedId(event.id);
        setGeneratedQr(null);
        setQrDataUrl(null);
    };
    const handleGenerate = () => {
        if (!selectedId)
            return;
        generateQR.mutate({
            eventId: selectedId,
            data: {
                duration_days: durationDays,
            },
        }, {
            onSuccess: (response) => {
                setQrDataUrl(null);
                setGeneratedQr(response.data.qr_code);
            },
        });
    };
    const isGenerateDisabled = !selectedId ||
        durationDays < 1 ||
        durationDays > 30 ||
        generateQR.isPending;
    const showFeedback = (type: "success" | "error", message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 3000);
    };
    const markCopySuccess = () => {
        setCopySuccess(true);
        showFeedback("success", "Token berhasil disalin");
        setTimeout(() => setCopySuccess(false), 2000);
    };
    const handleCopyToken = async (token: string) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(token);
                markCopySuccess();
            }
            else {
                const textArea = document.createElement("textarea");
                textArea.value = token;
                textArea.style.position = "fixed";
                textArea.style.left = "-999999px";
                textArea.style.top = "-999999px";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                const successful = document.execCommand("copy");
                document.body.removeChild(textArea);
                if (successful) {
                    markCopySuccess();
                }
                else {
                    showFeedback("error", "Gagal menyalin token otomatis. Silakan salin manual.");
                }
            }
        }
        catch (error) {
            console.error("Copy error:", error);
            showFeedback("error", "Gagal menyalin token.");
        }
    };
    return (<AdminLayout title="Buat QR Code">

      {/* ── Two Column ── */}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">

        {/* Left: Pilih Event + Form */}

        <div className="xl:col-span-2 bg-white border border-[#0D5C3A]/10 rounded-2xl p-6 shadow-md shadow-[#0D5C3A]/5 flex flex-col gap-4">

          <div>

            <h3 className="text-base font-semibold text-[#0D5C3A]">

              Atur QR Code

            </h3>

            <p className="text-xs text-gray-400 mt-0.5">

              Pilih event dan tentukan masa berlaku QR

            </p>

          </div>

          {/* Event Select */}

          <div>

            <label className="block text-sm font-medium text-[#0D5C3A] mb-2">

              Event

            </label>

            <div className="relative">

              <FormSelect value={selectedId ?? ""} onChange={(e) => {
            setSelectedId(Number(e.target.value) || null);
            setGeneratedQr(null);
            setQrDataUrl(null);
        }} disabled={loadingEvents} className="w-full appearance-none border border-[#0D5C3A]/20 rounded-xl px-4 py-2.5 text-sm text-[#0D5C3A] bg-[#F1F8F4] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent cursor-pointer disabled:bg-gray-100">

                <option value="">Pilih event...</option>

                {events.map((event) => (<option key={event.id} value={event.id}>

                    {event.event_title}

                  </option>))}

              </FormSelect>

              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#0D5C3A]/40 pointer-events-none">

                ▾

              </span>

            </div>

          </div>

          {/* Selected Event Detail */}

          {selectedEvent && (<div className="bg-[#E8F5E9] border border-[#0D5C3A]/20 rounded-xl p-4 space-y-2 text-sm">

              <p className="font-semibold text-[#0D5C3A]">

                {selectedEvent.event_title}

              </p>

              <p className="text-[#0D5C3A]/80 flex items-center gap-2">

                <Icon3D size="sm" variant="teal">

                  <CalendarDays size={14}/>

                </Icon3D>

                {formatEventDate(selectedEvent)}

              </p>

              <p className="text-[#0D5C3A]/80 flex items-center gap-2">

                <Icon3D size="sm" variant="blue">

                  <MapPin size={14}/>

                </Icon3D>

                {selectedEvent.location}

              </p>

              <span className="inline-block text-xs bg-[#D4AF37]/20 text-[#9A7A1A] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">

                {selectedEvent.category}

              </span>

            </div>)}

          {/* QR Settings */}

          <div>

            <label className="block text-sm font-medium text-[#0D5C3A] mb-2">

              Masa Berlaku QR Code

            </label>

            <div className="flex items-center gap-3">

              <FormInput type="number" min={1} max={30} value={durationDays} onChange={(e) => setDurationDays(Number(e.target.value))} className="w-full border border-[#0D5C3A]/20 rounded-xl px-4 py-2.5 text-sm text-[#0D5C3A] bg-[#F1F8F4] focus:outline-none focus:ring-2 focus:ring-[#0D5C3A] focus:border-transparent" required/>

              <span className="text-sm text-[#0D5C3A]/60 whitespace-nowrap">

                Hari

              </span>

            </div>

            <p className="text-xs text-[#0D5C3A]/60 mt-1">

              Masukkan durasi aktif QR Code dalam satuan hari (1 - 30 hari).

            </p>

          </div>

          {/* Existing QR Info */}

          {selectedId && !loadingQr && activeQr && !generatedQr && (<div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs flex items-start gap-2">

              <AlertCircle size={15} className="mt-0.5 shrink-0"/>

              <span>

                Event ini sudah memiliki QR aktif. Pembuatan ulang akan

                menonaktifkan QR sebelumnya.

              </span>

            </div>)}

          {selectedId && !loadingQr && activeQrError && (<div className="p-3 bg-[#E8F5E9] border border-[#0D5C3A]/20 text-[#0D5C3A]/70 rounded-xl text-xs flex items-start gap-2">

              <AlertCircle size={15} className="mt-0.5 shrink-0"/>

              <span>Event ini belum memiliki QR aktif.</span>

            </div>)}

          {/* Error */}

          {generateQR.isError && (<div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2">

              <AlertCircle size={15}/>

              {getApiErrorMessage(generateQR.error, "QR Code belum berhasil dibuat. Silakan coba lagi.")}

            </div>)}

          {/* Generate Button */}

          <button onClick={handleGenerate} disabled={isGenerateDisabled} className="w-full mt-auto bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[#0D5C3A]/20">

            {generateQR.isPending ? (<>

                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/>

                Membuat...

              </>) : (<>

                <span className="w-7 h-7 inline-flex items-center justify-center rounded-xl bg-white/20 shadow-inner border border-white/30">

                  <Sparkles size={16}/>

                </span>

                Buat QR Code

              </>)}

          </button>

        </div>

        {/* Right: Preview */}

        <div className="xl:col-span-3 bg-white border border-[#0D5C3A]/10 rounded-2xl p-6 shadow-md shadow-[#0D5C3A]/5 flex flex-col min-h-[520px]">

          <div className="mb-5 flex items-center gap-3">

            <Icon3D variant="teal">

              <QrCode size={18}/>

            </Icon3D>

            <div>

              <h3 className="text-base font-semibold text-[#0D5C3A]">

                Pratinjau QR Code

              </h3>

              <p className="text-xs text-[#0D5C3A]/60 mt-0.5">

                QR aktif dari event yang dipilih akan tampil di sini

              </p>

            </div>

          </div>

          {!selectedEvent ? (<div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">

              <Icon3D variant="gray" size="lg">

                <QrCode size={24}/>

              </Icon3D>

              <div className="text-center">

                <p className="font-semibold text-[#0D5C3A]/50 text-lg">

                  Belum Ada Event Dipilih

                </p>

                <p className="text-sm text-[#0D5C3A]/40 mt-1 max-w-xs">

                  Pilih event terlebih dahulu untuk melihat atau membuat QR

                  Code.

                </p>

              </div>

            </div>) : loadingQr && !generatedQr ? (<div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">

              <div className="w-52 h-52 bg-[#E8F5E9] rounded-2xl animate-pulse"/>

              <div className="h-4 bg-[#E8F5E9] rounded w-48 animate-pulse"/>

            </div>) : !displayedQr ? (<div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">

              <Icon3D variant="gray" size="lg">

                <QrCode size={24}/>

              </Icon3D>

              <div className="text-center">

                <p className="font-semibold text-[#0D5C3A]/50 text-lg">

                  QR Belum Dibuat

                </p>

                <p className="text-sm text-[#0D5C3A]/40 mt-1 max-w-xs">

                  Atur waktu mulai berlaku dan durasi, lalu klik Buat QR Code.

                </p>

              </div>

            </div>) : (<div className="flex-1 flex flex-col items-center justify-center gap-6">

              <div className="relative">

                <div className="w-60 h-60 bg-white border-2 border-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0D5C3A]/20 p-4">

                  {isGeneratingQrImage ? (<div className="w-full h-full bg-[#E8F5E9] rounded-xl animate-pulse"/>) : (<QRDisplay src={qrDataUrl}/>)}

                </div>

                <span className={`absolute -top-2 -right-2 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow shadow-[#0D5C3A]/30 ${displayedQr.is_valid_now
                ? "bg-[#0D5C3A]"
                : displayedQr.is_expired
                    ? "bg-red-500"
                    : "bg-amber-500"}`}>

                  {displayedQr.is_valid_now
                ? "Aktif"
                : displayedQr.is_expired
                    ? "Kedaluwarsa"
                    : "Terjadwal"}

                </span>

              </div>

              <div className="text-center">

                <p className="font-semibold text-[#0D5C3A]">

                  {selectedEvent.event_title}

                </p>

                <p className="text-sm text-[#0D5C3A]/60 mt-0.5">

                  {formatEventDate(selectedEvent)} • {selectedEvent.location}

                </p>

              </div>

              <div className="w-full max-w-md bg-[#E8F5E9] border border-[#0D5C3A]/20 rounded-xl p-4 space-y-2 text-sm">

                <div className="flex justify-between gap-4">

                  <span className="text-[#0D5C3A]/70 flex items-center gap-2">

                    <Clock size={14}/>

                    Dibuat pada

                  </span>

                  <span className="font-medium text-[#0D5C3A] text-right">

                    {displayedQr.created_at_wib || "-"}

                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#0D5C3A]/70 flex items-center gap-2">

                    <Timer size={14}/>

                    Masa Berlaku

                  </span>

                  <span className="font-medium text-[#0D5C3A] text-right">

                    {displayedQr.duration_days} Hari

                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#0D5C3A]/70">Mulai Aktif</span>

                  <span className="font-medium text-[#0D5C3A] text-right">

                    {displayedQr.valid_from_wib || "-"}

                  </span>

                </div>

                <div className="flex justify-between gap-4">

                  <span className="text-[#0D5C3A]/70">Kedaluwarsa Pada</span>

                  <span className="font-semibold text-red-600 text-right">

                    {displayedQr.expired_at_wib || "-"}

                  </span>

                </div>

                <div className="flex justify-between items-center gap-4">

                  <span className="text-[#0D5C3A]/70">Token</span>

                  <div className="flex items-center gap-2">

                    <span className="font-mono text-xs text-[#0D5C3A]/60 text-right truncate max-w-[180px]">

                      {qrPayload}

                    </span>

                    <button onClick={() => handleCopyToken(qrPayload)} className="text-[#0D5C3A]/40 hover:text-[#0D5C3A] transition-colors p-1" title="Salin Data QR">

                      {copySuccess ? (<CheckCircle size={14} className="text-[#0D5C3A]"/>) : (<Copy size={14}/>)}

                    </button>

                  </div>

                </div>

              </div>

              <div className="flex gap-3">

                <button onClick={() => {
                if (!qrDataUrl || !selectedEvent)
                    return;
                downloadDataUrl({
                    dataUrl: qrDataUrl,
                    fileName: `QR-${selectedEvent.event_title}`,
                });
            }} disabled={!qrDataUrl} className="flex items-center gap-2 bg-gradient-to-r from-[#0D5C3A] to-[#0A4D30] hover:from-[#0A4D30] hover:to-[#073D26] text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-md shadow-[#0D5C3A]/20 disabled:opacity-60 disabled:cursor-not-allowed">

                  <Download size={16}/>

                  Unduh PNG

                </button>

                <button type="button" onClick={() => setIsQrModalOpen(true)} disabled={!qrDataUrl} className="flex items-center gap-2 border-2 border-[#D4AF37] text-[#9A7A1A] hover:bg-[#D4AF37]/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed">

                <ExternalLink size={16}/>

                Buka QR

              </button>

              </div>

            </div>)}

        </div>

      </div>

      {/* ── Event List ── */}

      <div className="bg-white border border-[#0D5C3A]/10 rounded-2xl p-6 shadow-md shadow-[#0D5C3A]/5">

        <div className="mb-5 flex items-center gap-3">

          <Icon3D variant="gold">

            <CalendarDays size={18}/>

          </Icon3D>

          <div>

            <h3 className="text-base font-semibold text-[#0D5C3A]">

              Daftar Event

            </h3>

            <p className="text-xs text-[#0D5C3A]/60 mt-0.5">

              Klik salah satu event untuk membuat atau melihat QR aktif

            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

          {loadingEvents ? ([1, 2, 3, 4, 5, 6, 7, 8].map((i) => <EventCardSkeleton key={i}/>)) : eventsError ? (<div className="md:col-span-2 xl:col-span-4 text-center py-8 text-red-500">

              <AlertCircle size={36} className="mx-auto mb-2"/>

              <p className="text-sm">Gagal memuat data event</p>

            </div>) : events.length === 0 ? (<div className="md:col-span-2 xl:col-span-4 text-center py-8 text-[#0D5C3A]/40">

              <Icon3D variant="gray" size="lg">

                <CalendarDays size={24}/>

              </Icon3D>

              <p className="text-sm mt-3">Belum ada event yang tersedia</p>

            </div>) : (paginatedEvents.map((event) => (<EventListCard key={event.id} event={event} active={event.id === selectedId} onClick={() => handleSelectEvent(event)}/>)))}

        </div>

        {!loadingEvents && !eventsError && events.length > 0 && (<div className="mt-6 flex flex-col gap-3 border-t border-[#0D5C3A]/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-[#0D5C3A]/60">
              Halaman {currentPage} dari {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} className="rounded-lg border border-[#0D5C3A]/20 px-4 py-2 text-sm font-medium text-[#0D5C3A] transition hover:bg-[#E8F5E9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                Sebelumnya
              </button>

              <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-[#0D5C3A]/20 px-4 py-2 text-sm font-medium text-[#0D5C3A] transition hover:bg-[#E8F5E9] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent">
                Berikutnya
              </button>
            </div>
          </div>)}
      </div>

      <p className="mt-6 pb-6 text-center text-xs text-[#0D5C3A]/40">
        © 2026 Sistem Presensi Event - Pondok Pesantren Al-Qur&apos;an Al-Falah
      </p>

      {/* QR Modal */}
      {isQrModalOpen && qrDataUrl && (<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)}>

          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setIsQrModalOpen(false)} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700" aria-label="Tutup QR Code">
              ×
            </button>

            <div className="text-center">
              <h3 className="text-lg font-bold text-[#0D5C3A]">
                QR Code Presensi
              </h3>

              {selectedEvent && (<p className="mt-1 text-sm text-gray-500">
                  {selectedEvent.event_title}
                </p>)}

              <div className="mt-6 flex justify-center">
                <div className="rounded-2xl border-2 border-[#D4AF37] bg-white p-4 shadow-md">
                  <Image src={qrDataUrl} alt="QR Code Presensi" width={300} height={300} className="h-auto w-full max-w-[300px]" unoptimized/>
                </div>
              </div>

              {displayedQr && (<p className="mt-5 text-sm text-gray-500">
                  Berlaku sampai:{" "}
                  <span className="font-semibold text-gray-700">
                    {displayedQr.expired_at_wib || "-"}
                  </span>
                </p>)}

              <div className="mt-6 flex gap-3">
                <button type="button" onClick={() => setIsQrModalOpen(false)} className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50">
                  Tutup
                </button>

                <button type="button" onClick={() => {
                if (!qrDataUrl || !selectedEvent)
                    return;
                downloadDataUrl({
                    dataUrl: qrDataUrl,
                    fileName: `QR-${selectedEvent.event_title}`,
                });
            }} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0D5C3A] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A4D30]">
                  <Download size={16}/>
                  Unduh PNG
                </button>
              </div>
            </div>
          </div>
        </div>)}
      {feedback && (<FeedbackToast type={feedback.type} message={feedback.message}/>)}
    </AdminLayout>);
}
import type {
	Attendance,
	AttendanceEvent,
	AttendanceResponseData,
} from "@/hooks/admin/useAttendances";
import { formatDomicileName } from "@/lib/formatters";

export interface ReportEvent {
	id: number;
	event_title: string;
	event_datetime: string;
	event_date?: string;
	status_event: "Mendatang" | "Selesai";
	quota?: number;
	location?: string;
	registrations_count?: number;
	presensis_count?: number;
}

export interface Presence {
	id: number;
	event_id: number;
	user_id: number;
	scanned_at?: string;
	user?: {
		id: number;
		name: string;
		email: string;
		angkatan?: string;
		phone?: string;
		status?: string;
		role?: string;
	};
}

export function formatDate(dateValue?: string | null) {
	if (!dateValue) return "-";

	const d = new Date(dateValue);

	if (Number.isNaN(d.getTime())) return "-";

	return d.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatTime(dateValue?: string | null) {
	if (!dateValue) return "-";

	const d = new Date(dateValue);

	if (Number.isNaN(d.getTime())) return "-";

	return d.toLocaleTimeString("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export function formatDateTimeIndonesia(dateValue?: string | null) {
	if (!dateValue) return "-";

	const d = new Date(dateValue);

	if (Number.isNaN(d.getTime())) return "-";

	const datePart = d.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
	const timeParts = new Intl.DateTimeFormat("id-ID", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).formatToParts(d);
	const hour = timeParts.find((part) => part.type === "hour")?.value ?? "00";
	const minute = timeParts.find((part) => part.type === "minute")?.value ?? "00";

	return `${datePart}, ${hour}:${minute}`;
}

export function formatEventTime(startTime?: string | null, endTime?: string | null) {
	if (!startTime && !endTime) return "-";

	const start = startTime ? startTime.slice(0, 5) : "-";
	const end = endTime ? endTime.slice(0, 5) : "-";

	return `${start} - ${end}`;
}

export function formatDomicile(
	cityName?: string | null,
	provinceName?: string | null,
	fallback = "Tidak diketahui",
) {
	if (!cityName || cityName === "Tidak diketahui") return fallback;

	const formattedCity = formatDomicileName(cityName);
	return provinceName ? `${formattedCity}, ${provinceName}` : formattedCity;
}

export function getUserName(attendance: Attendance) {
	return attendance.user?.name ?? `User #${attendance.user_id}`;
}

export function getAttendanceCount(presences: Presence[], eventId: number) {
	return presences.filter((presence) => presence.event_id === eventId).length;
}

export function getAttendanceRate(
	presences: Presence[],
	eventId: number,
	quota?: number,
) {
	if (!quota) return 0;
	return Math.round((getAttendanceCount(presences, eventId) / quota) * 100);
}

export function getReportStats(events: ReportEvent[], presences: Presence[]) {
	const selesai = events.filter((event) => event.status_event === "Selesai").length;
	const totalHadir = presences.length;
	const avgRate =
		events.length > 0
			? Math.round(
					events.reduce((sum, event) => {
						return (
							sum +
							getAttendanceRate(presences, event.id, event.quota)
						);
					}, 0) / events.length,
				)
			: 0;

	return { selesai, totalHadir, avgRate };
}

function escapeExportValue(value: unknown) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

function getExportDate() {
	return new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

function getAttendanceStatus(attendance: Attendance) {
	return attendance.attendance?.status || attendance.status || "hadir";
}

function getAttendanceScannedAt(attendance: Attendance) {
	return attendance.attendance?.scanned_at || attendance.scanned_at;
}

function getAttendanceRows(attendances: Attendance[]) {
	return attendances.map((attendance, index) => ({
		no: index + 1,
		name: attendance.user?.name ?? `User #${attendance.user_id}`,
		email: attendance.user?.email ?? "-",
		phone: attendance.user?.phone ?? "-",
		angkatan: attendance.user?.angkatan ?? attendance.user?.graduation_year ?? "-",
		domicile: formatDomicile(
			attendance.user?.domicile?.city?.name,
			attendance.user?.domicile?.province?.name,
			"-",
		),
		registeredAt: formatDateTimeIndonesia(attendance.attendance?.registered_at),
		scannedAt: formatDateTimeIndonesia(getAttendanceScannedAt(attendance)),
		status: getAttendanceStatus(attendance),
	}));
}

function getEventExportInfo(event: AttendanceEvent) {
	return {
		title: event.event_title || "Laporan Kehadiran Event",
		date: formatDate(event.event_date),
		time: formatEventTime(event.start_time, event.end_time),
		location: event.location || "-",
	};
}

export function exportAttendancesToExcel(
	event: AttendanceEvent,
	attendances: Attendance[],
	summary?: AttendanceResponseData["summary"],
) {
	const info = getEventExportInfo(event);
	const rows = getAttendanceRows(attendances).map(
		(row) => `
		<tr>
			<td class="center">${row.no}</td>
			<td>${escapeExportValue(row.name)}</td>
			<td>${escapeExportValue(row.email)}</td>
			<td>${escapeExportValue(row.phone)}</td>
			<td class="center">${escapeExportValue(row.angkatan)}</td>
			<td>${escapeExportValue(row.domicile)}</td>
			<td class="center">${escapeExportValue(row.registeredAt)}</td>
			<td class="center">${escapeExportValue(row.scannedAt)}</td>
			<td>${escapeExportValue(row.status)}</td>
		</tr>
	`,
	);
	const html = `
		<html>
			<head>
				<meta charset="UTF-8" />
				<style>
					body { font-family: Arial, sans-serif; color: #1f2937; }
					.report-title { font-size: 20px; font-weight: 700; color: #0D5C3A; }
					.report-meta { color: #4b5563; margin: 4px 0 14px; line-height: 1.5; }
					.summary { margin-bottom: 14px; }
					.summary span {
						display: inline-block;
						background: #e8f5e9;
						border: 1px solid #c8e6c9;
						color: #0D5C3A;
						font-weight: 700;
						padding: 7px 10px;
						margin-right: 6px;
						border-radius: 4px;
					}
					table { border-collapse: collapse; width: 100%; }
					th {
						background: #0D5C3A;
						color: #ffffff;
						font-weight: 700;
						padding: 10px;
						border: 1px solid #0a4d30;
					}
					td { padding: 9px; border: 1px solid #e2e8f0; vertical-align: top; }
					tr:nth-child(even) td { background: #f8fafc; }
					.center { text-align: center; }
				</style>
			</head>
			<body>
				<div class="report-title">${escapeExportValue(info.title)}</div>
				<div class="report-meta">
					${escapeExportValue(info.date)} | ${escapeExportValue(info.time)} | ${escapeExportValue(info.location)}<br />
					Dicetak ${escapeExportValue(getExportDate())}
				</div>
				<div class="summary">
					<span>Hadir: ${summary?.total_attended ?? attendances.length}</span>
					<span>Terdaftar: ${summary?.total_registered ?? "-"}</span>
					<span>Belum hadir: ${summary?.total_not_attended ?? summary?.total_absent ?? "-"}</span>
				</div>
				<table>
					<thead>
						<tr>
							<th>No</th>
							<th>Nama</th>
							<th>Email</th>
							<th>No HP</th>
							<th>Tahun Kelulusan</th>
							<th>Domisili</th>
							<th>Jam Daftar</th>
							<th>Jam Hadir / Scan QR</th>
							<th>Status Hadir</th>
						</tr>
					</thead>
					<tbody>${rows.join("")}</tbody>
				</table>
			</body>
		</html>
	`;
	const blob = new Blob([html], { type: "application/vnd.ms-excel" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	const today = new Date().toISOString().slice(0, 10);

	link.href = url;
	link.download = `laporan-kehadiran-${event.id}-${today}.xls`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function exportAttendancesToPdf(
	event: AttendanceEvent,
	attendances: Attendance[],
	summary?: AttendanceResponseData["summary"],
	preparedWindow?: Window | null,
) {
	const info = getEventExportInfo(event);
	const rows = getAttendanceRows(attendances).map(
		(row) => `
		<tr>
			<td class="center">${row.no}</td>
			<td>${escapeExportValue(row.name)}</td>
			<td>${escapeExportValue(row.email)}</td>
			<td>${escapeExportValue(row.phone)}</td>
			<td class="center">${escapeExportValue(row.angkatan)}</td>
			<td>${escapeExportValue(row.domicile)}</td>
			<td class="center">${escapeExportValue(row.registeredAt)}</td>
			<td class="center">${escapeExportValue(row.scannedAt)}</td>
			<td class="center">
				<span class="status-badge status-${String(row.status).toLowerCase().replace(/\s+/g, "")}">
					${escapeExportValue(row.status)}
				</span>
			</td>
		</tr>
	`,
	);
	const printWindow =
		preparedWindow ?? window.open("", "_blank", "width=1120,height=800");

	if (!printWindow) return false;

	printWindow.document.write(`
		<!doctype html>
		<html>
			<head>
				<meta charset="UTF-8" />
				<title>${escapeExportValue(info.title)}</title>
				<link rel="icon" href="/images/logo-pesantren.png" type="image/png" />
				<style>
					@page { size: A4 landscape; margin: 12mm; }
					* { box-sizing: border-box; }
					body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
					.header {
						display: flex;
						justify-content: space-between;
						gap: 20px;
						padding-bottom: 14px;
						border-bottom: 3px solid #D4AF37;
						margin-bottom: 14px;
					}
					h1 { color: #0D5C3A; font-size: 21px; margin: 0 0 7px; }
					.meta { color: #4b5563; font-size: 12px; line-height: 1.6; }
					.summary { display: flex; gap: 8px; margin-bottom: 14px; }
					.summary div {
						background: #e8f5e9;
						border: 1px solid #c8e6c9;
						color: #0D5C3A;
						border-radius: 8px;
						padding: 8px 10px;
						font-size: 12px;
						font-weight: 700;
					}
					table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
					th {
						background: #0D5C3A;
						color: white;
						text-align: left;
						padding: 6px;
						border: 1px solid #0a4d30;
					}
					td { padding: 6px; border: 1px solid #e2e8f0; vertical-align: top; }
					tr:nth-child(even) td { background: #f8fafc; }
					.center { text-align: center; }
					.status-badge {
						display: inline-block;
						padding: 2px 6px;
						border-radius: 4px;
						font-weight: 600;
						font-size: 9px;
					}
					.status-hadir {
						background: #e8f5e9;
						color: #2e7d32;
						border: 1px solid #c8e6c9;
					}
					.status-registered {
						background: #e3f2fd;
						color: #1565c0;
						border: 1px solid #90caf9;
					}
					.status-tidakhadir, .status-absent {
						background: #ffebee;
						color: #c62828;
						border: 1px solid #ffcdd2;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<div>
						<h1>${escapeExportValue(info.title)}</h1>
						<div class="meta">
							${escapeExportValue(info.date)} | ${escapeExportValue(info.time)}<br />
							${escapeExportValue(info.location)}<br />
							Tanggal export: ${escapeExportValue(getExportDate())}
						</div>
					</div>
				</div>
				<div class="summary">
					<div>Hadir: ${summary?.total_attended ?? attendances.length}</div>
					<div>Terdaftar: ${summary?.total_registered ?? "-"}</div>
					<div>Belum hadir: ${summary?.total_not_attended ?? summary?.total_absent ?? "-"}</div>
				</div>
				<table>
					<thead>
						<tr>
							<th>No</th>
							<th>Nama</th>
							<th>Email</th>
							<th>No HP</th>
							<th>Tahun Kelulusan</th>
							<th>Domisili</th>
							<th>Jam Daftar</th>
							<th>Jam Hadir / Scan QR</th>
							<th>Status Hadir</th>
						</tr>
					</thead>
					<tbody>${rows.join("")}</tbody>
				</table>
				<script>
					window.onload = () => {
						window.print();
						window.onafterprint = () => window.close();
					};
				</script>
			</body>
		</html>
	`);
	printWindow.document.close();
	return true;
}

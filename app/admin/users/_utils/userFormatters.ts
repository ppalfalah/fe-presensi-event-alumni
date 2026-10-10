import type { User } from "@/hooks/admin/users";
import { formatDomicileName } from "@/lib/formatters";

export function formatDate(dateStr?: string) {
	if (!dateStr) return "-";

	const date = new Date(dateStr);
	if (Number.isNaN(date.getTime())) return "-";

	return date.toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatLabel(value: string) {
	if (!value) return "-";
	if (value.toLowerCase() === "user") return "Pengguna";
	return value.charAt(0).toUpperCase() + value.slice(1);
}

export function getUserPhone(user: User) {
	return user.phone ?? "";
}

export function isAdminUser(user: Pick<User, "role">) {
	return user.role.toLowerCase() === "admin";
}

export function getStatusLabel(status?: string | null) {
	switch (status?.toLowerCase()) {
		case "pending":
			return "Menunggu Persetujuan";
		case "active":
			return "Aktif";
		case "inactive":
			return "Nonaktif";
		case "rejected":
			return "Ditolak";
		default:
			return "Status tidak diketahui";
	}
}

export function getStatusClass(status?: string | null) {
	const normalized = status?.toLowerCase();

	if (normalized === "active") {
		return "bg-green-100 text-green-700";
	}

	if (normalized === "pending") {
		return "bg-amber-100 text-amber-700";
	}

	if (normalized === "inactive") {
		return "bg-gray-100 text-gray-600";
	}

	if (normalized === "rejected") {
		return "bg-red-100 text-red-600";
	}

	return "bg-gray-100 text-gray-600";
}

function escapeExcelValue(value: unknown) {
	return String(value ?? "")
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export function formatDomicile(
	cityName?: string | null,
	provinceName?: string | null,
	fallback = "-",
) {
	if (!cityName || cityName === "Tidak diketahui") return fallback;
	const formattedCity = formatDomicileName(cityName);
	return provinceName ? `${formattedCity}, ${provinceName}` : formattedCity;
}

function getExportRows(users: User[]) {
	return users.map((user, index) => ({
		no: index + 1,
		name: user.name,
		email: user.email,
		phone: getUserPhone(user) || "-",
		graduationYear: user.graduation_year ?? "-",
		domicile: formatDomicile(
			user.domicile?.city?.name,
			user.domicile?.province?.name,
			"-",
		),
		role: formatLabel(user.role),
		status: getStatusLabel(user.status),
		createdAt: formatDate(user.created_at),
	}));
}

function getExportDate() {
	return new Date().toLocaleDateString("id-ID", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function exportUsersToExcel(users: User[]) {
	const rows = getExportRows(users).map(
		(user) => `
		<tr>
			<td class="center">${user.no}</td>
			<td>${escapeExcelValue(user.name)}</td>
			<td>${escapeExcelValue(user.email)}</td>
			<td>${escapeExcelValue(user.phone)}</td>
			<td class="center">${escapeExcelValue(user.graduationYear)}</td>
			<td>${escapeExcelValue(user.domicile)}</td>
			<td class="center">${escapeExcelValue(user.role)}</td>
			<td>${escapeExcelValue(user.status)}</td>
			<td class="center">${escapeExcelValue(user.createdAt)}</td>
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
					.report-meta { color: #4b5563; margin: 4px 0 16px; }
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
				<div class="report-title">Data Pengguna Alumni</div>
				<div class="report-meta">Dicetak ${escapeExcelValue(getExportDate())} - Total ${users.length} pengguna</div>
				<table>
					<thead>
						<tr>
							<th>No</th>
							<th>Nama</th>
							<th>Email</th>
							<th>Nomor Telepon</th>
							<th>Tahun Kelulusan</th>
							<th>Domisili</th>
							<th>Peran</th>
							<th>Status</th>
							<th>Tanggal Dibuat</th>
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
	link.download = `data-user-${today}.xls`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

export function exportUsersToPdf(users: User[], preparedWindow?: Window | null) {
	const rows = getExportRows(users).map(
		(user) => `
		<tr>
			<td class="center">${user.no}</td>
			<td>${escapeExcelValue(user.name)}</td>
			<td>${escapeExcelValue(user.email)}</td>
			<td>${escapeExcelValue(user.phone)}</td>
			<td class="center">${escapeExcelValue(user.graduationYear)}</td>
			<td>${escapeExcelValue(user.domicile)}</td>
			<td class="center">${escapeExcelValue(user.role)}</td>
			<td class="center">
				<span class="status-badge status-${String(user.status).toLowerCase().replace(/\s+/g, "")}">
					${escapeExcelValue(user.status)}
				</span>
			</td>
			<td class="center">${escapeExcelValue(user.createdAt)}</td>
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
				<title>Data Pengguna Alumni</title>
				<link rel="icon" href="/images/logo-pesantren.png" type="image/png" />
				<style>
					@page { size: A4 landscape; margin: 12mm; }
					* { box-sizing: border-box; }
					body { font-family: Arial, sans-serif; color: #111827; margin: 0; }
					.header {
						display: flex;
						justify-content: space-between;
						align-items: flex-start;
						gap: 20px;
						padding-bottom: 14px;
						border-bottom: 3px solid #D4AF37;
						margin-bottom: 16px;
					}
					h1 { color: #0D5C3A; font-size: 22px; margin: 0 0 6px; }
					.meta { color: #4b5563; font-size: 12px; line-height: 1.6; }
					.badge {
						background: #e8f5e9;
						color: #0D5C3A;
						border: 1px solid #c8e6c9;
						border-radius: 8px;
						font-weight: 700;
						padding: 8px 12px;
						white-space: nowrap;
					}
					table { width: 100%; border-collapse: collapse; font-size: 10px; }
					th {
						background: #0D5C3A;
						color: white;
						text-align: left;
						padding: 9px;
						border: 1px solid #0a4d30;
					}
					td { padding: 8px 9px; border: 1px solid #e2e8f0; vertical-align: top; }
					tr:nth-child(even) td { background: #f8fafc; }
					.center { text-align: center; }
					.status-badge {
						display: inline-block;
						padding: 2px 6px;
						border-radius: 4px;
						font-weight: 600;
						font-size: 9px;
					}
					.status-aktif {
						background: #e8f5e9;
						color: #2e7d32;
						border: 1px solid #c8e6c9;
					}
					.status-menunggupersetujuan {
						background: #fff8e1;
						color: #f57f17;
						border: 1px solid #ffe082;
					}
					.status-nonaktif {
						background: #f5f5f5;
						color: #616161;
						border: 1px solid #e0e0e0;
					}
					.status-ditolak {
						background: #ffebee;
						color: #c62828;
						border: 1px solid #ffcdd2;
					}
				</style>
			</head>
			<body>
				<div class="header">
					<div>
						<h1>Data Pengguna Alumni</h1>
						<div class="meta">Tanggal ekspor: ${escapeExcelValue(getExportDate())}<br />Sumber data: halaman Manajemen Pengguna</div>
					</div>
					<div class="badge">${users.length} Pengguna</div>
				</div>
				<table>
					<thead>
						<tr>
							<th>No</th>
							<th>Nama</th>
							<th>Email</th>
							<th>Nomor Telepon</th>
							<th>Tahun Kelulusan</th>
							<th>Domisili</th>
							<th>Peran</th>
							<th>Status</th>
							<th>Tanggal Dibuat</th>
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

export function getUserStats(users: User[]) {
	const now = new Date();
	const activeUsers = users.filter((user) => user.status === "active").length;
	const pendingUsers = users.filter((user) => user.status === "pending").length;
	const inactiveUsers = users.filter((user) => user.status === "inactive").length;
	const rejectedUsers = users.filter((user) => user.status === "rejected").length;
	const adminUsers = users.filter(isAdminUser).length;
	const monthUsers = users.filter((user) => {
		const createdAt = new Date(user.created_at);
		return (
			createdAt.getMonth() === now.getMonth() &&
			createdAt.getFullYear() === now.getFullYear()
		);
	}).length;

	return {
		activeUsers,
		adminUsers,
		inactiveUsers,
		monthUsers,
		pendingUsers,
		rejectedUsers,
	};
}

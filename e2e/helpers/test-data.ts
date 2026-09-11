import type { TestInfo } from "@playwright/test";

export interface AlumniRegistrationData {
  firstName: string;
  lastName: string;
  gender: "Laki-laki" | "Perempuan";
  email: string;
  phone: string;
  graduationYear: string;
  birthDate: string;
  password: string;
  passwordConfirmation: string;
  province: string;
  city: string;
  district: string;
  village: string;
  postalCode: string;
  address: string;
}

const runId = Date.now().toString().slice(-9);

export function createUniqueAlumniData(
  testId: string,
  testInfo: TestInfo,
  overrides: Partial<AlumniRegistrationData> = {},
): AlumniRegistrationData {
  const numericTestId = testId.replace(/\D/g, "").padStart(3, "0").slice(-3);
  const identity = `${testId.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${runId}.w${testInfo.workerIndex}.r${testInfo.retry}`;

  return {
    firstName: "E2E",
    lastName: testId,
    gender: "Laki-laki",
    email: `${identity}@example.test`,
    phone: `08${numericTestId}${runId.slice(-7)}`,
    graduationYear: String(new Date().getFullYear()),
    birthDate: "2000-01-01",
    password: "E2e!Pass2026",
    passwordConfirmation: "E2e!Pass2026",
    province: "Jawa Barat",
    city: "Kota Bandung",
    district: "Sukasari",
    village: "Isola",
    postalCode: "40154",
    address: `Alamat pengujian ${testId}`,
    ...overrides,
  };
}

export function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

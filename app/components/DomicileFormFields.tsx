"use client";

import React from "react";
import { FormSelect, FormInput, FormTextarea } from "./FormControl";
import {
  useProvinces,
  useCities,
  useDistricts,
  useVillages,
} from "@/hooks/useRegions";
import { Loader2 } from "lucide-react";
import { formatDomicileName } from "@/lib/formatters";

export interface DomicileFormValues {
  domicile_province_code?: string | null;
  domicile_city_code?: string | null;
  domicile_district_code?: string | null;
  domicile_village_code?: string | null;
  domicile_postal_code?: string | null;
  domicile_address?: string | null;
}

interface DomicileFormFieldsProps {
  values: DomicileFormValues;
  onChange: (field: keyof DomicileFormValues, value: string) => void;
  errors?: Record<string, string>;
  theme?: "alumni" | "admin" | "alumni-profile";
}

export default function DomicileFormFields({
  values,
  onChange,
  errors = {},
  theme = "alumni",
}: DomicileFormFieldsProps) {
  // Fetch lists based on selected codes
  const { data: provinces = [], isLoading: isLoadingProvinces } = useProvinces();
  const { data: cities = [], isLoading: isLoadingCities } = useCities(
    values.domicile_province_code
  );
  const { data: districts = [], isLoading: isLoadingDistricts } = useDistricts(
    values.domicile_city_code
  );
  const { data: villages = [], isLoading: isLoadingVillages } = useVillages(
    values.domicile_district_code
  );

  // Theme Class Names mapping
  const styles = {
    alumni: {
      select: "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50",
      input: "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50",
      textarea: "w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:ring-2 border-slate-200 focus:border-[#0D5C3A] focus:ring-[#E8F5E9]/50 min-h-[80px] resize-y",
      errorSelect: "border-red-300 focus:border-red-400 focus:ring-red-100",
      label: "text-xs font-medium text-slate-600 mb-1 block",
    },
    "alumni-profile": {
      select: "w-full rounded-xl border border-[#0D5C3A]/30 bg-[#E8F5E9]/20 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#E8F5E9]/50 transition",
      input: "w-full rounded-xl border border-[#0D5C3A]/30 bg-[#E8F5E9]/20 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#E8F5E9]/50 transition",
      textarea: "w-full rounded-xl border border-[#0D5C3A]/30 bg-[#E8F5E9]/20 px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-[#E8F5E9]/50 transition min-h-[80px] resize-y",
      errorSelect: "border-red-400 focus:ring-red-100",
      label: "text-xs font-medium text-slate-400 mb-1 block",
    },
    admin: {
      select: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 bg-white",
      input: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 bg-white",
      textarea: "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7AB2B2]/30 bg-white min-h-[80px] resize-y",
      errorSelect: "border-red-500 focus:ring-red-100",
      label: "text-xs font-medium text-gray-600 mb-1 block",
    },
  }[theme];

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange("domicile_province_code", val);
    onChange("domicile_city_code", "");
    onChange("domicile_district_code", "");
    onChange("domicile_village_code", "");
    onChange("domicile_postal_code", "");
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange("domicile_city_code", val);
    onChange("domicile_district_code", "");
    onChange("domicile_village_code", "");
    onChange("domicile_postal_code", "");
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange("domicile_district_code", val);
    onChange("domicile_village_code", "");
    onChange("domicile_postal_code", "");
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    onChange("domicile_village_code", val);

    const matched = villages.find((v) => v.code === val);
    if (matched?.postal_code) {
      onChange("domicile_postal_code", matched.postal_code);
    }
  };

  return (
    <div className="space-y-4">
      {/* Province Select */}
      <div>
        <label className={styles.label}>Provinsi</label>
        <div className="relative">
          <FormSelect
            value={values.domicile_province_code || ""}
            onChange={handleProvinceChange}
            className={`${styles.select} ${
              errors.domicile_province_code ? styles.errorSelect : ""
            }`}
          >
            <option value="">Pilih provinsi</option>
            {provinces.map((prov) => (
              <option key={prov.code} value={prov.code}>
                {prov.name}
              </option>
            ))}
          </FormSelect>
          {isLoadingProvinces && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
          )}
        </div>
        {errors.domicile_province_code && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_province_code}</p>
        )}
      </div>

      {/* City Select */}
      <div>
        <label className={styles.label}>Kabupaten / Kota</label>
        <div className="relative">
          <FormSelect
            value={values.domicile_city_code || ""}
            onChange={handleCityChange}
            disabled={!values.domicile_province_code}
            className={`${styles.select} ${
              errors.domicile_city_code ? styles.errorSelect : ""
            } disabled:opacity-50`}
          >
            <option value="">
              {!values.domicile_province_code
                ? "Pilih provinsi terlebih dahulu"
                : "Pilih kabupaten/kota"}
            </option>
            {cities.map((city) => (
              <option key={city.code} value={city.code}>
                {formatDomicileName(city.name)}
              </option>
            ))}
          </FormSelect>
          {isLoadingCities && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
          )}
        </div>
        {errors.domicile_city_code && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_city_code}</p>
        )}
      </div>

      {/* District Select */}
      <div>
        <label className={styles.label}>Kecamatan</label>
        <div className="relative">
          <FormSelect
            value={values.domicile_district_code || ""}
            onChange={handleDistrictChange}
            disabled={!values.domicile_city_code}
            className={`${styles.select} ${
              errors.domicile_district_code ? styles.errorSelect : ""
            } disabled:opacity-50`}
          >
            <option value="">
              {!values.domicile_city_code
                ? "Pilih kabupaten/kota terlebih dahulu"
                : "Pilih kecamatan"}
            </option>
            {districts.map((d) => (
              <option key={d.code} value={d.code}>
                {d.name}
              </option>
            ))}
          </FormSelect>
          {isLoadingDistricts && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
          )}
        </div>
        {errors.domicile_district_code && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_district_code}</p>
        )}
      </div>

      {/* Village Select */}
      <div>
        <label className={styles.label}>Desa / Kelurahan</label>
        <div className="relative">
          <FormSelect
            value={values.domicile_village_code || ""}
            onChange={handleVillageChange}
            disabled={!values.domicile_district_code}
            className={`${styles.select} ${
              errors.domicile_village_code ? styles.errorSelect : ""
            } disabled:opacity-50`}
          >
            <option value="">
              {!values.domicile_district_code
                ? "Pilih kecamatan terlebih dahulu"
                : "Pilih desa/kelurahan"}
            </option>
            {villages.map((v) => (
              <option key={v.code} value={v.code}>
                {v.name}
              </option>
            ))}
          </FormSelect>
          {isLoadingVillages && (
            <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 animate-spin text-gray-400" size={16} />
          )}
        </div>
        {errors.domicile_village_code && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_village_code}</p>
        )}
      </div>

      {/* Postal Code Input */}
      <div>
        <label className={styles.label}>Kode Pos</label>
        <FormInput
          type="text"
          value={values.domicile_postal_code || ""}
          onChange={(e) => onChange("domicile_postal_code", e.target.value)}
          placeholder="Kode pos"
          className={`${styles.input} ${
            errors.domicile_postal_code ? styles.errorSelect : ""
          }`}
        />
        {errors.domicile_postal_code && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_postal_code}</p>
        )}
      </div>

      {/* Detail Address Input */}
      <div>
        <label className={styles.label}>Alamat Detail</label>
        <FormTextarea
          value={values.domicile_address || ""}
          onChange={(e) => onChange("domicile_address", e.target.value)}
          placeholder="Contoh: Jl. Melati No. 10, RT 01/RW 02"
          className={`${styles.textarea} ${
            errors.domicile_address ? styles.errorSelect : ""
          }`}
        />
        {errors.domicile_address && (
          <p className="text-red-500 text-xs mt-1">{errors.domicile_address}</p>
        )}
      </div>
    </div>
  );
}

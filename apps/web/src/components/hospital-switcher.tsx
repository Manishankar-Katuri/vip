"use client";

import { Building2 } from "lucide-react";

import { useHospital } from "@/hooks/useHospital";
export function HospitalSwitcher() {
  const {
    activeHospital,
    availableHospitals,
    currentUser,
    isLoading,
    setActiveHospital
  } = useHospital();

  if (
    currentUser &&
    !currentUser.isGlobal
  ) {
    return null;
  }

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <Building2 className="h-4 w-4" aria-hidden="true" />
      <select
        className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500"
        value={activeHospital?.id ?? ""}
        disabled={isLoading || availableHospitals.length === 0}
        onChange={(event) => {
          void setActiveHospital(event.target.value);
        }}
        aria-label="Select active hospital"
      >
        {availableHospitals.map((hospital) => (
          <option
            key={hospital.id}
            value={hospital.id}
          >
            {hospital.name}
          </option>
        ))}
      </select>
    </label>
  );
}

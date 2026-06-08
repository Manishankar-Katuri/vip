"use client";

import { useContext } from "react";

import { HospitalContext } from "@/providers/HospitalContextProvider";

export function useHospital() {
  const context = useContext(HospitalContext);

  if (!context) {
    throw new Error(
      "useHospital must be used within HospitalContextProvider"
    );
  }

  return context;
}

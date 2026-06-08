"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  apiFetch,
  getAccessToken,
  getSelectedHospitalId,
  setSelectedHospitalId
} from "@/lib/api-client";
import type {
  AuthUser,
  Permission,
  UserRole
} from "@/permissions";

export type Hospital = {
  id:string;
  name:string;
  slug:string;
  specialty:string | null;
  city:string | null;
  status:string;
};

type HospitalListResponse = {
  hospitals:Hospital[];
  activeHospital:Hospital | null;
};

type HospitalSelectResponse = {
  selectedHospitalId:string;
  activeHospital:Hospital;
};

type MyPermissionsResponse = {
  permissions:Permission[];
};

export type HospitalContextValue = {
  activeHospital:Hospital | null;
  availableHospitals:Hospital[];
  currentUser:AuthUser | null;
  isLoading:boolean;
  setActiveHospital:(hospital:Hospital | string) => Promise<void>;
  refreshHospitals:() => Promise<void>;
};

export const HospitalContext =
  createContext<HospitalContextValue | null>(null);

export function HospitalContextProvider({
  children
}: Readonly<{
  children:React.ReactNode;
}>) {
  const [activeHospital, setActiveHospitalState] =
    useState<Hospital | null>(null);
  const [availableHospitals, setAvailableHospitals] =
    useState<Hospital[]>([]);
  const [currentUser, setCurrentUser] =
    useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshHospitals = useCallback(async () => {
    const user = decodeCurrentUser();

    setCurrentUser(user);

    if (!user) {
      setAvailableHospitals([]);
      setActiveHospitalState(null);
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch<HospitalListResponse>(
        "/hospitals"
      );
      const selectedHospitalId = getSelectedHospitalId();
      const selectedHospital =
        response.activeHospital ??
        response.hospitals.find(
          (hospital) => hospital.id === selectedHospitalId
        ) ??
        response.hospitals[0] ??
        null;

      setAvailableHospitals(response.hospitals);
      setActiveHospitalState(selectedHospital);

      if (selectedHospital) {
        setSelectedHospitalId(selectedHospital.id);
      }

      if (selectedHospital) {
        const permissions = await loadEffectivePermissions(
          selectedHospital.id
        );

        setCurrentUser({
          ...user,
          permissions
        });
      }
    } catch {
      setAvailableHospitals([]);
      setActiveHospitalState(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void refreshHospitals();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [refreshHospitals]);

  const setActiveHospital = useCallback(
    async (hospital:Hospital | string) => {
      const hospitalId =
        typeof hospital === "string"
          ? hospital
          : hospital.id;
      const user = decodeCurrentUser();

      if (!user) {
        return;
      }

      if (!user.isGlobal) {
        const assignedHospital =
          availableHospitals.find(
            (candidate) => candidate.id === user.hospitalId
          ) ?? null;

        if (assignedHospital?.id !== hospitalId) {
          throw new Error(
            "Hospital-scoped users cannot switch hospitals"
          );
        }

        setSelectedHospitalId(hospitalId);
        setActiveHospitalState(assignedHospital);
        setCurrentUser({
          ...user,
          permissions:await loadEffectivePermissions(hospitalId)
        });
        return;
      }

      try {
        const response = await apiFetch<HospitalSelectResponse>(
          "/hospitals/select",
          {
            method:"POST",
            body:JSON.stringify({ hospitalId }),
            hospitalId
          }
        );

        setSelectedHospitalId(response.selectedHospitalId);
        setActiveHospitalState(response.activeHospital);
        setCurrentUser({
          ...user,
          permissions:await loadEffectivePermissions(
            response.selectedHospitalId
          )
        });
      } catch {
        setActiveHospitalState(null);
        setCurrentUser({
          ...user,
          permissions:undefined
        });
      }
    },
    [availableHospitals]
  );

  const value = useMemo(
    () => ({
      activeHospital,
      availableHospitals,
      currentUser,
      isLoading,
      setActiveHospital,
      refreshHospitals
    }),
    [
      activeHospital,
      availableHospitals,
      currentUser,
      isLoading,
      setActiveHospital,
      refreshHospitals
    ]
  );

  return (
    <HospitalContext.Provider value={value}>
      {children}
    </HospitalContext.Provider>
  );
}

async function loadEffectivePermissions(
  hospitalId:string
) {
  try {
    const response = await apiFetch<MyPermissionsResponse>(
      "/auth/permissions/me",
      { hospitalId }
    );

    return response.permissions;
  } catch {
    return undefined;
  }
}

function decodeCurrentUser():AuthUser | null {
  const token = getAccessToken();

  if (!token) {
    return null;
  }

  const [, encodedPayload] = token.split(".");

  if (!encodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(
      base64UrlDecode(encodedPayload)
    ) as Partial<AuthUser>;

    if (
      typeof payload.userId !== "string" ||
      !isUserRole(payload.role) ||
      typeof payload.isGlobal !== "boolean"
    ) {
      return null;
    }

    return {
      userId:payload.userId,
      role:payload.role,
      hospitalId:
        typeof payload.hospitalId === "string"
          ? payload.hospitalId
          : null,
      isGlobal:payload.isGlobal
    };
  } catch {
    return null;
  }
}

function base64UrlDecode(
  value:string
) {
  const base64 = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - base64.length % 4) % 4),
    "="
  );

  return atob(padded);
}

function isUserRole(
  role:unknown
): role is UserRole {
  return (
    role === "ADMIN" ||
    role === "DOCTOR" ||
    role === "PRODUCTION" ||
    role === "STAFF"
  );
}

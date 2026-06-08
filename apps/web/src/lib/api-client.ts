export type ApiClientOptions = RequestInit & {
  hospitalId?:string | null;
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api";

const SELECTED_HOSPITAL_STORAGE_KEY = "vip.selectedHospitalId";
const ACCESS_TOKEN_STORAGE_KEY = "vip_access_token";

export async function apiFetch<T>(
  path:string,
  options:ApiClientOptions = {}
):Promise<T> {
  const headers = new Headers(options.headers);
  const hospitalId =
    options.hospitalId ??
    getSelectedHospitalId();
  const token = getAccessToken();

  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (hospitalId) {
    headers.set("x-hospital-id", hospitalId);
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(
    buildApiUrl(path),
    {
      ...options,
      headers,
      credentials:"include"
    }
  );

  if (!response.ok) {
    throw new Error(
      `VIP API request failed with ${response.status}`
    );
  }

  return response.json() as Promise<T>;
}

function buildApiUrl(path:string) {
  const base = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  const normalizedPath = path.startsWith("/")
    ? path
    : `/${path}`;

  return `${base}${normalizedPath}`;
}

export function getSelectedHospitalId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(
    SELECTED_HOSPITAL_STORAGE_KEY
  );
}

export function setSelectedHospitalId(
  hospitalId:string
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    SELECTED_HOSPITAL_STORAGE_KEY,
    hospitalId
  );
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return (
    window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) ??
    getCookie("vip_access_token") ??
    getCookie("access_token")
  );
}

function getCookie(
  name:string
) {
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`));

  return match
    ? decodeURIComponent(match.split("=")[1] ?? "")
    : null;
}

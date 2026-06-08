import { googleFetch } from "@/lib/google/client";

export type BusinessLocation = {
  name: string;
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  phoneNumbers?: { primaryPhone?: string };
  categories?: { primaryCategory?: { displayName?: string } };
};

type AccountResponse = { accounts?: Array<{ name: string }> };
type LocationResponse = { locations?: BusinessLocation[] };

export async function getBusinessLocations(): Promise<BusinessLocation[]> {
  const accounts = await googleFetch<AccountResponse>("https://mybusinessaccountmanagement.googleapis.com/v1/accounts");
  const accountId = accounts.accounts?.[0]?.name;
  if (!accountId) return [];

  const readMask = encodeURIComponent("name,title,storefrontAddress,phoneNumbers,categories");
  const locations = await googleFetch<LocationResponse>(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=${readMask}&pageSize=100`,
  );
  return locations.locations ?? [];
}

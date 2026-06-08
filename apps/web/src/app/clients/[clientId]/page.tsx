import { OwnerClientDetailPage } from "@/components/owner/owner-client-detail-page";

export const dynamic = "force-dynamic";

type ClientDetailPageProps = {
  params: Promise<{ clientId: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const { clientId } = await params;

  return <OwnerClientDetailPage clientId={clientId} />;
}

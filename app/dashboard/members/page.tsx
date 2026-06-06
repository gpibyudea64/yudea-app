import MembersPage from "@/components/members";

export default async function MembersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string }>;
}) {
  const params = await searchParams;
  return <MembersPage initialRegion={params.region} />;
}

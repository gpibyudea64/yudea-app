import MembersPage from "@/components/members";

export default async function MembersDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ region?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  return (
    <MembersPage
      initialRegion={params.region}
      initialSortBy={params.sortBy}
      initialSortOrder={params.sortOrder === "desc" ? "desc" : "asc"}
    />
  );
}

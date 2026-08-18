import BirthdayDashboard from "@/components/dashboard/birthday";

export default async function BirthdayDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  return (
    <BirthdayDashboard
      initialSortBy={params.sortBy}
      initialSortOrder={params.sortOrder === "desc" ? "desc" : "asc"}
    />
  );
}

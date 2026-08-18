import ReportPage from "@/components/report";

export default async function ReportDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  return (
    <ReportPage
      initialSortBy={params.sortBy}
      initialSortOrder={params.sortOrder === "desc" ? "desc" : "asc"}
    />
  );
}

import AttendancePage from "@/components/attendance";

export default async function AttendanceDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  return (
    <AttendancePage
      initialSortBy={params.sortBy}
      initialSortOrder={params.sortOrder === "desc" ? "desc" : "asc"}
    />
  );
}

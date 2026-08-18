import PresbyterPage from "@/components/presbyter";

export default async function PresbyteryPage({
  searchParams,
}: {
  searchParams: Promise<{ sortBy?: string; sortOrder?: string }>;
}) {
  const params = await searchParams;
  return (
    <PresbyterPage
      initialSortBy={params.sortBy}
      initialSortOrder={params.sortOrder === "desc" ? "desc" : "asc"}
    />
  );
}

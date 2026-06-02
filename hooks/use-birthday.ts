import { getBirthdayMembers } from "@/lib/api/birthday";
import { useQuery } from "@tanstack/react-query";

const QUERY_KEY = "birthday-members";

export function useBirthdayMembers(date?: string) {
  return useQuery({
    queryKey: [QUERY_KEY, date],
    queryFn: () => getBirthdayMembers(date),
  });
}

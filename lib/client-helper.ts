import { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export const getServiceTypeColor = (type: string) => {
  const types: Record<string, BadgeVariant> = {
    "Sunday Service": "default",
    "Wednesday Service": "secondary",
    "Youth Service": "destructive",
    "Children's Church": "outline",
  };
  return types[type] || "default";
};

export function formatPelkatName(input: string): string {
  return input
    .toLowerCase() // Convert to lowercase first
    .split("_") // Split by underscore
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter
    .join(" "); // Join with space
}

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString();
}

export function formatLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function buildMemberAddress(member: {
  address?: string | null;
  kotaKabupaten?: string | null;
  kecamatan?: string | null;
  memberAddress?: string | null;
  memberKotaKabupaten?: string | null;
  memberKecamatan?: string | null;
  sameAddressAsFamily?: boolean;
  family?: {
    address?: string | null;
    kotaKabupaten?: string | null;
    kecamatan?: string | null;
  } | null;
}): string {
  if (member.sameAddressAsFamily === false && member.memberAddress) {
    return [member.memberAddress, member.memberKotaKabupaten, member.memberKecamatan]
      .filter(Boolean)
      .join(", ");
  }
  const f = member.family;
  if (!f) return "";
  return [f.address, f.kotaKabupaten, f.kecamatan].filter(Boolean).join(", ");
}

import { badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

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

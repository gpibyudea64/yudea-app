"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

type SortableHeaderProps = {
  label: string;
  sortBy: string;
  currentSortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (sortBy: string) => void;
  className?: string;
};

/**
 * A table header that toggles server-side sorting when clicked.
 * Mirrors the inline sort button markup used in the members/families tables.
 */
export function SortableHeader({
  label,
  sortBy,
  currentSortBy,
  sortOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSortBy === sortBy;
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1 hover:text-primary transition-colors cursor-pointer ${className ?? ""}`}
      onClick={() => onSort(sortBy)}
    >
      {label}
      {isActive ? (
        sortOrder === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
      )}
    </button>
  );
}

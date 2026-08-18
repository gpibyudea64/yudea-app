import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Mock next/navigation for components that use useRouter or usePathname
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/members",
}));

// Mock next-auth/react for components using useSession
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { StatCard } from "@/components/dashboard/stat-card";
import { DataTableControls } from "@/components/ui/data-table-controls";
import PelkatSelect from "@/components/ui/pelkat-select";
import AttendanceCard from "@/components/attendance/attendance-card";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StatCard", () => {
  it("renders title, description, and quantity", () => {
    render(
      <StatCard title="Total Members" description="Active members" quantity={42} />,
    );
    expect(screen.getByText("Total Members")).toBeDefined();
    expect(screen.getByText("42")).toBeDefined();
    expect(screen.getByText("Active members")).toBeDefined();
  });

  it("renders with custom icon", () => {
    render(
      <StatCard
        title="Test"
        description="Desc"
        quantity={5}
        icon={<span data-testid="custom-icon">*</span>}
      />,
    );
    expect(screen.getByTestId("custom-icon")).toBeDefined();
  });
});

describe("DataTableControls", () => {
  function createProps(overrides = {}) {
    return {
      search: "",
      onSearchChange: vi.fn(),
      searchPlaceholder: "Search items...",
      meta: { total: 100, page: 2, limit: 10, totalPages: 10 },
      onPageChange: vi.fn(),
      onLimitChange: vi.fn(),
      ...overrides,
    };
  }

  it("renders pagination info", () => {
    render(<DataTableControls {...createProps()} />);
    expect(screen.getByText(/Showing/)).toBeDefined();
    expect(screen.getByText(/100/)).toBeDefined();
  });

  it("renders previous/next navigation buttons", () => {
    render(<DataTableControls {...createProps()} />);
    expect(screen.getByLabelText("Previous page")).toBeDefined();
    expect(screen.getByLabelText("Next page")).toBeDefined();
  });

  it("renders search input with placeholder", () => {
    render(<DataTableControls {...createProps()} />);
    expect(screen.getByPlaceholderText("Search items...")).toBeDefined();
  });

  it("calls onSearchChange when typing in search", async () => {
    const onSearchChange = vi.fn();
    const onPageChange = vi.fn();
    render(
      <DataTableControls
        {...createProps({ onSearchChange, onPageChange })}
      />,
    );
    const input = screen.getByPlaceholderText("Search items...");
    await userEvent.type(input, "a");
    expect(onSearchChange).toHaveBeenCalled();
  });

  it("disables previous button on first page", () => {
    render(
      <DataTableControls
        {...createProps({ meta: { total: 10, page: 1, limit: 10, totalPages: 1 } })}
      />,
    );
    const prevButton = screen.getByLabelText("Previous page");
    expect(prevButton).toBeDisabled();
  });

  it("disables next button on last page", () => {
    render(
      <DataTableControls
        {...createProps({ meta: { total: 10, page: 1, limit: 10, totalPages: 1 } })}
      />,
    );
    const nextButton = screen.getByLabelText("Next page");
    expect(nextButton).toBeDisabled();
  });

  it("renders with empty data", () => {
    render(
      <DataTableControls
        {...createProps({ meta: { total: 0, page: 1, limit: 10, totalPages: 1 } })}
      />,
    );
    // Text is split across elements, use function matcher
    expect(screen.getByText((content) => content.includes("Showing"))).toBeDefined();
  });
});

describe("PelkatSelect", () => {
  it("renders select with pelkat options", () => {
    render(
      <PelkatSelect
        pelkat="all"
        onPelkatChange={vi.fn()}
        onPageChange={vi.fn()}
      />,
    );
    expect(screen.getByText("All Pelkat")).toBeDefined();
  });
});

describe("AttendanceCard", () => {
  it("renders card title and content number", () => {
    render(
      <AttendanceCard
        cardTitle="Total Attendance"
        contentNumber={150}
        contentText="All time"
        titleIcon={<span>icon</span>}
        backgroundClass="bg-blue-500"
      />,
    );
    expect(screen.getByText("Total Attendance")).toBeDefined();
    expect(screen.getByText("150")).toBeDefined();
    expect(screen.getByText("All time")).toBeDefined();
  });

  it("renders with zero values", () => {
    render(
      <AttendanceCard
        cardTitle="Average"
        contentNumber={0}
        contentText="Per service"
        titleIcon={null}
        backgroundClass="bg-green-500"
      />,
    );
    expect(screen.getByText("0")).toBeDefined();
  });
});

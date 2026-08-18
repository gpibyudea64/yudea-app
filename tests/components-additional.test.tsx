import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/dashboard/branches",
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({ data: null, status: "unauthenticated" })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock hooks
vi.mock("@/hooks/use-page-access", () => ({
  usePageAccess: () => ({ canView: true, canEdit: true, role: "ADMIN" }),
}));

vi.mock("@/hooks/use-branch", () => ({
  useBranches: vi.fn(),
  useCreateBranch: vi.fn(),
  useUpdateBranch: vi.fn(),
  useDeleteBranch: vi.fn(),
}));

vi.mock("@/hooks/use-region", () => ({
  useRegions: vi.fn(() => ({ data: { data: [], meta: { total: 0, page: 1, limit: 999, totalPages: 1 } } })),
  useCreateRegion: vi.fn(),
  useUpdateRegion: vi.fn(),
  useDeleteRegion: vi.fn(),
}));

vi.mock("@/hooks/use-member", () => ({
  usePresbyters: vi.fn(),
  useMembers: vi.fn(),
  useDeleteMember: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useUpdateMember: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateMember: vi.fn(),
}));

vi.mock("@/hooks/use-family", () => ({
  useFamilies: vi.fn(),
  useDeleteFamily: vi.fn(() => ({ mutateAsync: vi.fn() })),
  useCreateFamily: vi.fn(),
  useUpdateFamily: vi.fn(),
}));

import { useBranches } from "@/hooks/use-branch";
import { usePresbyters, useMembers } from "@/hooks/use-member";
import { useFamilies } from "@/hooks/use-family";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BranchPage from "@/components/branch/index";
import PresbyterPage from "@/components/presbyter/index";
import FamiliesPage from "@/components/family/index";
import MembersPage from "@/components/members/index";

afterEach(() => {
  vi.restoreAllMocks();
});

// ── UI Component Tests ──

describe("Badge", () => {
  it("renders children text", () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText("Active")).toBeDefined();
  });

  it("renders with default variant", () => {
    render(<Badge>Default</Badge>);
    expect(screen.getByText("Default")).toBeDefined();
  });

  it("renders with outline variant", () => {
    render(<Badge variant="outline">Outline</Badge>);
    expect(screen.getByText("Outline")).toBeDefined();
  });

  it("renders with destructive variant", () => {
    render(<Badge variant="destructive">Destructive</Badge>);
    expect(screen.getByText("Destructive")).toBeDefined();
  });

  it("renders with secondary variant", () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText("Secondary")).toBeDefined();
  });

  it("applies custom className", () => {
    render(<Badge className="custom-class">Styled</Badge>);
    expect(screen.getByText("Styled")).toBeDefined();
  });
});

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("renders with different variants", () => {
    const { rerender } = render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByText("Delete")).toBeDefined();

    rerender(<Button variant="outline">Cancel</Button>);
    expect(screen.getByText("Cancel")).toBeDefined();
  });

  it("handles click events", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    await userEvent.click(screen.getByText("Click"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("is disabled when disabled prop is true", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByText("Disabled")).toBeDisabled();
  });

  it("renders as child component with asChild", () => {
    render(
      <Button asChild>
        <a href="/test">Link</a>
      </Button>,
    );
    expect(screen.getByText("Link")).toBeDefined();
  });
});

describe("Card", () => {
  it("renders card header, title, and content", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>Card content</CardContent>
      </Card>,
    );
    expect(screen.getByText("Card Title")).toBeDefined();
    expect(screen.getByText("Card content")).toBeDefined();
  });

  it("applies custom className to card", () => {
    render(
      <Card className="shadow-xl">
        <CardContent>Content</CardContent>
      </Card>,
    );
    expect(screen.getByText("Content")).toBeDefined();
  });
});

// ── Page Rendering Tests (with mocked data) ──

describe("BranchesPage rendering", () => {
  it("renders loading state with correct title", () => {
    vi.mocked(useBranches).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<BranchPage />);
    expect(screen.getByText("Branch Management")).toBeDefined();
  });

  it("renders empty state", () => {
    vi.mocked(useBranches).mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    render(<BranchPage />);
    expect(screen.getByText("No Wilayah Pelayanan records found")).toBeDefined();
  });
});

describe("PresbyterPage rendering", () => {
  it("renders title and loading state", () => {
    vi.mocked(usePresbyters).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(<PresbyterPage />);
    expect(screen.getByText("Presbyter Management")).toBeDefined();
  });

  it("renders empty state", () => {
    vi.mocked(usePresbyters).mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    render(<PresbyterPage />);
    expect(screen.getByText("No presbyter records found")).toBeDefined();
  });

  it("renders list of presbyters with names", () => {
    vi.mocked(usePresbyters).mockReturnValue({
      data: {
        data: [
          {
            id: "1",
            firstName: "John",
            lastName: "Doe",
            birthDate: "1980-01-15",
            role: "FAMILY_HEAD",
            isActive: true,
            family: { region: { name: "Sektor A" } },
          },
          {
            id: "2",
            firstName: "Jane",
            lastName: "Smith",
            birthDate: "1985-06-20",
            role: "WIFE",
            isActive: true,
            family: { region: { name: "Sektor B" } },
          },
        ],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      },
      isLoading: false,
    } as any);

    render(<PresbyterPage />);
    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Jane Smith")).toBeDefined();
  });
});

describe("FamiliesPage rendering", () => {
  it("renders with empty state", () => {
    vi.mocked(useFamilies).mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <FamiliesPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Family Management")).toBeDefined();
    expect(screen.getByText("No family records found")).toBeDefined();
  });

  it("renders loading state", () => {
    vi.mocked(useFamilies).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <FamiliesPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Family Management")).toBeDefined();
    expect(screen.getByText("Loading family data...")).toBeDefined();
  });

  it("renders family records in table", () => {
    const familiesData = [
      {
        id: "1",
        familyName: "Smith Family",
        address: "Jl. Merdeka 123",
        kotaKabupaten: "Jakarta",
        kecamatan: "Menteng",
        kelurahan: "Gondangdia",
        provinsi: "DKI Jakarta",
        regionId: "r1",
        region: { id: "r1", name: "Sektor A" },
        members: [
          { id: "m1", firstName: "John", lastName: "Smith", isActive: true, role: "FAMILY_HEAD" },
          { id: "m2", firstName: "Jane", lastName: "Smith", isActive: true, role: "WIFE" },
        ],
      },
      {
        id: "2",
        familyName: "Doe Family",
        address: "Jl. Sudirman 456",
        kotaKabupaten: "Bandung",
        kecamatan: "Coblong",
        kelurahan: "Dago",
        provinsi: "Jawa Barat",
        regionId: "r2",
        region: { id: "r2", name: "Sektor B" },
        members: [{ id: "m3", firstName: "John", lastName: "Doe", isActive: false, role: "FAMILY_HEAD" }],
      },
    ];

    vi.mocked(useFamilies).mockReturnValue({
      data: { data: familiesData, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <FamiliesPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("Smith Family")).toBeDefined();
    expect(screen.getByText("Doe Family")).toBeDefined();
    expect(screen.getByText("Sektor A")).toBeDefined();
    expect(screen.getByText("Sektor B")).toBeDefined();
    expect(screen.getByText("Jakarta")).toBeDefined();
    expect(screen.getByText("Bandung")).toBeDefined();
    expect(screen.getByText("Aktif")).toBeDefined();
    expect(screen.getByText("Tidak Aktif")).toBeDefined();
    expect(screen.getAllByText("Edit").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Delete").length).toBeGreaterThanOrEqual(1);
  });
});

describe("MembersPage rendering", () => {
  it("renders with empty state", () => {
    vi.mocked(useMembers).mockReturnValue({
      data: { data: [], meta: { total: 0, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MembersPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Member Management")).toBeDefined();
    expect(screen.getByText("No member records found")).toBeDefined();
  });

  it("renders loading state", () => {
    vi.mocked(useMembers).mockReturnValue({
      data: undefined,
      isLoading: true,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MembersPage />
      </QueryClientProvider>,
    );
    expect(screen.getByText("Member Management")).toBeDefined();
    expect(screen.getByText("Loading member data...")).toBeDefined();
  });

  it("renders member records in table", () => {
    const membersData = [
      {
        id: "1",
        firstName: "John",
        lastName: "Doe",
        birthDate: "1980-01-15T00:00:00.000Z",
        role: "FAMILY_HEAD",
        pelkat: "PERSEKUTUAN_KAUM_BAPAK",
        isActive: true,
        isDeceased: false,
        deathDate: null,
        family: {
          id: "f1",
          familyName: "Doe Family",
          address: "Jl. Test 1",
          regionId: "r1",
          region: { id: "r1", name: "Sektor A" },
        },
      },
      {
        id: "2",
        firstName: "Jane",
        lastName: "Smith",
        birthDate: "1985-06-20T00:00:00.000Z",
        role: "WIFE",
        pelkat: "PERSEKUTUAN_KAUM_PEREMPUAN",
        isActive: false,
        isDeceased: true,
        deathDate: "2025-03-10T00:00:00.000Z",
        family: {
          id: "f2",
          familyName: "Smith Family",
          address: "Jl. Test 2",
          regionId: "r2",
          region: { id: "r2", name: "Sektor B" },
        },
      },
    ];

    vi.mocked(useMembers).mockReturnValue({
      data: { data: membersData, meta: { total: 2, page: 1, limit: 10, totalPages: 1 } },
      isLoading: false,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MembersPage />
      </QueryClientProvider>,
    );

    expect(screen.getByText("John Doe")).toBeDefined();
    expect(screen.getByText("Jane Smith")).toBeDefined();
    expect(screen.getByText("Sektor A")).toBeDefined();
    expect(screen.getByText("Sektor B")).toBeDefined();
    expect(screen.getByText("Hidup")).toBeDefined();
    expect(screen.getByText("Meninggal")).toBeDefined();
    expect(screen.getAllByText("Edit").length).toBeGreaterThanOrEqual(1);
  });
});

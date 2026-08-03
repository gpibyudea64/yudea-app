import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDialogForm } from "@/hooks/use-dialog-form";

describe("useDialogForm", () => {
  it("resets to default values when editing is null and dialog opens", () => {
    const reset = vi.fn();
    const defaults = { name: "", age: 0, active: false };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing: null, open: true }),
    );

    expect(reset).toHaveBeenCalledWith(defaults);
  });

  it("resets to default values when editing is undefined and dialog opens", () => {
    const reset = vi.fn();
    const defaults = { name: "", age: 0 };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing: undefined, open: true }),
    );

    expect(reset).toHaveBeenCalledWith(defaults);
  });

  it("merges editing values on top of defaults", () => {
    const reset = vi.fn();
    const defaults = { name: "", age: 0, email: "" };
    const editing = { name: "John", age: 30 };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      name: "John",
      age: 30,
      email: "",
    });
  });

  it("converts Date objects to YYYY-MM-DD strings", () => {
    const reset = vi.fn();
    const defaults = { name: "", birthDate: "" };
    const editing = { name: "John", birthDate: new Date("1990-03-15T12:00:00Z") };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      name: "John",
      birthDate: "1990-03-15",
    });
  });

  it("converts ISO date strings to YYYY-MM-DD format", () => {
    const reset = vi.fn();
    const defaults = { name: "", birthDate: "" };
    const editing = {
      name: "John",
      birthDate: "1990-03-15T00:00:00.000Z",
    };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      name: "John",
      birthDate: "1990-03-15",
    });
  });

  it("passes through plain date strings (YYYY-MM-DD) unchanged", () => {
    const reset = vi.fn();
    const defaults = { name: "", birthDate: "" };
    const editing = { name: "John", birthDate: "1990-03-15" };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      name: "John",
      birthDate: "1990-03-15",
    });
  });

  it("only includes fields that exist in defaults from editing record", () => {
    const reset = vi.fn();
    const defaults = { name: "" };
    const editing = { name: "John", extraField: "should be ignored" };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    // extraField should not appear in the result since it's not in defaults
    const callArg = reset.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.name).toBe("John");
    expect(callArg).not.toHaveProperty("extraField");
  });

  it("passes through non-date string values unchanged", () => {
    const reset = vi.fn();
    const defaults = { name: "", city: "" };
    const editing = { name: "John", city: "Jakarta" };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      name: "John",
      city: "Jakarta",
    });
  });

  it("passes through number values unchanged", () => {
    const reset = vi.fn();
    const defaults = { count: 0, price: 0 };
    const editing = { count: 42, price: 19.99 };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      count: 42,
      price: 19.99,
    });
  });

  it("passes through boolean values unchanged", () => {
    const reset = vi.fn();
    const defaults = { active: false, verified: true };
    const editing = { active: true, verified: false };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    expect(reset).toHaveBeenCalledWith({
      active: true,
      verified: false,
    });
  });

  it("resets to defaults on mount even when dialog is closed", () => {
    const reset = vi.fn();
    const defaults = { name: "" };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing: null, open: false }),
    );

    // The effect runs on mount and resets to defaults regardless of open state
    expect(reset).toHaveBeenCalledWith(defaults);
  });

  it("handles empty defaults object", () => {
    const reset = vi.fn();
    const defaults = {};
    const editing = { name: "John" };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    // No keys match between defaults and editing, so reset with empty values
    expect(reset).toHaveBeenCalledWith({});
  });

  it("falls back to defaults for null values in editing record", () => {
    const reset = vi.fn();
    const defaults = { name: "", email: "" };
    const editing = { name: "John", email: null };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    // DB nullable fields come back as `null`; the forms use "" and the API
    // schemas reject `null`, so null falls back to the default value.
    expect(reset).toHaveBeenCalledWith({
      name: "John",
      email: "",
    });
  });

  it("handles nested object values", () => {
    const reset = vi.fn();
    const defaults = { user: { name: "" }, tags: [] };
    const editing = { user: { name: "John" }, tags: ["a", "b"] };

    renderHook(() =>
      useDialogForm(reset, defaults, { editing, open: true }),
    );

    const callArg = reset.mock.calls[0][0] as Record<string, unknown>;
    expect(callArg.user).toEqual({ name: "John" });
    expect(callArg.tags).toEqual(["a", "b"]);
  });
});

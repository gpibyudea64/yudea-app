import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { handleApiError, validateBody } from "@/lib/api-validate";
import { NextResponse } from "next/server";

// A simple test schema
const testSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  age: z.number().int().min(0).optional(),
});

describe("validateBody", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed data on successful validation", () => {
    const body = { name: "John", email: "john@example.com" };
    const result = validateBody(testSchema, body);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data).toEqual(body);
  });

  it("applies schema defaults when fields are omitted", () => {
    const schemaWithDefaults = z.object({
      name: z.string(),
      role: z.string().default("MEMBER"),
    });

    const result = validateBody(schemaWithDefaults, { name: "Jane" });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ name: "Jane", role: "MEMBER" });
  });

  it("coerces values when schema has coercion", () => {
    const schemaWithCoerce = z.object({
      count: z.coerce.number().int(),
    });

    const result = validateBody(schemaWithCoerce, { count: "42" });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ count: 42 });
  });

  it("returns 400 response on validation failure", () => {
    const body = { name: "", email: "not-an-email" };
    const result = validateBody(testSchema, body);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(400);
  });

  it("returns field-level error details in 400 response", async () => {
    const body = { name: "", email: "bad" };
    const result = validateBody(testSchema, body);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();

    const responseBody = await result.error!.json();
    expect(responseBody.error).toBe("Validation failed");
    expect(responseBody.details).toBeDefined();
    expect(responseBody.details.name).toBeDefined();
    expect(responseBody.details.email).toBeDefined();
  });

  it("logs validation error with label on failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    validateBody(testSchema, { name: "", email: "x" }, "createMember");

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logArg = consoleSpy.mock.calls[0][0];
    expect(logArg).toContain("[validation]");
    expect(logArg).toContain("createMember");
  });

  it("logs validation error without label on failure", () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    validateBody(testSchema, { name: "", email: "x" });

    expect(consoleSpy).toHaveBeenCalledTimes(1);
    const logArg = consoleSpy.mock.calls[0][0];
    expect(logArg).toContain("[validation]");
    expect(logArg).toContain("request");
  });

  it("handles empty object against schema with all required fields", () => {
    const result = validateBody(testSchema, {});

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(400);
  });

  it("handles null body", () => {
    const result = validateBody(testSchema, null);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(400);
  });

  it("handles undefined body", () => {
    const result = validateBody(testSchema, undefined);

    expect(result.data).toBeNull();
    expect(result.error).not.toBeNull();
  });

  it("strips unknown fields that are not in the schema", () => {
    const body = {
      name: "John",
      email: "john@example.com",
      unknownField: "should be stripped",
    };
    const result = validateBody(testSchema, body);

    expect(result.error).toBeNull();
    expect(result.data).not.toBeNull();
    expect(result.data).not.toHaveProperty("unknownField");
  });

  it("accepts additional fields when schema uses passthrough", () => {
    const passthroughSchema = z
      .object({
        name: z.string(),
      })
      .passthrough();

    const result = validateBody(passthroughSchema, {
      name: "John",
      extra: "allowed",
    });

    expect(result.error).toBeNull();
    expect(result.data).toEqual({ name: "John", extra: "allowed" });
  });

  it("validates nested objects", () => {
    const nestedSchema = z.object({
      user: z.object({
        name: z.string().min(1),
        address: z.object({
          city: z.string().min(1),
        }),
      }),
    });

    const validResult = validateBody(nestedSchema, {
      user: { name: "John", address: { city: "Jakarta" } },
    });
    expect(validResult.error).toBeNull();
    expect(validResult.data).toBeDefined();

    const invalidResult = validateBody(nestedSchema, {
      user: { name: "", address: { city: "" } },
    });
    expect(invalidResult.data).toBeNull();
    expect(invalidResult.error).not.toBeNull();
    expect(invalidResult.error!.status).toBe(400);
  });

  it("validates arrays", () => {
    const arraySchema = z.object({
      tags: z.array(z.string().min(1)).min(1),
    });

    const validResult = validateBody(arraySchema, { tags: ["a", "b"] });
    expect(validResult.error).toBeNull();

    const invalidResult = validateBody(arraySchema, { tags: [] });
    expect(invalidResult.data).toBeNull();
    expect(invalidResult.error).not.toBeNull();
  });

  it("validates union types", () => {
    const unionSchema = z.object({
      status: z.union([z.literal("ACTIVE"), z.literal("INACTIVE")]),
    });

    const validResult = validateBody(unionSchema, { status: "ACTIVE" });
    expect(validResult.error).toBeNull();

    const invalidResult = validateBody(unionSchema, { status: "BANNED" });
    expect(invalidResult.data).toBeNull();
    expect(invalidResult.error).not.toBeNull();
  });
});

describe("handleApiError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 500 response with fallback message", async () => {
    const response = handleApiError(new Error("DB failure"), "testLabel");

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("An unexpected error occurred");
  });

  it("returns custom fallback message when provided", async () => {
    const response = handleApiError(
      new Error("DB failure"),
      "testLabel",
      "Failed to process request",
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.error).toBe("Failed to process request");
  });

  it("logs the error with label", () => {
    const error = new Error("DB connection lost");

    handleApiError(error, "member GET");

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(vi.mocked(console.error).mock.calls[0][0]).toContain("[api]");
    expect(vi.mocked(console.error).mock.calls[0][0]).toContain("member GET");
    expect(vi.mocked(console.error).mock.calls[0][1]).toBe(error);
  });

  it("handles string errors", () => {
    const response = handleApiError("Something went wrong", "stringError");

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledTimes(1);
  });

  it("handles null/undefined errors gracefully", () => {
    const responseFromNull = handleApiError(null, "nullError");
    expect(responseFromNull.status).toBe(500);

    const responseFromUndefined = handleApiError(undefined, "undefinedError");
    expect(responseFromUndefined.status).toBe(500);

    expect(console.error).toHaveBeenCalledTimes(2);
  });

  it("handles error objects with custom properties", () => {
    const dbError = Object.assign(new Error("Query failed"), {
      code: "ER_DUP_ENTRY",
      errno: 1062,
    });

    const response = handleApiError(dbError, "dbQuery");

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledTimes(1);
    const loggedError = vi.mocked(console.error).mock.calls[0][1] as Error & {
      code: string;
    };
    expect(loggedError.code).toBe("ER_DUP_ENTRY");
  });

  it("returns a proper NextResponse instance", () => {
    const response = handleApiError(new Error("fail"), "test");

    expect(response).toBeInstanceOf(NextResponse);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

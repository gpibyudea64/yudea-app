import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

/**
 * Validates a request body against a Zod schema.
 *
 * On success returns the parsed (and type-safe) data.
 * On failure returns a 400 NextResponse with the validation errors
 * and logs the issue for debugging.
 */
export function validateBody<T>(
  schema: ZodSchema<T>,
  body: unknown,
  label?: string,
):
  | { data: T; error: null }
  | { data: null; error: NextResponse } {
  const result = schema.safeParse(body);
  if (!result.success) {
    const err = result.error as ZodError;
    console.error(
      `[validation] ${label ?? "request"} body rejected:`,
      err.flatten(),
    );
    return {
      data: null,
      error: NextResponse.json(
        {
          error: "Validation failed",
          details: err.flatten().fieldErrors,
        },
        { status: 400 },
      ),
    };
  }
  return { data: result.data, error: null };
}

/**
 * Wraps a catch clause — logs the error then returns a generic 500.
 * Drop this into every `catch` block to replace the silent `catch { … }`.
 */
export function handleApiError(
  error: unknown,
  label: string,
  fallbackMessage = "An unexpected error occurred",
) {
  console.error(`[api] ${label}:`, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}

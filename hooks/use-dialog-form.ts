import { useEffect } from "react"
import type { UseFormReset, FieldValues, DefaultValues } from "react-hook-form"

/**
 * Resets a react-hook-form when `editing` or `open` changes.
 * Eliminates the identical `useEffect(() => { reset(...) }, [editing, open, reset])`
 * pattern duplicated across 6+ dialog components.
 */
export function useDialogForm<TFieldValues extends FieldValues>(
  reset: UseFormReset<TFieldValues>,
  defaultValues: DefaultValues<TFieldValues>,
  { editing, open }: { editing: unknown; open: boolean },
) {
  useEffect(() => {
    const editingRecord = editing as Record<string, unknown> | null

    if (editingRecord) {
      const values: Record<string, unknown> = {}

      // Copy defaults and merge editing values on top
      const defaults = defaultValues as Record<string, unknown>
      for (const key of Object.keys(defaults)) {
        values[key] = defaults[key]
      }

      for (const key of Object.keys(editingRecord)) {
        if (key in values) {
          const val = editingRecord[key]
          // DB nullable string fields come back as `null` (e.g. jabatan,
          // gerejaAsal, deathDate). The forms' defaults use "" and the API
          // schemas reject `null` for these, so fall back to the default.
          if (val === null) {
            values[key] = defaults[key]
          } else if (val instanceof Date) {
            // Handle Date objects and ISO date strings — convert to date input string
            values[key] = val.toISOString().slice(0, 10)
          } else if (
            typeof val === 'string' &&
            /^\d{4}-\d{2}-\d{2}T/.test(val)
          ) {
            values[key] = val.slice(0, 10)
          } else {
            values[key] = val
          }
        }
      }

      reset(values as TFieldValues)
    } else {
      reset(defaultValues)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing, open, reset])
}

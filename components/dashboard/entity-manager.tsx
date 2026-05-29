"use client";

import { ReactNode, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PaginationMeta, SelectOption } from "@/type/shared";

type PrimitiveValue = string | number | boolean;
export type FormValues = Record<string, PrimitiveValue>;

type FieldConfig = {
  name: string;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "number" | "date" | "select" | "checkbox";
  options?: SelectOption[];
  required?: boolean;
  createRequired?: boolean;
  editRequired?: boolean;
  checkboxLabel?: string;
};

type ColumnConfig<TItem> = {
  key: string;
  label: string;
  render: (item: TItem) => ReactNode;
};

interface EntityManagerProps<TItem> {
  title: string;
  entityLabel: string;
  description: string;
  createLabel: string;
  updateLabel?: string;
  searchPlaceholder: string;
  fields: FieldConfig[];
  initialValues: FormValues;
  items: TItem[];
  columns: ColumnConfig<TItem>[];
  getItemId: (item: TItem) => string;
  filterItems: (item: TItem, query: string) => boolean;
  getEditValues: (item: TItem) => FormValues;
  onCreate: (values: FormValues) => Promise<void>;
  onUpdate: (item: TItem, values: FormValues) => Promise<void>;
  onDelete?: (item: TItem) => Promise<void>;
  isLoading?: boolean;
  isSubmitting?: boolean;
  deletingId?: string | null;
  editingId?: string | null;
  pagination?: PaginationMeta;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  emptyMessage?: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  renderRowActions?: (item: TItem) => ReactNode;
}

export function EntityManager<TItem>({
  title,
  entityLabel,
  description,
  createLabel,
  updateLabel = "Save Changes",
  searchPlaceholder,
  fields,
  initialValues,
  items,
  columns,
  getItemId,
  filterItems,
  getEditValues,
  onCreate,
  onUpdate,
  onDelete,
  isLoading = false,
  isSubmitting = false,
  deletingId = null,
  editingId = null,
  pagination,
  onPageChange,
  onPageSizeChange,
  emptyMessage = "No records found.",
  canCreate = true,
  canEdit = true,
  canDelete = true,
  renderRowActions,
}: EntityManagerProps<TItem>) {
  const [query, setQuery] = useState("");
  const [values, setValues] = useState<FormValues>(initialValues);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const editingItem = useMemo(
    () =>
      editingItemId
        ? items.find((item) => getItemId(item) === editingItemId) ?? null
        : null,
    [editingItemId, getItemId, items],
  );

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) => filterItems(item, normalizedQuery));
  }, [filterItems, items, query]);

  const canGoPrevious = (pagination?.page ?? 1) > 1;
  const canGoNext =
    pagination ? pagination.page < pagination.totalPages : false;

  const resetForm = () => {
    setEditingItemId(null);
    setValues(initialValues);
    setError(null);
  };

  const handleChange = (field: FieldConfig, nextValue: PrimitiveValue) => {
    setValues((current) => ({
      ...current,
      [field.name]: nextValue,
    }));
  };

  const handleEdit = (item: TItem) => {
    setError(null);
    setMessage(null);
    setEditingItemId(getItemId(item));
    setValues(getEditValues(item));
  };

  const handleCreateOpenChange = (open: boolean) => {
    setIsCreateOpen(open);
    if (open) {
      resetForm();
      setMessage(null);
    }
  };

  const handleEditOpenChange = (open: boolean) => {
    if (!open) {
      resetForm();
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    try {
      if (editingItem) {
        await onUpdate(editingItem, values);
        setMessage(`${entityLabel} updated successfully.`);
        setEditingItemId(null);
      } else {
        await onCreate(values);
        setMessage(`${entityLabel} created successfully.`);
        setIsCreateOpen(false);
      }

      resetForm();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : `Failed to save ${title.toLowerCase()}.`,
      );
    }
  };

  const isFieldRequired = (field: FieldConfig, mode: "create" | "edit") => {
    if (mode === "create" && typeof field.createRequired === "boolean") {
      return field.createRequired;
    }

    if (mode === "edit" && typeof field.editRequired === "boolean") {
      return field.editRequired;
    }

    return field.required;
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden border-white/70">
        <CardHeader className="shrink-0 border-b border-border/60 bg-[linear-gradient(135deg,rgba(34,71,146,0.08),rgba(204,169,88,0.08))] px-4 py-5 sm:px-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">
                Management
              </p>
              <CardTitle className="mt-2 text-xl tracking-tight sm:text-2xl">
                {title}
              </CardTitle>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                {description}
              </p>
            </div>

            {canCreate ? (
              <Dialog open={isCreateOpen} onOpenChange={handleCreateOpenChange}>
                <DialogTrigger asChild>
                  <Button className="w-full sm:w-auto sm:min-w-36">{createLabel}</Button>
                </DialogTrigger>

                <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.5rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,247,241,0.98))] p-5 shadow-[0_40px_90px_-40px_rgba(16,28,56,0.45)] sm:rounded-[1.75rem] sm:p-6">
                  <DialogHeader>
                    <DialogTitle className="text-xl tracking-tight sm:text-2xl">
                      {createLabel}
                    </DialogTitle>
                    <DialogDescription>
                      Fill in the details below to add a new{" "}
                      {entityLabel.toLowerCase()}.
                    </DialogDescription>
                  </DialogHeader>

                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4">
                      {fields.map((field) => (
                        <div className="space-y-2" key={field.name}>
                          <Label htmlFor={`create-${field.name}`}>{field.label}</Label>

                          {field.type === "select" ? (
                            <Select
                              value={String(values[field.name] ?? "") || undefined}
                              onValueChange={(value) => handleChange(field, value)}
                            >
                              <SelectTrigger id={`create-${field.name}`}>
                                <SelectValue placeholder={`Select ${field.label}`} />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options?.map((option) => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "checkbox" ? (
                            <label className="flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-white/80 px-4 text-sm">
                              <input
                                id={`create-${field.name}`}
                                type="checkbox"
                                checked={Boolean(values[field.name])}
                                onChange={(event) =>
                                  handleChange(field, event.target.checked)
                                }
                              />
                              {field.checkboxLabel ?? field.label}
                            </label>
                          ) : (
                            <Input
                              id={`create-${field.name}`}
                              type={field.type ?? "text"}
                              className="h-11 rounded-2xl border-border/70 bg-white/80 px-4"
                              value={String(values[field.name] ?? "")}
                              placeholder={field.placeholder}
                              required={isFieldRequired(field, "create")}
                              onChange={(event) =>
                                handleChange(field, event.target.value)
                              }
                            />
                          )}
                        </div>
                      ))}
                    </div>

                    {error ? <p className="text-sm text-red-500">{error}</p> : null}

                    <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                      <DialogClose asChild>
                        <Button type="button" variant="outline" className="w-full sm:w-auto">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button disabled={isSubmitting} type="submit" className="w-full sm:w-auto">
                        {isSubmitting ? "Saving..." : createLabel}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4 sm:px-6">
          {message ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {message}
            </div>
          ) : null}

          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Input
              className="h-12 rounded-2xl border-border/70 bg-white/80 px-4 shadow-xs md:max-w-md"
              placeholder={searchPlaceholder}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            <div className="w-full rounded-2xl border border-border/70 bg-white/70 px-4 py-2 text-center text-sm text-muted-foreground shadow-xs sm:w-auto sm:rounded-full">
              {filteredItems.length} visible entries
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-border/70 bg-white/65 shadow-[0_18px_40px_-30px_rgba(23,32,62,0.32)] backdrop-blur-sm">
            <div className="h-full overflow-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-[linear-gradient(180deg,rgba(247,244,235,0.95),rgba(255,255,255,0.8))]">
                    {columns.map((column) => (
                      <TableHead
                        key={column.key}
                        className="sticky top-0 z-10 h-14 bg-[linear-gradient(180deg,rgba(247,244,235,0.98),rgba(255,255,255,0.92))] text-xs uppercase tracking-[0.18em] text-muted-foreground"
                      >
                        {column.label}
                      </TableHead>
                    ))}
                    {canEdit || canDelete || renderRowActions ? (
                      <TableHead className="sticky top-0 z-10 w-[180px] bg-[linear-gradient(180deg,rgba(247,244,235,0.98),rgba(255,255,255,0.92))] text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        Actions
                      </TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell
                        className="h-24 text-center"
                        colSpan={columns.length + (canEdit || canDelete || renderRowActions ? 1 : 0)}
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredItems.length ? (
                    filteredItems.map((item) => {
                      const id = getItemId(item);

                      return (
                        <TableRow
                          key={id}
                          className="border-border/60 transition-colors hover:bg-[rgba(34,71,146,0.035)]"
                        >
                          {columns.map((column) => (
                            <TableCell key={`${id}-${column.key}`}>
                              {column.render(item)}
                            </TableCell>
                          ))}

                          {canEdit || canDelete || renderRowActions ? (
                            <TableCell>
                              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                {canEdit ? (
                                  <Dialog
                                    open={editingItemId === id}
                                    onOpenChange={handleEditOpenChange}
                                  >
                                    <DialogTrigger asChild>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={editingId === id}
                                        onClick={() => handleEdit(item)}
                                      >
                                        {editingId === id ? "Saving..." : "Edit"}
                                      </Button>
                                    </DialogTrigger>

                                    <DialogContent className="max-h-[90vh] overflow-y-auto rounded-[1.5rem] border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(249,247,241,0.98))] p-5 shadow-[0_40px_90px_-40px_rgba(16,28,56,0.45)] sm:rounded-[1.75rem] sm:p-6">
                                      <DialogHeader>
                                        <DialogTitle className="text-xl tracking-tight sm:text-2xl">
                                          {updateLabel}
                                        </DialogTitle>
                                        <DialogDescription>
                                          Update the details for this{" "}
                                          {entityLabel.toLowerCase()}.
                                        </DialogDescription>
                                      </DialogHeader>

                                      <form className="space-y-4" onSubmit={handleSubmit}>
                                        <div className="grid grid-cols-1 gap-4">
                                          {fields.map((field) => (
                                            <div className="space-y-2" key={field.name}>
                                              <Label htmlFor={`edit-${id}-${field.name}`}>
                                                {field.label}
                                              </Label>

                                              {field.type === "select" ? (
                                                <Select
                                                  value={String(values[field.name] ?? "") || undefined}
                                                  onValueChange={(value) =>
                                                    handleChange(field, value)
                                                  }
                                                >
                                                  <SelectTrigger id={`edit-${id}-${field.name}`}>
                                                    <SelectValue
                                                      placeholder={`Select ${field.label}`}
                                                    />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    {field.options?.map((option) => (
                                                      <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                      >
                                                        {option.label}
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              ) : field.type === "checkbox" ? (
                                                <label className="flex h-11 items-center gap-2 rounded-2xl border border-border/70 bg-white/80 px-4 text-sm">
                                                  <input
                                                    id={`edit-${id}-${field.name}`}
                                                    type="checkbox"
                                                    checked={Boolean(values[field.name])}
                                                    onChange={(event) =>
                                                      handleChange(field, event.target.checked)
                                                    }
                                                  />
                                                  {field.checkboxLabel ?? field.label}
                                                </label>
                                              ) : (
                                                <Input
                                                  id={`edit-${id}-${field.name}`}
                                                  type={field.type ?? "text"}
                                                  className="h-11 rounded-2xl border-border/70 bg-white/80 px-4"
                                                  value={String(values[field.name] ?? "")}
                                                  placeholder={field.placeholder}
                                                  required={isFieldRequired(field, "edit")}
                                                  onChange={(event) =>
                                                    handleChange(field, event.target.value)
                                                  }
                                                />
                                              )}
                                            </div>
                                          ))}
                                        </div>

                                        {error ? (
                                          <p className="text-sm text-red-500">{error}</p>
                                        ) : null}

                                        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row">
                                          <DialogClose asChild>
                                            <Button
                                              type="button"
                                              variant="outline"
                                              className="w-full sm:w-auto"
                                            >
                                              Cancel
                                            </Button>
                                          </DialogClose>
                                          <Button
                                            disabled={isSubmitting}
                                            type="submit"
                                            className="w-full sm:w-auto"
                                          >
                                            {isSubmitting ? "Saving..." : updateLabel}
                                          </Button>
                                        </DialogFooter>
                                      </form>
                                    </DialogContent>
                                  </Dialog>
                                ) : null}

                                {renderRowActions ? renderRowActions(item) : null}

                                {onDelete && canDelete ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={deletingId === id}
                                    onClick={() => onDelete(item)}
                                  >
                                    {deletingId === id ? "Deleting..." : "Delete"}
                                  </Button>
                                ) : null}
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell
                        className="h-24 text-center"
                        colSpan={columns.length + (canEdit || canDelete || renderRowActions ? 1 : 0)}
                      >
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {pagination ? (
            <div className="flex flex-col gap-3 border-t border-border/60 pt-2 md:flex-row md:items-center md:justify-between">
              <div className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} • {pagination.total} total records
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  <Label htmlFor={`${title}-page-size`} className="text-sm">
                    Rows
                  </Label>
                  <Select
                    value={String(pagination.limit)}
                    onValueChange={(value) => onPageSizeChange?.(Number(value))}
                  >
                    <SelectTrigger
                      id={`${title}-page-size`}
                      className="h-10 w-[88px] rounded-full bg-white/80"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 20, 50].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                  <Button
                    variant="outline"
                    disabled={!canGoPrevious}
                    onClick={() => onPageChange?.(pagination.page - 1)}
                    className="w-full sm:w-auto"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    disabled={!canGoNext}
                    onClick={() => onPageChange?.(pagination.page + 1)}
                    className="w-full sm:w-auto"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

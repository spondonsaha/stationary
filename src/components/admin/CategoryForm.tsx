"use client";

import { useActionState, useState } from "react";
import {
  createCategoryAction,
  deleteCategoryAction,
  updateCategoryAction,
  type CategoryState,
} from "@/app/admin/products/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Input";
import { ImageUploader } from "@/components/admin/ImageUploader";

export type CategoryFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  productCount?: number;
};

export function CategoryForm({
  mode,
  values = {},
}: {
  mode: "create" | "edit";
  values?: CategoryFormValues;
}) {
  const action = mode === "create" ? createCategoryAction : updateCategoryAction;
  const [state, formAction, pending] = useActionState<CategoryState, FormData>(action, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state?.error ? (
        <p role="alert" className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-3 py-2 text-sm font-medium text-[#8c3b34]">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`cat-name-${values.id ?? "new"}`} required error={errors.name}>
          <Input
            id={`cat-name-${values.id ?? "new"}`}
            name="name"
            defaultValue={values.name}
            required
            invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Slug" htmlFor={`cat-slug-${values.id ?? "new"}`} hint="Blank = auto from name">
          <Input
            id={`cat-slug-${values.id ?? "new"}`}
            name="slug"
            defaultValue={values.slug ?? ""}
            placeholder="auto-generated"
          />
        </Field>
      </div>

      <Field label="Description (optional)" htmlFor={`cat-desc-${values.id ?? "new"}`}>
        <Textarea
          id={`cat-desc-${values.id ?? "new"}`}
          name="description"
          rows={2}
          defaultValue={values.description ?? ""}
        />
      </Field>

      <ImageUploader name="image" initialValue={values.image} label="Category image" />

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Add category" : "Save changes"}
        </Button>

        {mode === "edit" ? (
          confirmDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-ink-500">Delete?</span>
              <Button type="submit" variant="danger" size="sm" formAction={deleteCategoryAction}>
                Yes
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                No
              </Button>
            </span>
          ) : (
            <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )
        ) : null}

        {mode === "edit" && values.productCount && values.productCount > 0 ? (
          <span className="text-xs text-ink-400">Has {values.productCount} products</span>
        ) : null}
      </div>
    </form>
  );
}

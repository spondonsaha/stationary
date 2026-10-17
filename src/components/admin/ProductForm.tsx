"use client";

import Link from "next/link";
import { useActionState } from "react";
import { createProductAction, updateProductAction, type ProductState } from "@/app/admin/products/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUploader } from "@/components/admin/ImageUploader";

export type ProductFormValues = {
  id?: string;
  name?: string;
  slug?: string;
  description?: string;
  sku?: string;
  brand?: string | null;
  price?: string;
  stock?: number;
  lowStockThreshold?: number;
  categoryId?: string;
  image?: string | null;
  status?: "active" | "archived";
  featured?: boolean;
};

export function ProductForm({
  mode,
  values = {},
  categories,
}: {
  mode: "create" | "edit";
  values?: ProductFormValues;
  categories: { id: string; name: string }[];
}) {
  const action = mode === "create" ? createProductAction : updateProductAction;
  const [state, formAction, pending] = useActionState<ProductState, FormData>(action, null);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-5">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state?.error ? (
        <p role="alert" className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-4 py-3 text-sm font-medium text-[#8c3b34]">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="name" required error={errors.name}>
              <Input id="name" name="name" defaultValue={values.name} required invalid={Boolean(errors.name)} />
            </Field>
            <Field label="SKU" htmlFor="sku" required error={errors.sku}>
              <Input id="sku" name="sku" defaultValue={values.sku} required invalid={Boolean(errors.sku)} placeholder="PEN-001" />
            </Field>
          </div>

          <Field label="Slug (optional)" htmlFor="slug" error={errors.slug} hint="Leave blank to generate from the name and SKU.">
            <Input id="slug" name="slug" defaultValue={values.slug} placeholder="auto-generated" />
          </Field>

          <Field
            label="Brand (optional)"
            htmlFor="brand"
            error={errors.brand}
            hint="Shown in the storefront brand filter."
          >
            <Input id="brand" name="brand" defaultValue={values.brand ?? ""} placeholder="e.g. Faber-Castell" />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description}>
            <Textarea id="description" name="description" rows={4} defaultValue={values.description} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Price" htmlFor="price" required error={errors.price}>
              <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={values.price} required invalid={Boolean(errors.price)} />
            </Field>
            <Field label="Stock" htmlFor="stock" required error={errors.stock}>
              <Input id="stock" name="stock" type="number" step="1" min="0" defaultValue={values.stock ?? 0} required invalid={Boolean(errors.stock)} />
            </Field>
            <Field label="Low-stock alert at" htmlFor="lowStockThreshold" error={errors.lowStockThreshold}>
              <Input id="lowStockThreshold" name="lowStockThreshold" type="number" step="1" min="0" defaultValue={values.lowStockThreshold ?? 10} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" htmlFor="categoryId" required error={errors.categoryId}>
              <Select id="categoryId" name="categoryId" defaultValue={values.categoryId} required>
                <option value="">Choose a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="status" error={errors.status}>
              <Select id="status" name="status" defaultValue={values.status ?? "active"}>
                <option value="active">Active (visible in shop)</option>
                <option value="archived">Archived (hidden)</option>
              </Select>
            </Field>
          </div>

          <label className="flex items-center gap-2.5 text-sm text-ink-700">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={values.featured}
              className="h-4 w-4 rounded border-ink-200 text-ink focus:ring-ink-400"
            />
            Feature on the home page
          </label>
        </div>

        <div className="space-y-4">
          <div className="rounded-card border border-ink-100 bg-white p-5 shadow-soft">
            <ImageUploader name="image" initialValue={values.image} />
          </div>

          <div className="flex flex-col gap-2 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Create product" : "Save changes"}
            </Button>
            <Link
              href="/admin/products"
              className="inline-flex h-11 items-center justify-center rounded-md border border-ink-200 bg-white text-sm font-medium text-ink btn-press"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </form>
  );
}

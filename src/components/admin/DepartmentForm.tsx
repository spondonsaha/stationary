"use client";

import { useActionState, useState } from "react";
import {
  createDepartmentAction,
  deleteDepartmentAction,
  updateDepartmentAction,
  type DepartmentState,
} from "@/app/admin/departments/actions";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";

export type DepartmentFormValues = {
  id?: string;
  name?: string;
  code?: string;
  faculty?: string | null;
  budgetCode?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  active?: boolean;
  orderCount?: number;
};

export function DepartmentForm({
  mode,
  values = {},
}: {
  mode: "create" | "edit";
  values?: DepartmentFormValues;
}) {
  const action = mode === "create" ? createDepartmentAction : updateDepartmentAction;
  const [state, formAction, pending] = useActionState<DepartmentState, FormData>(action, null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const errors = state?.fieldErrors ?? {};
  const key = values.id ?? "new";

  return (
    <form action={formAction} className="space-y-4">
      {values.id ? <input type="hidden" name="id" value={values.id} /> : null}

      {state?.error ? (
        <p role="alert" className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-3 py-2 text-sm font-medium text-[#8c3b34]">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor={`dept-name-${key}`} required error={errors.name}>
          <Input
            id={`dept-name-${key}`}
            name="name"
            defaultValue={values.name}
            required
            invalid={Boolean(errors.name)}
          />
        </Field>
        <Field label="Code" htmlFor={`dept-code-${key}`} required hint="Short code, e.g. CHEM" error={errors.code}>
          <Input
            id={`dept-code-${key}`}
            name="code"
            defaultValue={values.code}
            required
            invalid={Boolean(errors.code)}
            className="uppercase"
          />
        </Field>
        <Field label="Faculty (optional)" htmlFor={`dept-faculty-${key}`}>
          <Input id={`dept-faculty-${key}`} name="faculty" defaultValue={values.faculty ?? ""} />
        </Field>
        <Field label="Default budget code (optional)" htmlFor={`dept-budget-${key}`}>
          <Input id={`dept-budget-${key}`} name="budgetCode" defaultValue={values.budgetCode ?? ""} />
        </Field>
        <Field label="Contact name (optional)" htmlFor={`dept-contact-${key}`}>
          <Input id={`dept-contact-${key}`} name="contactName" defaultValue={values.contactName ?? ""} />
        </Field>
        <Field label="Contact email (optional)" htmlFor={`dept-email-${key}`} error={errors.contactEmail}>
          <Input
            id={`dept-email-${key}`}
            name="contactEmail"
            type="email"
            defaultValue={values.contactEmail ?? ""}
            invalid={Boolean(errors.contactEmail)}
          />
        </Field>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input
          type="checkbox"
          name="active"
          defaultChecked={values.active ?? true}
          className="h-4 w-4 rounded border-ink-300"
        />
        Active — available in the checkout department picker
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : mode === "create" ? "Add department" : "Save changes"}
        </Button>

        {mode === "edit" ? (
          confirmDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-xs text-ink-500">Delete?</span>
              <Button type="submit" variant="danger" size="sm" formAction={deleteDepartmentAction}>
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

        {mode === "edit" && values.orderCount ? (
          <span className="text-xs text-ink-400">{values.orderCount} order(s) on record</span>
        ) : null}
      </div>
    </form>
  );
}

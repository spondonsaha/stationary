"use client";

import { useActionState } from "react";
import { addPaymentAction, type InvoiceActionState } from "@/app/admin/invoices/actions";
import { formatMoney } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select } from "@/components/ui/Input";

export function AddPaymentForm({
  invoiceId,
  balance,
}: {
  invoiceId: string;
  balance: number;
}) {
  const [state, formAction, pending] = useActionState<InvoiceActionState, FormData>(
    addPaymentAction,
    null,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />

      {state?.error ? (
        <p role="alert" className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-3 py-2 text-sm font-medium text-[#8c3b34]">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p role="status" className="rounded-md border border-[#c8e6d5] bg-leaf-soft px-3 py-2 text-sm font-medium text-[#1f5c40]">
          Payment recorded.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Amount" htmlFor="pay-amount">
          <Input
            id="pay-amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={balance > 0 ? balance.toFixed(2) : ""}
            placeholder={formatMoney(balance)}
            required
          />
        </Field>
        <Field label="Method" htmlFor="pay-method">
          <Select id="pay-method" name="method" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="bank_transfer">Bank transfer</option>
            <option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Note (optional)" htmlFor="pay-notes">
          <Input id="pay-notes" name="notes" placeholder="Reference" />
        </Field>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record payment"}
      </Button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { markInvoicePaidAction, voidInvoiceAction } from "@/app/admin/invoices/actions";
import { Button } from "@/components/ui/Button";

/** Mark-paid + void controls with inline confirmation for the destructive one. */
export function InvoiceStatusActions({
  invoiceId,
  status,
}: {
  invoiceId: string;
  status: "unpaid" | "partial" | "paid" | "void";
}) {
  const [confirmVoid, setConfirmVoid] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "paid" && status !== "void" ? (
        <form action={markInvoicePaidAction}>
          <input type="hidden" name="invoiceId" value={invoiceId} />
          <Button type="submit" variant="accent">
            Mark paid in full
          </Button>
        </form>
      ) : null}

      {status !== "void" ? (
        confirmVoid ? (
          <form action={voidInvoiceAction} className="flex items-center gap-1">
            <input type="hidden" name="invoiceId" value={invoiceId} />
            <span className="text-xs text-ink-500">Void this invoice?</span>
            <Button type="submit" variant="danger" size="sm">
              Yes, void
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmVoid(false)}>
              Cancel
            </Button>
          </form>
        ) : (
          <Button type="button" variant="ghost" onClick={() => setConfirmVoid(true)}>
            Void
          </Button>
        )
      ) : null}
    </div>
  );
}

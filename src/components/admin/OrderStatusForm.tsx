"use client";

import { setOrderStatusAction } from "@/app/admin/orders/actions";
import { Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/** Order fulfilment status control (submits on change via a submit button). */
export function OrderStatusForm({
  orderId,
  status,
}: {
  orderId: string;
  status: "pending" | "confirmed" | "cancelled";
}) {
  return (
    <form action={setOrderStatusAction} className="flex items-end gap-2">
      <input type="hidden" name="id" value={orderId} />
      <label className="flex-1 text-sm">
        <span className="mb-1 block text-xs font-medium text-ink-400">Set status</span>
        <Select name="status" defaultValue={status}>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </label>
      <Button type="submit">Update</Button>
    </form>
  );
}

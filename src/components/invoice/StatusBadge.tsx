import { Badge } from "@/components/ui/Badge";

export type InvoiceStatus = "unpaid" | "partial" | "paid" | "void";

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  if (status === "paid") return <Badge tone="success">Paid</Badge>;
  if (status === "partial") return <Badge tone="warning">Partially paid</Badge>;
  if (status === "void") return <Badge tone="danger">Void</Badge>;
  return <Badge tone="danger">Unpaid</Badge>;
}

export function OrderStatusBadge({ status }: { status: "pending" | "confirmed" | "cancelled" }) {
  if (status === "confirmed") return <Badge tone="success">Confirmed</Badge>;
  if (status === "cancelled") return <Badge tone="danger">Cancelled</Badge>;
  return <Badge tone="warning">Pending</Badge>;
}

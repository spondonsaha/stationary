"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import {
  createAdminOrderAction,
  searchCustomersForOrderAction,
  type AdminOrderState,
  type OrderCustomerHit,
} from "@/app/admin/orders/actions";
import { searchProductsAction } from "@/app/admin/invoices/actions";
import { computeTotals, lineTotal } from "@/lib/cart/totals";
import { formatMoney, shopConfig } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

type Line = { key: string; productId: string; productName: string; quantity: number; unitPrice: number };
type ProductHit = { id: string; name: string; sku: string; price: string; stock: number };
type CustomerType = "guest" | "student" | "faculty_staff" | "department";
type Fulfillment = "pickup" | "campus_delivery";
type PaymentMethod = "cash" | "card" | "bank_transfer" | "mobile_payment" | "department_account" | "other";
type PaymentStatus = "paid" | "partial" | "unpaid";

type DeptOption = { id: string; name: string; code: string };

let seq = 0;
const nextKey = () => `l${++seq}`;

export function AdminOrderForm({ departments }: { departments: DeptOption[] }) {
  const [state, formAction, pending] = useActionState<AdminOrderState, FormData>(
    createAdminOrderAction,
    null,
  );

  const [selected, setSelected] = useState<OrderCustomerHit | null>(null);
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    studentId: "",
    faculty: "",
    notes: "",
  });
  const [customerType, setCustomerType] = useState<CustomerType>("guest");
  const [departmentId, setDepartmentId] = useState("");
  const [poNumber, setPoNumber] = useState("");
  const [fulfillment, setFulfillment] = useState<Fulfillment>("pickup");
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");

  const totals = useMemo(
    () =>
      computeTotals({
        lines: lines.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
        discount,
      }),
    [lines, discount],
  );

  const payload = useMemo(
    () =>
      JSON.stringify({
        customerId: selected?.id ?? "",
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerType,
        studentId: customer.studentId,
        faculty: customer.faculty,
        departmentId: customerType === "department" ? departmentId : "",
        poNumber: customerType === "department" ? poNumber : "",
        fulfillment,
        notes: customer.notes,
        discount,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
        payment:
          paymentStatus === "unpaid"
            ? { status: "unpaid", amount: 0 }
            : {
                status: paymentStatus,
                amount: paymentStatus === "paid" ? totals.total : amount,
                method,
              },
      }),
    [
      selected,
      customer,
      customerType,
      departmentId,
      poNumber,
      fulfillment,
      discount,
      lines,
      paymentStatus,
      amount,
      method,
      totals.total,
    ],
  );

  const errors = state?.fieldErrors ?? {};

  function pickCustomer(hit: OrderCustomerHit) {
    setSelected(hit);
    setCustomerType(hit.type);
    setCustomer({
      name: hit.name,
      email: hit.email,
      phone: hit.phone ?? "",
      address: "",
      studentId: hit.studentId ?? "",
      faculty: hit.faculty ?? "",
      notes: "",
    });
    if (hit.departmentId) setDepartmentId(hit.departmentId);
  }

  function clearCustomer() {
    setSelected(null);
    setCustomerType("guest");
    setCustomer({ name: "", email: "", phone: "", address: "", studentId: "", faculty: "", notes: "" });
  }

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="payload" value={payload} />

      <div className="space-y-5">
        {/* Customer */}
        <section className="space-y-4 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Customer</h2>
            {selected ? (
              <button
                type="button"
                onClick={clearCustomer}
                className="text-sm font-medium text-ink-500 hover:text-ink"
              >
                Change customer
              </button>
            ) : null}
          </div>

          {selected ? (
            <div className="flex items-center justify-between gap-3 rounded-md border border-ink-100 bg-paper-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink-800">{selected.name}</p>
                <p className="truncate text-xs text-ink-400">{selected.email}</p>
              </div>
              <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-xs capitalize text-ink-500 ring-1 ring-ink-100">
                {selected.type.replace("_", " ")}
              </span>
            </div>
          ) : (
            <CustomerPicker onAdd={pickCustomer} />
          )}

          {errors.customerId ? (
            <p className="text-xs font-medium text-[#b3372c]">{errors.customerId}</p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="customerName" required error={errors.customerName}>
              <Input
                id="customerName"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                required
                invalid={Boolean(errors.customerName)}
                placeholder="Full name"
              />
            </Field>
            <Field label="Email" htmlFor="customerEmail" required error={errors.customerEmail}>
              <Input
                id="customerEmail"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                required
                invalid={Boolean(errors.customerEmail)}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Phone (optional)" htmlFor="customerPhone">
              <Input
                id="customerPhone"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
            </Field>
            <Field label="Address (optional)" htmlFor="customerAddress">
              <Input
                id="customerAddress"
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
              />
            </Field>
          </div>
        </section>

        {/* Customer type / affiliation */}
        <section className="space-y-4 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Account type</h2>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["guest", "Guest"],
                ["student", "Student"],
                ["faculty_staff", "Faculty / staff"],
                ["department", "Department"],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setCustomerType(value)}
                className={`rounded-full px-3 py-1.5 text-sm font-medium ring-1 transition-colors ${
                  customerType === value
                    ? "bg-ink text-paper-50 ring-ink"
                    : "bg-white text-ink-600 ring-ink-200 hover:bg-paper-50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {customerType === "student" || customerType === "faculty_staff" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={customerType === "student" ? "Student ID" : "Staff ID"}
                htmlFor="studentId"
                required
                error={errors.studentId}
              >
                <Input
                  id="studentId"
                  value={customer.studentId}
                  onChange={(e) => setCustomer((c) => ({ ...c, studentId: e.target.value }))}
                  invalid={Boolean(errors.studentId)}
                />
              </Field>
              <Field label="Faculty (optional)" htmlFor="faculty">
                <Input
                  id="faculty"
                  value={customer.faculty}
                  onChange={(e) => setCustomer((c) => ({ ...c, faculty: e.target.value }))}
                />
              </Field>
            </div>
          ) : null}

          {customerType === "department" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Department" htmlFor="departmentId" required error={errors.departmentId}>
                <Select
                  id="departmentId"
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                >
                  <option value="">Select a department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="PO / budget code" htmlFor="poNumber" required error={errors.poNumber}>
                <Input
                  id="poNumber"
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  invalid={Boolean(errors.poNumber)}
                />
              </Field>
            </div>
          ) : null}

          <Field label="Fulfilment" htmlFor="fulfillment">
            <Select
              id="fulfillment"
              value={fulfillment}
              onChange={(e) => setFulfillment(e.target.value as Fulfillment)}
            >
              <option value="pickup">Pickup at the bookstore</option>
              <option value="campus_delivery">Campus delivery</option>
            </Select>
          </Field>
          {fulfillment === "campus_delivery" && !customer.address ? (
            <p className="text-xs text-ink-400">
              A campus delivery address can be added above, or note it below.
            </p>
          ) : null}
        </section>

        {/* Items */}
        <section className="space-y-3 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-ink">Items</h2>
            <span className="text-xs text-ink-400">
              {lines.length} line{lines.length === 1 ? "" : "s"}
            </span>
          </div>
          {errors.items ? (
            <p className="text-xs font-medium text-[#b3372c]">{errors.items}</p>
          ) : null}

          <ul className="space-y-3">
            {lines.map((l) => (
              <LineRow
                key={l.key}
                line={l}
                onChange={(patch) =>
                  setLines((prev) => prev.map((x) => (x.key === l.key ? { ...x, ...patch } : x)))
                }
                onRemove={() => setLines((prev) => prev.filter((x) => x.key !== l.key))}
              />
            ))}
          </ul>

          <ProductPicker
            onAdd={(hit) =>
              setLines((prev) =>
                prev.some((x) => x.productId === hit.id)
                  ? prev.map((x) =>
                      x.productId === hit.id ? { ...x, quantity: x.quantity + 1 } : x,
                    )
                  : [
                      ...prev,
                      {
                        key: nextKey(),
                        productId: hit.id,
                        productName: hit.name,
                        quantity: 1,
                        unitPrice: Number(hit.price),
                      },
                    ],
              )
            }
          />
        </section>

        {/* Notes */}
        <section className="space-y-3 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Notes</h2>
          <Textarea
            rows={3}
            value={customer.notes}
            onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
            placeholder="Delivery instructions, payment terms, etc."
            aria-label="Order notes"
          />
        </section>
      </div>

      {/* Summary / payment */}
      <aside className="h-fit space-y-4">
        <div className="rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <SummaryRow label="Subtotal" value={formatMoney(totals.subtotal)} />
            <div className="flex items-center justify-between gap-3">
              <dt className="text-ink-500">Discount</dt>
              <dd>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                  className="h-9 w-28 text-right"
                  aria-label="Discount amount"
                />
              </dd>
            </div>
            <SummaryRow label={`Tax (${shopConfig.taxRatePercent}%)`} value={formatMoney(totals.tax)} />
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(totals.total)}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Payment</h2>
          <div className="space-y-2">
            {(
              [
                ["paid", "Paid in full"],
                ["partial", "Deposit / partial"],
                ["unpaid", "Unpaid — invoice on account"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="radio"
                  name="paymentStatus"
                  value={value}
                  checked={paymentStatus === value}
                  onChange={() => setPaymentStatus(value)}
                  className="h-4 w-4 text-ink focus:ring-ink-400"
                />
                {label}
              </label>
            ))}
          </div>

          {paymentStatus !== "unpaid" ? (
            <Field label="Method" htmlFor="method">
              <Select
                id="method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="mobile_payment">Mobile payment</option>
                <option value="department_account">Department account</option>
                <option value="other">Other</option>
              </Select>
            </Field>
          ) : null}

          {paymentStatus === "partial" ? (
            <Field label="Deposit amount" htmlFor="amount">
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value) || 0)}
              />
            </Field>
          ) : null}

          {state?.error ? (
            <p
              role="alert"
              className="rounded-md border border-[#f5c9c4] bg-eraser-soft px-3 py-2 text-sm font-medium text-[#8c3b34]"
            >
              {state.error}
            </p>
          ) : null}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={pending || lines.length === 0}
          >
            {pending ? "Placing order…" : "Place order"}
          </Button>
          <p className="text-center text-xs text-ink-400">
            Creates a confirmed order and invoice.{" "}
            <Link href="/admin/invoices/new" className="text-ink-500 underline hover:text-ink">
              Walk-in invoice instead
            </Link>
          </p>
        </div>
      </aside>
    </form>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-ink-500">
      <dt>{label}</dt>
      <dd className="tabular-nums">{value}</dd>
    </div>
  );
}

function LineRow({
  line,
  onChange,
  onRemove,
}: {
  line: Line;
  onChange: (patch: Partial<Line>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="grid grid-cols-12 items-end gap-2">
      <div className="col-span-12 sm:col-span-6">
        <label className="mb-1 block text-xs text-ink-400">Item</label>
        <Input value={line.productName} readOnly className="bg-paper-50" aria-label="Item name" />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <label className="mb-1 block text-xs text-ink-400">Qty</label>
        <Input
          type="number"
          min="1"
          value={line.quantity}
          onChange={(e) => onChange({ quantity: Math.max(1, Number(e.target.value) || 1) })}
          className="text-right"
          aria-label="Quantity"
        />
      </div>
      <div className="col-span-4 sm:col-span-2">
        <label className="mb-1 block text-xs text-ink-400">Unit</label>
        <Input value={line.unitPrice.toFixed(2)} readOnly className="bg-paper-50 text-right" aria-label="Unit price" />
      </div>
      <div className="col-span-3 self-center text-right text-sm tabular-nums text-ink-700 sm:col-span-2">
        {formatMoney(lineTotal(line.unitPrice, line.quantity))}
      </div>
      <div className="col-span-12 flex justify-end sm:col-span-12">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${line.productName || "line"}`}
          className="rounded-md px-2 py-1.5 text-xs font-medium text-ink-400 hover:bg-eraser-soft hover:text-[#8c3b34]"
        >
          Remove
        </button>
      </div>
    </li>
  );
}

function CustomerPicker({ onAdd }: { onAdd: (hit: OrderCustomerHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<OrderCustomerHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        const results = await searchCustomersForOrderAction(value);
        setHits(results);
        setOpen(true);
      });
    }, 220);
  }

  return (
    <div className="relative">
      <label className="mb-1 block text-xs text-ink-400">Search an existing customer (optional)</label>
      <Input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Name, email, phone or student ID…"
        aria-label="Search customers"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {searching ? <span className="absolute right-3 top-8 text-xs text-ink-300">…</span> : null}
      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-ink-100 bg-white shadow-lift">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAdd(h);
                  setQ("");
                  setHits([]);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-paper-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink-800">{h.name}</span>
                  <span className="truncate text-xs text-ink-400">{h.email}</span>
                </span>
                <span className="shrink-0 text-xs capitalize text-ink-400">
                  {h.type.replace("_", " ")}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {open && q.trim().length >= 2 && hits.length === 0 && !searching ? (
        <p className="mt-1 text-xs text-ink-400">No existing customer — fill in the details below to create one.</p>
      ) : null}
    </div>
  );
}

function ProductPicker({ onAdd }: { onAdd: (hit: ProductHit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<ProductHit[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, start] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function search(value: string) {
    setQ(value);
    if (timer.current) clearTimeout(timer.current);
    if (value.trim().length < 2) {
      setHits([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(() => {
      start(async () => {
        const results = await searchProductsAction(value);
        setHits(results);
        setOpen(true);
      });
    }, 220);
  }

  return (
    <div className="relative">
      <Input
        value={q}
        onChange={(e) => search(e.target.value)}
        placeholder="Search catalog by name or SKU…"
        aria-label="Search products"
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {searching ? <span className="absolute right-3 top-3 text-xs text-ink-300">…</span> : null}
      {open && hits.length > 0 ? (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-ink-100 bg-white shadow-lift">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onAdd(h);
                  setQ("");
                  setHits([]);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-paper-50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-ink-800">{h.name}</span>
                  <span className="text-xs text-ink-400">
                    {h.sku} · {h.stock} in stock
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-ink-600">{formatMoney(h.price)}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

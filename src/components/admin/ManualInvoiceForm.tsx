"use client";

import { useActionState, useMemo, useRef, useState, useTransition } from "react";
import {
  createManualInvoiceAction,
  searchProductsAction,
  type ManualInvoiceState,
} from "@/app/admin/invoices/actions";
import { computeTotals, lineTotal } from "@/lib/cart/totals";
import { formatMoney } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";

type Line = {
  key: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
};

type Hit = { id: string; name: string; sku: string; price: string; stock: number };
type PaymentStatus = "paid" | "partial" | "unpaid";
type Method = "cash" | "card" | "bank_transfer" | "other";

let seq = 0;
const nextKey = () => `l${++seq}`;

export function ManualInvoiceForm() {
  const [state, formAction, pending] = useActionState<ManualInvoiceState, FormData>(
    createManualInvoiceAction,
    null,
  );

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    notes: "",
  });
  const [lines, setLines] = useState<Line[]>([]);
  const [discount, setDiscount] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("paid");
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<Method>("cash");

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
        customerName: customer.name,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        notes: customer.notes,
        discount,
        items: lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
        })),
        payment:
          paymentStatus === "unpaid"
            ? { status: "unpaid", amount: 0 }
            : {
                status: paymentStatus,
                amount: paymentStatus === "paid" ? totals.total : amount,
                method,
              },
      }),
    [customer, lines, discount, paymentStatus, amount, method, totals.total],
  );

  const errors = state?.fieldErrors ?? {};

  return (
    <form action={formAction} className="grid gap-5 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="payload" value={payload} />

      <div className="space-y-5">
        <section className="space-y-4 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Bill to</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer name" htmlFor="customerName" required error={errors.customerName}>
              <Input
                id="customerName"
                value={customer.name}
                onChange={(e) => setCustomer((c) => ({ ...c, name: e.target.value }))}
                required
                invalid={Boolean(errors.customerName)}
                placeholder="Walk-in customer"
              />
            </Field>
            <Field label="Email (optional)" htmlFor="customerEmail" error={errors.customerEmail}>
              <Input
                id="customerEmail"
                type="email"
                value={customer.email}
                onChange={(e) => setCustomer((c) => ({ ...c, email: e.target.value }))}
                placeholder="name@example.com"
              />
            </Field>
            <Field label="Phone (optional)" htmlFor="customerPhone" error={errors.customerPhone}>
              <Input
                id="customerPhone"
                value={customer.phone}
                onChange={(e) => setCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
            </Field>
            <Field label="Address (optional)" htmlFor="customerAddress" error={errors.customerAddress}>
              <Input
                id="customerAddress"
                value={customer.address}
                onChange={(e) => setCustomer((c) => ({ ...c, address: e.target.value }))}
              />
            </Field>
          </div>
        </section>

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
              setLines((prev) => [
                ...prev,
                {
                  key: nextKey(),
                  productId: hit.id,
                  productName: hit.name,
                  quantity: 1,
                  unitPrice: Number(hit.price),
                },
              ])
            }
          />

          <button
            type="button"
            onClick={() =>
              setLines((prev) => [
                ...prev,
                { key: nextKey(), productId: null, productName: "", quantity: 1, unitPrice: 0 },
              ])
            }
            className="text-sm font-medium text-ink-500 hover:text-ink"
          >
            + Add free-text line
          </button>
        </section>

        <section className="space-y-3 rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Notes</h2>
          <Textarea
            rows={3}
            value={customer.notes}
            onChange={(e) => setCustomer((c) => ({ ...c, notes: e.target.value }))}
            placeholder="Payment terms, delivery note, etc."
            aria-label="Invoice notes"
          />
        </section>
      </div>

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
                ["unpaid", "Unpaid — send invoice"],
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
            <div className="grid grid-cols-2 gap-3">
              <Field label="Method" htmlFor="method">
                <Select
                  id="method"
                  value={method}
                  onChange={(e) => setMethod(e.target.value as Method)}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="other">Other</option>
                </Select>
              </Field>
              {paymentStatus === "partial" ? (
                <Field label="Amount" htmlFor="amount">
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
            </div>
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
            {pending ? "Creating…" : "Create invoice"}
          </Button>
          <p className="text-center text-xs text-ink-400">
            Stock is decremented for catalog items. Free-text lines skip stock.
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
      <div className="col-span-12 sm:col-span-5">
        <label className="mb-1 block text-xs text-ink-400">Item</label>
        <Input
          value={line.productName}
          onChange={(e) => onChange({ productName: e.target.value })}
          placeholder="Item name"
          aria-label="Item name"
        />
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
        <Input
          type="number"
          step="0.01"
          min="0"
          value={line.unitPrice}
          onChange={(e) => onChange({ unitPrice: Math.max(0, Number(e.target.value) || 0) })}
          className="text-right"
          aria-label="Unit price"
        />
      </div>
      <div className="col-span-3 self-center text-right text-sm tabular-nums text-ink-700 sm:col-span-2">
        {formatMoney(lineTotal(line.unitPrice, line.quantity))}
      </div>
      <div className="col-span-1 self-center text-right">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${line.productName || "line"}`}
          className="rounded-md px-2 py-1.5 text-ink-400 hover:bg-eraser-soft hover:text-[#8c3b34]"
        >
          ✕
        </button>
      </div>
    </li>
  );
}

function ProductPicker({ onAdd }: { onAdd: (hit: Hit) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
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
      {searching ? (
        <span className="absolute right-3 top-3 text-xs text-ink-300">…</span>
      ) : null}
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

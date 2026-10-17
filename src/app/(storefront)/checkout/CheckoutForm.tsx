"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { checkoutAction, type CheckoutState } from "./actions";
import { useCartContext } from "@/components/cart/CartProvider";
import { formatMoney, shopConfig } from "@/lib/config";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Input";
import type { DepartmentOption } from "@/lib/queries/departments";

const TAX = shopConfig.taxRatePercent;

const CUSTOMER_TYPES = [
  { value: "student", label: "Student", hint: "Student ID required" },
  { value: "faculty_staff", label: "Faculty & Staff", hint: "Staff ID required" },
  { value: "department", label: "Department", hint: "PO / budget code required" },
  { value: "guest", label: "Guest", hint: "General public" },
] as const;

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash on pickup" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "mobile_payment", label: "Mobile payment" },
  { value: "department_account", label: "Department account" },
  { value: "card", label: "Card" },
  { value: "other", label: "Other" },
] as const;

export function CheckoutForm({ departments }: { departments: DepartmentOption[] }) {
  const { items, subtotal } = useCartContext();
  const [state, formAction, pending] = useActionState<CheckoutState, FormData>(
    checkoutAction,
    null,
  );

  const [customerType, setCustomerType] = useState<string>("student");
  const [fulfillment, setFulfillment] = useState<string>("pickup");
  const [departmentId, setDepartmentId] = useState<string>("");

  const cartJson = useMemo(
    () =>
      JSON.stringify(
        items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      ),
    [items],
  );

  const tax = Math.round(subtotal * TAX) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;

  if (items.length === 0) {
    return (
      <div className="mt-8 rounded-card border border-dashed border-ink-200 bg-white px-6 py-16 text-center">
        <h2 className="font-display text-xl font-semibold text-ink">Nothing to check out yet</h2>
        <p className="mt-1 text-sm text-ink-500">Add a few items to your cart first.</p>
        <Link
          href="/products"
          className="mt-5 inline-flex h-11 items-center rounded-md bg-ink px-5 text-sm font-medium text-white btn-press"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const errors = state?.errors ?? {};
  const selectedDept = departments.find((d) => d.id === departmentId);

  return (
    <form action={formAction} className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="cart" value={cartJson} />

      <div className="space-y-6">
        {/* Who is ordering ------------------------------------------------ */}
        <section className="rounded-card border border-ink-100 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Who is ordering?</h2>
          {state?.errorMessage ? (
            <p
              role="alert"
              className="mt-3 rounded-md border border-eraser/25 bg-eraser-soft px-4 py-3 text-sm font-medium text-eraser"
            >
              {state.errorMessage}
            </p>
          ) : null}

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {CUSTOMER_TYPES.map((t) => (
              <label
                key={t.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                  customerType === t.value
                    ? "border-ink bg-ink-50"
                    : "border-ink-200 bg-white hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="customerType"
                  value={t.value}
                  checked={customerType === t.value}
                  onChange={() => setCustomerType(t.value)}
                  className="mt-0.5 h-4 w-4 text-ink focus:ring-ink-400"
                />
                <span>
                  <span className="block font-medium text-ink-800">{t.label}</span>
                  <span className="block text-xs text-ink-400">{t.hint}</span>
                </span>
              </label>
            ))}
          </div>
        </section>

        {/* Details -------------------------------------------------------- */}
        <section className="rounded-card border border-ink-100 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Your details</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" htmlFor="name" required error={errors.name}>
              <Input
                id="name"
                name="name"
                autoComplete="name"
                required
                invalid={Boolean(errors.name)}
                placeholder="Alice Morgan"
              />
            </Field>
            <Field
              label="Email"
              htmlFor="email"
              required
              error={errors.email}
              hint="Invoice link is shown on the confirmation page."
            >
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                invalid={Boolean(errors.email)}
                placeholder="alice@northgate.edu"
              />
            </Field>
            <Field label="Phone" htmlFor="phone" required error={errors.phone}>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                invalid={Boolean(errors.phone)}
                placeholder="+1 555 0100"
              />
            </Field>

            {customerType === "student" || customerType === "faculty_staff" ? (
              <Field
                label="Student / staff ID"
                htmlFor="studentId"
                required
                error={errors.studentId}
              >
                <Input
                  id="studentId"
                  name="studentId"
                  invalid={Boolean(errors.studentId)}
                  placeholder="N1032845"
                />
              </Field>
            ) : null}

            {customerType === "student" ? (
              <Field label="Faculty (optional)" htmlFor="faculty" error={errors.faculty}>
                <Input id="faculty" name="faculty" placeholder="Faculty of Science" />
              </Field>
            ) : null}

            {customerType === "department" ? (
              <>
                <Field label="Department" htmlFor="departmentId" required error={errors.departmentId}>
                  <Select
                    id="departmentId"
                    name="departmentId"
                    value={departmentId}
                    onChange={(e) => setDepartmentId(e.target.value)}
                  >
                    <option value="">Select department…</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field
                  label="PO / budget code"
                  htmlFor="poNumber"
                  required
                  error={errors.poNumber}
                  hint={
                    selectedDept?.budgetCode
                      ? `Suggested: ${selectedDept.budgetCode}`
                      : undefined
                  }
                >
                  <Input
                    id="poNumber"
                    name="poNumber"
                    defaultValue={selectedDept?.budgetCode ?? ""}
                    key={departmentId}
                    invalid={Boolean(errors.poNumber)}
                    placeholder="CHEM-2026-0142"
                  />
                </Field>
              </>
            ) : null}
          </div>
        </section>

        {/* Fulfilment ----------------------------------------------------- */}
        <section className="rounded-card border border-ink-100 bg-white p-5 shadow-soft sm:p-6">
          <h2 className="font-display text-lg font-semibold text-ink">Collection or delivery</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { value: "pickup", label: "Pickup", hint: "Collect from the bookstore" },
              { value: "campus_delivery", label: "Campus delivery", hint: "Delivered on campus" },
            ].map((f) => (
              <label
                key={f.value}
                className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 text-sm ${
                  fulfillment === f.value
                    ? "border-ink bg-ink-50"
                    : "border-ink-200 bg-white hover:border-ink-300"
                }`}
              >
                <input
                  type="radio"
                  name="fulfillment"
                  value={f.value}
                  checked={fulfillment === f.value}
                  onChange={() => setFulfillment(f.value)}
                  className="mt-0.5 h-4 w-4 text-ink focus:ring-ink-400"
                />
                <span>
                  <span className="block font-medium text-ink-800">{f.label}</span>
                  <span className="block text-xs text-ink-400">{f.hint}</span>
                </span>
              </label>
            ))}
          </div>

          {fulfillment === "campus_delivery" ? (
            <div className="mt-4">
              <Field
                label="Campus delivery address"
                htmlFor="address"
                required
                error={errors.address}
              >
                <Input
                  id="address"
                  name="address"
                  autoComplete="street-address"
                  required
                  invalid={Boolean(errors.address)}
                  placeholder="Science Block B, Room 214"
                />
              </Field>
            </div>
          ) : null}

          <div className="mt-4">
            <Field label="Preferred payment method" htmlFor="paymentMethod">
              <Select
                id="paymentMethod"
                name="paymentMethod"
                defaultValue={customerType === "department" ? "department_account" : "cash"}
                key={customerType}
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          <div className="mt-4">
            <Field label="Order notes (optional)" htmlFor="notes" error={errors.notes}>
              <Textarea
                id="notes"
                name="notes"
                rows={3}
                placeholder="Delivery time, room number, etc."
              />
            </Field>
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4">
        <div className="rounded-card border border-ink-100 bg-white p-5 shadow-soft">
          <h2 className="font-display text-lg font-semibold text-ink">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.productId} className="flex justify-between gap-3 text-sm">
                <span className="text-ink-500">
                  <span className="font-medium text-ink-800">{item.quantity}×</span>{" "}
                  {item.name}
                </span>
                <span className="shrink-0 tabular-nums text-ink-800">
                  {formatMoney(item.unitPrice * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
            <div className="flex justify-between text-ink-500">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatMoney(subtotal)}</dd>
            </div>
            <div className="flex justify-between text-ink-500">
              <dt>Tax ({TAX}%)</dt>
              <dd className="tabular-nums">{formatMoney(tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-ink-100 pt-2 text-base font-semibold text-ink">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatMoney(total)}</dd>
            </div>
          </dl>
          <Button type="submit" size="lg" className="mt-5 w-full" disabled={pending}>
            {pending ? "Placing order…" : `Place order · ${formatMoney(total)}`}
          </Button>
          <p className="mt-3 text-center text-xs text-ink-400">
            Payment at pickup or delivery. Your invoice is issued immediately.
          </p>
        </div>
      </aside>
    </form>
  );
}

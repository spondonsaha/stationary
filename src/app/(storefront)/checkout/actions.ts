"use server";

import { redirect } from "next/navigation";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrderWithInvoice, StockError, PriceError } from "@/lib/invoice/create";
import { assertSameOrigin } from "@/lib/security/csrf";
import { clientIp, rateLimit } from "@/lib/security/rate-limit";
import { headers } from "next/headers";

export type CheckoutState = {
  /** field-level errors, keyed by form field name */
  errors?: Record<string, string>;
  errorMessage?: string;
} | null;

/**
 * Creates the order + invoice in one transaction and redirects to the
 * secure success page (which links the invoice).
 *
 * Money math and stock happen exclusively server-side: the client only
 * sends product ids + quantities.
 */
export async function checkoutAction(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  try {
    await assertSameOrigin();
  } catch {
    return { errorMessage: "Request rejected. Please reload the page and try again." };
  }

  const ip = clientIp(await headers());
  const limited = rateLimit(`checkout:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return {
      errorMessage: `Too many checkout attempts. Please wait ${limited.retryAfter}s and try again.`,
    };
  }

  let cartLines: { productId: string; quantity: number }[] = [];
  try {
    cartLines = JSON.parse(String(formData.get("cart") ?? "[]"));
  } catch {
    return { errorMessage: "Your cart data was invalid. Please refresh the page." };
  }

  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    address: formData.get("address") ?? "",
    customerType: formData.get("customerType") ?? "guest",
    studentId: formData.get("studentId") ?? "",
    faculty: formData.get("faculty") ?? "",
    departmentId: formData.get("departmentId") ?? "",
    poNumber: formData.get("poNumber") ?? "",
    fulfillment: formData.get("fulfillment") ?? "pickup",
    paymentMethod: formData.get("paymentMethod") ?? "cash",
    notes: formData.get("notes") ?? "",
    cart: cartLines,
  });

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!errors[key]) errors[key] = issue.message;
    }
    return { errors, errorMessage: "Please fix the highlighted fields." };
  }

  const data = parsed.data;

  try {
    const result = await createOrderWithInvoice({
      customer: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        address: data.address || null,
        type: data.customerType,
        studentId: data.studentId || null,
        faculty: data.faculty || null,
        departmentId: data.departmentId || null,
        poNumber: data.poNumber || null,
        fulfillment: data.fulfillment,
        paymentMethod: data.paymentMethod,
        notes: data.notes || null,
      },
      lines: data.cart.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    });

    redirect(`/checkout/success/${result.publicToken}`);
  } catch (err) {
    if (err instanceof StockError) {
      return {
        errorMessage: `“${err.productName}” only has ${err.available} left in stock. Please adjust your cart.`,
      };
    }
    if (err instanceof PriceError) {
      return {
        errorMessage: "One of the products in your cart is no longer available. Please review your cart.",
      };
    }
    // next/navigation redirect() throws — re-throw so it propagates.
    throw err;
  }
}

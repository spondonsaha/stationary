import { z } from "zod";

export const CUSTOMER_TYPES = ["guest", "student", "faculty_staff", "department"] as const;
export const FULFILLMENT_METHODS = ["pickup", "campus_delivery"] as const;
export const PAYMENT_METHODS = [
  "cash",
  "card",
  "bank_transfer",
  "mobile_payment",
  "department_account",
  "other",
] as const;

export const checkoutSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Please enter your full name")
      .max(160, "Name is too long"),
    email: z
      .string()
      .trim()
      .min(3, "Please enter your email")
      .max(254, "Email is too long")
      .email("Enter a valid email address"),
    phone: z
      .string()
      .trim()
      .min(5, "Please enter a phone number")
      .max(40, "Phone number is too long"),
    address: z.string().trim().max(500, "Address is too long").optional().or(z.literal("")),
    customerType: z.enum(CUSTOMER_TYPES).default("guest"),
    studentId: z.string().trim().max(40, "ID is too long").optional().or(z.literal("")),
    faculty: z.string().trim().max(160, "Faculty is too long").optional().or(z.literal("")),
    departmentId: z.string().uuid().optional().or(z.literal("")),
    poNumber: z.string().trim().max(60, "PO / budget code is too long").optional().or(z.literal("")),
    fulfillment: z.enum(FULFILLMENT_METHODS).default("pickup"),
    paymentMethod: z.enum(PAYMENT_METHODS).default("cash"),
    notes: z
      .string()
      .trim()
      .max(1000, "Notes are too long")
      .optional()
      .or(z.literal("")),
    cart: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(99),
        }),
      )
      .min(1, "Your cart is empty"),
  })
  .superRefine((val, ctx) => {
    if (val.customerType === "student" || val.customerType === "faculty_staff") {
      if (!val.studentId || val.studentId.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["studentId"],
          message: "Enter your student or staff ID number",
        });
      }
    }
    if (val.customerType === "department") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Select your department",
        });
      }
      if (!val.poNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["poNumber"],
          message: "Enter a PO or budget code",
        });
      }
    }
    if (val.fulfillment === "campus_delivery") {
      if (!val.address || val.address.length < 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["address"],
          message: "Enter a campus delivery address",
        });
      }
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const manualInvoiceItemSchema = z.object({
  productId: z.string().uuid().nullable(),
  productName: z.string().trim().min(1).max(160),
  quantity: z.number().int().min(1).max(999),
  unitPrice: z.number().min(0).max(999999),
});

export const manualInvoiceSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(160),
  customerEmail: z
    .string()
    .trim()
    .email("Valid email required")
    .max(254)
    .optional()
    .or(z.literal("")),
  customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
  customerAddress: z.string().trim().max(500).optional().or(z.literal("")),
  customerType: z.enum(CUSTOMER_TYPES).default("guest"),
  departmentId: z.string().uuid().optional().or(z.literal("")),
  poNumber: z.string().trim().max(60).optional().or(z.literal("")),
  fulfillment: z.enum(FULFILLMENT_METHODS).default("pickup"),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  discount: z.number().min(0).max(999999),
  items: z.array(manualInvoiceItemSchema).min(1, "Add at least one item"),
  /** paid = cash sale (paid in full now), unpaid = send later, partial = deposit */
  payment: z.discriminatedUnion("status", [
    z.object({ status: z.literal("paid"), amount: z.number().min(0), method: z.enum(PAYMENT_METHODS) }),
    z.object({ status: z.literal("partial"), amount: z.number().min(0.01), method: z.enum(PAYMENT_METHODS) }),
    z.object({ status: z.literal("unpaid"), amount: z.literal(0) }),
  ]),
});

export type ManualInvoiceInput = z.infer<typeof manualInvoiceSchema>;

/**
 * Admin places an order on behalf of a customer. Unlike the walk-in manual
 * invoice, this creates a real Order + Invoice from live catalog prices and
 * can be attributed to an existing customer (`customerId`) or a new one.
 */
export const adminOrderSchema = z
  .object({
    customerId: z.string().uuid().optional().or(z.literal("")),
    customerName: z.string().trim().min(2, "Customer name is required").max(160),
    customerEmail: z
      .string()
      .trim()
      .email("A valid email is required")
      .max(254),
    customerPhone: z.string().trim().max(40).optional().or(z.literal("")),
    customerAddress: z.string().trim().max(500).optional().or(z.literal("")),
    customerType: z.enum(CUSTOMER_TYPES).default("guest"),
    studentId: z.string().trim().max(40).optional().or(z.literal("")),
    faculty: z.string().trim().max(160).optional().or(z.literal("")),
    departmentId: z.string().uuid().optional().or(z.literal("")),
    poNumber: z.string().trim().max(60).optional().or(z.literal("")),
    fulfillment: z.enum(FULFILLMENT_METHODS).default("pickup"),
    notes: z.string().trim().max(1000).optional().or(z.literal("")),
    discount: z.number().min(0).max(999999),
    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.number().int().min(1).max(999),
        }),
      )
      .min(1, "Add at least one item"),
    payment: z.discriminatedUnion("status", [
      z.object({
        status: z.literal("paid"),
        amount: z.number().min(0),
        method: z.enum(PAYMENT_METHODS),
      }),
      z.object({
        status: z.literal("partial"),
        amount: z.number().min(0.01),
        method: z.enum(PAYMENT_METHODS),
      }),
      z.object({ status: z.literal("unpaid"), amount: z.literal(0) }),
    ]),
  })
  .superRefine((val, ctx) => {
    if (val.customerType === "student" || val.customerType === "faculty_staff") {
      if (!val.studentId || val.studentId.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["studentId"],
          message: "Enter the student or staff ID number",
        });
      }
    }
    if (val.customerType === "department") {
      if (!val.departmentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["departmentId"],
          message: "Select a department",
        });
      }
      if (!val.poNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["poNumber"],
          message: "Enter a PO or budget code",
        });
      }
    }
  });

export type AdminOrderInput = z.infer<typeof adminOrderSchema>;

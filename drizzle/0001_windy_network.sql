CREATE TYPE "public"."customer_type" AS ENUM('guest', 'student', 'faculty_staff', 'department');--> statement-breakpoint
CREATE TYPE "public"."fulfillment_method" AS ENUM('pickup', 'campus_delivery');--> statement-breakpoint
CREATE TYPE "public"."stock_movement_reason" AS ENUM('initial', 'restock', 'sale', 'adjustment', 'return');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'cashier', 'store_manager');--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'mobile_payment' BEFORE 'other';--> statement-breakpoint
ALTER TYPE "public"."payment_method" ADD VALUE 'department_account' BEFORE 'other';--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"code" varchar(20) NOT NULL,
	"faculty" varchar(160),
	"budget_code" varchar(60),
	"contact_name" varchar(160),
	"contact_email" varchar(254),
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stock_movements" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"product_id" uuid NOT NULL,
	"delta" integer NOT NULL,
	"reason" "stock_movement_reason" NOT NULL,
	"balance_after" integer NOT NULL,
	"reference_type" varchar(30),
	"reference_id" uuid,
	"note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "role" "user_role" DEFAULT 'admin' NOT NULL;--> statement-breakpoint
ALTER TABLE "admin_users" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "type" "customer_type" DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "student_id" varchar(40);--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "faculty" varchar(160);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "customer_type" "customer_type" DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "po_number" varchar(60);--> statement-breakpoint
ALTER TABLE "invoices" ADD COLUMN "fulfillment" "fulfillment_method" DEFAULT 'pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "customer_type" "customer_type" DEFAULT 'guest' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "department_id" uuid;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "po_number" varchar(60);--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "fulfillment" "fulfillment_method" DEFAULT 'pickup' NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "preferred_payment_method" "payment_method" DEFAULT 'cash' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" varchar(80);--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stock_movements" ADD CONSTRAINT "stock_movements_created_by_admin_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."admin_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "departments_code_idx" ON "departments" USING btree ("code");--> statement-breakpoint
CREATE INDEX "departments_name_idx" ON "departments" USING btree ("name");--> statement-breakpoint
CREATE INDEX "stock_movements_product_id_created_at_idx" ON "stock_movements" USING btree ("product_id","created_at");--> statement-breakpoint
CREATE INDEX "stock_movements_reason_idx" ON "stock_movements" USING btree ("reason");--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "customers_type_idx" ON "customers" USING btree ("type");--> statement-breakpoint
CREATE INDEX "customers_department_id_idx" ON "customers" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "invoices_department_id_idx" ON "invoices" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "orders_department_id_idx" ON "orders" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "products_brand_idx" ON "products" USING btree ("brand");
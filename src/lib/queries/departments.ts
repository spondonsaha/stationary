import "server-only";
import { asc, eq } from "drizzle-orm";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";

export type DepartmentOption = {
  id: string;
  name: string;
  code: string;
  budgetCode: string | null;
};

/** Active departments offered in the checkout department picker. */
export const getActiveDepartments = unstable_cache(
  async (): Promise<DepartmentOption[]> =>
    db
      .select({
        id: departments.id,
        name: departments.name,
        code: departments.code,
        budgetCode: departments.budgetCode,
      })
      .from(departments)
      .where(eq(departments.active, true))
      .orderBy(asc(departments.name)),
  ["departments:active"],
  { tags: ["departments"], revalidate: 300 },
);

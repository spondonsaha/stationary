"use client";

/** Category <select> for GET filter forms (submits with the surrounding form). */
export function CategoryFilterSelect({
  categories,
  value,
  name = "category",
}: {
  categories: { id: string; name: string; slug: string }[];
  value: string;
  name?: string;
}) {
  return (
    <select
      id="pcategory"
      name={name}
      defaultValue={value}
      className="h-11 w-full rounded-md border border-ink-200 bg-white px-3 text-sm sm:w-48"
    >
      <option value="">All categories</option>
      {categories.map((c) => (
        <option key={c.id} value={c.slug}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

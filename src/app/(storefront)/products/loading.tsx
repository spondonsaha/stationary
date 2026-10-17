import { ProductGridSkeleton } from "@/components/storefront/ProductCard";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="skeleton h-4 w-32 rounded" aria-hidden />
      <div className="skeleton mt-4 h-9 w-64 rounded" aria-hidden />
      <div className="skeleton mt-6 h-20 w-full rounded-card" aria-hidden />
      <div className="mt-8" role="status" aria-label="Loading products">
        <ProductGridSkeleton count={12} />
      </div>
    </div>
  );
}

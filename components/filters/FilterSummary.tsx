"use client";

export function FilterSummary({
  visibleCount,
  totalCount,
}: {
  visibleCount: number;
  totalCount: number;
}) {
  return (
    <div className="filter-count desktop-filter-count" aria-live="polite">
      {visibleCount} von {totalCount} sichtbar
    </div>
  );
}

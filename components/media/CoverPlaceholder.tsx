"use client";

function initialsFromName(name: string): string {
  const parts = name
    .replace(/[:]/g, " ")
    .split(/\s+/)
    .filter((part) => part && !/^(the|a|of|and|und|der|die|das)$/i.test(part));
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

export function PlaceholderCover({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={className ? `cover-placeholder ${className}` : "cover-placeholder"} aria-hidden="true">
      {initialsFromName(name)}
    </div>
  );
}

export const CoverPlaceholder = PlaceholderCover;

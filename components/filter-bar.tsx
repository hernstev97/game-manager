"use client";

import { useMemo, useState } from "react";
import {
  collectFieldOptions,
  fieldById,
  filterableFields,
  type AnyGameField,
  type GameRecord,
} from "@/lib/game-fields";
import {
  activeFilterChips,
  emptyFieldFilter,
  isFilterActive,
  type FieldFilterValue,
  type LibraryFilters,
} from "@/lib/filter-games";
import { Chip, Popover, TextButton } from "@/components/ui";
import { ChevronDown, Filter, X } from "lucide-react";
import { cn } from "@/lib/cn";

type FilterGroup = {
  key: string;
  label: string;
  fields: AnyGameField[];
};

function groupFilterFields(fields: AnyGameField[]): FilterGroup[] {
  const groups: FilterGroup[] = [];
  const seen = new Set<string>();
  for (const field of fields) {
    const key = field.filterGroup ?? field.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const members = field.filterGroup
      ? fields.filter((item) => item.filterGroup === field.filterGroup)
      : [field];
    groups.push({
      key,
      label: field.filterGroupLabel ?? field.label,
      fields: members,
    });
  }
  return groups;
}

function FieldFilterControls({
  field,
  value,
  games,
  onChange,
}: {
  field: AnyGameField;
  value: FieldFilterValue | undefined;
  games: GameRecord[];
  onChange: (next: FieldFilterValue) => void;
}) {
  if (field.type === "text" || field.filterWidget === "toggle") {
    const current = value?.kind === "toggle" ? value : { kind: "toggle" as const, on: false };
    return (
      <Chip selected={current.on} tone="primary" onClick={() => onChange({ ...current, on: !current.on })}>
        {field.filterTrueLabel ?? field.label}
      </Chip>
    );
  }

  if (field.type === "rating") {
    const current = value?.kind === "rating" ? value : { kind: "rating" as const, selected: [], gte: 7 };
    const toggle = (token: "rated" | "unrated" | "gte") => {
      const selected = current.selected.includes(token)
        ? current.selected.filter((item) => item !== token)
        : [...current.selected, token];
      onChange({ ...current, selected });
    };
    return (
      <div className="filter-stack">
        <div className="chip-row">
          <Chip selected={current.selected.includes("rated")} onClick={() => toggle("rated")}>
            Bewertet
          </Chip>
          <Chip selected={current.selected.includes("unrated")} onClick={() => toggle("unrated")}>
            Unbewertet
          </Chip>
          <Chip selected={current.selected.includes("gte")} onClick={() => toggle("gte")}>
            ≥ {current.gte}
          </Chip>
        </div>
        {current.selected.includes("gte") ? (
          <label className="range-row">
            <span>Mindestens</span>
            <input
              type="range"
              min={1}
              max={10}
              step={0.5}
              value={current.gte}
              onChange={(event) => onChange({ ...current, gte: Number(event.target.value) })}
            />
            <strong>{current.gte}</strong>
          </label>
        ) : null}
      </div>
    );
  }

  if (field.type === "priority") {
    const current = value?.kind === "priority" ? value : { kind: "priority" as const, selected: [] };
    const toggle = (token: "has" | "top5" | "none") => {
      const selected = current.selected.includes(token)
        ? current.selected.filter((item) => item !== token)
        : [...current.selected, token];
      onChange({ ...current, selected });
    };
    return (
      <div className="chip-row">
        <Chip selected={current.selected.includes("has")} onClick={() => toggle("has")}>
          Hat Priorität
        </Chip>
        <Chip selected={current.selected.includes("top5")} onClick={() => toggle("top5")}>
          Top 5
        </Chip>
        <Chip selected={current.selected.includes("none")} onClick={() => toggle("none")}>
          Ohne Rang
        </Chip>
      </div>
    );
  }

  const current = value?.kind === "multi" ? value : { kind: "multi" as const, selected: [] };
  const toggle = (token: string) => {
    const selected = current.selected.includes(token)
      ? current.selected.filter((item) => item !== token)
      : [...current.selected, token];
    onChange({ ...current, selected });
  };

  if (field.type === "boolean") {
    return (
      <div className="chip-row">
        <Chip selected={current.selected.includes("true")} onClick={() => toggle("true")}>
          {field.filterTrueLabel ?? field.label}
        </Chip>
        <Chip selected={current.selected.includes("false")} onClick={() => toggle("false")}>
          {field.filterFalseLabel ?? `Nicht ${field.label}`}
        </Chip>
      </div>
    );
  }

  const options = collectFieldOptions(field, games);
  return (
    <div className="chip-row">
      {options.map((option) => (
        <Chip key={option} selected={current.selected.includes(option)} onClick={() => toggle(option)}>
          {option}
        </Chip>
      ))}
    </div>
  );
}

function groupActiveCount(group: FilterGroup, filters: LibraryFilters): number {
  let count = 0;
  for (const field of group.fields) {
    const value = filters.fields[field.id];
    if (!value) continue;
    if (value.kind === "toggle" && value.on) count++;
    if (value.kind === "multi") count += value.selected.length;
    if (value.kind === "rating") count += value.selected.length;
    if (value.kind === "priority") count += value.selected.length;
  }
  return count;
}

export function FilterBar({
  games,
  filters,
  visibleCount,
  onChange,
  onClear,
}: {
  games: GameRecord[];
  filters: LibraryFilters;
  visibleCount: number;
  onChange: (next: LibraryFilters) => void;
  onClear: () => void;
}) {
  const [openKey, setOpenKey] = useState<string | null>(null);
  const groups = useMemo(() => groupFilterFields(filterableFields()), []);
  const chips = activeFilterChips(filters);
  const active = isFilterActive(filters);

  const setField = (fieldId: string, value: FieldFilterValue) => {
    onChange({
      ...filters,
      fields: { ...filters.fields, [fieldId]: value },
    });
  };

  const dismissChip = (fieldId: string, token: string) => {
    if (fieldId === "query") {
      onChange({ ...filters, query: "" });
      return;
    }
    const field = fieldById(fieldId);
    const current = filters.fields[fieldId] ?? (field ? emptyFieldFilter(field) : undefined);
    if (!current) return;
    if (current.kind === "toggle") {
      setField(fieldId, { ...current, on: false });
      return;
    }
    if (current.kind === "multi") {
      setField(fieldId, { ...current, selected: current.selected.filter((item) => item !== token) });
      return;
    }
    if (current.kind === "rating") {
      setField(fieldId, {
        ...current,
        selected: current.selected.filter((item) => item !== token),
      });
      return;
    }
    setField(fieldId, {
      ...current,
      selected: current.selected.filter((item) => item !== token),
    });
  };

  return (
    <section className="filter-bar" aria-label="Filter">
      <div className="filter-bar-heading">
        <div className="filter-heading-copy">
          <span className="section-eyebrow">NAVIGATE</span>
          <h2>Deine Sammlung im Fokus</h2>
        </div>
        <div className="filter-count" aria-live="polite">
          <strong>{visibleCount}</strong>
          <span>von {games.length} sichtbar</span>
        </div>
      </div>
      <div className="filter-groups">
        <span className="filter-lead-mark" aria-hidden="true">
          <Filter size={16} strokeWidth={2.4} />
          <span>Filter</span>
        </span>
        {groups.map((group) => {
          const activeCount = groupActiveCount(group, filters);
          const isOpen = openKey === group.key;
          return (
            <div key={group.key} className="filter-group">
              <button
                type="button"
                className={cn("filter-trigger", activeCount > 0 && "is-active")}
                aria-expanded={isOpen}
                onClick={() => setOpenKey((current) => (current === group.key ? null : group.key))}
              >
                <span>{group.label}</span>
                {activeCount > 0 ? (
                  <span className="filter-trigger-badge">{activeCount}</span>
                ) : null}
                <ChevronDown
                  size={15}
                  className="transition-transform duration-200"
                  style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              <Popover open={isOpen} onClose={() => setOpenKey(null)}>
                <div className="filter-popover">
                  <div className="filter-popover-label">{group.label}</div>
                  {group.fields.map((field) => (
                    <FieldFilterControls
                      key={field.id}
                      field={field}
                      games={games}
                      value={filters.fields[field.id]}
                      onChange={(next) => setField(field.id, next)}
                    />
                  ))}
                </div>
              </Popover>
            </div>
          );
        })}
      </div>

      {active ? (
        <div className="active-filters">
          {chips.map((chip) => {
            const tone =
              chip.fieldId === "owned" || chip.fieldId === "wishlisted"
                ? "secondary"
                : chip.fieldId === "finished" || chip.fieldId === "franchise" || chip.fieldId === "genres"
                  ? "tertiary"
                  : "primary";
            return (
              <Chip
                key={`${chip.fieldId}-${chip.token}`}
                selected
                tone={tone}
                className="filter-chip-enter"
                onDismiss={() => dismissChip(chip.fieldId, chip.token)}
              >
                {chip.label}
              </Chip>
            );
          })}
          <TextButton onClick={onClear}>
            <X size={15} />
            Alle löschen
          </TextButton>
        </div>
      ) : null}
    </section>
  );
}

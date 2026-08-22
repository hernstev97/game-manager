import { z } from "zod";
import type { SavedView, SavedViewFilterValue } from "../model/views";
import {
  DISPLAY_MODES,
  GROUP_BY_MODES,
  SAVED_VIEW_KINDS,
} from "../model/views";

const selectionSchema = z.array(z.enum(["has", "top5", "none"]));
const favoriteSelectionSchema = z.array(z.enum(["has", "top5", "top10", "none"]));
const multiFilterSchema = z
  .object({ kind: z.literal("multi"), selected: z.array(z.string()) })
  .passthrough();
const toggleFilterSchema = z
  .object({ kind: z.literal("toggle"), on: z.boolean() })
  .passthrough();
const ratingFilterSchema = z
  .object({
    kind: z.literal("rating"),
    selected: z.array(z.enum(["rated", "unrated", "gte"])),
    gte: z.number().finite(),
  })
  .passthrough();
const queueFilterSchema = z
  .object({ kind: z.literal("queue"), selected: selectionSchema })
  .passthrough();
const favoriteFilterSchema = z
  .object({ kind: z.literal("favorite"), selected: favoriteSelectionSchema })
  .passthrough();
const priorityFilterSchema = z
  .object({ kind: z.literal("priority"), selected: selectionSchema })
  .passthrough();

const knownFilterSchemas = {
  multi: multiFilterSchema,
  toggle: toggleFilterSchema,
  rating: ratingFilterSchema,
  queue: queueFilterSchema,
  favorite: favoriteFilterSchema,
  priority: priorityFilterSchema,
} as const;

export const savedViewFilterValueSchema: z.ZodType<SavedViewFilterValue> = z
  .object({ kind: z.string() })
  .passthrough()
  .superRefine((value, context) => {
    const schema = knownFilterSchemas[value.kind as keyof typeof knownFilterSchemas];
    if (!schema) return;
    const parsed = schema.safeParse(value);
    if (parsed.success) return;
    context.addIssue({
      code: "custom",
      message: `Invalid ${value.kind} filter: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
    });
  }) as unknown as z.ZodType<SavedViewFilterValue>;

export const savedViewFiltersSchema = z
  .object({
    query: z.string(),
    fields: z.record(z.string(), savedViewFilterValueSchema),
  })
  .passthrough();

export const sortStateSchema = z
  .object({ by: z.string().min(1), dir: z.enum(["asc", "desc"]) })
  .passthrough();

export const savedViewSchema: z.ZodType<SavedView> = z
  .object({
    id: z.string().min(1),
    name: z.string(),
    filters: savedViewFiltersSchema,
    sort: sortStateSchema,
    displayMode: z.enum(DISPLAY_MODES),
    groupBy: z.enum(GROUP_BY_MODES),
    isDefault: z.boolean(),
    kind: z.enum(SAVED_VIEW_KINDS),
  })
  .passthrough() as z.ZodType<SavedView>;

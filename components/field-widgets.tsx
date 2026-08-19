"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AnyGameField, GameRecord } from "@/lib/game-fields";
import {
  collectEditorOptions,
  collectFieldOptions,
  formatDate,
  formatPlaytime,
  matchExistingOption,
} from "@/lib/game-fields";
import { CoverImage } from "@/components/cover-image";
import { IconCheck } from "@/components/m3/icons";
import { M3Chip, M3Menu, M3Slider, M3Switch, M3TextField } from "@/components/m3/host";
import { toast } from "@/components/m3/snackbar";
import { MorphLoader } from "@/components/morph-loader";
import {
  fetchSteamAppDetails,
  formatMoneyFromCents,
  isSteamPriceSnapshot,
  steamStoreUrl,
} from "@/lib/steam";
import {
  fetchIgdbGame,
  hasIgdbCredentials,
  igdbSearchUrl,
  mergeCatalogFields,
} from "@/lib/igdb";
import { useLibrary } from "@/store/library";

export function BooleanChip({
  field,
  value,
}: {
  field: AnyGameField;
  value: boolean;
}) {
  if (!value) return null;
  return <M3Chip>{field.label}</M3Chip>;
}

export function RatingStars({
  value,
  onChange,
  compact,
}: {
  value: number | null;
  onChange?: (value: number | null) => void;
  compact?: boolean;
}) {
  if (compact) {
    return <span>{value == null ? "—" : value.toFixed(1)}</span>;
  }
  return (
    <div className="filter-stack">
      <M3Slider
        label="Bewertung"
        min={1}
        max={10}
        step={0.5}
        value={value ?? 1}
        onChange={(next) => onChange?.(next)}
      />
      <div className="confirm-row">
        <strong>{value == null ? "—" : value.toFixed(1)}</strong>
        {onChange && value != null ? (
          <m3-button variant="text" onClick={() => onChange(null)}>
            Zurücksetzen
          </m3-button>
        ) : null}
      </div>
    </div>
  );
}

export function PriorityBadge({ value }: { value: number | null }) {
  if (value == null) return null;
  return <M3Chip>#{value}</M3Chip>;
}

export function NotesPreview({ value }: { value: string }) {
  const line = value.split(/\r?\n/, 1)[0]?.trim() ?? "";
  if (!line) return null;
  return <span title={value}>{line}</span>;
}

const NEW_VALUE = "\u001enew";
const CLEAR_VALUE = "\u001eclear";

function EnumField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="anchor">
        <m3-button variant="outlined" onClick={() => setOpen((current) => !current)}>
          {value}
        </m3-button>
        <M3Menu
          open={open}
          onOpenChange={setOpen}
          onSelect={(next) => {
            onChange(next);
            setOpen(false);
          }}
        >
          {options.map((option) => (
            <m3-menu-item key={option} value={option}>
              {option}
              {option === value ? <IconCheck slot="trailing-icon" /> : null}
            </m3-menu-item>
          ))}
        </M3Menu>
      </div>
    </div>
  );
}

function ComboEnumField({
  field,
  value,
  options,
  onChange,
}: {
  field: AnyGameField;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  const newLabel = field.newOptionLabel ?? `Neue ${field.label}`;
  const emptyLabel = field.emptyLabel ?? "Keine Angabe";
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(() => !value && options.length === 0);

  const buttonLabel = creating ? newLabel : value || emptyLabel;

  return (
    <div className="field">
      <span className="field-label">{field.label}</span>
      <div className="anchor">
        <m3-button variant="outlined" onClick={() => setOpen((current) => !current)}>
          {buttonLabel}
        </m3-button>
        <M3Menu
          open={open}
          onOpenChange={setOpen}
          onSelect={(next) => {
            if (next === NEW_VALUE) {
              setCreating(true);
              setOpen(false);
              return;
            }
            if (next === CLEAR_VALUE) {
              setCreating(false);
              onChange("");
              setOpen(false);
              return;
            }
            setCreating(false);
            onChange(next);
            setOpen(false);
          }}
        >
          <m3-menu-item value={CLEAR_VALUE}>
            {emptyLabel}
            {!creating && !value ? <IconCheck slot="trailing-icon" /> : null}
          </m3-menu-item>
          {options.map((option) => (
            <m3-menu-item key={option} value={option}>
              {option}
              {!creating && option === value ? <IconCheck slot="trailing-icon" /> : null}
            </m3-menu-item>
          ))}
          <m3-menu-item value={NEW_VALUE}>
            {newLabel}
            {creating ? <IconCheck slot="trailing-icon" /> : null}
          </m3-menu-item>
        </M3Menu>
      </div>
      {creating ? (
        <M3TextField
          label={newLabel}
          value={value}
          onChange={onChange}
          onCommit={(next) => onChange(matchExistingOption(options, next))}
          placeholder={field.label}
          autoFocus
        />
      ) : null}
      {field.filterMinCount && field.filterMinCount > 1 ? (
        <span className="settings-copy">
          Im Filter erst ab {field.filterMinCount} Spielen sichtbar.
        </span>
      ) : null}
    </div>
  );
}

function ComboMultiEnumField({
  field,
  selected,
  options,
  onChange,
}: {
  field: AnyGameField;
  selected: string[];
  options: readonly string[];
  onChange: (value: string[]) => void;
}) {
  const newLabel = field.newOptionLabel ?? `Neue ${field.label}`;
  const max = field.maxSelected ?? Infinity;
  const unused = options.filter((option) => !selected.includes(option));
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(() => options.length === 0 && selected.length === 0);
  const [draft, setDraft] = useState("");

  const add = (raw: string) => {
    const next = matchExistingOption(options, raw);
    if (!next) return;
    if (selected.includes(next)) {
      setDraft("");
      setCreating(false);
      return;
    }
    if (selected.length >= max) {
      onChange([...selected.slice(selected.length - max + 1), next]);
    } else {
      onChange([...selected, next]);
    }
    setDraft("");
    setCreating(false);
  };

  return (
    <div className="field">
      <span className="field-label">{field.label}</span>
      {selected.length > 0 ? (
        <div className="chip-row">
          {selected.map((item) => (
            <M3Chip
              key={item}
              variant="input"
              removable
              onRemove={() => onChange(selected.filter((entry) => entry !== item))}
            >
              {item}
            </M3Chip>
          ))}
        </div>
      ) : null}
      <div className="anchor">
        <m3-button variant="outlined" onClick={() => setOpen((current) => !current)}>
          {creating ? newLabel : unused.length > 0 ? `${field.label} wählen` : newLabel}
        </m3-button>
        <M3Menu
          open={open}
          onOpenChange={setOpen}
          onSelect={(next) => {
            if (next === NEW_VALUE) {
              setCreating(true);
              setOpen(false);
              return;
            }
            add(next);
            setOpen(false);
          }}
        >
          {unused.map((option) => (
            <m3-menu-item key={option} value={option}>
              {option}
            </m3-menu-item>
          ))}
          <m3-menu-item value={NEW_VALUE}>
            {newLabel}
            {creating ? <IconCheck slot="trailing-icon" /> : null}
          </m3-menu-item>
        </M3Menu>
      </div>
      {creating ? (
        <form
          className="confirm-row"
          onSubmit={(event) => {
            event.preventDefault();
            add(draft);
          }}
        >
          <M3TextField
            label={newLabel}
            value={draft}
            onChange={setDraft}
            placeholder={field.label}
            autoFocus
          />
          <m3-button type="submit">Hinzufügen</m3-button>
        </form>
      ) : null}
    </div>
  );
}

const STEAM_APP_ID_DEBOUNCE_MS = 400;

function parsePositiveAppId(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function SteamAppIdField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const committed = typeof game.steamAppId === "number" ? game.steamAppId : null;
  const [draft, setDraft] = useState(committed == null ? "" : String(committed));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const apply = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const parsed = parsePositiveAppId(raw);
      if (raw.trim() === "") {
        if (committed != null) onChange({ steamAppId: null, steamPrice: null });
        return;
      }
      if (parsed == null || parsed === committed) return;
      onChange({
        steamAppId: parsed,
        steamPrice: null,
      });
    },
    [committed, onChange],
  );

  const storeId = parsePositiveAppId(draft) ?? committed;

  return (
    <div className="field">
      <M3TextField
        label="Steam App-ID"
        value={draft}
        onChange={(next) => {
          setDraft(next);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => apply(next), STEAM_APP_ID_DEBOUNCE_MS);
        }}
        onCommit={apply}
        placeholder="359870"
      />
      <div className="confirm-row">
        <m3-button
          variant="outlined"
          disabled={storeId == null}
          onClick={() => {
            if (storeId == null) return;
            apply(draft);
            window.open(steamStoreUrl(storeId), "_blank", "noopener,noreferrer");
          }}
        >
          Im Steam Store öffnen
        </m3-button>
      </div>
    </div>
  );
}

function IgdbIdField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const igdbClientId = useLibrary((state) => state.igdbClientId);
  const igdbClientSecret = useLibrary((state) => state.igdbClientSecret);
  const committed = typeof game.igdbId === "number" ? game.igdbId : null;
  const [draft, setDraft] = useState(committed == null ? "" : String(committed));
  const [busy, setBusy] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const apply = useCallback(
    (raw: string) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const parsed = parsePositiveAppId(raw);
      if (raw.trim() === "") {
        if (committed != null) onChange({ igdbId: null });
        return;
      }
      if (parsed == null || parsed === committed) return;
      onChange({ igdbId: parsed });
    },
    [committed, onChange],
  );

  const storeId = parsePositiveAppId(draft) ?? committed;
  const creds = { clientId: igdbClientId, clientSecret: igdbClientSecret };
  const ready = hasIgdbCredentials(creds);

  const loadMetadata = async () => {
    const id = storeId;
    if (id == null) {
      toast.error("Bitte zuerst eine IGDB-ID eintragen.");
      return;
    }
    if (!ready) {
      toast.error("IGDB in den Einstellungen verbinden (Twitch-Client-ID und Secret).");
      return;
    }
    apply(draft);
    setBusy(true);
    try {
      const details = await fetchIgdbGame({ kind: "id", value: id }, creds);
      if (!details) {
        toast.error("IGDB hat kein Spiel zu dieser ID gefunden.");
        return;
      }
      onChange(mergeCatalogFields(game, details));
      toast.success("IGDB-Metadaten übernommen.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "IGDB-Metadaten nicht geladen.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="field">
      <M3TextField
        label="IGDB-ID"
        value={draft}
        onChange={(next) => {
          setDraft(next);
          if (debounceRef.current) clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => apply(next), STEAM_APP_ID_DEBOUNCE_MS);
        }}
        onCommit={apply}
        placeholder="1026"
        helperText={ready ? undefined : "Twitch-App in den Einstellungen eintragen, um zu laden."}
      />
      <div className="confirm-row">
        <m3-button
          variant="outlined"
          disabled={!game.name && storeId == null}
          onClick={() => {
            window.open(
              igdbSearchUrl(game.name || (storeId != null ? String(storeId) : "")),
              "_blank",
              "noopener,noreferrer",
            );
          }}
        >
          Bei IGDB öffnen
        </m3-button>
        <m3-button variant="text" disabled={busy || storeId == null} onClick={() => void loadMetadata()}>
          Metadaten laden
        </m3-button>
      </div>
    </div>
  );
}

function SteamPriceField({
  game,
  onChange,
}: {
  game: GameRecord;
  onChange: (patch: Partial<GameRecord>) => void;
}) {
  const appId = game.steamAppId;
  const price = isSteamPriceSnapshot(game.steamPrice) ? game.steamPrice : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const attemptedFor = useRef<number | null>(null);
  const appIdRef = useRef(appId);
  const requestSeq = useRef(0);

  const load = useCallback(
    async (id: number, manual: boolean) => {
      const seq = ++requestSeq.current;
      setBusy(true);
      if (manual) setError(null);
      try {
        const details = await fetchSteamAppDetails(id);
        if (seq !== requestSeq.current) return;
        if (!details) {
          setError("Steam lieferte keine Spieldetails.");
          return;
        }
        onChange({ steamPrice: details.price, released: details.released });
        setError(details.price ? null : "Steam hat keinen Store-Preis geliefert.");
      } catch (err) {
        if (seq !== requestSeq.current) return;
        const message = err instanceof Error ? err.message : "Preis konnte nicht geladen werden.";
        setError(message);
        if (manual) toast.error(message);
      } finally {
        if (seq === requestSeq.current) setBusy(false);
      }
    },
    [onChange],
  );

  useEffect(() => {
    appIdRef.current = appId;
    if (appId == null) {
      attemptedFor.current = null;
      requestSeq.current += 1;
      return;
    }
    if (price) return;
    if (attemptedFor.current === appId) return;
    attemptedFor.current = appId;
    void load(appId, false);
  }, [appId, price, load]);

  const original =
    price &&
    !price.isFree &&
    price.initialCents != null &&
    price.finalCents != null &&
    price.initialCents > price.finalCents
      ? formatMoneyFromCents(price.initialCents, price.currency)
      : null;

  return (
    <div className="field">
      <span className="field-label">Steam-Preis</span>
      {appId == null ? (
        <p className="settings-copy">Keine Steam-App-ID — Preis kann nicht geladen werden.</p>
      ) : (
        <>
          <div className="steam-price">
            {busy && !price ? (
              <MorphLoader size={28} label="Steam-Preis wird geladen" />
            ) : price ? (
              <>
                <div className="steam-price-line">
                  {original ? <span className="steam-price-was">{original}</span> : null}
                  <strong className="steam-price-value">{price.formatted}</strong>
                  {price.discountPercent > 0 ? <M3Chip>−{price.discountPercent}%</M3Chip> : null}
                </div>
                <span className="settings-copy">Stand: {formatDate(price.updatedAt)}</span>
              </>
            ) : (
              <p className="settings-copy">{error || "Noch kein Preis geladen."}</p>
            )}
            {price && error ? <p className="settings-copy">{error}</p> : null}
          </div>
          <div className="confirm-row">
            <m3-button variant="text" disabled={busy} onClick={() => void load(appId, true)}>
              Preis aktualisieren
            </m3-button>
            {busy && price ? <MorphLoader size={24} label="Steam-Preis wird aktualisiert" /> : null}
          </div>
          <span className="settings-copy">Steam-Storepreis für Deutschland. Snapshot, nicht live.</span>
        </>
      )}
    </div>
  );
}

export function EditorField({
  field,
  game,
  games,
  onChange,
  onPriority,
}: {
  field: AnyGameField;
  game: GameRecord;
  games: GameRecord[];
  onChange: (patch: Partial<GameRecord>) => void;
  onPriority: (priority: number | null) => void;
}) {
  const value = game[field.id];
  const currentTokens = Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : typeof value === "string"
      ? value
      : "";
  const options =
    field.allowCustom || !field.options?.length
      ? collectEditorOptions(field, games, currentTokens)
      : collectFieldOptions(field, games);

  if (field.type === "boolean") {
    return (
      <M3Switch
        label={field.label}
        checked={Boolean(value)}
        onChange={(next) => onChange({ [field.id]: next })}
        disabled={field.readOnly}
      />
    );
  }

  if (field.type === "text") {
    return (
      <label className="field">
        <span className="field-label">{field.label}</span>
        <textarea
          className="notes-input"
          value={typeof value === "string" ? value : ""}
          aria-label={field.label}
          rows={5}
          onChange={(event) => onChange({ [field.id]: event.target.value })}
        />
      </label>
    );
  }

  if (field.type === "enum") {
    const current = typeof value === "string" ? value : String(field.defaultValue ?? "");
    if (field.allowCustom || !field.options?.length) {
      return (
        <ComboEnumField
          field={field}
          value={current}
          options={options}
          onChange={(next) => onChange({ [field.id]: next })}
        />
      );
    }
    return (
      <EnumField
        label={field.label}
        value={current}
        options={options}
        onChange={(next) => onChange({ [field.id]: next })}
      />
    );
  }

  if (field.type === "multiEnum") {
    const selected = Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
    if (field.allowCustom || !field.options?.length) {
      return (
        <ComboMultiEnumField
          field={field}
          selected={selected}
          options={options}
          onChange={(next) => onChange({ [field.id]: next })}
        />
      );
    }
    const max = field.maxSelected ?? Infinity;
    return (
      <div className="field">
        <span className="field-label">{field.label}</span>
        <div className="chip-row">
          {options.map((option) => {
            const isOn = selected.includes(option);
            return (
              <M3Chip
                key={option}
                variant="filter"
                selected={isOn}
                onClick={() => {
                  if (isOn) {
                    onChange({ [field.id]: selected.filter((item) => item !== option) });
                    return;
                  }
                  if (selected.length >= max) {
                    onChange({ [field.id]: [...selected.slice(1 - max + selected.length), option].slice(-max) });
                    return;
                  }
                  onChange({ [field.id]: [...selected, option] });
                }}
              >
                {option}
              </M3Chip>
            );
          })}
        </div>
      </div>
    );
  }

  if (field.type === "rating") {
    return (
      <div className="field">
        <span className="field-label">{field.label}</span>
        <RatingStars
          value={typeof value === "number" ? value : null}
          onChange={(next) => onChange({ [field.id]: next })}
        />
      </div>
    );
  }

  if (field.type === "priority") {
    const current = typeof value === "number" ? value : null;
    return (
      <div className="field">
        <span className="field-label">{field.label}</span>
        <div className="priority-editor">
          <M3TextField
            label="Rang"
            type="number"
            value={current == null ? "" : String(current)}
            onChange={(next) => {
              if (next === "") {
                onPriority(null);
                return;
              }
              const parsed = Number(next);
              if (Number.isFinite(parsed)) onPriority(parsed);
            }}
          />
          <m3-button variant="tonal" onClick={() => onPriority(1)}>
            Auf Platz 1
          </m3-button>
          {current != null ? (
            <m3-button variant="text" onClick={() => onPriority(null)}>
              Rang entfernen
            </m3-button>
          ) : null}
        </div>
      </div>
    );
  }

  if (field.type === "cover") {
    return (
      <div className="field">
        <M3TextField
          label={field.label}
          value={typeof value === "string" ? value : ""}
          onChange={(next) => onChange({ [field.id]: next })}
          placeholder="https://…"
        />
        <div className="cover-preview">
          <CoverImage
            name={game.name}
            franchise={game.franchise}
            coverUrl={game.coverUrl}
            steamAppId={game.steamAppId}
          />
        </div>
      </div>
    );
  }

  if (field.type === "steamAppId") {
    return <SteamAppIdField game={game} onChange={onChange} />;
  }

  if (field.type === "igdbId") {
    return <IgdbIdField game={game} onChange={onChange} />;
  }

  if (field.type === "steamPrice") {
    return <SteamPriceField game={game} onChange={onChange} />;
  }

  if (field.type === "number") {
    if (field.id === "playtimeMinutes") {
      const minutes = typeof value === "number" ? value : null;
      return (
        <M3TextField
          label={field.label}
          helperText={minutes != null ? formatPlaytime(minutes) : undefined}
          value={minutes == null ? "" : String(minutes)}
          onChange={(next) => {
            if (next.trim() === "") {
              onChange({ [field.id]: null });
              return;
            }
            const parsed = Number(next);
            if (Number.isFinite(parsed)) onChange({ [field.id]: Math.max(0, Math.round(parsed)) });
          }}
          placeholder="Minuten"
        />
      );
    }
    return (
      <M3TextField
        label={field.label}
        value={typeof value === "number" ? String(value) : ""}
        onChange={(next) => {
          if (next.trim() === "") {
            onChange({ [field.id]: null });
            return;
          }
          const parsed = Number(next);
          if (Number.isFinite(parsed)) onChange({ [field.id]: parsed });
        }}
      />
    );
  }

  if (field.type === "date") {
    return (
      <M3TextField
        label={field.label}
        value={formatDate(typeof value === "string" ? value : null)}
        onChange={() => undefined}
        disabled
      />
    );
  }

  return (
    <M3TextField
      label={field.label}
      value={typeof value === "string" ? value : ""}
      onChange={(next) => onChange({ [field.id]: next })}
      disabled={field.readOnly}
    />
  );
}

"use client";

import { useState } from "react";
import type { AnyGameField } from "@/lib/game-fields";
import { matchExistingOption } from "@/lib/game-fields";
import { IconCheck } from "@/components/m3/icons";
import { M3Chip, M3Menu, M3TextField } from "@/components/m3/host";

const NEW_VALUE = "\u001enew";
const CLEAR_VALUE = "\u001eclear";

export function EnumField({
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

export function ComboEnumField({
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

export function ComboMultiEnumField({
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

export function MultiEnumField({
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
                  onChange(selected.filter((item) => item !== option));
                  return;
                }
                if (selected.length >= max) {
                  onChange([...selected.slice(1 - max + selected.length), option].slice(-max));
                  return;
                }
                onChange([...selected, option]);
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

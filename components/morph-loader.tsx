"use client";

import { useEffect, useMemo, useState } from "react";
import { Morph, getShape, toPathD, type ShapeName } from "shape-morph";
import { Shape } from "shape-morph/react";

/** Material 3 loading-indicator sequence: circle through polygonal forms. */
const CYCLE: ShapeName[] = [
  "Circle",
  "SoftBurst",
  "Cookie4Sided",
  "Clover4Leaf",
  "Pentagon",
  "Square",
];

const STEP_MS = 420;

export function MorphLoader({
  size = 48,
  label = "Lädt",
}: {
  size?: number;
  label?: string;
}) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  const start = CYCLE[step % CYCLE.length];
  const end = CYCLE[(step + 1) % CYCLE.length];
  const morph = useMemo(() => new Morph(getShape(start), getShape(end)), [start, end]);
  const pathD = useMemo(() => toPathD(morph.asCubics(progress), 100), [morph, progress]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    let frame = 0;
    let origin: number | null = null;
    const tick = (now: number) => {
      if (origin == null) origin = now;
      const next = Math.min(1, (now - origin) / STEP_MS);
      setProgress(next);
      if (next >= 1) {
        setStep((value) => value + 1);
        setProgress(0);
        origin = now;
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [reduceMotion]);

  return (
    <span className="morph-loader" role="status" aria-live="polite" aria-label={label}>
      {reduceMotion ? (
        <Shape name="Circle" size={size} />
      ) : (
        <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
          <path d={pathD} fill="currentColor" />
        </svg>
      )}
    </span>
  );
}

"use client";

import {
  MOTION_PREFERENCE_DETAILS,
  motionPreferences,
} from "@/lib/motion";
import { useMotion } from "@/components/preferences/MotionProvider";

export function MotionSelector() {
  const { preference, effectiveMotion, systemReduced, setPreference } = useMotion();

  return (
    <>
      <span className="field-label">Animationen</span>
      <div className="motion-options" role="radiogroup" aria-label="Animationsstufe">
        {motionPreferences.map((motionPreference) => {
          const detail = MOTION_PREFERENCE_DETAILS[motionPreference];
          const selected = preference === motionPreference;
          return (
            <button
              key={motionPreference}
              type="button"
              className={`motion-option motion-option-${motionPreference}`}
              role="radio"
              aria-checked={selected}
              onClick={() => setPreference(motionPreference)}
            >
              <span className="motion-option-demo" aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="motion-option-copy">
                <strong>{detail.label}</strong>
                <small>{detail.description}</small>
              </span>
            </button>
          );
        })}
      </div>
      <p className="settings-copy motion-system-note" aria-live="polite">
        {systemReduced
          ? "Die Systemeinstellung „Bewegung reduzieren“ ist aktiv und hat Vorrang. Wirksam: Keine."
          : `Wirksam: ${MOTION_PREFERENCE_DETAILS[effectiveMotion].label}. Die Systemeinstellung hat bei Reduced Motion Vorrang.`}
      </p>
    </>
  );
}

"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  type SteamImportComparison,
  type SteamImportJobSelection,
  type SteamImportPlan,
  type SteamImportReport,
  type SteamImportResolution,
  type SteamImportWizardProps,
  type SteamLibraryNormalizationResult,
} from "@/lib/steam-import/types";
import {
  compareSteamLibrary,
  defaultSteamImportSelection,
} from "@/lib/steam-import/match";
import { normalizeSteamLibrary } from "@/lib/steam-import/normalize";
import { prepareSteamImportPlan } from "@/lib/steam-import/plan";
import { createSteamImportReport } from "@/lib/steam-import/report";
import { runSteamImportHandoffs } from "./handoffs";
import {
  needsResolution,
  resolutionFromValue,
  type SteamImportWizardStep,
} from "./wizard-labels";

export function useSteamImportWizard(props: SteamImportWizardProps) {
  const abortRef = useRef<AbortController | null>(null);
  const [step, setStep] = useState<SteamImportWizardStep>("load");
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState("");
  const [normalization, setNormalization] =
    useState<SteamLibraryNormalizationResult | null>(null);
  const [comparison, setComparison] = useState<SteamImportComparison | null>(null);
  const [selectedAppIds, setSelectedAppIds] = useState<number[]>([]);
  const [resolutions, setResolutions] = useState<
    Record<string, SteamImportResolution | undefined>
  >({});
  const [jobs, setJobs] = useState<SteamImportJobSelection>({
    details: false,
    covers: false,
  });
  const [plan, setPlan] = useState<SteamImportPlan | null>(null);
  const [report, setReport] = useState<SteamImportReport | null>(null);
  const existingById = useMemo(
    () => new Map(props.currentDocument.games.map((game) => [game.id, game])),
    [props.currentDocument.games],
  );
  const selectedSet = useMemo(() => new Set(selectedAppIds), [selectedAppIds]);
  const unresolvedSelected = useMemo(
    () =>
      comparison?.items.filter(
        (item) =>
          selectedSet.has(item.source.steamAppId) &&
          needsResolution(item.category) &&
          !resolutions[String(item.source.steamAppId)],
      ) ?? [],
    [comparison, resolutions, selectedSet],
  );

  useEffect(() => () => abortRef.current?.abort(), []);
  useEffect(() => {
    if (props.online === false) abortRef.current?.abort();
  }, [props.online]);

  const load = async () => {
    if (props.online === false || loading) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const payload = await props.loadLibrary({ signal: controller.signal });
      if (controller.signal.aborted) return;
      const normalized = normalizeSteamLibrary(payload);
      if (normalized.games.length === 0) {
        setNormalization(normalized);
        setError(
          "Steam hat keine importierbaren Spiele geliefert. Prüfe Profilfreigabe und Verbindung.",
        );
        return;
      }
      const compared = compareSteamLibrary(
        normalized.games,
        props.currentDocument.games,
      );
      setNormalization(normalized);
      setComparison(compared);
      setSelectedAppIds(defaultSteamImportSelection(compared));
      setResolutions({});
      setPlan(null);
      setStep("select");
    } catch {
      if (!controller.signal.aborted) {
        setError(
          "Steam-Bibliothek konnte nicht geladen werden. Prüfe Verbindung, Profilfreigabe und die Zugangsdaten in den Einstellungen.",
        );
      }
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  const toggleSelection = (appId: number, checked: boolean) => {
    setSelectedAppIds((current) =>
      checked
        ? [...new Set([...current, appId])]
        : current.filter((value) => value !== appId),
    );
    if (!checked) {
      setResolutions((current) => ({ ...current, [String(appId)]: undefined }));
    }
  };

  const setResolution = (appId: number, value: string) => {
    const resolution = resolutionFromValue(value);
    setResolutions((current) => ({
      ...current,
      [String(appId)]: resolution,
    }));
    if (resolution) toggleSelection(appId, true);
  };

  const prepareReview = () => {
    if (!comparison) return;
    setError("");
    try {
      setPlan(
        prepareSteamImportPlan({
          current: props.currentDocument,
          comparison,
          selectedAppIds,
          resolutions,
          jobs,
          createId: props.createId,
        }),
      );
      setStep("review");
    } catch {
      setError(
        "Der Importplan konnte nicht sicher vorbereitet werden. Bitte Auswahl und Zuordnungen prüfen.",
      );
    }
  };

  const apply = async () => {
    if (!plan?.canApply || applying) return;
    setApplying(true);
    setError("");
    try {
      const result = await props.onApply(plan);
      if (result.importPlanId !== plan.id) throw new Error("Unexpected import result");
      const handoffs = await runSteamImportHandoffs(plan, props);
      setReport(createSteamImportReport(plan, result, handoffs));
      setStep("report");
    } catch {
      setError(
        "Die atomare Übernahme ist fehlgeschlagen. Der Plan wurde nicht als erfolgreich markiert; bitte Speicher und Snapshot-Funktion prüfen.",
      );
    } finally {
      setApplying(false);
    }
  };

  const restart = () => {
    abortRef.current?.abort();
    setStep("load");
    setError("");
    setNormalization(null);
    setComparison(null);
    setSelectedAppIds([]);
    setResolutions({});
    setPlan(null);
    setReport(null);
  };

  return {
    step, setStep, loading, applying, error, normalization, comparison,
    selectedAppIds, setSelectedAppIds, resolutions, jobs, setJobs, plan,
    setPlan, report, existingById, selectedSet, unresolvedSelected,
    load, toggleSelection, setResolution, prepareReview, apply, restart,
  };
}

export type SteamImportWizardController = ReturnType<
  typeof useSteamImportWizard
>;

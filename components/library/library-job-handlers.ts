import { fetchIgdbGame } from "@/lib/igdb";
import { JobTaskError, type JobScheduler, type JobTaskContext } from "@/lib/jobs";
import { ImageChecker } from "@/lib/media/image-checker";
import {
  createIgdbMetadataProposal,
  createMetadataReview,
  createSteamMetadataProposal,
  type MetadataProposal,
} from "@/lib/metadata";
import { fetchSteamAppDetails } from "@/lib/steam";
import { useLibrary } from "@/store/library";

const imageChecker = new ImageChecker({ concurrency: 2 });

function positiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function activeGame(gameId: string) {
  return useLibrary.getState().games.find((game) => game.id === gameId);
}

function proposalWithFields(
  proposal: MetadataProposal,
  fieldIds: readonly string[],
): MetadataProposal {
  const allowed = new Set(fieldIds);
  return {
    ...proposal,
    values: Object.fromEntries(
      Object.entries(proposal.values).filter(([fieldId]) => allowed.has(fieldId)),
    ),
    imageChecks: proposal.imageChecks
      ? Object.fromEntries(
          Object.entries(proposal.imageChecks).filter(([fieldId]) =>
            allowed.has(fieldId),
          ),
        )
      : undefined,
  };
}

function queueProposal(proposal: MetadataProposal): void {
  const game = activeGame(proposal.gameId);
  if (!game) throw new JobTaskError("Spiel existiert nicht mehr.", { code: "game-missing" });
  const review = createMetadataReview({
    id: globalThis.crypto?.randomUUID?.() ?? `review-${Date.now()}`,
    game,
    proposal,
  });
  useLibrary.getState().queueMetadataReviews([review]);
}

async function reportDone(context: JobTaskContext, message: string) {
  await context.reportProgress({
    processed: 1,
    remaining: 0,
    failed: 0,
    total: 1,
    message,
  });
}

async function runSteamMetadata(
  context: JobTaskContext,
  mode: "full" | "details" | "covers",
) {
  const gameId = stringValue(context.job.payload.gameId);
  const appId = positiveInteger(context.job.payload.steamAppId ?? context.job.payload.steamId);
  if (!gameId || !appId) {
    throw new JobTaskError("Ungültiger Steam-Auftrag.", { code: "invalid-payload" });
  }
  const details = await fetchSteamAppDetails(appId).catch((cause) => {
    throw new JobTaskError("Steam-Metadaten konnten nicht geladen werden.", {
      code: "steam-request-failed",
      retryable: true,
      cause,
    });
  });
  if (context.signal.aborted) return;
  if (!details) {
    throw new JobTaskError("Steam hat keine Details geliefert.", {
      code: "steam-not-found",
    });
  }
  const imageCheck =
    mode === "details" ? undefined : await imageChecker.check(details.coverUrl);
  if (context.signal.aborted) return;
  let proposal = createSteamMetadataProposal(
    gameId,
    details,
    new Date().toISOString(),
    imageCheck,
  );
  if (mode === "details") {
    proposal = proposalWithFields(proposal, [
      "steamAppId",
      "name",
      "released",
      "steamPrice",
    ]);
  } else if (mode === "covers") {
    proposal = proposalWithFields(proposal, ["coverUrl", "landscapeArtwork"]);
  }
  queueProposal(proposal);
  await reportDone(context, "Steam-Vorschlag wartet auf Prüfung.");
}

async function runIgdbMetadata(context: JobTaskContext) {
  const gameId = stringValue(context.job.payload.gameId);
  const igdbId = positiveInteger(context.job.payload.igdbId);
  const state = useLibrary.getState();
  if (!gameId || !igdbId) {
    throw new JobTaskError("Ungültiger IGDB-Auftrag.", { code: "invalid-payload" });
  }
  const details = await fetchIgdbGame(
    { kind: "id", value: igdbId },
    { clientId: state.igdbClientId, clientSecret: state.igdbClientSecret },
  ).catch((cause) => {
    throw new JobTaskError("IGDB-Metadaten konnten nicht geladen werden.", {
      code: "igdb-request-failed",
      retryable: true,
      cause,
    });
  });
  if (context.signal.aborted) return;
  if (!details) {
    throw new JobTaskError("IGDB hat keine Details geliefert.", {
      code: "igdb-not-found",
    });
  }
  const imageCheck = details.coverUrl
    ? await imageChecker.check(details.coverUrl)
    : undefined;
  if (context.signal.aborted) return;
  queueProposal(
    createIgdbMetadataProposal(gameId, details, new Date().toISOString(), imageCheck),
  );
  await reportDone(context, "IGDB-Vorschlag wartet auf Prüfung.");
}

let registeredScheduler: JobScheduler | undefined;

export function registerLibraryJobHandlers(scheduler: JobScheduler): void {
  if (registeredScheduler === scheduler) return;
  registeredScheduler = scheduler;
  scheduler.register("metadata.steam", (context) => runSteamMetadata(context, "full"), {
    service: "steam",
  });
  scheduler.register("metadata.igdb", runIgdbMetadata, { service: "igdb" });
  scheduler.register(
    "steam-import.details",
    (context) => runSteamMetadata(context, "details"),
    { service: "steam" },
  );
  scheduler.register(
    "steam-import.covers",
    (context) => runSteamMetadata(context, "covers"),
    { service: "steam" },
  );
}

import type { LibrarySliceContext, LibraryState } from "./types";

type IntegrationSlice = Pick<
  LibraryState,
  | "steamId"
  | "steamApiKey"
  | "igdbClientId"
  | "igdbClientSecret"
  | "setSteamCredentials"
  | "setIgdbCredentials"
>;

export function createIntegrationSlice({ set, persist }: LibrarySliceContext): IntegrationSlice {
  return {
    steamId: "",
    steamApiKey: "",
    igdbClientId: "",
    igdbClientSecret: "",

    setSteamCredentials: (steamId, steamApiKey) => {
      set({ steamId, steamApiKey });
      persist();
    },

    setIgdbCredentials: (clientId, clientSecret) => {
      set({ igdbClientId: clientId, igdbClientSecret: clientSecret });
      persist();
    },
  };
}

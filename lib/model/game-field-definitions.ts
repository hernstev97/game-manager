import type { GameFieldDef } from "../game-fields";
import {
  IDENTITY_GAME_FIELDS,
  PLATFORMS,
} from "./game-field-definitions-identity";
import { LIBRARY_GAME_FIELDS } from "./game-field-definitions-library";

export { PLATFORMS };

export const GAME_FIELDS = [
  ...IDENTITY_GAME_FIELDS,
  ...LIBRARY_GAME_FIELDS,
] as const satisfies readonly GameFieldDef[];

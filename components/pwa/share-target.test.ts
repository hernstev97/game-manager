import { describe, expect, it } from "vitest";
import {
  parseShareTarget,
  removeShareTargetParams,
} from "./share-target";

function params(input: Record<string, string>): URLSearchParams {
  return new URLSearchParams(input);
}

describe("parseShareTarget", () => {
  it("classifies a Steam store link embedded in shared text", () => {
    const result = parseShareTarget(
      params({
        "share-target": "1",
        title: "Portal 2",
        text: "Play this: https://store.steampowered.com/app/620/Portal_2/.",
      }),
    );
    expect(result).toMatchObject({ kind: "steam", steamAppId: 620, name: "Portal 2" });
    expect(result?.query).toContain("/app/620/");
  });

  it("classifies IGDB slugs and numeric references", () => {
    expect(
      parseShareTarget(
        params({ "share-target": "1", url: "https://www.igdb.com/games/outer-wilds" }),
      ),
    ).toMatchObject({ kind: "igdb", igdbRef: { kind: "slug", value: "outer-wilds" } });
    expect(
      parseShareTarget(params({ "share-target": "1", url: "https://igdb.com/games/1942" })),
    ).toMatchObject({ kind: "igdb", igdbRef: { kind: "id", value: 1942 } });
  });

  it("keeps a general URL or plain game name as an explicit payload", () => {
    expect(
      parseShareTarget(params({ "share-target": "1", url: "https://example.com/games/fez" })),
    ).toMatchObject({ kind: "url", query: "https://example.com/games/fez" });
    expect(parseShareTarget(params({ "share-target": "1", text: "Disco Elysium" }))).toMatchObject(
      { kind: "name", query: "Disco Elysium" },
    );
  });

  it("ignores ordinary queries and removes only processed share fields", () => {
    expect(parseShareTarget(params({ text: "Hades" }))).toBeNull();
    const url = new URL("https://ggrid.test/?share-target=1&title=Hades&keep=yes#library");
    expect(removeShareTargetParams(url)).toBe("/?keep=yes#library");
  });
});

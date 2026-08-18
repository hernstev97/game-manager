import { describe, expect, it } from "vitest";
import { parseSteamIdentity } from "./steam";

describe("parseSteamIdentity", () => {
  it("accepts a 64-bit id", () => {
    expect(parseSteamIdentity("76561197960434622")).toEqual({
      kind: "steam64",
      value: "76561197960434622",
    });
  });

  it("accepts vanity names and profile URLs", () => {
    expect(parseSteamIdentity("robinwalker")).toEqual({ kind: "vanity", value: "robinwalker" });
    expect(parseSteamIdentity("https://steamcommunity.com/id/robinwalker")).toEqual({
      kind: "vanity",
      value: "robinwalker",
    });
    expect(parseSteamIdentity("https://steamcommunity.com/profiles/76561197960434622")).toEqual({
      kind: "steam64",
      value: "76561197960434622",
    });
  });

  it("rejects empty or junk input", () => {
    expect(parseSteamIdentity("")).toBeNull();
    expect(parseSteamIdentity("???")).toBeNull();
  });
});

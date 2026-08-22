import { describe, expect, it } from "vitest";
import manifest from "../../app/manifest";

describe("PWA manifest", () => {
  it("contains standalone install metadata and complete icon purposes", () => {
    const value = manifest();
    expect(value).toMatchObject({ short_name: "gGrid", display: "standalone", start_url: "/" });
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "192x192", purpose: "maskable" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ]),
    );
  });

  it("exposes all shortcuts and a GET share target", () => {
    const value = manifest();
    expect(value.shortcuts?.map((item) => item.url)).toEqual([
      "/?pwa-action=add-game",
      "/?pwa-action=search",
      "/?pwa-action=queue",
    ]);
    expect(value.share_target).toEqual({
      action: "/?share-target=1",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: { title: "title", text: "text", url: "url" },
    });
  });
});

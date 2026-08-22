import type { MetadataRoute } from "next";

const shortcutIcon = {
  src: "/icons/ggrid-192.png",
  sizes: "192x192",
  type: "image/png",
};

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "gGrid – Spielebibliothek",
    short_name: "gGrid",
    description: "Die persönliche Spielebibliothek zum Sammeln, Planen und Entdecken.",
    lang: "de",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#fdf7ff",
    theme_color: "#65558f",
    categories: ["games", "utilities"],
    icons: [
      {
        src: "/icons/ggrid-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ggrid-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/ggrid-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/ggrid-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Spiel hinzufügen",
        short_name: "Hinzufügen",
        description: "Den Dialog zum Hinzufügen eines Spiels öffnen",
        url: "/?pwa-action=add-game",
        icons: [shortcutIcon],
      },
      {
        name: "Bibliothek durchsuchen",
        short_name: "Suche",
        description: "Die Suche in der Spielebibliothek fokussieren",
        url: "/?pwa-action=search",
        icons: [shortcutIcon],
      },
      {
        name: "Warteschlange",
        short_name: "Warteschlange",
        description: "Die Spielewarteschlange anzeigen",
        url: "/?pwa-action=queue",
        icons: [shortcutIcon],
      },
    ],
    share_target: {
      action: "/?share-target=1",
      method: "GET",
      enctype: "application/x-www-form-urlencoded",
      params: {
        title: "title",
        text: "text",
        url: "url",
      },
    },
  };
}

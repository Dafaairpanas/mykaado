import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MyKaado - Japanese Flashcards",
    short_name: "MyKaado",
    description: "Belajar bahasa Jepang dengan Spaced Repetition",
    start_url: "/",
    display: "standalone",
    background_color: "#FAF9F5",
    theme_color: "#0A0A0A",
    orientation: "portrait-primary",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      }
    ],
  };
}

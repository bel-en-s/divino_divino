import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/divino_divino/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "work.html"),
        culture: resolve(__dirname, "culture.html"),
        directors: resolve(__dirname, "directors.html"),
        contact: resolve(__dirname, "contact.html"),
        film: resolve(__dirname, "film.html"),
      },
    },
    assetsInclude: ["**/*.jpeg", "**/*.jpg", "**/*.png", "**/*.svg", "**/*.gif", "**/*.mp4", "**/*.webp", "**/*.hdr"],
    copyPublicDir: true,
  },
});
import { defineConfig } from "vite";
import { resolve } from "path";

const cleanUrlPages = {
  work: "work.html",
  culture: "culture.html",
  directors: "directors.html",
  contact: "contact.html",
  draw: "draw.html",
  "white-label": "white-label.html",
  care: "care.html",
  "care-form": "care-form.html",
};

function cleanUrlsPlugin() {
  return {
    name: "clean-urls",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (!req.url) return next();
        const [pathname, query] = req.url.split("?");
        const name = pathname.replace(/^\/+|\/+$/g, "");
        if (name && cleanUrlPages[name]) {
          req.url = `/${cleanUrlPages[name]}${query ? `?${query}` : ""}`;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [cleanUrlsPlugin()],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_PROXY || "https://divinodivino.com.ar",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        work: resolve(__dirname, "work.html"),
        culture: resolve(__dirname, "culture.html"),
        directors: resolve(__dirname, "directors.html"),
        contact: resolve(__dirname, "contact.html"),
        draw: resolve(__dirname, "draw.html"),
        "white-label": resolve(__dirname, "white-label.html"),
        care: resolve(__dirname, "care.html"),
        "care-form": resolve(__dirname, "care-form.html"),
      },
    },
    assetsInclude: ["**/*.jpeg", "**/*.jpg", "**/*.png", "**/*.svg", "**/*.gif", "**/*.mp4", "**/*.webp", "**/*.hdr"],
    copyPublicDir: true,
/*    css: {
      devSourcemap: true
    }*/
  },
});
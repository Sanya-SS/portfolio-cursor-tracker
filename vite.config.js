import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves the site under /<repo-name>/, so asset URLs must be
  // prefixed with the repo name. For a user/org page or a custom domain,
  // change this back to "/".
  base: "/portfolio-cursor-tracker/",
  plugins: [react()],
  server: {
    host: true,
  },
});

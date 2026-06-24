import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Spike-stage config. PWA plugin (vite-plugin-pwa) comes later, with the editor.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});

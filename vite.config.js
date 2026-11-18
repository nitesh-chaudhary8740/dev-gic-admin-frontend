
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

   server: {
    host: "0.0.0.0",

    proxy: {
      "/api": {
        target: "http://192.168.1.191:3000",
        changeOrigin: true,
      },

      "/media": {
        target: "http://192.168.1.191:3000",
        changeOrigin: true,
      },
    },
  },
});

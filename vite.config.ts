import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    allowedHosts: [
      "isupplya.com",
      "www.isupplya.com",
      "server1.isupplya.com",
    ],
    hmr: {
      protocol: "wss",
      host: "isupplya.com",
      clientPort: 443,
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: true, // Listen on all addresses (0.0.0.0)
    port: 3000,
  },
  plugins: [react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-accordion",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-label",
            "@radix-ui/react-slot",
            "@radix-ui/react-switch",
            "lucide-react",
            "framer-motion",
            "sonner",
            "vaul"
          ],
          "vendor-utils": ["date-fns", "clsx", "tailwind-merge", "zod", "react-hook-form"],
          "vendor-data": ["@tanstack/react-query", "@supabase/supabase-js"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '0.0.0.0', // Explicitly use IPv4 - prevents IPv6 DNS delays on Windows
    port: 3000,
    strictPort: false, // Allow fallback to another port if 3000 is busy
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
    sourcemap: false, // Disable sourcemaps in production for smaller bundle size
    reportCompressedSize: false, // Speed up build time
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
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb as base64
    chunkSizeWarningLimit: 1000,
  },
}));

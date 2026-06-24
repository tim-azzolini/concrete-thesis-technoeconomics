import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/concrete-thesis-technoeconomics/",
  plugins: [react()],
  optimizeDeps: {
    include: ["react-pdf"],
  },
});

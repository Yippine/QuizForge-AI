import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

// Plugin to selectively copy knowledge-base files (exclude handout and mermaid)
function selectiveKnowledgeBaseCopy() {
  return {
    name: "selective-knowledge-base-copy",
    writeBundle(options, bundle) {
      const outDir = options.dir || "dist";
      const kbSource = path.resolve(__dirname, "knowledge-base");
      const kbDest = path.resolve(outDir, "knowledge-base");

      // Remove the auto-copied knowledge-base directory
      if (fs.existsSync(kbDest)) {
        fs.rmSync(kbDest, { recursive: true, force: true });
      }

      // Create knowledge-base/ipas structure
      fs.mkdirSync(path.join(kbDest, "ipas"), { recursive: true });

      // Copy only formula (3) and questions (4) directories
      const dirsToCopy = ["3 formula", "4 questions"];
      dirsToCopy.forEach((dir) => {
        const src = path.join(kbSource, "ipas", dir);
        const dest = path.join(kbDest, "ipas", dir);
        if (fs.existsSync(src)) {
          fs.cpSync(src, dest, { recursive: true });
        }
      });

      console.log(
        "✅ Selectively copied knowledge-base (excluded handout and mermaid)"
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({ features: { customElement: false } }),
    tailwindcss(),
    selectiveKnowledgeBaseCopy(),
  ],
  optimizeDeps: {
    esbuildOptions: {
      charset: "utf8",
    },
  },
  build: {
    charset: "utf8",
  },
  server: {
    host: true,
    port: 3002,
    open: true,
    allowedHosts: [".trycloudflare.com", "long-term-care.leopilot.com"],
    hmr: {
      protocol: "ws",
      clientPort: 3002,
    },
  },
});

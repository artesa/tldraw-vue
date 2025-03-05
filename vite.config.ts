import { defineConfig, type UserConfig } from "vite";
import { qrcode } from "vite-plugin-qrcode";
import vue from "@vitejs/plugin-vue";
import dts from "vite-plugin-dts";

export default defineConfig(({ command }) => {
  const baseConfig: UserConfig = {
    define: {
      "process.env": {},
    },
    plugins: [vue(), qrcode()],
  };

  if (command === "build") {
    baseConfig.build ||= {};
    baseConfig.build.lib = {
      entry: "./src/index.ts",
      name: "tlDrawVue",
      // the proper extensions will be added
      fileName: "tldraw-vue",
      formats: ["es", "umd"],
    };
    baseConfig.build.cssCodeSplit = true;
    baseConfig.build.rollupOptions ||= {};
    baseConfig.build.rollupOptions.output ||= {};
    if (!Array.isArray(baseConfig.build.rollupOptions.output))
      baseConfig.build.rollupOptions.output.assetFileNames = assetInfo => {
        if (assetInfo.name === "index.css") return "tldraw-vue.css";
        return assetInfo.name ?? "FAIL";
      };
    baseConfig.build.rollupOptions.external = [
      "vue",
      "@vueuse/core",
    ];
    baseConfig.plugins ||= [];
    baseConfig.plugins.push(
      dts({
        rollupTypes: true,
        staticImport: true,
        exclude: ["src/test/**/*"],
      }),
    );
    baseConfig.define ||= {};
    baseConfig.define["process.env"] = {
      TLDRAW_ENV: "production",
    };
  } else if (command === "serve") {
    baseConfig.root = "./src";
  }

  return baseConfig;
});

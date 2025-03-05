import type { App } from "vue";
import TldrawVue from "./TldrawVue.vue";

export default {
  install: (app: App) => {
    app.component("TldrawVue", TldrawVue);
  },
};

export { TldrawVue };
export type { FileAssetInfo, ReloadAssetCallback, UploadImageCallback } from './TldrawVue.vue';

export * from '@tldraw/tldraw';

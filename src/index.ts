import type { App } from "vue";
import TldrawVue from "./TlDrawVue.vue";

export default {
  install: (app: App) => {
    app.component("TldrawVue", TldrawVue);
  },
};

export { TldrawVue };
export type { FileAssetInfo, ReloadAssetCallback, UploadImageCallback } from './TlDrawVue.vue';

export * from '@tldraw/tldraw';

<template>
  <div ref="tlDrawContainer" class="tldraw-container"></div>
</template>

<script setup lang="ts">
const props = defineProps<{
  data?: TLRecord[];
  uploadImage?: UploadImageCallback;
  reloadAssetUrl?: ReloadAssetCallback;
  hideUi?: boolean;
  overrides?: TLUiOverrides;
  assetUrls?: TLUiContextProviderProps['assetUrls'];
  readOnly?: boolean;
  tool?: string;
}>();

const emit = defineEmits<{
  editor: [editor: Editor];
  uiEvent: [name: string, data: any]
}>();

const tlDrawContainer = shallowRef<HTMLDivElement | null>(null);
const reactRoot = shallowRef<Root | null>(null);
const editor = shallowRef<Editor | null>(null);

const tlStore = createTLStore({
  shapeUtils: defaultShapeUtils,
});

// Sync prop data changes to tldraw
const { pause, resume } = watchPausable(
  () => props.data,
  async (newData, oldData) => {
    const diff = diffArray(oldData ?? [], newData ?? [], (a, b) => a.id !== b.id);

    const added = await Promise.all(
      diff.added.map(async added => {
        const copyAdded = copy(added);
        // This allows us to reload the asset urls if urls a signed and expire
        if (copyAdded.typeName === "asset" && props.reloadAssetUrl) {
          const reloadedUrl = await props.reloadAssetUrl(copyAdded)
          if (reloadedUrl) {
            copyAdded.props.src = reloadedUrl
          }
        }
        return copyAdded;
      }),
    );

    tlStore.mergeRemoteChanges(() => {
      tlStore.remove(diff.removed.map(d => d.id));
      tlStore.put(added);
    });
  },
  { immediate: true },
);

// Sync tldraw changes to prop data
tlStore.listen(
  async ({ changes }) => {
    pause();
    for (const added of Object.values(changes.added)) {
      const index = props.data?.findIndex(d => d.id === added.id);
      if (index !== undefined && index > -1) {
        props.data?.splice(index, 1);
      }
      props.data?.push(copy(added));
    }
    for (const updated of Object.values(changes.updated)) {
      const index = props.data?.findIndex(d => d.id === updated[1].id);
      if (index !== undefined && index > -1 && props.data && props.data[index]) {
        props.data[index] = copy(updated[1]);
      }
    }
    for (const removed of Object.values(changes.removed)) {
      const index = props.data?.findIndex(d => d.id === removed.id);
      if (index !== undefined && index > -1 && props.data) {
        props.data.splice(index, 1);
      }
    }
    resume();
  },
  { source: "user", scope: "document" },
);

// Allow us to handle files manual. Otherwise files get embedded as base64 in the document
async function assetHandler(info: FileAssetInfo): Promise<TLAsset> {
  const result = await props.uploadImage?.(info);

  // This should not happen, because with registerAssetHandlerIfAvailable we make sure that props.uploadImage is available
  if (!result) {
    throw new Error("No result from uploadImage");
  }

  const assetId: TLAssetId = AssetRecordType.createId(getHashForString(`${result.id}`));

  let size: {
    w: number;
    h: number;
  };
  let isAnimated: boolean;
  let shapeType: "image" | "video";

  if (["image/jpeg", "image/png", "image/gif", "image/svg+xml"].includes(info.file.type)) {
    shapeType = "image";
    size = await MediaHelpers.getImageSizeFromSrc(result.url);
    isAnimated = info.file.type === "image/gif" && (await MediaHelpers.isAnimated(info.file));
  } else {
    shapeType = "video";
    isAnimated = true;
    size = await MediaHelpers.getVideoSizeFromSrc(result.url);
  }

  const asset: TLAsset = AssetRecordType.create({
    id: assetId,
    type: shapeType,
    typeName: "asset",
    props: {
      name: info.file.name,
      src: result.url,
      w: size.w,
      h: size.h,
      mimeType: info.file.type,
      isAnimated,
    },
    meta: {
      id: result.id,
    },
  });

  return asset;
}

function registerAssetHandlerIfAvailable(editor: Editor): void {
  if (props.uploadImage) {
    editor.registerExternalAssetHandler("file", assetHandler);
  }
}

function createElement(): React.FunctionComponentElement<TldrawProps> {
  return React.createElement(Tldraw as React.FunctionComponent<TldrawProps>, {
    store: tlStore,
    onMount: (_editor: Editor) => {
      if (props.readOnly) {
        _editor.updateInstanceState({
          isReadonly: props.readOnly,
        })
      }

      if (props.tool) {
        _editor.setCurrentTool(props.tool);
      }
      editor.value = _editor;
      registerAssetHandlerIfAvailable(_editor);
      emit("editor", _editor);
    },
    hideUi: props.hideUi,
    overrides: props.overrides,
    assetUrls: props.assetUrls,
    onUiEvent: (name, data) => {
      emit('uiEvent', name, data)
    },
  } as TldrawProps);
}

// If props change, we need to rerender the react tree
watch([() => props.hideUi, () => props.overrides, () => props.assetUrls, () => props.readOnly], () => {
  rerender();
});

// Render react tree
function rerender(): void {
  if (reactRoot.value) {
    reactRoot.value.render(createElement());
  }
}

// Create react root when container ref is set
whenever(tlDrawContainer, tlDrawContainer => {
  reactRoot.value = createRoot(tlDrawContainer);
  rerender();
});

// Unmount react root when component unmounts
onUnmounted(() => {
  if (reactRoot.value) {
    reactRoot.value.unmount();
  }
});

/**
 * Load a snapshot
 * @param snapshot TLStoreSnapshot
 */
function loadSnapshot(snapshot: TLStoreSnapshot): void {
  tlStore.loadSnapshot(snapshot);
}

/**
 * Get a snapshot which you can restore with `loadSnapshot()`
 * @param type Snapshot type. Default is `document`
 */
function getSnapshot(type: Parameters<TLStore['getSnapshot']>[0] = 'document'): StoreSnapshot<TLRecord> {
  return tlStore.getSnapshot(type);
}

defineExpose({
  rerender,
  editor,
  tlStore,
  tlDrawContainer,
  loadSnapshot,
  getSnapshot,
  test: true
});
</script>

<script lang="ts">
import { shallowRef, onUnmounted, watch } from "vue";
import {
  type TLRecord,
  createTLStore,
  Tldraw,
  defaultShapeUtils,
  type TldrawProps,
  type Editor,
  type TLExternalAsset,
  type TLAsset,
  type TLAssetId,
  type TLUiContextProviderProps,
  AssetRecordType,
  getHashForString,
  MediaHelpers,
  type TLUiOverrides,
  type TLStoreSnapshot,
  type TLStore,
  type StoreSnapshot
} from "@tldraw/tldraw";
import { watchPausable, whenever } from "@vueuse/core";
import { diff as diffArray } from "fast-array-diff";
import * as React from "react";
import { createRoot, type Root } from "react-dom/client";
import copy from "fast-copy";

export type FileAssetInfo = TLExternalAsset & { type: "file" };

export type UploadImageCallback = (
    info: FileAssetInfo,
  ) => Promise<{ url: string; id: number | string; meta?: Record<string, unknown> }>;

export type ReloadAssetCallback = (asset: TLAsset) => Promise<string | null>;
</script>

<style>
@import url("@tldraw/tldraw/tldraw.css");
/* TODO REPLACE THIS */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap");
</style>

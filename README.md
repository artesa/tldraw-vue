## tldraw-vue

This is a small wrapper around [tldraw](https://github.com/tldraw/tldraw). This package is a Vue component that allows you to embed tldraw in your Vue app.

Pulling in react in a Vue app is probably cursed. But if you need to do it, this package is for you.

This package is not affiliated with tldraw. It is a community project. Also see the [tldraw license](https://github.com/tldraw/tldraw?tab=License-1-ov-file#readme).

## Installation

```bash
npm install tldraw-vue
```

## Usage

```vue
<template>
  <div>
    <TldrawVue :data="value" />
  </div>
</template>

<script setup lang="ts">
import TldrawVue from "tldraw-vue";
</script>

<style>
@import "tldraw-vue/dist/tldraw-vue.css";
</style>
```

<template>
    <!-- <tldraw-wc style="height: 80vh; width: 100%;"></tldraw-wc> -->
    <!-- <tldraw-vue v-model:snapshot="sessionStore"></tldraw-vue> -->
    <TldrawVue style="height: 80vh; width: 100%;" :data="sessionStore2"></TldrawVue>
</template>

<script setup lang="ts">
import { reactive } from 'vue';
import TldrawVue from '../TldrawVue.vue';
import { useLocalStorage } from '@vueuse/core'

const sessionStore = useLocalStorage('tldraw-session', null);

const sessionStore2 = useLocalStorage('tldraw-session2', []);

const dataTest = reactive([]);
</script>
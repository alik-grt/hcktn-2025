<template>
  <div>
    <NodeToolbar :is-visible="selected">
      <div v-if="!showDeleteConfirm" class="flex gap-2">
        <button
          @click.stop="showDeleteConfirm = true"
          class="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          type="button"
          title="Delete node"
        >
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
      <div v-else class="flex gap-2">
        <button
          @click.stop="confirmDelete"
          class="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          type="button"
          title="Confirm delete"
        >
          <span class="material-symbols-outlined text-base">check</span>
        </button>
        <button
          @click.stop="cancelDelete"
          class="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          type="button"
          title="Cancel delete"
        >
          <span class="material-symbols-outlined text-base">close</span>
        </button>
      </div>
    </NodeToolbar>
    <div
      :class="[
        'parent-node flex flex-col rounded-lg border-2 border-dashed shadow-md',
        'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50',
      ]"
    >
    <NodeResizer
      :min-width="200"
      :min-height="100"
      :is-visible="selected"
      handle-color="#9ca3af"
      handle-border-color="#6b7280"
    />
    <div class="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
        <span class="material-symbols-outlined text-gray-600 dark:text-gray-300 text-base"
          >folder</span
        >
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-text-light-primary dark:text-text-dark-primary">
          {{ data.name || 'Parent Node' }}
        </h3>
        <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
          Container for grouping nodes
        </p>
      </div>
    </div>
    <div class="p-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
      <p>Drag nodes here to group them</p>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NodeResizer } from '@vue-flow/node-resizer';
import '@vue-flow/node-resizer/dist/style.css';
import { NodeToolbar } from '@vue-flow/node-toolbar';
import { ref, inject } from 'vue';
import type { Node } from '../api/workflows';

type Props = {
  id: string;
  data: Node;
  selected?: boolean;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [nodeId: string];
}>();

const onNodeDelete = inject<(nodeId: string) => void>('onNodeDelete');

const showDeleteConfirm = ref(false);

const confirmDelete = () => {
  if (onNodeDelete) {
    onNodeDelete(props.id);
  } else {
    emit('delete', props.id);
  }
  showDeleteConfirm.value = false;
};

const cancelDelete = () => {
  showDeleteConfirm.value = false;
};
</script>

<style scoped>
.parent-node {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>


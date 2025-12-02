<template>
  <div>
    <NodeToolbar :is-visible="props.selected">
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
        'note-node flex flex-col rounded-lg border-2 shadow-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700',
        props.selected ? 'ring-2 ring-yellow-400 dark:ring-yellow-600' : '',
      ]"
    >
      <div class="flex items-center gap-3 p-4 border-b border-yellow-200 dark:border-yellow-800">
        <div class="flex h-8 w-8 items-center justify-center rounded-md bg-yellow-100 dark:bg-yellow-900">
          <span class="material-symbols-outlined text-base text-yellow-600 dark:text-yellow-300">note</span>
        </div>
        <div class="flex-1">
          <input
            v-if="isEditingTitle"
            v-model="noteTitle"
            @blur="onSaveTitle"
            @keydown.enter="onSaveTitle"
            @keydown.esc="onCancelTitle"
            class="w-full font-semibold text-text-light-primary dark:text-text-dark-primary bg-transparent border-none outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600 rounded px-1"
            autofocus
          />
          <h3
            v-else
            @dblclick.stop="onEditTitle"
            class="font-semibold text-text-light-primary dark:text-text-dark-primary cursor-text hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 rounded px-1 transition-colors"
          >
            {{ noteTitle || 'Note' }}
          </h3>
        </div>
      </div>
      <div class="p-4">
        <textarea
          v-if="isEditing"
          v-model="noteText"
          @blur="onSave"
          @keydown.ctrl.enter="onSave"
          @keydown.esc="onCancel"
          class="w-full min-h-[100px] p-2 border border-yellow-300 dark:border-yellow-700 rounded bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary resize-none focus:outline-none focus:ring-2 focus:ring-yellow-400 dark:focus:ring-yellow-600"
          placeholder="Enter your note here..."
          autofocus
        />
        <div
          v-else
          @dblclick="onEdit"
          class="min-h-[100px] p-2 text-text-light-primary dark:text-text-dark-primary whitespace-pre-wrap cursor-text hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 rounded transition-colors"
        >
          {{ noteText || 'Double-click to edit note...' }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, inject } from 'vue';
import { NodeToolbar } from '@vue-flow/node-toolbar';
import type { Node } from '../api/workflows';
import { workflowsApi } from '../api/workflows';

type Props = {
  id: string;
  data: Node;
  selected?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [nodeId: string];
}>();

const onNodeDelete = inject<(nodeId: string) => void>('onNodeDelete');

const isEditing = ref(false);
const isEditingTitle = ref(false);
const showDeleteConfirm = ref(false);
const noteText = ref(props.data.config?.text || '');
const noteTitle = ref(props.data.name || '');

watch(
  () => props.data.config?.text,
  (newText) => {
    if (newText !== undefined) {
      noteText.value = newText;
    }
  },
);

watch(
  () => props.data.name,
  (newName) => {
    if (newName !== undefined) {
      noteTitle.value = newName;
    }
  },
);

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

const onEdit = () => {
  isEditing.value = true;
};

const onSave = async () => {
  isEditing.value = false;
  const updatedNode = {
    ...props.data,
    config: {
      ...props.data.config,
      text: noteText.value,
    },
  };
  try {
    await workflowsApi.updateNode(props.id, updatedNode);
  } catch (error) {
    console.error('Failed to update note:', error);
  }
};

const onCancel = () => {
  isEditing.value = false;
  noteText.value = props.data.config?.text || '';
};

const onEditTitle = () => {
  isEditingTitle.value = true;
};

const onSaveTitle = async () => {
  isEditingTitle.value = false;
  const updatedNode = {
    ...props.data,
    name: noteTitle.value || 'Note',
  };
  try {
    await workflowsApi.updateNode(props.id, updatedNode);
  } catch (error) {
    console.error('Failed to update note title:', error);
    noteTitle.value = props.data.name || '';
  }
};

const onCancelTitle = () => {
  isEditingTitle.value = false;
  noteTitle.value = props.data.name || '';
};
</script>

<style scoped></style>


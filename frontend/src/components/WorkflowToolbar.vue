<template>
  <header
    class="flex h-16 items-center justify-between border-b border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark px-6 sticky top-0 z-10"
  >
    <div class="flex items-center gap-4">
      <div v-if="isEditingName" class="flex items-center gap-2">
        <input
          ref="nameInputRef"
          v-model="editingName"
          @blur="handleNameBlur"
          @keydown.enter="handleNameSave"
          @keydown.esc="handleNameCancel"
          class="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary bg-transparent border-b-2 border-primary focus:outline-none focus:border-primary/80 px-1 min-w-[200px]"
          type="text"
        />
      </div>
      <div v-else class="flex items-center gap-2">
        <h1
          class="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary cursor-pointer hover:text-primary transition-colors"
          @click="startEditingName"
          :title="workflow ? 'Click to edit name' : ''"
        >
          {{ workflow ? workflow.name : 'New Workflow' }}
        </h1>
        <button
          v-if="workflow"
          @click.stop="startEditingName"
          class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-text-light-secondary dark:text-text-dark-secondary transition-colors"
          title="Edit workflow name"
        >
          <span class="material-symbols-outlined text-base">edit</span>
        </button>
      </div>
      <span
        v-if="workflow && workflow.status === 'active'"
        class="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:text-green-200"
      >
        Active
      </span>
      <span
        v-else-if="workflow && workflow.status === 'inactive'"
        class="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:text-gray-200"
      >
        Inactive
      </span>
    </div>
    <div class="flex items-center gap-2">
      <button
        @click="$emit('run')"
        class="flex h-9 items-center justify-center gap-2 rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark px-4 text-sm font-medium text-text-light-primary dark:text-text-dark-primary shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="running"
      >
        <span class="material-symbols-outlined text-base">play_arrow</span>
        {{ running ? 'Running...' : 'Run Test' }}
      </button>
      <button
        @click="$emit('save')"
        class="flex h-9 min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg bg-primary px-4 text-white text-sm font-semibold leading-normal shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        :disabled="saving"
      >
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import type { Workflow } from '../api/workflows';

type Props = {
  workflow: Workflow | null;
  saving: boolean;
  running: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  goBack: [];
  save: [];
  run: [];
  updateName: [name: string];
}>();

const isEditingName = ref(false);
const editingName = ref('');
const nameInputRef = ref<HTMLInputElement | null>(null);
const originalName = ref('');

const startEditingName = () => {
  if (!props.workflow) {
    return;
  }
  originalName.value = props.workflow.name;
  editingName.value = props.workflow.name;
  isEditingName.value = true;
  nextTick(() => {
    nameInputRef.value?.focus();
    nameInputRef.value?.select();
  });
};

const handleNameSave = async () => {
  if (!props.workflow) {
    return;
  }
  const trimmedName = editingName.value.trim();
  if (trimmedName && trimmedName !== originalName.value) {
    emit('updateName', trimmedName);
  }
  isEditingName.value = false;
};

const handleNameBlur = () => {
  handleNameSave();
};

const handleNameCancel = () => {
  editingName.value = originalName.value;
  isEditingName.value = false;
};

watch(
  () => props.workflow?.name,
  (newName) => {
    if (newName && !isEditingName.value) {
      editingName.value = newName;
    }
  },
);
</script>

<style scoped></style>

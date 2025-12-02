<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <button @click="$emit('goBack')" class="btn-secondary">← Back</button>
      <h2 v-if="workflow">{{ workflow.name }}</h2>
      <h2 v-else>New Workflow</h2>
    </div>
    <div class="toolbar-right">
      <button @click="$emit('save')" class="btn-secondary" :disabled="saving">
        {{ saving ? 'Saving...' : 'Save' }}
      </button>
      <button @click="$emit('run')" class="btn-primary" :disabled="running">
        {{ running ? 'Running...' : 'Run Workflow' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workflow } from '../api/workflows';

type Props = {
  workflow: Workflow | null;
  saving: boolean;
  running: boolean;
};

defineProps<Props>();

defineEmits<{
  goBack: [];
  save: [];
  run: [];
}>();
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.toolbar h2 {
  margin: 0;
  font-size: 1.5rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}
</style>

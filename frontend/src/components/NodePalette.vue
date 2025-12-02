<template>
  <div class="node-palette">
    <ExecutionList v-if="workflow" :workflowId="workflow.id" @select="$emit('executionSelect', $event)" />
    <div class="palette-section">
      <h3>Nodes</h3>
      <div class="node-types">
        <div
          v-for="nodeType in nodeTypes"
          :key="nodeType.type"
          class="node-type-item"
          draggable="true"
          @dragstart="handleDragStart($event, nodeType)"
        >
          <div class="node-icon" :class="nodeType.type">{{ nodeType.icon }}</div>
          <span>{{ nodeType.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Workflow } from '../api/workflows';
import ExecutionList from './ExecutionList.vue';

type Props = {
  workflow: Workflow | null;
};

defineProps<Props>();

defineEmits<{
  executionSelect: [executionId: string];
}>();

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', icon: '⚡' },
  { type: 'http', label: 'HTTP', icon: '🌐' },
  { type: 'transform', label: 'Transform', icon: '🔄' },
  { type: 'agent', label: 'Agent', icon: '🤖' },
  { type: 'delay', label: 'Delay', icon: '⏱️' },
];

const handleDragStart = (event: DragEvent, nodeType: { type: string; label: string }) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('nodeType', nodeType.type);
  }
};
</script>

<style scoped>
.node-palette {
  width: 250px;
  background: white;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.palette-section {
  padding: 1rem;
  overflow-y: auto;
  flex: 1;
}

.palette-section h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}

.node-types {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.node-type-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  cursor: grab;
  user-select: none;
}

.node-type-item:active {
  cursor: grabbing;
}

.node-icon {
  font-size: 1.5rem;
}
</style>


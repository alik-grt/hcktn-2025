<template>
  <div class="sidebar" v-if="selectedNode">
    <h3>Node Configuration</h3>
    <NodeConfigForm :node="selectedNode" @update="$emit('updateNode', $event)" />
    <NodeExecutionResult
      v-if="workflow"
      :key="`${selectedNode.id}-${executionFinished?.executionId || lastExecutionId || 'none'}`"
      :nodeId="selectedNode.id"
      :nodeType="selectedNode.type"
      :workflowId="workflow.id"
      :executionId="executionFinished?.executionId || lastExecutionId || null"
    />
  </div>
</template>

<script setup lang="ts">
import type { Node, Workflow } from '../api/workflows';
import NodeConfigForm from './NodeConfigForm.vue';
import NodeExecutionResult from './NodeExecutionResult.vue';

type Props = {
  selectedNode: Node | null;
  workflow: Workflow | null;
  executionFinished: { executionId: string; output: any; timestamp: string } | null;
  lastExecutionId: string | null;
};

defineProps<Props>();

defineEmits<{
  updateNode: [node: Node];
}>();
</script>

<style scoped>
.sidebar {
  width: 300px;
  background: white;
  border-left: 1px solid #e0e0e0;
  padding: 1rem;
  overflow-y: auto;
}

.sidebar h3 {
  margin-bottom: 1rem;
  font-size: 1rem;
}
</style>

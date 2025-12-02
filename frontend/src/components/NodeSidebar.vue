<template>
  <aside
    class="w-80 border-l border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 overflow-y-auto"
  >
    <div v-if="selectedNode">
      <h2 class="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Node Configuration
      </h2>
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
    <div v-else>
      <h2 class="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
        Nodes
      </h2>
      <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
        Drag and drop to add to canvas
      </p>
      <div class="space-y-3">
        <div
          v-for="nodeType in nodeTypes"
          :key="nodeType.type"
          class="flex cursor-grab items-center gap-3 rounded-lg border border-border-light dark:border-border-dark bg-gray-50 dark:bg-gray-800 p-3 shadow-sm hover:shadow-md transition-shadow"
          draggable="true"
          @dragstart="handleDragStart($event, nodeType)"
        >
          <div :class="getIconContainerClass(nodeType.type)">
            <span :class="getIconClass(nodeType.type)">{{ getIcon(nodeType.type) }}</span>
          </div>
          <div>
            <h4 class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary">
              {{ nodeType.label }}
            </h4>
            <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
              {{ getNodeDescription(nodeType.type) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </aside>
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

const nodeTypes = [
  // { type: 'parent', label: 'Parent', icon: '📁' },
  { type: 'trigger', label: 'Trigger', icon: '⚡' },
  { type: 'http', label: 'HTTP', icon: '🌐' },
  { type: 'transform', label: 'Transform', icon: '🔄' },
  { type: 'agent', label: 'Agent', icon: '🤖' },
  { type: 'delay', label: 'Delay', icon: '⏱️' },
  { type: 'note', label: 'Note', icon: '📝' },
];

const handleDragStart = (event: DragEvent, nodeType: { type: string; label: string }) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('nodeType', nodeType.type);
  }
};

const getIcon = (type: string) => {
  const iconMap: Record<string, string> = {
    parent: 'folder',
    trigger: 'webhook',
    http: 'http',
    transform: 'transform',
    agent: 'smart_toy',
    delay: 'schedule',
    note: 'note',
  };
  return iconMap[type] || 'circle';
};

const getIconContainerClass = (type: string) => {
  const colorMap: Record<string, string> = {
    parent: 'bg-gray-200 dark:bg-gray-700',
    trigger: 'bg-green-100 dark:bg-green-900',
    http: 'bg-blue-100 dark:bg-blue-900',
    transform: 'bg-purple-100 dark:bg-purple-900',
    agent: 'bg-blue-100 dark:bg-blue-900',
    delay: 'bg-orange-100 dark:bg-orange-900',
    note: 'bg-yellow-100 dark:bg-yellow-900',
  };
  return `flex h-8 w-8 items-center justify-center rounded-md ${colorMap[type] || 'bg-gray-100 dark:bg-gray-800'}`;
};

const getIconClass = (type: string) => {
  const colorMap: Record<string, string> = {
    parent: 'text-gray-600 dark:text-gray-300',
    trigger: 'text-green-600 dark:text-green-300',
    http: 'text-blue-600 dark:text-blue-300',
    transform: 'text-purple-600 dark:text-purple-300',
    agent: 'text-blue-600 dark:text-blue-300',
    delay: 'text-orange-600 dark:text-orange-300',
    note: 'text-yellow-600 dark:text-yellow-300',
  };
  return `material-symbols-outlined text-base ${colorMap[type] || 'text-gray-600 dark:text-gray-300'}`;
};

const getNodeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    parent: 'Container for grouping nodes',
    trigger: 'Trigger on event',
    http: 'Make HTTP request',
    transform: 'Transform data',
    agent: 'Process data with AI',
    delay: 'Wait before continuing',
    note: 'Text note (cannot be connected)',
  };
  return descriptions[type] || '';
};
</script>

<style scoped></style>

<template>
  <aside
    class="w-80 border-l border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-6 overflow-y-auto"
  >
    <h2 class="text-lg font-semibold text-text-light-primary dark:text-text-dark-primary mb-4">
      Nodes
    </h2>
    <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mb-4">
      Drag and drop to add to canvas
    </p>
    <div class="mb-4">
      <div class="relative">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary text-base">
          search
        </span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search nodes..."
          class="w-full pl-10 pr-4 py-2 rounded-lg border border-border-light dark:border-border-dark bg-white dark:bg-gray-800 text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>
    </div>
    <div class="space-y-3">
      <div
        v-for="nodeType in filteredNodeTypes"
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
  </aside>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { Workflow } from '../api/workflows';

type Props = {
  workflow: Workflow | null;
};

defineProps<Props>();

const searchQuery = ref('');

const nodeTypes = [
  // { type: 'parent', label: 'Parent', icon: '📁' },
  { type: 'trigger', label: 'Trigger', icon: '⚡' },
  { type: 'http', label: 'HTTP', icon: '🌐' },
  { type: 'transform', label: 'Transform', icon: '🔄' },
  { type: 'agent', label: 'Agent', icon: '🤖' },
  { type: 'delay', label: 'Delay', icon: '⏱️' },
  { type: 'if', label: 'If', icon: '🔀' },
  { type: 'note', label: 'Note', icon: '📝' },
];

const getNodeDescription = (type: string) => {
  const descriptions: Record<string, string> = {
    parent: 'Container for grouping nodes',
    trigger: 'Trigger on event',
    http: 'Make HTTP request',
    transform: 'Transform data',
    agent: 'Process data with AI',
    delay: 'Wait before continuing',
    if: 'Conditional branching',
    note: 'Text note (cannot be connected)',
  };
  return descriptions[type] || '';
};

const filteredNodeTypes = computed(() => {
  if (!searchQuery.value.trim()) {
    return nodeTypes;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return nodeTypes.filter((nodeType) => {
    const label = nodeType.label.toLowerCase();
    const description = getNodeDescription(nodeType.type).toLowerCase();
    return label.includes(query) || description.includes(query);
  });
});

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
    if: 'call_split',
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
    if: 'bg-pink-100 dark:bg-pink-900',
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
    if: 'text-pink-600 dark:text-pink-300',
    note: 'text-yellow-600 dark:text-yellow-300',
  };
  return `material-symbols-outlined text-base ${colorMap[type] || 'text-gray-600 dark:text-gray-300'}`;
};
</script>

<style scoped></style>

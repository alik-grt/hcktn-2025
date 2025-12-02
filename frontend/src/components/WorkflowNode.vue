<template>
  <div>
    <NodeToolbar :is-visible="isSelected || isHovered">
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
        'workflow-node flex flex-col rounded-lg border shadow-md',
        getNodeStatusClass(),
        isSelected ? 'node-selected' : '',
      ]"
      @mouseenter="isHovered = true"
      @mouseleave="isHovered = false"
    >
      <div class="flex items-center gap-3 p-4 border-b border-border-light dark:border-border-dark">
        <div :class="getIconContainerClass()">
          <span
            v-if="getNodeStatus() === 'progress'"
            class="material-symbols-outlined animate-spin text-info"
          >
            sync
          </span>
          <span
            v-else-if="getNodeStatus() === 'passed'"
            class="material-symbols-outlined text-success"
          >
            check_circle
          </span>
          <span v-else :class="getIconClass()">{{ getIcon() }}</span>
        </div>
        <div class="flex-1">
          <h3 class="font-semibold text-text-light-primary dark:text-text-dark-primary">
            {{ getNodeTitle() }}
          </h3>
          <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
            {{ getNodeSubtitle() }}
          </p>
        </div>
      </div>
      <div class="p-4 text-sm text-text-light-secondary dark:text-text-dark-secondary">
        <p>{{ getNodeContent() }}</p>
      </div>
      <div
        v-if="
          data.type === 'trigger' &&
          (data.subtype === 'manual' || data.subtype === 'cron' || !data.subtype)
        "
        class="px-4 pb-4"
      >
        <button
          v-if="data.subtype === 'cron' && isCronActive"
          @click.stop="onPause"
          class="w-full flex items-center justify-center gap-2 rounded-lg bg-yellow-100 dark:bg-yellow-900 px-4 py-2 text-sm font-medium text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800"
          type="button"
          title="Stop cron"
        >
          <span class="material-symbols-outlined text-base">pause</span>
          Pause
        </button>
        <button
          v-else
          @click.stop="onRun"
          :class="[
            'w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium',
            data.subtype === 'cron' && !isWorkflowActive
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800',
          ]"
          type="button"
          :disabled="data.subtype === 'cron' && !isWorkflowActive"
          :title="
            data.subtype === 'cron' && !isWorkflowActive
              ? 'Please activate the workflow first before starting the cron job'
              : data.subtype === 'cron'
                ? 'Start cron'
                : 'Run workflow'
          "
        >
          <span class="material-symbols-outlined text-base">play_arrow</span>
          {{ data.subtype === 'cron' ? 'Start' : 'Run' }}
        </button>
      </div>
      <div
        v-if="getNodeStatus() !== 'idle'"
        class="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 flex items-center justify-center"
      >
        <div
          :class="[
            'h-2 w-2 rounded-full border-2 border-white dark:border-card-dark',
            getNodeStatusIndicatorClass(),
          ]"
        ></div>
      </div>
      <div
        v-else-if="data.type !== 'trigger'"
        class="absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 flex items-center justify-center"
      >
        <div
          class="h-2 w-2 rounded-full bg-gray-400 border-2 border-white dark:border-card-dark"
        ></div>
      </div>
      <div
        class="absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 flex items-center justify-center"
      >
        <div
          :class="[
            'h-2 w-2 rounded-full border-2 border-white dark:border-card-dark',
            getNodeStatusIndicatorClass(),
          ]"
        ></div>
      </div>
      <Handle
        v-if="data.type !== 'trigger'"
        type="target"
        :position="Position.Left"
        :style="{ background: '#10B981', width: '8px', height: '8px', border: '2px solid white' }"
      />
      <Handle
        type="source"
        :position="Position.Right"
        :style="{ background: '#4F46E5', width: '8px', height: '8px', border: '2px solid white' }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeToolbar } from '@vue-flow/node-toolbar';
import { inject, computed, ref } from 'vue';
import type { Node } from '../api/workflows';

type Props = {
  id: string;
  data: Node;
  selected?: boolean;
  position?: { x: number; y: number };
};

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [nodeId: string];
  select: [node: Node];
  run: [nodeId: string];
}>();

const onNodeRun = inject<(node: Node) => Promise<void>>('onNodeRun');
const onNodePause = inject<(node: Node) => Promise<void>>('onNodePause');
const workflowStatus = inject<() => 'active' | 'inactive' | null>('workflowStatus', () => null);
const selectedNode = inject<{ value: Node | null }>('selectedNode', { value: null });
const onNodeDelete = inject<(nodeId: string) => void>('onNodeDelete');

const isCronActive = computed(() => {
  return props.data.subtype === 'cron' && props.data.config?.cronActive === true;
});

const isWorkflowActive = computed(() => {
  if (!workflowStatus) {
    return false;
  }
  return workflowStatus() === 'active';
});

const isSelected = computed(() => {
  return selectedNode.value?.id === props.id;
});

const isHovered = ref(false);
const showDeleteConfirm = ref(false);

const getNodeStatus = () => {
  return props.data.status || 'idle';
};

const getNodeStatusClass = () => {
  const status = getNodeStatus();
  const statusClasses: Record<string, string> = {
    idle: 'border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark',
    progress: 'border-info dark:border-info bg-card-light dark:bg-card-dark border-2',
    passed: 'border-success dark:border-success bg-card-light dark:bg-card-dark border-2',
    error: 'border-error dark:border-error bg-card-light dark:bg-card-dark border-2',
  };
  return statusClasses[status] || statusClasses.idle;
};

const getNodeStatusIndicatorClass = () => {
  const status = getNodeStatus();
  const indicatorClasses: Record<string, string> = {
    idle: 'bg-gray-400',
    progress: 'bg-info animate-pulse',
    passed: 'bg-success',
    error: 'bg-error',
  };
  return indicatorClasses[status] || indicatorClasses.idle;
};

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

const onRun = () => {
  emit('run', props.id);
  if (onNodeRun) {
    onNodeRun(props.data);
  }
};

const onPause = () => {
  if (onNodePause) {
    onNodePause(props.data);
  }
};

const getIcon = () => {
  const iconMap: Record<string, string> = {
    trigger: 'webhook',
    http: 'http',
    transform: 'transform',
    agent: 'smart_toy',
    delay: 'schedule',
  };
  return iconMap[props.data.type] || 'circle';
};

const getIconContainerClass = () => {
  const colorMap: Record<string, string> = {
    trigger: 'bg-green-100 dark:bg-green-900',
    http: 'bg-blue-100 dark:bg-blue-900',
    transform: 'bg-purple-100 dark:bg-purple-900',
    agent: 'bg-blue-100 dark:bg-blue-900',
    delay: 'bg-orange-100 dark:bg-orange-900',
  };
  return `flex h-10 w-10 items-center justify-center rounded-lg ${colorMap[props.data.type] || 'bg-gray-100 dark:bg-gray-800'}`;
};

const getIconClass = () => {
  const colorMap: Record<string, string> = {
    trigger: 'text-green-600 dark:text-green-300',
    http: 'text-blue-600 dark:text-blue-300',
    transform: 'text-purple-600 dark:text-purple-300',
    agent: 'text-blue-600 dark:text-blue-300',
    delay: 'text-orange-600 dark:text-orange-300',
  };
  return `material-symbols-outlined ${colorMap[props.data.type] || 'text-gray-600 dark:text-gray-300'}`;
};

const getNodeTitle = () => {
  if (props.data.type === 'trigger') {
    if (props.data.subtype === 'webhook') {
      return 'Webhook Trigger';
    } else if (props.data.subtype === 'cron') {
      return 'Cron Trigger';
    }
    return 'Manual Trigger';
  } else if (props.data.type === 'http') {
    return `${props.data.method || 'GET'} Request`;
  } else if (props.data.type === 'agent') {
    return props.data.name || 'AI Agent';
  } else if (props.data.type === 'transform') {
    return 'Transform Data';
  } else if (props.data.type === 'delay') {
    return 'Delay';
  }
  return props.data.type;
};

const getNodeSubtitle = () => {
  if (props.data.type === 'trigger') {
    if (props.data.subtype === 'webhook') {
      return 'Starts workflow on HTTP POST';
    } else if (props.data.subtype === 'cron') {
      return 'Scheduled trigger';
    }
    return 'Manual start';
  } else if (props.data.type === 'http') {
    return `HTTP ${props.data.method || 'GET'}`;
  } else if (props.data.type === 'agent') {
    return 'AI Agent: Process data with AI';
  } else if (props.data.type === 'transform') {
    return 'Transform data';
  } else if (props.data.type === 'delay') {
    return 'Wait before continuing';
  }
  return '';
};

const getNodeContent = () => {
  if (props.data.type === 'trigger') {
    if (props.data.subtype === 'webhook') {
      return 'Listening for incoming data...';
    }
    return 'Ready to start';
  } else if (props.data.type === 'http') {
    return props.data.url || 'No URL configured';
  } else if (props.data.type === 'agent') {
    return 'Processing input...';
  } else if (props.data.type === 'transform') {
    return 'Transform data';
  } else if (props.data.type === 'delay') {
    if (props.data.config?.delayMs) {
      return `Wait ${props.data.config.delayMs}ms`;
    } else if (props.data.config?.until) {
      return `Wait until ${new Date(props.data.config.until).toLocaleString()}`;
    }
    return 'Configure delay';
  }
  return '';
};
</script>

<style scoped>
.workflow-node {
  position: relative;
  min-width: 320px;
  transition: all 0.2s ease;
}

.workflow-node.node-selected {
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.5),
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-color: rgb(59, 130, 246);
}

.dark .workflow-node.node-selected {
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.6),
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border-color: rgb(96, 165, 250);
}
</style>

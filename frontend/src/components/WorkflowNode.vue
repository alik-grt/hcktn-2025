<template>
  <div
    :class="[
      getNodeContainerClass(),
      isSelected ? 'node-selected' : '',
      isInDevelopment ? 'border-error border-2 border-dashed' : '',
    ]"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <NodeToolbar :is-visible="isSelected">
      <div v-if="!showDeleteConfirm" class="flex gap-2">
        <button
          @click.stop="toggleResizable"
          :class="[
            'p-2 rounded-lg transition-colors',
            isResizable
              ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700',
          ]"
          type="button"
          :title="isResizable ? 'Disable resize' : 'Enable resize'"
        >
          <span class="material-symbols-outlined text-sm">{{ isResizable ? 'aspect_ratio' : 'crop_free' }}</span>
        </button>
        <button
          @click.stop="showDeleteConfirm = true"
          class="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          type="button"
          title="Delete node"
        >
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
      <div v-else class="flex gap-2">
        <button
          @click.stop="confirmDelete"
          class="p-2 rounded-lg bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          type="button"
          title="Confirm delete"
        >
          <span class="material-symbols-outlined text-sm">check</span>
        </button>
        <button
          @click.stop="cancelDelete"
          class="p-2 rounded-lg bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          type="button"
          title="Cancel delete"
        >
          <span class="material-symbols-outlined text-sm">close</span>
        </button>
      </div>
    </NodeToolbar>
    <CustomNodeResizer
      v-if="isResizable"
      :node-id="id"
      :min-width="data.type === 'note' ? 200 : 320"
      :min-height="100"
      :is-visible="isResizable"
    />
    
    <!-- Note Node Content -->
    <template v-if="data.type === 'note'">
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
    </template>

    <!-- Parent Node Content -->
    <template v-else-if="data.type === 'parent'">
      <div class="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
          <span class="material-symbols-outlined text-gray-600 dark:text-gray-300 text-base">folder</span>
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
    </template>

    <!-- Workflow Node Content (trigger, http, transform, agent, delay) -->
    <template v-else>
      <div class="flex items-center gap-3 p-4 border-b border-border-light dark:border-border-dark">
        <div :class="getIconContainerClass()">
          <span
            v-if="getNodeStatus() === 'progress'"
            class="material-symbols-outlined animate-spin text-info"
          >
            sync
          </span>
          <span
            v-else-if="getNodeStatus() === 'error'"
            class="material-symbols-outlined text-error"
          >
            close
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
            ((data.subtype === 'cron' || data.subtype === 'manual' || !data.subtype) && !isWorkflowActive)
              ? 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed'
              : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800',
          ]"
          type="button"
          :disabled="(data.subtype === 'cron' || data.subtype === 'manual' || !data.subtype) && !isWorkflowActive"
          :title="
            (data.subtype === 'cron' || data.subtype === 'manual' || !data.subtype) && !isWorkflowActive
              ? 'Please activate the workflow first before running the trigger'
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
        :style="{ background: '#10B981', width: '12px', height: '12px', border: '3px solid white' }"
      />
      <template v-if="data.type === 'if'">
        <Handle
          id="condition1"
          type="source"
          :position="Position.Right"
          class="if-handle-condition1"
          :style="{ background: '#10B981', width: '12px', height: '12px', border: '3px solid white' }"
        />
        <Handle
          id="condition2"
          type="source"
          :position="Position.Right"
          class="if-handle-condition2"
          :style="{ background: '#3B82F6', width: '12px', height: '12px', border: '3px solid white' }"
        />
        <Handle
          id="else"
          type="source"
          :position="Position.Right"
          class="if-handle-else"
          :style="{ background: '#EF4444', width: '12px', height: '12px', border: '3px solid white' }"
        />
      </template>
      <template v-else>
        <Handle
          id="output1"
          type="source"
          :position="Position.Right"
          class="source-handle-1"
          :style="{ background: '#4F46E5', width: '12px', height: '12px', border: '3px solid white' }"
        />
        <Handle
          id="output2"
          type="source"
          :position="Position.Right"
          class="source-handle-2"
          :style="{ background: '#4F46E5', width: '12px', height: '12px', border: '3px solid white' }"
        />
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { NodeToolbar } from '@vue-flow/node-toolbar';
import { inject, computed, ref, watch } from 'vue';
import type { Node } from '../api/workflows';
import { workflowsApi } from '../api/workflows';
import CustomNodeResizer from './CustomNodeResizer.vue';

type Props = {
  id: string;
  data: Node;
  selected?: boolean;
  position?: { x: number; y: number };
  inDevelopment?: boolean;
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
const nodes = inject<{ value: Node[] }>('nodes');

// Note node state
const isEditing = ref(false);
const isEditingTitle = ref(false);
const noteText = ref(props.data.config?.text || '');
const noteTitle = ref(props.data.name || '');
// Common state
const isHovered = ref(false);
const showDeleteConfirm = ref(false);

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

const isResizable = computed(() => {
  return props.data.config?.resizable === true;
});

// Watch for note data changes
watch(
  () => props.data.config?.text,
  (newText) => {
    if (newText !== undefined && props.data.type === 'note') {
      noteText.value = newText;
    }
  },
);

watch(
  () => props.data.name,
  (newName) => {
    if (newName !== undefined && props.data.type === 'note') {
      noteTitle.value = newName;
    }
  },
);

const toggleResizable = async () => {
  const newResizableState = !isResizable.value;
  const updatedNode = {
    ...props.data,
    config: {
      ...props.data.config,
      resizable: newResizableState,
    },
  };
  try {
    const result = await workflowsApi.updateNode(props.id, updatedNode);
    if (nodes) {
      const nodeIndex = nodes.value.findIndex((n: Node) => n.id === props.id);
      if (nodeIndex !== -1) {
        nodes.value[nodeIndex] = { ...nodes.value[nodeIndex], ...result };
      }
    }
  } catch (error) {
    console.error('Failed to update node resizable state:', error);
  }
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

// Note node methods
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

// Workflow node methods
const onRun = () => {
  // Block manual trigger if workflow is not active
  if (props.data.type === 'trigger' && (props.data.subtype === 'manual' || !props.data.subtype) && !isWorkflowActive.value) {
    return;
  }
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

const getNodeStatus = () => {
  return props.data.status || 'idle';
};

const getNodeContainerClass = () => {
  if (props.data.type === 'note') {
    return 'note-node flex flex-col rounded-lg border-2 shadow-md bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-700';
  } else if (props.data.type === 'parent') {
    return 'parent-node flex flex-col rounded-lg border-2 border-dashed shadow-md border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900/50';
  } else {
    const baseClass = `workflow-node flex flex-col rounded-lg border shadow-md ${getNodeStatusClass()}`;
    if (props.data.inDevelopment) {
      return `${baseClass} border-error border-2 border-dashed`;
    }
    return baseClass;
  }
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

const getIcon = () => {
  const iconMap: Record<string, string> = {
    trigger: 'webhook',
    http: 'http',
    transform: 'transform',
    agent: 'smart_toy',
    delay: 'schedule',
    if: 'call_split',
    merge: 'merge',
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
    if: 'bg-pink-100 dark:bg-pink-900',
    merge: 'bg-pink-100 dark:bg-pink-900',
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
    if: 'text-pink-600 dark:text-pink-300',
    merge: 'text-pink-600 dark:text-pink-300',
  };
  return `material-symbols-outlined ${colorMap[props.data.type] || 'text-gray-600 dark:text-gray-300'}`;
};

const isInDevelopment = computed(() => {
  return props.data.type === 'if' || props.data.type === 'merge';
});

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
  } else if (props.data.type === 'if') {
    return 'If Condition';
  } else if (props.data.type === 'merge') {
    return 'Merge';
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
  } else if (props.data.type === 'if') {
    return 'Conditional branching';
  } else if (props.data.type === 'merge') {
    return 'Merge multiple inputs';
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
  } else if (props.data.type === 'if') {
    const condition1 = props.data.config?.condition1;
    const condition2 = props.data.config?.condition2;
    if (condition1 && condition2) {
      return `C1: ${condition1} | C2: ${condition2}`;
    } else if (condition1) {
      return `C1: ${condition1}`;
    } else if (condition2) {
      return `C2: ${condition2}`;
    }
    return 'Configure conditions';
  } else if (props.data.type === 'merge') {
    return 'Merge multiple inputs (in development)';
  }
  return '';
};

</script>

<style scoped>
.workflow-node,
.parent-node,
.note-node {
  position: relative;
  min-width: 320px;
  min-height: 150px;
  box-sizing: border-box;
  display: block;
  transition: all 0.2s ease;
  width: 100%;
  height: 100%;
}

.note-node {
  min-width: 200px;
}

.workflow-node.node-selected,
.parent-node.node-selected,
.note-node.node-selected {
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.5),
    0 4px 6px -1px rgba(0, 0, 0, 0.1),
    0 2px 4px -1px rgba(0, 0, 0, 0.06);
  border-color: rgb(59, 130, 246);
}

.dark .workflow-node.node-selected,
.dark .parent-node.node-selected,
.dark .note-node.node-selected {
  box-shadow:
    0 0 0 3px rgba(59, 130, 246, 0.6),
    0 4px 6px -1px rgba(0, 0, 0, 0.3),
    0 2px 4px -1px rgba(0, 0, 0, 0.2);
  border-color: rgb(96, 165, 250);
}
</style>

<style>
:deep(.vue-flow__node[data-id]) {
  position: relative;
  min-width: 320px;
  min-height: 100px;
}

:deep(.vue-flow__node[data-id] .workflow-node),
:deep(.vue-flow__node[data-id] .parent-node),
:deep(.vue-flow__node[data-id] .note-node) {
  width: 100%;
  height: 100%;
  min-width: 320px;
  min-height: 150px;
}

:deep(.vue-flow__node[data-id] .note-node) {
  min-width: 200px;
}

:deep(.if-handle-condition1) {
  top: 30% !important;
}

:deep(.if-handle-condition2) {
  top: 50% !important;
}

:deep(.if-handle-else) {
  top: 70% !important;
}

:deep(.source-handle-1) {
  top: 40% !important;
}

:deep(.source-handle-2) {
  top: 60% !important;
}
</style>

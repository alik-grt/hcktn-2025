<template>
  <div class="workflow-node" :class="getNodeStatusClass()">
    <div class="node-header">
      <span class="node-type-badge" :class="data.type">{{ getNodeTypeLabel() }}</span>
      <div class="node-status-indicator">
        <div v-if="getNodeStatus() === 'progress'" class="loading-icon" title="Processing...">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 8 1 A 7 7 0 0 1 15 8"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
              class="loading-path-1"
            />
            <path
              d="M 8 15 A 7 7 0 0 1 1 8"
              stroke="currentColor"
              stroke-width="2"
              fill="none"
              class="loading-path-2"
            />
          </svg>
        </div>
        <button @click.stop="onDelete" class="node-delete" type="button">×</button>
      </div>
    </div>
    <div class="node-content">
      <div v-if="data.type === 'trigger'">{{ data.subtype || 'manual' }}</div>
      <div v-else-if="data.type === 'http'">{{ data.method || 'GET' }} {{ data.url }}</div>
      <div v-else-if="data.type === 'transform'">Transform</div>
      <div v-else-if="data.type === 'agent'">Agent</div>
      <div v-else-if="data.type === 'delay'">
        <div v-if="data.config?.delayMs">{{ data.config.delayMs }}ms</div>
        <div v-else-if="data.config?.until">{{ new Date(data.config.until).toLocaleString() }}</div>
        <div v-else>Delay</div>
      </div>
    </div>
    <div v-if="data.type === 'trigger' && (data.subtype === 'manual' || !data.subtype)" class="node-actions">
      <button @click.stop="onRun" class="btn-play" type="button" title="Run workflow">
        ▶
      </button>
    </div>
    <Handle
      v-if="data.type !== 'trigger'"
      type="target"
      :position="Position.Left"
      :style="{ background: '#28a745', width: '10px', height: '10px' }"
    />
    <Handle
      type="source"
      :position="Position.Right"
      :style="{ background: '#007bff', width: '10px', height: '10px' }"
    />
  </div>
</template>

<script setup lang="ts">
import { Handle, Position } from '@vue-flow/core';
import { inject } from 'vue';
import type { Node } from '../api/workflows';

type Props = {
  id: string;
  data: Node;
  selected?: boolean;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  delete: [nodeId: string];
  select: [node: Node];
  run: [nodeId: string];
}>();

const onNodeRun = inject<() => Promise<void>>('onNodeRun', async () => {});

const getNodeTypeLabel = () => {
  if (props.data.type === 'trigger') {
    return props.data.subtype || 'trigger';
  }
  return props.data.type;
};

const getNodeStatus = () => {
  return props.data.status || 'idle';
};

const getNodeStatusClass = () => {
  const status = getNodeStatus();
  return `status-${status}`;
};

const onDelete = () => {
  emit('delete', props.id);
};

const onRun = () => {
  emit('run', props.id);
  onNodeRun();
};
</script>

<style scoped>
.workflow-node {
  width: 150px;
  background: white;
  border: 2px solid #ccc;
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: move;
  user-select: none;
}

.workflow-node.status-idle {
  border-color: #ccc;
}

.workflow-node.status-progress {
  border-color: #007bff;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.3);
}

.workflow-node.status-passed {
  border-color: #28a745;
  background: #d4edda;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
}

.workflow-node.status-error {
  border-color: #dc3545;
}

.node-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.node-status-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.loading-icon {
  color: #007bff;
  animation: spin 1s linear infinite;
}

.loading-path-1 {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: dash-1 1.5s ease-in-out infinite;
}

.loading-path-2 {
  stroke-dasharray: 22;
  stroke-dashoffset: 22;
  animation: dash-2 1.5s ease-in-out infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes dash-1 {
  0% {
    stroke-dashoffset: 22;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -22;
  }
}

@keyframes dash-2 {
  0% {
    stroke-dashoffset: 22;
  }
  50% {
    stroke-dashoffset: 0;
  }
  100% {
    stroke-dashoffset: -22;
  }
}

.node-type-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.node-type-badge.trigger {
  background: #fff3cd;
  color: #856404;
}

.node-type-badge.http {
  background: #d1ecf1;
  color: #0c5460;
}

.node-type-badge.transform {
  background: #d4edda;
  color: #155724;
}

.node-type-badge.agent {
  background: #e2e3e5;
  color: #383d41;
}

.node-type-badge.delay {
  background: #fff3cd;
  color: #856404;
}

.node-delete {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
}

.node-delete:hover {
  color: #dc3545;
}

.node-content {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.node-actions {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-play {
  background: #28a745;
  color: white;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  padding: 0;
  padding-left: 2px;
}

.btn-play:hover {
  background: #218838;
  transform: scale(1.1);
}

.btn-play:active {
  transform: scale(0.95);
}
</style>

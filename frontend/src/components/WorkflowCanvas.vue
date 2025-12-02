<template>
  <div class="canvas-wrapper" ref="canvasWrapperRef">
    <VueFlow
      v-if="workflow"
      :nodes="vueFlowNodes"
      :edges="vueFlowEdges"
      :node-types="nodeTypesMap"
      :min-zoom="0.1"
      :max-zoom="4"
      @connect="onConnect"
      @connect-start="onConnectStart"
      @connect-end="onConnectEnd"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
      @node-click="onNodeClick"
      @node-double-click="onNodeDoubleClick"
      @pane-click="onPaneClick"
      @drop="onDrop"
      @init="onInit"
      @viewport-change="onViewportChange"
      @move="onViewportChange"
      @zoom="onViewportChange"
      @dragover.prevent
      class="vue-flow-container"
    >
      <Background />
      <Controls />
      <MiniMap />
    </VueFlow>
    <AddNodePlaceholder
      v-if="placeholderVisible"
      :style="{
        position: 'absolute',
        left: `${placeholderPosition.x - 30}px`,
        top: `${placeholderPosition.y - 30}px`,
        zIndex: 1000,
      }"
      @click="$emit('showNodeSelectMenu')"
    />
    <NodeSelectMenu
      :visible="nodeSelectMenuVisible"
      :position="nodeSelectMenuPosition"
      :nodeTypes="nodeTypes"
      @select="$emit('nodeTypeSelect', $event)"
      @close="$emit('hideNodeSelectMenu')"
    />
    <div v-if="!workflow" class="loading-overlay">
      <div class="loading-message">Loading workflow...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, markRaw } from 'vue';
import { VueFlow } from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { Controls } from '@vue-flow/controls';
import { MiniMap } from '@vue-flow/minimap';
import type { Node as VueFlowNode, Edge as VueFlowEdge, Connection } from '@vue-flow/core';
import type { Workflow, Node } from '../api/workflows';
import WorkflowNode from './WorkflowNode.vue';
// import AnimatedEdge from './AnimatedEdge.vue';
import AddNodePlaceholder from './AddNodePlaceholder.vue';
import NodeSelectMenu from './NodeSelectMenu.vue';

type Props = {
  workflow: Workflow | null;
  vueFlowNodes: VueFlowNode[];
  vueFlowEdges: VueFlowEdge[];
  placeholderVisible: boolean;
  placeholderPosition: { x: number; y: number };
  nodeSelectMenuVisible: boolean;
  nodeSelectMenuPosition: { x: number; y: number };
  nodeTypes: Array<{ type: string; label: string; icon: string }>;
};

const props = defineProps<Props>();

const canvasWrapperRef = ref<HTMLElement | null>(null);

const emit = defineEmits<{
  connect: [connection: Connection];
  connectStart: [event: any];
  connectEnd: [event?: MouseEvent];
  nodesChange: [changes: any[]];
  edgesChange: [changes: any[]];
  nodeClick: [event: { node: VueFlowNode }];
  nodeDoubleClick: [event: { node: VueFlowNode }];
  paneClick: [event: MouseEvent];
  drop: [event: DragEvent];
  showNodeSelectMenu: [];
  nodeTypeSelect: [nodeType: string];
  hideNodeSelectMenu: [];
  init: [];
  viewportChange: [];
  move: [];
  zoom: [];
}>();

const nodeTypesMap = {
  workflowNode: markRaw(WorkflowNode),
};

// const edgeTypesMap = {
//   animated: markRaw(AnimatedEdge),
//   default: markRaw(AnimatedEdge),
// };

const onConnect = (connection: Connection) => {
  emit('connect', connection);
};

const onConnectStart = (event: any) => {
  emit('connectStart', event);
};

const onConnectEnd = (event?: MouseEvent) => {
  emit('connectEnd', event);
};

const onNodesChange = (changes: any[]) => {
  emit('nodesChange', changes);
};

const onEdgesChange = (changes: any[]) => {
  emit('edgesChange', changes);
};

const onNodeClick = (event: { node: VueFlowNode }) => {
  emit('nodeClick', event);
};

const onNodeDoubleClick = (event: { node: VueFlowNode }) => {
  emit('nodeDoubleClick', event);
};

const onPaneClick = (event: MouseEvent) => {
  emit('paneClick', event);
};

const onDrop = (event: DragEvent) => {
  emit('drop', event);
};

const onInit = () => {
  emit('init');
};

const onViewportChange = () => {
  emit('viewportChange');
};

defineExpose({
  canvasWrapperRef,
});
</script>

<style scoped>
.canvas-wrapper {
  flex: 1;
  position: relative;
  background: rgb(249 250 251);
}

.dark .canvas-wrapper {
  background: rgba(17, 24, 39, 0.5);
}

.canvas-wrapper::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(#e5e7eb_1px, transparent_1px);
  background-size: 16px 16px;
  pointer-events: none;
}

.dark .canvas-wrapper::before {
  background: radial-gradient(#374151_1px, transparent_1px);
  background-size: 16px 16px;
}

.vue-flow-container {
  width: 100%;
  height: 100%;
}

:deep(.vue-flow__edge-path) {
  stroke-width: 2;
}

:deep(.vue-flow__edge.animated .vue-flow__edge-path) {
  stroke-dasharray: 5;
  animation: dashdraw 0.5s linear infinite;
}

:deep(.vue-flow__edge.animated) {
  filter: drop-shadow(0 0 2px rgba(0, 123, 255, 0.5));
}

@keyframes dashdraw {
  to {
    stroke-dashoffset: -10;
  }
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-message {
  font-size: 1.2rem;
  color: #666;
}
</style>

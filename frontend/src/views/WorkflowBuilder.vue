<template>
  <div class="workflow-builder">
    <WorkflowToolbar
      :workflow="workflow"
      :saving="saving"
      :running="running"
      @go-back="goBack"
      @save="handleSave"
      @run="runWorkflow"
    />
    <div class="builder-content">
      <NodePalette :workflow="workflow" @execution-select="onExecutionSelect" />
      <WorkflowCanvas
        ref="canvasRef"
        :workflow="workflow"
        :vue-flow-nodes="vueFlowNodes"
        :vue-flow-edges="vueFlowEdges"
        :placeholder-visible="placeholderVisible"
        :placeholder-position="placeholderPosition"
        :node-select-menu-visible="nodeSelectMenuVisible"
        :node-select-menu-position="nodeSelectMenuPosition"
        :node-types="nodeTypes"
        @connect="onConnect"
        @connect-start="onConnectStart"
        @connect-end="onConnectEnd"
        @nodes-change="onNodesChange"
        @edges-change="onEdgesChange"
        @node-click="onNodeClick"
        @node-double-click="onNodeDoubleClick"
        @drop="onDrop"
        @show-node-select-menu="showNodeSelectMenu"
        @node-type-select="onNodeTypeSelect"
        @hide-node-select-menu="hideNodeSelectMenu"
      />
      <NodeSidebar
        :selected-node="selectedNode"
        :workflow="workflow"
        :execution-finished="executionFinished"
        :last-execution-id="lastExecutionId"
        @update-node="updateNode"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, provide, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import type { Node as VueFlowNode, Connection } from '@vue-flow/core';
import { useWorkflowManagement } from '../composables/useWorkflowManagement';
import { useNodeManagement } from '../composables/useNodeManagement';
import { useEdgeManagement } from '../composables/useEdgeManagement';
import { useVueFlowSync } from '../composables/useVueFlowSync';
import { useConnectionPlaceholder } from '../composables/useConnectionPlaceholder';
import { useWorkflowSocket } from '../composables/useWorkflowSocket';
import type { Node } from '../api/workflows';
import WorkflowToolbar from '../components/WorkflowToolbar.vue';
import NodePalette from '../components/NodePalette.vue';
import WorkflowCanvas from '../components/WorkflowCanvas.vue';
import NodeSidebar from '../components/NodeSidebar.vue';

const route = useRoute();
const router = useRouter();
const canvasRef = ref<InstanceType<typeof WorkflowCanvas> | null>(null);

const {
  workflow,
  nodes,
  edges,
  saving,
  running,
  lastExecutionId,
  workflowId,
  loadWorkflow,
  saveWorkflow,
  runWorkflow,
  resetWorkflow,
} = useWorkflowManagement();

const selectedNode = ref<Node | null>(null);

const socketWorkflowId = computed(() => {
  return workflowId.value === 'new' ? null : workflowId.value;
});

const {
  connect,
  disconnect,
  getNodeStatus,
  executionFinished,
  nodeStatuses,
  resetNodeStatusesForNodes,
} = useWorkflowSocket(socketWorkflowId);

const {
  createNode,
  updateNode: updateNodeData,
  updateNodePosition,
  deleteNode,
  saveAllNodePositions,
} = useNodeManagement(nodes, edges, selectedNode);

const { createEdge, deleteEdge, cleanupOrphanedEdges, getConnectedNodeIds } = useEdgeManagement(
  edges,
  nodes,
);

const { vueFlowNodes, vueFlowEdges, vueFlowInstance } = useVueFlowSync(nodes, edges, getNodeStatus);

const {
  placeholderVisible,
  placeholderPosition,
  nodeSelectMenuVisible,
  nodeSelectMenuPosition,
  pendingConnectionSource,
  hidePlaceholder,
  showNodeSelectMenu: showNodeSelectMenuHandler,
  hideNodeSelectMenu,
  handleConnectStart,
  handleConnectEnd,
  handleConnect,
} = useConnectionPlaceholder(workflow);

const nodeTypes = [
  { type: 'trigger', label: 'Trigger', icon: '⚡' },
  { type: 'http', label: 'HTTP', icon: '🌐' },
  { type: 'transform', label: 'Transform', icon: '🔄' },
  { type: 'agent', label: 'Agent', icon: '🤖' },
  { type: 'delay', label: 'Delay', icon: '⏱️' },
];

const handleNodeRun = async () => {
  if (!workflow.value) {
    return;
  }
  await runWorkflow();
};

provide('onNodeRun', handleNodeRun);

const onExecutionSelect = (executionId: string) => {
  lastExecutionId.value = executionId;
};

const onDrop = async (event: DragEvent) => {
  event.preventDefault();
  const nodeType = event.dataTransfer?.getData('nodeType');
  if (!nodeType || !workflow.value) {
    return;
  }

  const position = vueFlowInstance.project({ x: event.clientX, y: event.clientY });

  try {
    await createNode({
      type: nodeType as any,
      workflowId: workflow.value.id,
      position: position,
    });
  } catch (error) {
    console.error('Failed to create node:', error);
  }
};

const onConnectStart = (event: any) => {
  handleConnectStart(event);
};

const onConnect = async (connection: Connection) => {
  if (!workflow.value || !connection.source || !connection.target) {
    return;
  }

  handleConnect();

  try {
    await createEdge({
      workflowId: workflow.value.id,
      sourceNodeId: connection.source,
      targetNodeId: connection.target,
    });
  } catch (error) {
    console.error('Failed to create edge:', error);
  }
};

const onConnectEnd = (event?: MouseEvent) => {
  const canvasWrapperRef = canvasRef.value?.$el as HTMLElement | null;
  handleConnectEnd(event, canvasWrapperRef);
};

const showNodeSelectMenu = () => {
  const canvasWrapperRef = canvasRef.value?.$el as HTMLElement | null;
  showNodeSelectMenuHandler(canvasWrapperRef);
};

const onNodeTypeSelect = async (nodeType: string) => {
  if (!workflow.value || !pendingConnectionSource.value) {
    return;
  }

  try {
    const newNode = await createNode({
      type: nodeType as any,
      workflowId: workflow.value.id,
      position: placeholderPosition.value,
    });

    await createEdge({
      workflowId: workflow.value.id,
      sourceNodeId: pendingConnectionSource.value,
      targetNodeId: newNode.id,
    });

    hidePlaceholder();
  } catch (error) {
    console.error('Failed to create node from placeholder:', error);
  }
};

const onNodesChange = (changes: any[]) => {
  for (const change of changes) {
    if (change.type === 'position') {
      if (change.dragging === false && change.position) {
        const position = change.position;
        if (position && typeof position === 'object' && 'x' in position && 'y' in position) {
          const node = nodes.value.find((n: Node) => n.id === change.id);
          if (node) {
            updateNodePosition(change.id, { x: position.x, y: position.y });
          }
        }
      }
    }
  }
};

const onEdgesChange = (changes: any[]) => {
  for (const change of changes) {
    if (change.type === 'remove') {
      deleteEdge(change.id);
    }
  }
};

const onNodeClick = (event: { node: VueFlowNode }) => {
  selectedNode.value = event.node.data as Node;
  hidePlaceholder();
};

const onNodeDoubleClick = (event: { node: VueFlowNode }) => {
  deleteNode(event.node.id);
};

const updateNode = async (node: Node) => {
  try {
    const oldNode = nodes.value.find((n: Node) => n.id === node.id);
    if (!oldNode) {
      return;
    }

    const vueFlowNode = vueFlowNodes.value.find((n) => n.id === node.id);
    const positionToSave = vueFlowNode?.position || node.position;
    const nodeToUpdate = { ...node, position: positionToSave };

    const hasNonPositionChanges =
      oldNode.type !== node.type ||
      oldNode.subtype !== node.subtype ||
      oldNode.method !== node.method ||
      oldNode.url !== node.url ||
      oldNode.bodyTemplate !== node.bodyTemplate ||
      JSON.stringify(oldNode.template) !== JSON.stringify(node.template) ||
      JSON.stringify(oldNode.config) !== JSON.stringify(node.config) ||
      JSON.stringify(oldNode.headers) !== JSON.stringify(node.headers);

    await updateNodeData(nodeToUpdate);

    if (hasNonPositionChanges) {
      const connectedNodeIds = getConnectedNodeIds(node.id);
      resetNodeStatusesForNodes(Array.from(connectedNodeIds));
    }
  } catch (error) {
    console.error('Failed to update node:', error);
  }
};

const handleSave = async () => {
  await saveWorkflow();
  await saveAllNodePositions(vueFlowNodes.value);
};

const goBack = () => {
  router.push('/');
};

watch(
  () => [route.params.id, route.path] as const,
  async ([newId, newPath], [oldId, oldPath]) => {
    if (newId !== oldId || newPath !== oldPath) {
      disconnect();
      resetWorkflow();
      selectedNode.value = null;
      if ((newId && newId !== 'new') || (newPath && newPath !== '/workflow/new')) {
        const loaded = await loadWorkflow();
        if (loaded) {
          await cleanupOrphanedEdges();
          connect();
        }
      }
    }
  },
  { immediate: false },
);

watch(socketWorkflowId, (newId: string | null, oldId: string | null) => {
  if (newId !== oldId) {
    if (oldId) {
      disconnect();
    }
    if (newId) {
      connect();
    }
  }
});

const isUpdatingStatuses = ref(false);

watch(
  () => nodeStatuses.value,
  async () => {
    if (isUpdatingStatuses.value) {
      return;
    }

    isUpdatingStatuses.value = true;
    await nextTick();

    const updates: Array<{ index: number; node: Node }> = [];
    for (let i = 0; i < nodes.value.length; i++) {
      const node = nodes.value[i];
      const status = getNodeStatus(node.id);
      if ((node as any).status !== status) {
        const vueFlowNode = vueFlowNodes.value.find((n) => n.id === node.id);
        const preservedPosition = vueFlowNode?.position;
        const currentPosition = node.position;
        const newNode = { ...node, status } as Node;
        if (preservedPosition) {
          newNode.position = { x: preservedPosition.x, y: preservedPosition.y };
        } else if (currentPosition) {
          newNode.position = currentPosition;
        }
        updates.push({ index: i, node: newNode });
      }
    }

    if (updates.length > 0) {
      for (const { index, node } of updates) {
        nodes.value[index] = node;
      }
      await nextTick();
    }

    isUpdatingStatuses.value = false;
  },
  { deep: true, immediate: true, flush: 'post' },
);

onMounted(async () => {
  const loaded = await loadWorkflow();
  if (loaded) {
    await cleanupOrphanedEdges();
    connect();
  }
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped>
.workflow-builder {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.builder-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>

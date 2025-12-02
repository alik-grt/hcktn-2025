<template>
  <div class="relative flex min-h-screen w-full">
    <aside
      class="flex h-screen w-64 flex-col border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4 sticky top-0"
    >
      <div class="flex flex-col gap-4 flex-grow">
        <div class="flex items-center gap-3 px-2">
          <h1
            class="text-text-light-primary dark:text-text-dark-primary text-base font-bold leading-normal"
          >
            Automation Studio
          </h1>
        </div>
        <nav class="flex flex-col gap-2 mt-6">
          <router-link
            to="/"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
            exact-active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">dashboard</span>
            <p class="text-sm font-medium leading-normal">Dashboard</p>
          </router-link>
          <router-link
            to="/workflows"
            class="flex items-center gap-3 px-3 py-2 rounded bg-primary/10 dark:bg-primary/20 text-primary"
            active-class="bg-primary/10 dark:bg-primary/20 text-primary"
          >
            <span class="material-symbols-outlined fill text-primary">hub</span>
            <p class="text-sm font-semibold leading-normal">Workflows</p>
          </router-link>
          <router-link
            to="/executions"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">play_circle</span>
            <p class="text-sm font-medium leading-normal">Executions</p>
          </router-link>
          <router-link
            to="/variables"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">data_object</span>
            <p class="text-sm font-medium leading-normal">Variables</p>
          </router-link>
          <router-link
            to="/credentials"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">key</span>
            <p class="text-sm font-medium leading-normal">Credentials</p>
          </router-link>
        </nav>
      </div>
    </aside>
    <main class="flex-1 flex flex-col">
      <WorkflowToolbar
        :workflow="workflow"
        :saving="saving"
        :running="running"
        @go-back="goBack"
        @save="handleSave"
        @run="runWorkflow"
        @update-name="handleUpdateName"
      />
      <div class="flex flex-1 overflow-hidden">
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
          @pane-click="onPaneClick"
          @drop="onDrop"
          @show-node-select-menu="showNodeSelectMenu"
          @node-type-select="onNodeTypeSelect"
          @hide-node-select-menu="hideNodeSelectMenu"
          @init="onVueFlowInit"
          @viewport-change="onViewportChange"
          @move="onViewportChange"
          @move-start="onViewportChange"
          @move-end="onViewportChange"
          @zoom="onViewportChange"
          @zoom-change="onViewportChange"
        />
      </div>
    </main>
    <NodeSidebar
      :selected-node="selectedNode"
      :workflow="workflow"
      :execution-finished="executionFinished"
      :last-execution-id="lastExecutionId"
      @update-node="updateNode"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, provide, nextTick } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useRoute, useRouter } from 'vue-router';
import type { Node as VueFlowNode, Connection } from '@vue-flow/core';
import { useWorkflowManagement } from '../composables/useWorkflowManagement';
import { useNodeManagement } from '../composables/useNodeManagement';
import { useEdgeManagement } from '../composables/useEdgeManagement';
import { useVueFlowSync } from '../composables/useVueFlowSync';
import { useConnectionPlaceholder } from '../composables/useConnectionPlaceholder';
import { useWorkflowSocket } from '../composables/useWorkflowSocket';
import { useViewportPersistence } from '../composables/useViewportPersistence';
import type { Node } from '../api/workflows';
import { workflowsApi } from '../api/workflows';
import WorkflowToolbar from '../components/WorkflowToolbar.vue';
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
  updateWorkflowName,
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
  saveAllNodes,
} = useNodeManagement(nodes, edges, selectedNode);

const nodePositionDebouncers = new Map<
  string,
  (nodeId: string, position: { x: number; y: number }) => void
>();

const getDebouncedUpdateForNode = (nodeId: string) => {
  if (!nodePositionDebouncers.has(nodeId)) {
    const debouncedFn = useDebounceFn((nodeId: string, position: { x: number; y: number }) => {
      updateNodePosition(nodeId, position);
    }, 300);
    nodePositionDebouncers.set(nodeId, debouncedFn);
  }
  return nodePositionDebouncers.get(nodeId)!;
};

const { createEdge, deleteEdge, cleanupOrphanedEdges, getConnectedNodeIds } = useEdgeManagement(
  edges,
  nodes,
);

const { vueFlowNodes, vueFlowEdges, vueFlowInstance } = useVueFlowSync(nodes, edges, getNodeStatus);

const { saveViewport, restoreViewport, clearViewport, isRestoringViewport, hasRestoredViewport } =
  useViewportPersistence(vueFlowInstance, workflowId);

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

const handleNodeRun = async (node: Node) => {
  if (!workflow.value) {
    return;
  }
  if (node.type === 'trigger' && node.subtype === 'cron') {
    try {
      await workflowsApi.startCron(node.id);
      const updatedNode = nodes.value.find((n: Node) => n.id === node.id);
      if (updatedNode && updatedNode.config) {
        updatedNode.config.cronActive = true;
      }
    } catch (error) {
      console.error('Failed to start cron job:', error);
    }
    return;
  }
  await runWorkflow();
};

const handleNodePause = async (node: Node) => {
  if (!workflow.value) {
    return;
  }
  if (node.type === 'trigger' && node.subtype === 'cron') {
    try {
      await workflowsApi.stopCron(node.id);
      const updatedNode = nodes.value.find((n: Node) => n.id === node.id);
      if (updatedNode && updatedNode.config) {
        updatedNode.config.cronActive = false;
      }
    } catch (error) {
      console.error('Failed to stop cron job:', error);
    }
  }
};

provide('onNodeRun', handleNodeRun);
provide('onNodePause', handleNodePause);

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
    if (change.type === 'remove') {
      deleteNode(change.id);
    } else if (change.type === 'position') {
      if (!change.position) {
        continue;
      }
      const position = change.position;
      if (
        position &&
        typeof position === 'object' &&
        typeof position.x === 'number' &&
        typeof position.y === 'number'
      ) {
        const debouncedUpdate = getDebouncedUpdateForNode(change.id);
        debouncedUpdate(change.id, { x: position.x, y: position.y });
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

const onPaneClick = () => {
  selectedNode.value = null;
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
  console.log('handleSave: Saving workflow and nodes', {
    vueFlowNodesCount: vueFlowNodes.value.length,
    nodesCount: nodes.value.length,
    vueFlowNodes: vueFlowNodes.value.map((n) => ({
      id: n.id,
      position: n.position,
    })),
  });
  await saveWorkflow();
  await saveAllNodes(vueFlowNodes.value);
  console.log('handleSave: Save completed');
};

const goBack = () => {
  router.push('/');
};

const handleUpdateName = async (name: string) => {
  try {
    await updateWorkflowName(name);
  } catch (error) {
    console.error('Failed to update workflow name:', error);
  }
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

const hasFocusedOnTrigger = ref(false);

const focusOnTriggerNode = async () => {
  if (hasFocusedOnTrigger.value) {
    return;
  }

  if (!vueFlowInstance) {
    return;
  }

  const triggerNode = nodes.value.find((node) => node.type === 'trigger');
  if (!triggerNode) {
    return;
  }

  const vueFlowNode = vueFlowNodes.value.find((n) => n.id === triggerNode.id);
  if (!vueFlowNode || !vueFlowNode.position) {
    return;
  }

  const position = vueFlowNode.position;
  if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
    return;
  }

  try {
    await nextTick();

    if (vueFlowInstance.fitView && typeof vueFlowInstance.fitView === 'function') {
      vueFlowInstance.fitView({
        nodes: [triggerNode.id],
        padding: 0.2,
        duration: 400,
      });
      hasFocusedOnTrigger.value = true;
    } else if (vueFlowInstance.setCenter && typeof vueFlowInstance.setCenter === 'function') {
      vueFlowInstance.setCenter(position.x, position.y, {
        zoom: 1.2,
        duration: 400,
      });
      hasFocusedOnTrigger.value = true;
    }
  } catch (error) {
    console.error('Failed to focus on trigger node:', error);
  }
};

const onVueFlowInit = async () => {
  await nextTick();

  const restored = await restoreViewport();
  if (!restored) {
    if (!hasFocusedOnTrigger.value) {
      setTimeout(() => {
        focusOnTriggerNode();
      }, 100);
    }
  } else {
    hasFocusedOnTrigger.value = true;
  }
};

const onViewportChange = () => {
  if (!isRestoringViewport.value) {
    saveViewport();
  }
};

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

watch(
  () => vueFlowNodes.value.length,
  async () => {
    if (vueFlowNodes.value.length > 0 && !hasFocusedOnTrigger.value) {
      await nextTick();
      setTimeout(() => {
        focusOnTriggerNode();
      }, 300);
    }
  },
);

watch(
  () => [route.params.id, route.path] as const,
  async ([newId, newPath], [oldId, oldPath]) => {
    if (newId !== oldId || newPath !== oldPath) {
      hasFocusedOnTrigger.value = false;
      disconnect();
      resetWorkflow();
      selectedNode.value = null;
      if ((newId && newId !== 'new') || (newPath && newPath !== '/workflow/new')) {
        const loaded = await loadWorkflow();
        if (loaded) {
          await cleanupOrphanedEdges();
          connect();
          await nextTick();
          const restored = await restoreViewport();
          if (!restored) {
            setTimeout(() => {
              focusOnTriggerNode();
            }, 300);
          } else {
            hasFocusedOnTrigger.value = true;
          }
        }
      }
    }
  },
  { immediate: false },
);

onMounted(async () => {
  const loaded = await loadWorkflow();
  if (loaded) {
    await cleanupOrphanedEdges();
    connect();
    await nextTick();
    const restored = await restoreViewport();
    if (!restored) {
      setTimeout(() => {
        focusOnTriggerNode();
      }, 300);
    } else {
      hasFocusedOnTrigger.value = true;
    }
  }
});

onUnmounted(() => {
  saveViewport();
  disconnect();
});
</script>

<style scoped></style>

import { ref, watch, nextTick, type Ref } from 'vue';
import { useVueFlow } from '@vue-flow/core';
import type { Node as VueFlowNode, Edge as VueFlowEdge } from '@vue-flow/core';
import type { Node, Edge } from '../api/workflows';

export function useVueFlowSync(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  getNodeStatus: (nodeId: string) => string,
) {
  const vueFlowNodes = ref<VueFlowNode[]>([]);
  const vueFlowEdges = ref<VueFlowEdge[]>([]);
  const vueFlowInstance = useVueFlow();

  const convertToVueFlowNodes = (nodesData: Node[]): VueFlowNode[] => {
    return nodesData.map((node) => ({
      id: node.id,
      type: 'workflowNode',
      position: node.position || { x: 0, y: 0 },
      data: node,
      draggable: true,
    }));
  };

  const convertToVueFlowEdges = (edgesData: Edge[]): VueFlowEdge[] => {
    const nodeIds = new Set(nodes.value.map((n: Node) => n.id));
    const vueFlowNodeIds = new Set(vueFlowNodes.value.map((n: VueFlowNode) => n.id));
    const sourceNodeStatuses = new Map<string, string>();
    for (const node of nodes.value) {
      sourceNodeStatuses.set(node.id, getNodeStatus(node.id));
    }

    return edgesData
      .filter((edge) => {
        const hasSourceInData = nodeIds.has(edge.sourceNodeId);
        const hasTargetInData = nodeIds.has(edge.targetNodeId);
        const hasSourceInVueFlow = vueFlowNodeIds.has(edge.sourceNodeId);
        const hasTargetInVueFlow = vueFlowNodeIds.has(edge.targetNodeId);
        
        const isValid = hasSourceInData && hasTargetInData && hasSourceInVueFlow && hasTargetInVueFlow;
        
        if (!isValid) {
          console.warn(
            `[Vue Flow]: Edge source or target is missing. Filtering out edge.`,
            {
              edgeId: edge.id,
              sourceId: edge.sourceNodeId,
              targetId: edge.targetNodeId,
              hasSourceInData,
              hasTargetInData,
              hasSourceInVueFlow,
              hasTargetInVueFlow,
            },
          );
          return false;
        }
        return true;
      })
      .map((edge) => {
        const sourceStatus = sourceNodeStatuses.get(edge.sourceNodeId) || 'idle';
        const isAnimated = sourceStatus === 'progress' || sourceStatus === 'passed';

        return {
          id: edge.id,
          source: edge.sourceNodeId,
          target: edge.targetNodeId,
          type: 'default',
          animated: isAnimated,
          style: isAnimated
            ? {
                stroke: sourceStatus === 'progress' ? '#007bff' : '#28a745',
                strokeWidth: 2,
              }
            : undefined,
        };
      });
  };

  watch(
    () => nodes.value,
    async (newNodes: Node[]) => {
      const currentNodesMap = new Map(vueFlowNodes.value.map((n: VueFlowNode) => [n.id, n]));
      const newVueFlowNodes = convertToVueFlowNodes(newNodes);

      for (const newNode of newVueFlowNodes) {
        const currentNode = currentNodesMap.get(newNode.id);
        if (currentNode) {
          const currentPos = (currentNode as VueFlowNode).position;
          const newNodePos = newNode.position;

          if (
            currentPos &&
            typeof currentPos === 'object' &&
            'x' in currentPos &&
            'y' in currentPos &&
            typeof currentPos.x === 'number' &&
            typeof currentPos.y === 'number' &&
            (currentPos.x !== 0 || currentPos.y !== 0)
          ) {
            const posDiff =
              Math.abs(currentPos.x - (newNodePos?.x || 0)) +
              Math.abs(currentPos.y - (newNodePos?.y || 0));
            if (posDiff > 1) {
              newNode.position = { x: currentPos.x, y: currentPos.y };
            }
          }
        }
      }

      vueFlowNodes.value = newVueFlowNodes;
      
      await nextTick();
      
      vueFlowEdges.value = convertToVueFlowEdges(edges.value);
    },
    { deep: true, flush: 'post' },
  );

  watch(
    () => edges.value,
    async () => {
      await nextTick();
      vueFlowEdges.value = convertToVueFlowEdges(edges.value);
    },
    { deep: true },
  );

  const getVueFlowNodePosition = (nodeId: string) => {
    const vueFlowNode = vueFlowNodes.value.find((n) => n.id === nodeId);
    return vueFlowNode?.position;
  };

  return {
    vueFlowNodes,
    vueFlowEdges,
    vueFlowInstance,
    getVueFlowNodePosition,
  };
}

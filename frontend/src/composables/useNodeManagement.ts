import type { Ref } from 'vue';
import { workflowsApi, type Node, type Edge, type CreateNodeDto } from '../api/workflows';

export function useNodeManagement(
  nodes: Ref<Node[]>,
  edges: Ref<Edge[]>,
  selectedNode: Ref<Node | null>,
) {
  const createNode = async (data: CreateNodeDto) => {
    try {
      const newNode = await workflowsApi.createNode(data);
      nodes.value.push(newNode);
      return newNode;
    } catch (error) {
      console.error('Failed to create node:', error);
      throw error;
    }
  };

  const updateNode = async (node: Node) => {
    try {
      const updateData: Partial<CreateNodeDto> = {
        type: node.type,
        subtype: node.subtype,
        workflowId: node.workflowId,
        position: node.position,
        config: node.config,
        method: node.method,
        url: node.url,
        headers: node.headers,
        bodyTemplate: node.bodyTemplate,
        template: node.template,
        name: node.name,
      };
      const updated = await workflowsApi.updateNode(node.id, updateData);
      const index = nodes.value.findIndex((n: Node) => n.id === node.id);
      if (index !== -1) {
        nodes.value[index] = updated;
      }
      if (selectedNode.value?.id === node.id) {
        selectedNode.value = updated;
      }
      return updated;
    } catch (error) {
      console.error('Failed to update node:', error);
      throw error;
    }
  };

  const updateNodePosition = async (nodeId: string, position: { x: number; y: number }) => {
    const node = nodes.value.find((n: Node) => n.id === nodeId);
    if (!node) {
      return;
    }

    const currentPos = node.position || { x: 0, y: 0 };
    const posDiff = Math.abs(currentPos.x - position.x) + Math.abs(currentPos.y - position.y);

    if (posDiff > 0.5) {
      try {
        await workflowsApi.updateNode(nodeId, { position: { x: position.x, y: position.y } });
      } catch (error) {
        console.error(`Failed to update node position for ${nodeId}:`, error);
      }
    }
  };

  const deleteNode = async (nodeId: string) => {
    try {
      const edgesToDelete = edges.value.filter(
        (e: Edge) => e.sourceNodeId === nodeId || e.targetNodeId === nodeId,
      );

      for (const edge of edgesToDelete) {
        try {
          await workflowsApi.deleteEdge(edge.id);
        } catch (error) {
          console.error(`Failed to delete edge ${edge.id}:`, error);
        }
      }

      await workflowsApi.deleteNode(nodeId);
      nodes.value = nodes.value.filter((n: Node) => n.id !== nodeId);
      edges.value = edges.value.filter(
        (e: Edge) => e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId,
      );
      if (selectedNode.value?.id === nodeId) {
        selectedNode.value = null;
      }
    } catch (error) {
      console.error('Failed to delete node:', error);
      throw error;
    }
  };

  const saveAllNodePositions = async (
    vueFlowNodes: Array<{ id: string; position?: { x: number; y: number } }>,
  ) => {
    const updates: Promise<void>[] = [];

    for (const vueFlowNode of vueFlowNodes) {
      const node = nodes.value.find((n: Node) => n.id === vueFlowNode.id);
      if (node && vueFlowNode.position) {
        const currentPos = node.position || { x: 0, y: 0 };
        const newPos = vueFlowNode.position;
        const posDiff = Math.abs(currentPos.x - newPos.x) + Math.abs(currentPos.y - newPos.y);

        if (posDiff > 0.5) {
          updates.push(
            updateNode({
              ...node,
              position: { x: newPos.x, y: newPos.y },
            }).then(() => {}),
          );
        }
      }
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Saved positions for ${updates.length} nodes`);
    }
  };

  const saveAllNodes = async (
    vueFlowNodes: Array<{ id: string; position?: { x: number; y: number } }>,
  ): Promise<void> => {
    const updates: Promise<void>[] = [];

    for (const node of nodes.value) {
      const vueFlowNode = vueFlowNodes.find((n) => n.id === node.id);
      const positionToSave = vueFlowNode?.position || node.position;

      const nodeToUpdate: Node = {
        ...node,
        position: positionToSave,
      };

      console.log(`Saving node ${node.id}:`, {
        position: positionToSave,
        vueFlowPosition: vueFlowNode?.position,
        nodePosition: node.position,
        config: nodeToUpdate.config,
        method: nodeToUpdate.method,
        url: nodeToUpdate.url,
      });

      updates.push(updateNode(nodeToUpdate).then(() => {}));
    }

    if (updates.length > 0) {
      await Promise.all(updates);
      console.log(`Saved config and positions for ${updates.length} nodes`);
    }
  };

  return {
    createNode,
    updateNode,
    updateNodePosition,
    deleteNode,
    saveAllNodePositions,
    saveAllNodes,
  };
}

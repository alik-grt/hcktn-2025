import { ref, type Ref } from 'vue';
import { workflowsApi, type Edge, type Node, type CreateEdgeDto } from '../api/workflows';

export function useEdgeManagement(edges: Ref<Edge[]>, nodes: Ref<Node[]>) {
  const createEdge = async (data: CreateEdgeDto) => {
    try {
      const newEdge = await workflowsApi.createEdge(data);
      edges.value.push(newEdge);
      return newEdge;
    } catch (error) {
      console.error('Failed to create edge:', error);
      throw error;
    }
  };

  const deleteEdge = async (edgeId: string) => {
    try {
      await workflowsApi.deleteEdge(edgeId);
      edges.value = edges.value.filter((e: Edge) => e.id !== edgeId);
    } catch (error) {
      console.error('Failed to delete edge:', error);
      throw error;
    }
  };

  const cleanupOrphanedEdges = async () => {
    const nodeIds = new Set(nodes.value.map((n: Node) => n.id));
    const orphanedEdges: Edge[] = [];

    for (const edge of edges.value) {
      const hasSource = nodeIds.has(edge.sourceNodeId);
      const hasTarget = nodeIds.has(edge.targetNodeId);
      if (!hasSource || !hasTarget) {
        console.warn(`Edge ${edge.id} skipped: source or target node missing`, {
          edgeId: edge.id,
          sourceId: edge.sourceNodeId,
          targetId: edge.targetNodeId,
          hasSource,
          hasTarget,
        });
        orphanedEdges.push(edge);
      }
    }

    if (orphanedEdges.length > 0) {
      for (const edge of orphanedEdges) {
        try {
          await workflowsApi.deleteEdge(edge.id);
          edges.value = edges.value.filter((e: Edge) => e.id !== edge.id);
          console.log(`Deleted orphaned edge: ${edge.id}`);
        } catch (error) {
          console.error(`Failed to delete orphaned edge ${edge.id}:`, error);
        }
      }
    }
  };

  const getConnectedNodeIds = (nodeId: string): Set<string> => {
    const connectedIds = new Set<string>([nodeId]);
    let changed = true;

    while (changed) {
      changed = false;
      for (const edge of edges.value) {
        const hasSource = connectedIds.has(edge.sourceNodeId);
        const hasTarget = connectedIds.has(edge.targetNodeId);

        if (hasSource && !hasTarget) {
          connectedIds.add(edge.targetNodeId);
          changed = true;
        } else if (hasTarget && !hasSource) {
          connectedIds.add(edge.sourceNodeId);
          changed = true;
        }
      }
    }

    return connectedIds;
  };

  return {
    createEdge,
    deleteEdge,
    cleanupOrphanedEdges,
    getConnectedNodeIds,
  };
}


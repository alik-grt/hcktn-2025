import { ref, watch, type Ref } from 'vue';
import type { Node } from '../api/workflows';

type AnimatedEdge = {
  edgeId: string;
  startTime: number;
  duration: number;
};

export function useEdgeAnimation(
  nodes: Ref<Node[]>,
  edges: Ref<Array<{ id: string; sourceNodeId: string; targetNodeId: string }>>,
  getNodeStatus: (nodeId: string) => string,
) {
  const animatedEdges = ref<Map<string, AnimatedEdge>>(new Map());
  const previousNodeStatuses = ref<Map<string, string>>(new Map());
  const animationProgress = ref<Map<string, number>>(new Map());

  const startEdgeAnimation = (edgeId: string, duration: number = 1500) => {
    const existing = animatedEdges.value.get(edgeId);
    if (existing) {
      return;
    }

    const startTime = Date.now();
    animatedEdges.value.set(edgeId, {
      edgeId,
      startTime,
      duration,
    });

    animationProgress.value.set(edgeId, 0);
    animationProgress.value = new Map(animationProgress.value);

    const updateProgress = () => {
      const animation = animatedEdges.value.get(edgeId);
      if (!animation) {
        return;
      }

      const elapsed = Date.now() - animation.startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      animationProgress.value.set(edgeId, progress);
      animationProgress.value = new Map(animationProgress.value);

      if (progress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        animatedEdges.value.delete(edgeId);
        animatedEdges.value = new Map(animatedEdges.value);
        animationProgress.value.delete(edgeId);
        animationProgress.value = new Map(animationProgress.value);
      }
    };

    requestAnimationFrame(updateProgress);
  };

  const isEdgeAnimated = (edgeId: string): boolean => {
    return animatedEdges.value.has(edgeId);
  };

  const getEdgeAnimationProgress = (edgeId: string): number => {
    return animationProgress.value.get(edgeId) || 0;
  };

  watch(
    () => nodes.value,
    (newNodes) => {
      const currentStatuses = new Map<string, string>();
      for (const node of newNodes) {
        const status = getNodeStatus(node.id);
        currentStatuses.set(node.id, status);
      }

      for (const [nodeId, currentStatus] of currentStatuses.entries()) {
        const previousStatus = previousNodeStatuses.value.get(nodeId) || 'idle';

        if (previousStatus !== 'progress' && currentStatus === 'progress') {
          const outgoingEdges = edges.value.filter((e) => e.sourceNodeId === nodeId);
          for (const edge of outgoingEdges) {
            startEdgeAnimation(edge.id, 1500);
          }
        }
      }

      previousNodeStatuses.value = currentStatuses;
    },
    { deep: true },
  );

  return {
    animatedEdges,
    isEdgeAnimated,
    getEdgeAnimationProgress,
    startEdgeAnimation,
  };
}

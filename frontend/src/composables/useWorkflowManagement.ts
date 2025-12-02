import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { workflowsApi, type Workflow, type Node, type Edge } from '../api/workflows';

export function useWorkflowManagement() {
  const route = useRoute();
  const router = useRouter();
  const workflow = ref<Workflow | null>(null);
  const nodes = ref<Node[]>([]);
  const edges = ref<Edge[]>([]);
  const saving = ref(false);
  const running = ref(false);
  const lastExecutionId = ref<string | null>(null);

  const workflowId = computed(() => {
    const id = route.params.id;
    const path = route.path;

    if (path === '/workflow/new' || id === 'new') {
      return null;
    }
    if (!id) {
      return null;
    }
    return id as string;
  });

  const loadWorkflow = async () => {
    const routeId = route.params.id;
    const routePath = route.path;
    const currentId = workflowId.value;

    const isNewWorkflow = routePath === '/workflow/new' || routeId === 'new';

    if (isNewWorkflow) {
      try {
        workflow.value = await workflowsApi.create({
          name: 'New Workflow',
          status: 'inactive',
        });
        await router.replace(`/workflow/${workflow.value.id}`);
        await new Promise((resolve) => setTimeout(resolve, 300));
        const newRouteId = route.params.id;
        const newRoutePath = route.path;
        if (newRouteId && newRouteId !== 'new' && newRoutePath !== '/workflow/new') {
          workflow.value = await workflowsApi.getById(newRouteId as string);
          const loadedNodes = await workflowsApi.getNodes(newRouteId as string);
          const loadedEdges = await workflowsApi.getEdges(newRouteId as string);

          nodes.value = loadedNodes;

          const nodeIds = new Set(loadedNodes.map((n: Node) => n.id));
          const validEdges = loadedEdges.filter((edge: Edge) => {
            const hasSource = nodeIds.has(edge.sourceNodeId);
            const hasTarget = nodeIds.has(edge.targetNodeId);
            if (!hasSource || !hasTarget) {
              console.warn(`Filtering out orphaned edge ${edge.id} during load`, {
                edgeId: edge.id,
                sourceId: edge.sourceNodeId,
                targetId: edge.targetNodeId,
                hasSource,
                hasTarget,
              });
            }
            return hasSource && hasTarget;
          });

          edges.value = validEdges;
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to create workflow:', error);
        return false;
      }
    }

    if (!routeId || !currentId) {
      return false;
    }

    try {
      const idToLoad = currentId || (routeId as string);
      workflow.value = await workflowsApi.getById(idToLoad);
      const loadedNodes = await workflowsApi.getNodes(idToLoad);
      const loadedEdges = await workflowsApi.getEdges(idToLoad);

      nodes.value = loadedNodes;

      const nodeIds = new Set(loadedNodes.map((n: Node) => n.id));
      const validEdges = loadedEdges.filter((edge: Edge) => {
        const hasSource = nodeIds.has(edge.sourceNodeId);
        const hasTarget = nodeIds.has(edge.targetNodeId);
        if (!hasSource || !hasTarget) {
          console.warn(`Filtering out orphaned edge ${edge.id} during load`, {
            edgeId: edge.id,
            sourceId: edge.sourceNodeId,
            targetId: edge.targetNodeId,
            hasSource,
            hasTarget,
          });
        }
        return hasSource && hasTarget;
      });

      edges.value = validEdges;
      return true;
    } catch (error) {
      console.error('Failed to load workflow:', error);
      return false;
    }
  };

  const saveWorkflow = async () => {
    if (!workflow.value) {
      return;
    }
    saving.value = true;
    try {
      workflow.value = await workflowsApi.update(workflow.value.id, {
        name: workflow.value.name,
        description: workflow.value.description,
        status: workflow.value.status,
      });
    } catch (error) {
      console.error('Failed to save workflow:', error);
    } finally {
      saving.value = false;
    }
  };

  const updateWorkflowName = async (name: string) => {
    if (!workflow.value || !name.trim()) {
      return;
    }
    try {
      workflow.value = await workflowsApi.update(workflow.value.id, {
        name: name.trim(),
      });
    } catch (error) {
      console.error('Failed to update workflow name:', error);
      throw error;
    }
  };

  const toggleWorkflowStatus = async () => {
    if (!workflowId.value || !workflow.value) {
      return;
    }
    running.value = true;
    try {
      const newStatus = workflow.value.status === 'active' ? 'inactive' : 'active';
      workflow.value = await workflowsApi.update(workflow.value.id, {
        status: newStatus,
      });
    } catch (error) {
      console.error('Failed to toggle workflow status:', error);
    } finally {
      running.value = false;
    }
  };

  const runWorkflow = async () => {
    if (!workflowId.value || !workflow.value) {
      return;
    }
    running.value = true;
    lastExecutionId.value = null;
    try {
      const execution = await workflowsApi.executeWorkflow(workflow.value.id);
      lastExecutionId.value = execution.id;
    } catch (error) {
      console.error('Failed to run workflow:', error);
    } finally {
      running.value = false;
    }
  };

  const resetWorkflow = () => {
    nodes.value = [];
    edges.value = [];
    workflow.value = null;
  };

  return {
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
    toggleWorkflowStatus,
    resetWorkflow,
    updateWorkflowName,
  };
}

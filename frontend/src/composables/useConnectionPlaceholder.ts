import { ref, type Ref } from 'vue';
import type { Workflow } from '../api/workflows';

export function useConnectionPlaceholder(
  workflow: Ref<Workflow | null>,
  vueFlowInstance: Ref<any>,
) {
  const placeholderVisible = ref(false);
  const placeholderPosition = ref({ x: 0, y: 0 });
  const nodeSelectMenuVisible = ref(false);
  const nodeSelectMenuPosition = ref({ x: 0, y: 0 });
  const pendingConnectionSource = ref<string | null>(null);
  const isConnectionInProgress = ref(false);
  const lastConnectionSource = ref<string | null>(null);

  const showPlaceholder = (position: { x: number; y: number }, sourceNodeId: string) => {
    placeholderPosition.value = position;
    pendingConnectionSource.value = sourceNodeId;
    placeholderVisible.value = true;
  };

  const hidePlaceholder = () => {
    placeholderVisible.value = false;
    pendingConnectionSource.value = null;
  };

  const showNodeSelectMenu = (canvasWrapperRef?: HTMLElement | null) => {
    if (!canvasWrapperRef) {
      return;
    }

    const rect = canvasWrapperRef.getBoundingClientRect();
    nodeSelectMenuPosition.value = {
      x: rect.left + placeholderPosition.value.x,
      y: rect.top + placeholderPosition.value.y + 40,
    };
    nodeSelectMenuVisible.value = true;
  };

  const hideNodeSelectMenu = () => {
    nodeSelectMenuVisible.value = false;
  };

  const handleConnectStart = (event: any) => {
    const connection = event.connection || event;
    if (connection && connection.source) {
      isConnectionInProgress.value = true;
      lastConnectionSource.value = connection.source;
    }
  };

  const handleConnectEnd = (event?: MouseEvent, canvasWrapperRef?: HTMLElement | null) => {
    if (!workflow.value || !isConnectionInProgress.value || !lastConnectionSource.value || !event) {
      isConnectionInProgress.value = false;
      lastConnectionSource.value = null;
      return;
    }

    if (canvasWrapperRef && vueFlowInstance.value) {
      const rect = canvasWrapperRef.getBoundingClientRect();
      const position = vueFlowInstance.value.project({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      });
      showPlaceholder(position, lastConnectionSource.value);
    }

    isConnectionInProgress.value = false;
    lastConnectionSource.value = null;
  };

  const handleConnect = () => {
    isConnectionInProgress.value = false;
    lastConnectionSource.value = null;
    hidePlaceholder();
  };

  return {
    placeholderVisible,
    placeholderPosition,
    nodeSelectMenuVisible,
    nodeSelectMenuPosition,
    pendingConnectionSource,
    isConnectionInProgress,
    showPlaceholder,
    hidePlaceholder,
    showNodeSelectMenu,
    hideNodeSelectMenu,
    handleConnectStart,
    handleConnectEnd,
    handleConnect,
  };
}

import { ref, watch, type Ref } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { useVueFlow } from '@vue-flow/core';

type ViewportState = {
  x: number;
  y: number;
  zoom: number;
};

const STORAGE_KEY_PREFIX = 'workflow_viewport_';

const getStorageKey = (workflowId: string | null): string | null => {
  if (!workflowId) {
    return null;
  }
  return `${STORAGE_KEY_PREFIX}${workflowId}`;
};

const saveViewportToStorage = (workflowId: string | null, viewport: ViewportState): void => {
  const key = getStorageKey(workflowId);
  if (!key) {
    return;
  }

  try {
    localStorage.setItem(key, JSON.stringify(viewport));
  } catch (error) {
    console.error('Failed to save viewport to localStorage:', error);
  }
};

const isValidViewportValue = (value: number): boolean => {
  return (
    typeof value === 'number' &&
    !isNaN(value) &&
    isFinite(value) &&
    value >= -100000 &&
    value <= 100000
  );
};

const loadViewportFromStorage = (workflowId: string | null): ViewportState | null => {
  const key = getStorageKey(workflowId);
  if (!key) {
    return null;
  }

  try {
    const stored = localStorage.getItem(key);
    if (!stored) {
      return null;
    }

    const viewport = JSON.parse(stored) as ViewportState;
    if (
      isValidViewportValue(viewport.x) &&
      isValidViewportValue(viewport.y) &&
      isValidViewportValue(viewport.zoom) &&
      viewport.zoom > 0 &&
      viewport.zoom <= 4
    ) {
      return viewport;
    }
  } catch (error) {
    console.error('Failed to load viewport from localStorage:', error);
  }

  return null;
};

export function useViewportPersistence(
  vueFlowInstance: ReturnType<typeof useVueFlow> | null,
  workflowId: Ref<string | null>,
) {
  const isRestoringViewport = ref(false);
  const hasRestoredViewport = ref(false);

  const saveViewport = useDebounceFn(() => {
    if (!vueFlowInstance || !workflowId.value || isRestoringViewport.value) {
      return;
    }

    const getViewport = vueFlowInstance.getViewport;
    if (!getViewport || typeof getViewport !== 'function') {
      return;
    }

    try {
      const viewport = getViewport();
      if (
        viewport &&
        isValidViewportValue(viewport.x) &&
        isValidViewportValue(viewport.y) &&
        isValidViewportValue(viewport.zoom) &&
        viewport.zoom > 0 &&
        viewport.zoom <= 10
      ) {
        saveViewportToStorage(workflowId.value, {
          x: viewport.x,
          y: viewport.y,
          zoom: viewport.zoom,
        });
      }
    } catch (error) {
      console.error('Failed to get viewport:', error);
    }
  }, 500);

  const restoreViewport = async (): Promise<boolean> => {
    if (!vueFlowInstance || !workflowId.value || hasRestoredViewport.value) {
      return false;
    }

    const savedViewport = loadViewportFromStorage(workflowId.value);
    if (!savedViewport) {
      return false;
    }

    const setViewport = vueFlowInstance.setViewport;
    if (!setViewport || typeof setViewport !== 'function') {
      return false;
    }

    try {
      if (
        !isValidViewportValue(savedViewport.x) ||
        !isValidViewportValue(savedViewport.y) ||
        !isValidViewportValue(savedViewport.zoom) ||
        savedViewport.zoom <= 0 ||
        savedViewport.zoom > 10
      ) {
        clearViewport(workflowId.value);
        return false;
      }

      isRestoringViewport.value = true;
      setViewport(
        {
          x: savedViewport.x,
          y: savedViewport.y,
          zoom: savedViewport.zoom,
        },
        {
          duration: 0,
        },
      );
      hasRestoredViewport.value = true;
      return true;
    } catch (error) {
      console.error('Failed to restore viewport:', error);
      clearViewport(workflowId.value);
      return false;
    } finally {
      setTimeout(() => {
        isRestoringViewport.value = false;
      }, 100);
    }
  };

  const clearViewport = (workflowIdToClear: string | null): void => {
    const key = getStorageKey(workflowIdToClear);
    if (key) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.error('Failed to clear viewport from localStorage:', error);
      }
    }
  };

  watch(
    () => workflowId.value,
    () => {
      hasRestoredViewport.value = false;
    },
  );

  return {
    saveViewport,
    restoreViewport,
    clearViewport,
    isRestoringViewport,
    hasRestoredViewport,
  };
}

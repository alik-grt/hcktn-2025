<template>
  <div
    v-if="isVisible"
    class="custom-node-resizer"
    :style="resizerStyle"
  >
    <div class="resizer-border"></div>
    <div
      class="resizer-handle resizer-handle-top"
      @mousedown="startResize('top', $event)"
    ></div>
    <div
      class="resizer-handle resizer-handle-right"
      @mousedown="startResize('right', $event)"
    ></div>
    <div
      class="resizer-handle resizer-handle-bottom"
      @mousedown="startResize('bottom', $event)"
    ></div>
    <div
      class="resizer-handle resizer-handle-left"
      @mousedown="startResize('left', $event)"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onUnmounted, inject } from 'vue';
import { useVueFlow } from '@vue-flow/core';

type Props = {
  nodeId: string;
  minWidth?: number;
  minHeight?: number;
  isVisible?: boolean;
};

const props = withDefaults(defineProps<Props>(), {
  minWidth: 200,
  minHeight: 100,
  isVisible: true,
});

const vueFlowInstance = inject('vueFlowInstance', useVueFlow());
const { getNode, setNodes, viewport } = vueFlowInstance;

const resizerStyle = computed(() => {
  return {};
});

const isResizing = ref(false);
const resizeDirection = ref<'top' | 'right' | 'bottom' | 'left' | null>(null);
const startScreenX = ref(0);
const startScreenY = ref(0);
const startWidth = ref(0);
const startHeight = ref(0);
const startNodeX = ref(0);
const startNodeY = ref(0);

const startResize = (direction: 'top' | 'right' | 'bottom' | 'left', event: MouseEvent) => {
  event.preventDefault();
  event.stopPropagation();
  
  const node = getNode.value(props.nodeId);
  if (!node) {
    return;
  }
  
  isResizing.value = true;
  resizeDirection.value = direction;
  startScreenX.value = event.clientX;
  startScreenY.value = event.clientY;
  const nodeWidth = typeof node.width === 'number' ? node.width : props.minWidth;
  const nodeHeight = typeof node.height === 'number' ? node.height : props.minHeight;
  startWidth.value = nodeWidth;
  startHeight.value = nodeHeight;
  startNodeX.value = node.position.x;
  startNodeY.value = node.position.y;

  document.addEventListener('mousemove', handleResize, { passive: false });
  document.addEventListener('mouseup', stopResize, { passive: false });
  document.body.style.cursor = getCursor(direction);
  document.body.style.userSelect = 'none';
};

const handleResize = (event: MouseEvent) => {
  if (!isResizing.value || !resizeDirection.value) {
    return;
  }

  event.preventDefault();
  event.stopPropagation();

  const node = getNode.value(props.nodeId);
  if (!node) {
    return;
  }

  const zoom = viewport.value?.zoom || 1;
  const deltaScreenX = event.clientX - startScreenX.value;
  const deltaScreenY = event.clientY - startScreenY.value;
  const deltaX = deltaScreenX / zoom;
  const deltaY = deltaScreenY / zoom;
  
  let newWidth = startWidth.value;
  let newHeight = startHeight.value;
  let newX = startNodeX.value;
  let newY = startNodeY.value;

  switch (resizeDirection.value) {
    case 'right':
      newWidth = Math.max(props.minWidth, startWidth.value + deltaX);
      break;
    case 'left':
      newWidth = Math.max(props.minWidth, startWidth.value - deltaX);
      newX = startNodeX.value + (startWidth.value - newWidth);
      break;
    case 'bottom':
      newHeight = Math.max(props.minHeight, startHeight.value + deltaY);
      break;
    case 'top':
      newHeight = Math.max(props.minHeight, startHeight.value - deltaY);
      newY = startNodeY.value + (startHeight.value - newHeight);
      break;
  }

  try {
    setNodes((nodes) =>
      nodes.map((n) => {
        if (n.id === props.nodeId) {
          return {
            ...n,
            width: newWidth,
            height: newHeight,
            position: newX !== startNodeX.value || newY !== startNodeY.value
              ? { x: newX, y: newY }
              : n.position,
          };
        }
        return n;
      }),
    );
  } catch (error) {
    console.error('Error updating node dimensions:', error);
  }
};

const stopResize = () => {
  if (isResizing.value) {
    isResizing.value = false;
    resizeDirection.value = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }
};

const getCursor = (direction: 'top' | 'right' | 'bottom' | 'left'): string => {
  switch (direction) {
    case 'top':
    case 'bottom':
      return 'ns-resize';
    case 'left':
    case 'right':
      return 'ew-resize';
    default:
      return 'default';
  }
};

onUnmounted(() => {
  stopResize();
});
</script>

<style scoped>
.custom-node-resizer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
  overflow: visible;
}

.resizer-border {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 2px dashed #3b82f6;
  border-radius: 8px;
  pointer-events: none;
}

.resizer-handle {
  position: absolute;
  background: transparent;
  pointer-events: all;
  cursor: default;
  z-index: 1001;
}

.resizer-handle-top {
  top: -4px;
  left: 0;
  width: 100%;
  height: 8px;
  cursor: ns-resize;
}

.resizer-handle-right {
  top: 0;
  right: -4px;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
}

.resizer-handle-bottom {
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 8px;
  cursor: ns-resize;
}

.resizer-handle-left {
  top: 0;
  left: -4px;
  width: 8px;
  height: 100%;
  cursor: ew-resize;
}

.resizer-handle:hover {
  background: rgba(59, 130, 246, 0.1);
}

.resizer-handle-top:hover,
.resizer-handle-bottom:hover {
  background: rgba(59, 130, 246, 0.2);
}

.resizer-handle-left:hover,
.resizer-handle-right:hover {
  background: rgba(59, 130, 246, 0.2);
}
</style>

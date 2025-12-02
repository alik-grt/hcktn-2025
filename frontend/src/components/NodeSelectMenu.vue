<template>
  <div v-if="visible" class="node-select-menu-overlay" @click.self="close">
    <div class="node-select-menu" :style="{ left: `${position.x}px`, top: `${position.y}px` }">
      <div class="menu-header">
        <h4>Select Node Type</h4>
        <button @click="close" class="close-btn">×</button>
      </div>
      <div class="menu-items">
        <div
          v-for="nodeType in nodeTypes"
          :key="nodeType.type"
          class="menu-item"
          @click="selectNode(nodeType.type)"
        >
          <div class="menu-item-icon" :class="nodeType.type">{{ nodeType.icon }}</div>
          <span>{{ nodeType.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

type NodeType = {
  type: string;
  label: string;
  icon: string;
};

type Props = {
  visible: boolean;
  position: { x: number; y: number };
  nodeTypes: NodeType[];
};

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [nodeType: string];
  close: [];
}>();

const selectNode = (nodeType: string) => {
  emit('select', nodeType);
  close();
};

const close = () => {
  emit('close');
};
</script>

<style scoped>
.node-select-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.3);
}

.node-select-menu {
  position: absolute;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  min-width: 200px;
  max-width: 300px;
  overflow: hidden;
}

.menu-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.menu-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  line-height: 1;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.menu-items {
  padding: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.menu-item:hover {
  background: #f5f5f5;
}

.menu-item-icon {
  font-size: 1.5rem;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

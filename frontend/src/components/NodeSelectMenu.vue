<template>
  <div v-if="visible" class="node-select-menu-overlay" @click.self="close">
    <div class="node-select-menu" :style="{ left: `${position.x}px`, top: `${position.y}px` }">
      <div class="menu-header">
        <h4>Select Node Type</h4>
        <button @click="close" class="close-btn">×</button>
      </div>
      <div class="menu-search">
        <div class="search-input-wrapper">
          <span class="material-symbols-outlined search-icon">search</span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search nodes..."
            class="search-input"
            @click.stop
          />
        </div>
      </div>
      <div class="menu-items">
        <div
          v-for="nodeType in filteredNodeTypes"
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
import { ref, computed, watch } from 'vue';

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

const searchQuery = ref('');

const filteredNodeTypes = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.nodeTypes;
  }
  const query = searchQuery.value.toLowerCase().trim();
  return props.nodeTypes.filter((nodeType) => {
    const label = nodeType.label.toLowerCase();
    return label.includes(query);
  });
});

watch(() => props.visible, (newValue) => {
  if (!newValue) {
    searchQuery.value = '';
  }
});

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

.menu-search {
  padding: 0.5rem 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  font-size: 1.25rem;
  color: #999;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  outline: none;
}

.search-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.menu-items {
  padding: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
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

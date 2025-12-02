<template>
  <div class="execution-list">
    <div class="execution-list-header">
      <h3>Executions</h3>
      <button
        v-if="executions.length > 0 && !loading"
        class="clear-button"
        @click="handleClear"
        :disabled="clearing"
      >
        {{ clearing ? 'Clearing...' : 'Clear' }}
      </button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="executions.length === 0" class="empty">No executions yet</div>
    <div v-else class="executions">
      <div
        v-for="execution in executions"
        :key="execution.id"
        class="execution-item"
        :class="{ active: selectedExecutionId === execution.id }"
        @click="selectExecution(execution.id)"
      >
        <div class="execution-header">
          <span class="execution-status" :class="getStatusClass(execution.status)">
            {{ execution.status }}
          </span>
          <span class="execution-date">{{ formatDate(execution.createdAt) }}</span>
        </div>
        <div class="execution-id">ID: {{ execution.id.slice(0, 8) }}...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed, nextTick } from 'vue';
import { workflowsApi } from '../api/workflows';
import { useWorkflowSocket } from '../composables/useWorkflowSocket';

type Execution = {
  id: string;
  workflowId: string;
  status: string;
  output?: any;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
};

type Props = {
  workflowId: string | null;
};

const props = defineProps<Props>();

const emit = defineEmits<{
  select: [executionId: string];
}>();

const { executions: socketExecutions, connect, disconnect } = useWorkflowSocket(
  computed(() => props.workflowId),
);

const executions = computed(() => {
  if (!socketExecutions.value || socketExecutions.value.length === 0) {
    return [];
  }
  return socketExecutions.value
    .filter((exec) => exec && exec.id)
    .map((exec) => ({
      id: exec.id,
      workflowId: exec.workflowId,
      status: exec.status,
      output: exec.output,
      createdAt: exec.startedAt || exec.createdAt,
      finishedAt: exec.finishedAt,
    }));
});

const loading = ref(false);
const clearing = ref(false);
const selectedExecutionId = ref<string | null>(null);

const loadExecutions = async () => {
  if (!props.workflowId) {
    return;
  }

  loading.value = true;
  try {
    const data = await workflowsApi.getExecutions(props.workflowId);
    if (data && Array.isArray(data) && data.length > 0) {
      const sortedData = [...data].sort((a, b) => {
        const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      socketExecutions.value = sortedData;
    } else {
      socketExecutions.value = [];
    }
  } catch (error) {
    console.error('Failed to load executions:', error);
    socketExecutions.value = [];
  } finally {
    loading.value = false;
  }
};

const selectExecution = (executionId: string) => {
  selectedExecutionId.value = executionId;
  emit('select', executionId);
};

const getStatusClass = (status: string) => {
  return `status-${status.toLowerCase()}`;
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return '';
  }
  const date = new Date(dateString);
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const handleClear = async () => {
  if (!props.workflowId || clearing.value) {
    return;
  }

  if (!confirm('Are you sure you want to clear all executions?')) {
    return;
  }

  clearing.value = true;
  try {
    await workflowsApi.clearExecutions(props.workflowId);
    socketExecutions.value = [];
    selectedExecutionId.value = null;
    emit('select', '');
  } catch (error) {
    console.error('Failed to clear executions:', error);
    alert('Failed to clear executions. Please try again.');
  } finally {
    clearing.value = false;
  }
};

watch(
  () => props.workflowId,
  (newWorkflowId, oldWorkflowId) => {
    if (newWorkflowId && newWorkflowId !== oldWorkflowId) {
      socketExecutions.value = [];
      loadExecutions();
      nextTick(() => {
        connect();
      });
    } else if (!newWorkflowId) {
      disconnect();
      socketExecutions.value = [];
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.workflowId) {
    loadExecutions();
  }
});

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped>
.execution-list {
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e0e0e0;
}

.execution-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.execution-list-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.clear-button {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #dc3545;
  background: white;
  border: 1px solid #dc3545;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-button:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.clear-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading,
.empty {
  padding: 1rem;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.executions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 400px;
  overflow-y: auto;
}

.execution-item {
  padding: 0.75rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.execution-item:hover {
  background: #f5f5f5;
  border-color: #007bff;
}

.execution-item.active {
  background: #e7f3ff;
  border-color: #007bff;
}

.execution-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.execution-status {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
  text-transform: uppercase;
}

.execution-status.status-running {
  background: #fff3cd;
  color: #856404;
}

.execution-status.status-completed {
  background: #d4edda;
  color: #155724;
}

.execution-status.status-failed {
  background: #f8d7da;
  color: #721c24;
}

.execution-date {
  font-size: 0.75rem;
  color: #666;
}

.execution-id {
  font-size: 0.7rem;
  color: #999;
  font-family: monospace;
}
</style>


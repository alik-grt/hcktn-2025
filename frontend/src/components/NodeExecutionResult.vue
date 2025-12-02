<template>
  <div class="node-execution-result">
    <div class="result-header">
      <h4>Execution Result</h4>
      <button @click="loadResult" class="btn-refresh" :disabled="loading">
        {{ loading ? 'Loading...' : '↻' }}
      </button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="!executionNode" class="no-result">No execution data available</div>
    <div v-else class="result-content">
      <div class="result-status" :class="`status-${executionNode.status}`">
        <span class="status-badge">{{ executionNode.status }}</span>
        <span v-if="executionNode.duration" class="duration"> {{ executionNode.duration }}ms </span>
      </div>
      <div v-if="executionNode.error" class="error-section">
        <h5>Error:</h5>
        <pre>{{ executionNode.error }}</pre>
      </div>
      <div v-if="executionNode.input" class="input-section">
        <h5>Input:</h5>
        <pre>{{ JSON.stringify(executionNode.input, null, 2) }}</pre>
      </div>
      <div v-if="executionNode.output" class="output-section">
        <h5>Output:</h5>
        <div v-if="nodeType === 'http'" class="http-output">
          <div v-if="executionNode.output.status" class="http-status">
            Status:
            <span :class="getStatusClass(executionNode.output.status)">
              {{ executionNode.output.status }}
            </span>
          </div>
          <div v-if="executionNode.output.headers" class="http-headers">
            <h6>Headers:</h6>
            <pre>{{ JSON.stringify(executionNode.output.headers, null, 2) }}</pre>
          </div>
          <div v-if="executionNode.output.body" class="http-body">
            <h6>Body:</h6>
            <pre>{{ JSON.stringify(executionNode.output.body, null, 2) }}</pre>
          </div>
        </div>
        <div v-else>
          <pre>{{ JSON.stringify(executionNode.output, null, 2) }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { workflowsApi } from '../api/workflows';

const props = defineProps<{
  nodeId: string;
  nodeType: string;
  workflowId: string;
  executionId?: string | null;
}>();

const executionNode = ref<any>(null);
const loading = ref(false);
const latestExecution = ref<any>(null);

const loadResult = async () => {
  if (!props.workflowId || !props.nodeId) {
    return;
  }
  loading.value = true;
  try {
    const executionId = props.executionId;
    if (executionId) {
      executionNode.value = await workflowsApi.getExecutionNode(executionId, props.nodeId);
    } else {
      latestExecution.value = await workflowsApi.getLatestExecution(props.workflowId);
      if (latestExecution.value?.id) {
        executionNode.value = await workflowsApi.getExecutionNode(
          latestExecution.value.id,
          props.nodeId,
        );
      } else {
        executionNode.value = null;
      }
    }
  } catch (error) {
    console.error('Failed to load execution result:', error);
    executionNode.value = null;
  } finally {
    loading.value = false;
  }
};

const getStatusClass = (status: number) => {
  if (status >= 200 && status < 300) {
    return 'status-success';
  }
  if (status >= 400 && status < 500) {
    return 'status-client-error';
  }
  if (status >= 500) {
    return 'status-server-error';
  }
  return '';
};

watch(
  () => [props.nodeId, props.workflowId, props.executionId],
  () => {
    loadResult();
  },
);

onMounted(() => {
  loadResult();
});
</script>

<style scoped>
.node-execution-result {
  margin-top: 1rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 0.5rem;
  border: 1px solid #e0e0e0;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.result-header h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.btn-refresh {
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 0.25rem 0.5rem;
  cursor: pointer;
  font-size: 1rem;
}

.btn-refresh:hover:not(:disabled) {
  background: #0056b3;
}

.btn-refresh:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading,
.no-result {
  text-align: center;
  padding: 1rem;
  color: #666;
}

.result-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.result-status {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
  font-size: 0.85rem;
}

.status-idle .status-badge {
  background: #e0e0e0;
  color: #666;
}

.status-progress .status-badge {
  background: #007bff;
  color: white;
}

.status-passed .status-badge {
  background: #28a745;
  color: white;
}

.status-error .status-badge {
  background: #dc3545;
  color: white;
}

.duration {
  font-size: 0.85rem;
  color: #666;
}

.error-section,
.input-section,
.output-section {
  background: white;
  padding: 0.75rem;
  border-radius: 0.25rem;
  border: 1px solid #e0e0e0;
}

.error-section h5,
.input-section h5,
.output-section h5 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #333;
}

.error-section {
  border-color: #dc3545;
}

.error-section h5 {
  color: #dc3545;
}

pre {
  margin: 0;
  padding: 0.5rem;
  background: #f5f5f5;
  border-radius: 0.25rem;
  font-size: 0.85rem;
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
}

.http-output {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.http-status {
  font-weight: 500;
}

.status-success {
  color: #28a745;
  font-weight: 600;
}

.status-client-error {
  color: #ffc107;
  font-weight: 600;
}

.status-server-error {
  color: #dc3545;
  font-weight: 600;
}

.http-headers h6,
.http-body h6 {
  margin: 0 0 0.25rem 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #666;
}
</style>

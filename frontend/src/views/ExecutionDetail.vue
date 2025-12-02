<template>
  <AppLayout>
    <div class="flex h-screen w-full overflow-hidden">
      <!-- Executions List Pane -->
      <div
        class="col-span-12 xl:col-span-5 border-r border-border-light dark:border-border-dark bg-foreground-light dark:bg-foreground-dark flex flex-col h-screen w-full xl:w-5/12"
      >
        <!-- Header Bar -->
        <div
          class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-border-light dark:border-border-dark shrink-0"
        >
          <p class="text-3xl font-black leading-tight tracking-[-0.033em] min-w-72">Executions</p>
          <button
            class="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-muted-light dark:bg-muted-dark text-text-light-primary dark:text-text-dark-primary text-sm font-bold leading-normal tracking-[0.015em] hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            @click="loadExecutions"
            :disabled="loading"
          >
            <span class="material-symbols-outlined mr-2 text-base">refresh</span>
            <span class="truncate">Refresh List</span>
          </button>
        </div>
        <!-- Search and Filter Bar -->
        <div class="p-4 border-b border-border-light dark:border-border-dark shrink-0">
          <label class="flex flex-col min-w-40 h-12 w-full">
            <div class="flex w-full flex-1 items-stretch rounded-lg h-full">
              <div
                class="text-text-light-secondary dark:text-text-dark-secondary flex border-none bg-muted-light dark:bg-muted-dark items-center justify-center pl-4 rounded-l-lg border-r-0"
              >
                <span class="material-symbols-outlined" style="font-size: 24px">search</span>
              </div>
              <input
                v-model="searchQuery"
                class="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-text-light-primary dark:text-text-dark-primary focus:outline-0 focus:ring-0 border-none bg-muted-light dark:bg-muted-dark h-full placeholder:text-text-light-secondary placeholder:dark:text-text-dark-secondary px-4 text-base font-normal leading-normal"
                placeholder="Search by workflow name..."
              />
            </div>
          </label>
          <div class="flex gap-3 pt-3 overflow-x-auto">
            <button
              class="flex h-8 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-muted-light dark:bg-muted-dark px-3 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              @click="toggleStatusFilter"
            >
              <span class="material-symbols-outlined" style="font-size: 20px">filter_list</span>
              <p class="text-sm font-medium leading-normal">
                Status: {{ statusFilter === 'all' ? 'All' : formatStatus(statusFilter) }}
              </p>
              <span class="material-symbols-outlined" style="font-size: 20px">arrow_drop_down</span>
            </button>
          </div>
        </div>
        <!-- Executions List Table -->
        <div class="overflow-y-auto flex-1">
          <div v-if="loading" class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary">
            Loading...
          </div>
          <div
            v-else-if="filteredExecutions.length === 0"
            class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
          >
            No executions found
          </div>
          <table v-else class="w-full text-left">
            <thead class="sticky top-0 bg-foreground-light dark:bg-foreground-dark z-10">
              <tr class="border-b border-border-light dark:border-border-dark">
                <th class="px-4 py-3 text-sm font-medium leading-normal w-1/2">Workflow Name</th>
                <th class="px-4 py-3 text-sm font-medium leading-normal">Status</th>
                <th class="px-4 py-3 text-sm font-medium leading-normal">Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="execution in filteredExecutions"
                :key="execution.id"
                :class="[
                  'border-b border-border-light dark:border-border-dark cursor-pointer transition-colors',
                  executionId === execution.id
                    ? 'bg-primary/10 dark:bg-primary/20'
                    : 'hover:bg-muted-light dark:hover:bg-muted-dark',
                ]"
                @click="selectExecution(execution.id)"
              >
                <td class="px-4 py-3">
                  <p
                    class="font-medium text-sm text-text-light-primary dark:text-text-dark-primary"
                  >
                    {{ execution.workflow?.name || 'Unknown Workflow' }}
                  </p>
                  <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    {{ formatDate(execution.startedAt || execution.createdAt) }}
                  </p>
                </td>
                <td class="px-4 py-3">
                  <span
                    :class="[
                      'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                      getStatusBadgeClass(execution.status),
                    ]"
                  >
                    <span
                      :class="[
                        'size-1.5 rounded-full',
                        execution.status === 'completed'
                          ? 'bg-success'
                          : execution.status === 'failed'
                            ? 'bg-danger'
                            : execution.status === 'running'
                              ? 'bg-info animate-pulse'
                              : 'bg-gray-400',
                      ]"
                    ></span>
                    {{ formatStatus(execution.status) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm text-text-light-secondary dark:text-text-dark-secondary">
                  {{ formatDuration(execution.startedAt, execution.finishedAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <!-- Execution Detail Pane -->
      <div
        class="col-span-12 xl:col-span-7 flex flex-col h-screen overflow-y-auto w-full xl:w-7/12"
      >
        <div v-if="!selectedExecution" class="flex items-center justify-center h-full">
          <p class="text-text-light-secondary dark:text-text-dark-secondary">
            Select an execution to view details
          </p>
        </div>
        <template v-else>
          <!-- Summary Header -->
          <div class="p-4 border-b border-border-light dark:border-border-dark shrink-0">
            <h2 class="text-xl font-bold">
              Execution Details for: {{ selectedExecution.workflow?.name || 'Unknown Workflow' }}
            </h2>
            <div
              class="flex items-center gap-6 mt-2 text-sm text-text-light-secondary dark:text-text-dark-secondary"
            >
              <span
                :class="[
                  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
                  getStatusBadgeClass(selectedExecution.status),
                ]"
              >
                <span
                  :class="[
                    'size-2 rounded-full',
                    selectedExecution.status === 'completed'
                      ? 'bg-success'
                      : selectedExecution.status === 'failed'
                        ? 'bg-danger'
                        : selectedExecution.status === 'running'
                          ? 'bg-info animate-pulse'
                          : 'bg-gray-400',
                  ]"
                ></span>
                {{ formatStatus(selectedExecution.status) }}
              </span>
              <span
                ><strong>Started:</strong> {{ formatDate(selectedExecution.startedAt || selectedExecution.createdAt) }}</span
              >
              <span
                ><strong>Duration:</strong>
                {{ formatDuration(selectedExecution.startedAt, selectedExecution.finishedAt) }}</span
              >
            </div>
          </div>
          <!-- Step Timeline/Log Viewer -->
          <div class="flex-grow p-6 space-y-4">
            <div
              v-for="(executionNode, index) in executionNodes"
              :key="executionNode.id"
              class="rounded-lg border border-border-light dark:border-border-dark bg-foreground-light dark:bg-foreground-dark shadow-sm"
            >
              <div
                v-if="!expandedNodes[executionNode.id]"
                class="flex items-center p-4 cursor-pointer"
                @click="toggleNodeExpansion(executionNode.id)"
              >
                <span
                  :class="[
                    'material-symbols-outlined mr-3',
                    executionNode.status === 'passed'
                      ? 'text-success'
                      : executionNode.status === 'error'
                        ? 'text-danger'
                        : 'text-info',
                  ]"
                >
                  {{
                    executionNode.status === 'passed'
                      ? 'check_circle'
                      : executionNode.status === 'error'
                        ? 'error'
                        : 'schedule'
                  }}
                </span>
                <div class="flex-1">
                  <p class="font-medium">
                    Step {{ index + 1 }}: {{ getNodeName(executionNode) }}
                  </p>
                  <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                    Duration: {{ formatNodeDuration(executionNode.duration) }}
                  </p>
                </div>
                <span class="material-symbols-outlined">expand_more</span>
              </div>
              <div v-else class="p-4">
                <div class="flex items-center cursor-pointer" @click="toggleNodeExpansion(executionNode.id)">
                  <span
                    :class="[
                      'material-symbols-outlined mr-3',
                      executionNode.status === 'passed'
                        ? 'text-success'
                        : executionNode.status === 'error'
                          ? 'text-danger'
                          : 'text-info',
                    ]"
                  >
                    {{
                      executionNode.status === 'passed'
                        ? 'check_circle'
                        : executionNode.status === 'error'
                          ? 'error'
                          : 'schedule'
                    }}
                  </span>
                  <div class="flex-1">
                    <p class="font-medium">
                      Step {{ index + 1 }}: {{ getNodeName(executionNode) }}
                    </p>
                    <p class="text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      Duration: {{ formatNodeDuration(executionNode.duration) }}
                    </p>
                  </div>
                  <span class="material-symbols-outlined">expand_less</span>
                </div>
                <div class="mt-4 border-t border-border-light dark:border-border-dark pt-4">
                  <div class="flex border-b border-border-light dark:border-border-dark text-sm">
                    <button
                      :class="[
                        'px-4 py-2 transition-colors',
                        activeTab[executionNode.id] === 'input'
                          ? 'text-primary border-b-2 border-primary font-medium'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary',
                      ]"
                      @click="setActiveTab(executionNode.id, 'input')"
                    >
                      Input
                    </button>
                    <button
                      :class="[
                        'px-4 py-2 transition-colors',
                        activeTab[executionNode.id] === 'output'
                          ? 'text-primary border-b-2 border-primary font-medium'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary',
                      ]"
                      @click="setActiveTab(executionNode.id, 'output')"
                    >
                      Output
                    </button>
                    <button
                      :class="[
                        'px-4 py-2 transition-colors',
                        activeTab[executionNode.id] === 'logs'
                          ? 'text-primary border-b-2 border-primary font-medium'
                          : 'text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary',
                      ]"
                      @click="setActiveTab(executionNode.id, 'logs')"
                    >
                      Logs
                    </button>
                  </div>
                  <pre
                    class="text-xs p-4 bg-muted-light dark:bg-muted-dark rounded-b-lg overflow-x-auto"
                  ><code class="language-json">{{
                    activeTab[executionNode.id] === 'input'
                      ? JSON.stringify(executionNode.input || {}, null, 2)
                      : activeTab[executionNode.id] === 'output'
                        ? JSON.stringify(executionNode.output || {}, null, 2)
                        : executionNode.error || 'No logs available'
                  }}</code></pre>
                </div>
              </div>
            </div>
            <div
              v-if="executionNodes.length === 0"
              class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
            >
              No execution nodes found
            </div>
          </div>
        </template>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import { executionsApi, type Execution, type ExecutionNode } from '../api/executions';
import { workflowsApi, type Node } from '../api/workflows';

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const executions = ref<Execution[]>([]);
const executionId = ref<string | null>(route.params.id as string);
const selectedExecution = ref<Execution | null>(null);
const executionNodes = ref<ExecutionNode[]>([]);
const workflowNodes = ref<Node[]>([]);
const searchQuery = ref('');
const statusFilter = ref<'all' | 'running' | 'completed' | 'failed' | 'stopped'>('all');
const expandedNodes = ref<Record<string, boolean>>({});
const activeTab = ref<Record<string, 'input' | 'output' | 'logs'>>({});

const filteredExecutions = computed(() => {
  let filtered = executions.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (exec: Execution) => exec.workflow?.name?.toLowerCase().includes(query),
    );
  }

  if (statusFilter.value !== 'all') {
    filtered = filtered.filter((exec: Execution) => exec.status === statusFilter.value);
  }

  return filtered;
});

const loadExecutions = async () => {
  loading.value = true;
  try {
    executions.value = await executionsApi.getAll();
    if (executionId.value) {
      await selectExecution(executionId.value);
    }
  } catch (error) {
    console.error('Failed to load executions:', error);
  } finally {
    loading.value = false;
  }
};

const selectExecution = async (id: string) => {
  executionId.value = id;
  router.push(`/executions/${id}`);
  try {
    const execution = await executionsApi.getById(id);
    selectedExecution.value = execution;
    if (execution.executionNodes) {
      executionNodes.value = execution.executionNodes;
    } else {
      executionNodes.value = await executionsApi.getExecutionNodes(id);
    }
    if (execution.workflowId) {
      workflowNodes.value = await workflowsApi.getNodes(execution.workflowId);
    }
    expandedNodes.value = {};
    activeTab.value = {};
  } catch (error) {
    console.error('Failed to load execution details:', error);
  }
};

const toggleStatusFilter = () => {
  const statuses: Array<'all' | 'running' | 'completed' | 'failed' | 'stopped'> = [
    'all',
    'running',
    'completed',
    'failed',
    'stopped',
  ];
  const currentIndex = statuses.indexOf(statusFilter.value);
  statusFilter.value = statuses[(currentIndex + 1) % statuses.length];
};

const toggleNodeExpansion = (nodeId: string) => {
  expandedNodes.value[nodeId] = !expandedNodes.value[nodeId];
  if (!activeTab.value[nodeId]) {
    activeTab.value[nodeId] = 'input';
  }
};

const setActiveTab = (nodeId: string, tab: 'input' | 'output' | 'logs') => {
  activeTab.value[nodeId] = tab;
};

const formatStatus = (status: string) => {
  const statusMap: Record<string, string> = {
    completed: 'Success',
    failed: 'Failed',
    running: 'Running',
    stopped: 'Stopped',
  };
  return statusMap[status] || status;
};

const getStatusBadgeClass = (status: string) => {
  if (status === 'completed') {
    return 'bg-success/10 text-success';
  }
  if (status === 'failed') {
    return 'bg-danger/10 text-danger';
  }
  if (status === 'running') {
    return 'bg-info/10 text-info';
  }
  return 'bg-gray-100 dark:bg-gray-700 text-text-light-secondary dark:text-text-dark-secondary';
};

const formatDate = (dateString?: string) => {
  if (!dateString) {
    return 'Unknown';
  }
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'Just now';
  }
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  }
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) {
    return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (startedAt?: string, finishedAt?: string) => {
  if (!startedAt) {
    return 'N/A';
  }
  const start = new Date(startedAt).getTime();
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now();
  const durationMs = end - start;
  const durationSec = Math.floor(durationMs / 1000);
  const durationMin = Math.floor(durationSec / 60);
  const durationHour = Math.floor(durationMin / 60);

  if (durationHour > 0) {
    return `${durationHour}h ${durationMin % 60}m`;
  }
  if (durationMin > 0) {
    return `${durationMin}m ${durationSec % 60}s`;
  }
  return `${durationSec}s`;
};

const formatNodeDuration = (duration?: number) => {
  if (!duration) {
    return 'N/A';
  }
  const durationSec = Math.floor(duration / 1000);
  const durationMin = Math.floor(durationSec / 60);
  if (durationMin > 0) {
    return `${durationMin}m ${durationSec % 60}s`;
  }
  if (durationSec > 0) {
    return `${durationSec}s`;
  }
  return `${duration}ms`;
};

const getNodeName = (executionNode: ExecutionNode) => {
  const workflowNode = workflowNodes.value.find((n) => n.id === executionNode.nodeId);
  if (workflowNode) {
    if (workflowNode.name) {
      return workflowNode.name;
    }
    const typeName = workflowNode.type.charAt(0).toUpperCase() + workflowNode.type.slice(1);
    if (workflowNode.subtype) {
      const subtypeName =
        workflowNode.subtype.charAt(0).toUpperCase() + workflowNode.subtype.slice(1);
      return `${typeName} - ${subtypeName}`;
    }
    return typeName;
  }
  return `Node ${executionNode.nodeId.slice(0, 8)}`;
};

watch(
  () => route.params.id,
  async (newId) => {
    if (newId && typeof newId === 'string') {
      executionId.value = newId;
      await selectExecution(newId);
    }
  },
);

onMounted(() => {
  loadExecutions();
});
</script>

<style scoped></style>


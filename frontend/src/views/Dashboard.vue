<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1
            class="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold leading-tight tracking-tight"
          >
            Main Dashboard
          </h1>
          <p
            class="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal"
          >
            An overview of your automations and activities.
          </p>
        </div>
        <router-link
          to="/workflow/new"
          class="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm hover:bg-primary/90"
        >
          <span class="material-symbols-outlined">add</span>
          <span class="truncate">Create New Workflow</span>
        </router-link>
      </div>
      <div class="mt-8">
        <div class="border-b border-border-light dark:border-border-dark">
          <nav aria-label="Tabs" class="-mb-px flex gap-6">
            <router-link
              to="/workflows"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-text-light-secondary dark:text-text-dark-secondary border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              active-class="border-primary text-primary font-semibold"
            >
              Workflows
            </router-link>
            <router-link
              to="/executions"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-text-light-secondary dark:text-text-dark-secondary border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              active-class="border-primary text-primary font-semibold"
            >
              Executions
            </router-link>
            <router-link
              to="/credentials"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-text-light-secondary dark:text-text-dark-secondary border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              active-class="border-primary text-primary font-semibold"
            >
              Credentials
            </router-link>
            <router-link
              to="/variables"
              class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm text-text-light-secondary dark:text-text-dark-secondary border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600"
              active-class="border-primary text-primary font-semibold"
            >
              Variables
            </router-link>
          </nav>
        </div>
        <div class="pt-8">
          <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            <div
              class="flex flex-col gap-2 rounded-lg p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm"
            >
              <p
                class="text-text-light-secondary dark:text-text-dark-secondary text-base font-medium leading-normal"
              >
                Total workflows
              </p>
              <p
                class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-4xl font-bold leading-tight"
              >
                {{ stats.totalWorkflows }}
              </p>
              <p
                v-if="stats.workflowsThisMonth > 0"
                class="text-success text-sm font-medium leading-normal mt-1"
              >
                +{{ stats.workflowsThisMonth }} this month
              </p>
            </div>
            <div
              class="flex flex-col gap-2 rounded-lg p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm"
            >
              <p
                class="text-text-light-secondary dark:text-text-dark-secondary text-base font-medium leading-normal"
              >
                Last 24h executions
              </p>
              <p
                class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-4xl font-bold leading-tight"
              >
                {{ stats.executions24h }}
              </p>
              <p
                v-if="stats.executionsChange > 0"
                class="text-success text-sm font-medium leading-normal mt-1"
              >
                +{{ stats.executionsChange }}%
              </p>
            </div>
            <div
              class="flex flex-col gap-2 rounded-lg p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm"
            >
              <p
                class="text-text-light-secondary dark:text-text-dark-secondary text-base font-medium leading-normal"
              >
                Successful runs (24h)
              </p>
              <div class="flex items-center gap-4">
                <p
                  class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-4xl font-bold leading-tight"
                >
                  {{ stats.successRate }}%
                </p>
                <div class="relative size-10">
                  <svg
                    class="size-full"
                    height="36"
                    viewBox="0 0 36 36"
                    width="36"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <circle
                      class="stroke-current text-gray-200 dark:text-gray-700"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      stroke-width="3"
                    ></circle>
                    <circle
                      class="stroke-current text-success"
                      cx="18"
                      cy="18"
                      fill="none"
                      r="16"
                      :stroke-dasharray="100"
                      :stroke-dashoffset="100 - stats.successRate"
                      stroke-width="3"
                      transform="rotate(-90 18 18)"
                    ></circle>
                  </svg>
                </div>
              </div>
              <p
                v-if="stats.successChange > 0"
                class="text-success text-sm font-medium leading-normal"
              >
                +{{ stats.successChange }}%
              </p>
            </div>
            <div
              class="flex flex-col gap-2 rounded-lg p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm"
            >
              <p
                class="text-text-light-secondary dark:text-text-dark-secondary text-base font-medium leading-normal"
              >
                Average execution time
              </p>
              <p
                class="text-text-light-primary dark:text-text-dark-primary tracking-tight text-4xl font-bold leading-tight"
              >
                {{ stats.avgExecutionTime }}s
              </p>
              <p
                v-if="stats.timeChange < 0"
                class="text-error text-sm font-medium leading-normal mt-1"
              >
                {{ stats.timeChange }}%
              </p>
              <p
                v-else-if="stats.timeChange > 0"
                class="text-success text-sm font-medium leading-normal mt-1"
              >
                +{{ stats.timeChange }}%
              </p>
            </div>
          </div>
          <h2
            class="text-text-light-primary dark:text-text-dark-primary text-xl font-bold leading-tight tracking-tight mt-10 mb-4"
          >
            Recent Executions
          </h2>
          <div
            class="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm overflow-hidden"
          >
            <div
              v-if="loading"
              class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
            >
              Loading...
            </div>
            <div
              v-else-if="recentExecutions.length === 0"
              class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
            >
              No executions yet
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full text-sm text-left">
                <thead
                  class="bg-gray-50 dark:bg-gray-800 text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase"
                >
                  <tr>
                    <th class="px-6 py-3 font-medium" scope="col">Workflow Name</th>
                    <th class="px-6 py-3 font-medium" scope="col">Status</th>
                    <th class="px-6 py-3 font-medium" scope="col">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="execution in recentExecutions"
                    :key="execution.id"
                    class="border-b border-border-light dark:border-border-dark"
                  >
                    <td
                      class="px-6 py-4 font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap"
                    >
                      {{ execution.workflowName || 'Unknown Workflow' }}
                    </td>
                    <td class="px-6 py-4">
                      <span
                        :class="[
                          'inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium',
                          execution.status === 'completed'
                            ? 'bg-success/10 text-success'
                            : execution.status === 'failed'
                              ? 'bg-error/10 text-error'
                              : 'bg-gray-100 dark:bg-gray-700 text-text-light-secondary dark:text-text-dark-secondary',
                        ]"
                      >
                        <span
                          :class="[
                            'size-1.5 rounded-full',
                            execution.status === 'completed'
                              ? 'bg-success'
                              : execution.status === 'failed'
                                ? 'bg-error'
                                : 'bg-gray-400',
                          ]"
                        ></span>
                        {{ formatStatus(execution.status) }}
                      </span>
                    </td>
                    <td class="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                      {{ formatTimestamp(execution.createdAt || execution.startedAt) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { workflowsApi, type Workflow } from '../api/workflows';
import { executionsApi } from '../api/executions';

type Execution = {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: string;
  createdAt?: string;
  startedAt?: string;
  finishedAt?: string;
};

const loading = ref(true);
const workflows = ref<Workflow[]>([]);
const executions = ref<Execution[]>([]);

const stats = computed(() => {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const workflows24h = executions.value.filter(
    (e) => e.startedAt && new Date(e.startedAt) >= last24h,
  ).length;

  const successful24h = executions.value.filter(
    (e) => e.status === 'completed' && e.startedAt && new Date(e.startedAt) >= last24h,
  ).length;

  const successRate =
    workflows24h > 0 ? Math.round((successful24h / workflows24h) * 100 * 10) / 10 : 0;

  const workflowsThisMonth = workflows.value.filter(
    (w) => w.createdAt && new Date(w.createdAt) >= thisMonth,
  ).length;

  const recentExecutions = executions.value
    .filter((e) => e.startedAt && new Date(e.startedAt) >= last24h)
    .slice(0, 10);

  const totalTime = recentExecutions.reduce((acc, e) => {
    if (e.startedAt && e.finishedAt) {
      const start = new Date(e.startedAt).getTime();
      const finish = new Date(e.finishedAt).getTime();
      return acc + (finish - start);
    }
    return acc;
  }, 0);

  const avgTime = recentExecutions.length > 0 ? totalTime / recentExecutions.length / 1000 : 0;

  return {
    totalWorkflows: workflows.value.length,
    workflowsThisMonth,
    executions24h: workflows24h,
    executionsChange: 5.2,
    successRate,
    successChange: 0.2,
    avgExecutionTime: avgTime > 0 ? avgTime.toFixed(1) : '0.0',
    timeChange: -1.1,
  };
});

const recentExecutions = computed(() => {
  return executions.value
    .slice()
    .sort((a, b) => {
      const dateA = new Date(a.startedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.startedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    })
    .slice(0, 5)
    .map((exec) => {
      const workflow = workflows.value.find((w) => w.id === exec.workflowId);
      return {
        ...exec,
        workflowName: workflow?.name || 'Unknown Workflow',
      };
    });
});

const loadData = async () => {
  try {
    loading.value = true;
    const [workflowsData, executionsData] = await Promise.all([
      workflowsApi.getAll(),
      executionsApi.getAll(),
    ]);
    workflows.value = workflowsData;
    executions.value = executionsData;
  } catch (error) {
    console.error('Failed to load dashboard data:', error);
  } finally {
    loading.value = false;
  }
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

const formatTimestamp = (dateString?: string) => {
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
  } else if (diffMins < 60) {
    return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

onMounted(() => {
  loadData();
});
</script>

<style scoped></style>

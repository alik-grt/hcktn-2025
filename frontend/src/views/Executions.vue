<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1
            class="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold leading-tight tracking-tight"
          >
            Executions
          </h1>
          <p
            class="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal"
          >
            A log of all your workflow runs.
          </p>
        </div>
      </div>
      <div class="mt-8">
        <div
          v-if="loading"
          class="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
        >
          Loading...
        </div>
        <div
          v-else-if="executions.length === 0"
          class="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
        >
          No executions found
        </div>
        <div
          v-else
          class="rounded-lg border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-sm overflow-hidden"
        >
          <div class="overflow-x-auto">
            <table class="w-full text-sm text-left">
              <thead
                class="bg-gray-50 dark:bg-gray-800 text-xs text-text-light-secondary dark:text-text-dark-secondary uppercase"
              >
                <tr>
                  <th class="px-6 py-3 font-medium" scope="col">Workflow Name</th>
                  <th class="px-6 py-3 font-medium" scope="col">Runtime</th>
                  <th class="px-6 py-3 font-medium" scope="col">Status</th>
                  <th class="px-6 py-3 font-medium" scope="col">Start Time</th>
                  <th class="px-6 py-3 font-medium" scope="col">Duration</th>
                  <th class="px-6 py-3 font-medium" scope="col">
                    <span class="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="execution in executions"
                  :key="execution.id"
                  class="border-b border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td
                    class="px-6 py-4 font-medium text-text-light-primary dark:text-text-dark-primary whitespace-nowrap"
                  >
                    {{ execution.workflow?.name || 'Unknown Workflow' }}
                  </td>
                  <td class="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                    Cloud
                  </td>
                  <td class="px-6 py-4">
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
                              ? 'bg-error'
                              : execution.status === 'running'
                                ? 'bg-warning animate-pulse'
                                : 'bg-gray-400',
                        ]"
                      ></span>
                      {{ formatStatus(execution.status) }}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                    {{ formatStartTime(execution.startedAt || execution.createdAt) }}
                  </td>
                  <td class="px-6 py-4 text-text-light-secondary dark:text-text-dark-secondary">
                    {{ formatDuration(execution.startedAt, execution.finishedAt) }}
                  </td>
                  <td class="px-6 py-4 text-right">
                    <router-link
                      :to="`/executions/${execution.id}`"
                      class="font-medium text-primary hover:underline"
                    >
                      View
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { executionsApi, type Execution } from '../api/executions';

const loading = ref(false);
const executions = ref<Execution[]>([]);

const loadExecutions = async () => {
  loading.value = true;
  try {
    executions.value = await executionsApi.getAll();
  } catch (error) {
    console.error('Failed to load executions:', error);
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

const getStatusBadgeClass = (status: string) => {
  if (status === 'completed') {
    return 'bg-success/10 text-success';
  }
  if (status === 'failed') {
    return 'bg-error/10 text-error';
  }
  if (status === 'running') {
    return 'bg-warning/10 text-warning';
  }
  return 'bg-gray-100 dark:bg-gray-700 text-text-light-secondary dark:text-text-dark-secondary';
};

const formatStartTime = (dateString?: string) => {
  if (!dateString) {
    return 'Unknown';
  }
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
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
  if (durationSec > 0) {
    return `${durationSec}s`;
  }
  return `${durationMs}ms`;
};

onMounted(() => {
  loadExecutions();
});
</script>

<style scoped></style>

<template>
  <AppLayout>
    <div class="mx-auto max-w-7xl">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-col gap-1">
          <h1
            class="text-text-light-primary dark:text-text-dark-primary text-3xl font-bold leading-tight tracking-tight"
          >
            Workflows
          </h1>
          <p
            class="text-text-light-secondary dark:text-text-dark-secondary text-base font-normal leading-normal"
          >
            Manage your automation workflows.
          </p>
        </div>
        <button
          @click="createWorkflow"
          class="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm hover:bg-primary/90"
        >
          <span class="material-symbols-outlined">add</span>
          <span class="truncate">Create New Workflow</span>
        </button>
      </div>
      <div class="mt-8">
        <div
          v-if="loading"
          class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
        >
          Loading...
        </div>
        <div
          v-else-if="workflows.length === 0"
          class="p-8 text-center text-text-light-secondary dark:text-text-dark-secondary"
        >
          No workflows found
        </div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <div
            v-for="workflow in workflows"
            :key="workflow.id"
            class="rounded-lg p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-sm cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5"
            @click="openWorkflow(workflow.id)"
          >
            <div class="flex justify-between items-start mb-2">
              <h3 class="text-text-light-primary dark:text-text-dark-primary font-semibold text-lg">
                {{ workflow.name }}
              </h3>
              <button
                class="p-1.5 rounded hover:bg-error/10 text-error transition-colors"
                @click.stop="handleDelete(workflow.id, workflow.name)"
                :disabled="deleting === workflow.id"
                title="Delete workflow"
              >
                <span class="material-symbols-outlined text-lg">delete</span>
              </button>
            </div>
            <p
              v-if="workflow.description"
              class="text-text-light-secondary dark:text-text-dark-secondary text-sm mb-4"
            >
              {{ workflow.description }}
            </p>
            <div class="flex justify-between items-center">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  workflow.status === 'active'
                    ? 'bg-success/10 text-success'
                    : 'bg-gray-100 dark:bg-gray-700 text-text-light-secondary dark:text-text-dark-secondary',
                ]"
              >
                {{ workflow.status }}
              </span>
              <span class="text-text-light-secondary dark:text-text-dark-secondary text-sm">
                {{ workflow.nodes?.length || 0 }} nodes
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppLayout from '../components/AppLayout.vue';
import { workflowsApi, type Workflow } from '../api/workflows';

const router = useRouter();
const workflows = ref<Workflow[]>([]);
const loading = ref(true);
const deleting = ref<string | null>(null);

const loadWorkflows = async () => {
  try {
    loading.value = true;
    workflows.value = await workflowsApi.getAll();
  } catch (error) {
    console.error('Failed to load workflows:', error);
  } finally {
    loading.value = false;
  }
};

const createWorkflow = () => {
  router.push('/workflow/new');
};

const openWorkflow = (id: string) => {
  router.push(`/workflow/${id}`);
};

const handleDelete = async (id: string, name: string) => {
  if (deleting.value === id) {
    return;
  }

  if (
    !confirm(`Are you sure you want to delete workflow "${name}"? This action cannot be undone.`)
  ) {
    return;
  }

  deleting.value = id;
  try {
    await workflowsApi.delete(id);
    workflows.value = workflows.value.filter((w) => w.id !== id);
  } catch (error) {
    console.error('Failed to delete workflow:', error);
    alert('Failed to delete workflow. Please try again.');
  } finally {
    deleting.value = null;
  }
};

onMounted(() => {
  loadWorkflows();
});
</script>

<style scoped></style>

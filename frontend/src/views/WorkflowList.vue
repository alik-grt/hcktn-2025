<template>
  <div class="workflow-list">
    <div class="header">
      <h1>Workflows</h1>
      <button @click="createWorkflow" class="btn-primary">Create Workflow</button>
    </div>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="workflows.length === 0" class="empty">No workflows found</div>
    <div v-else class="workflow-grid">
      <div
        v-for="workflow in workflows"
        :key="workflow.id"
        class="workflow-card"
        @click="openWorkflow(workflow.id)"
      >
        <div class="workflow-card-header">
          <h3>{{ workflow.name }}</h3>
          <button
            class="delete-button"
            @click.stop="handleDelete(workflow.id, workflow.name)"
            :disabled="deleting === workflow.id"
            title="Delete workflow"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="3 6 5 6 21 6"></polyline>
              <path
                d="m19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              ></path>
              <line x1="10" y1="11" x2="10" y2="17"></line>
              <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
          </button>
        </div>
        <p v-if="workflow.description">{{ workflow.description }}</p>
        <div class="workflow-meta">
          <span class="status" :class="workflow.status">{{ workflow.status }}</span>
          <span class="nodes-count">{{ workflow.nodes?.length || 0 }} nodes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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

  if (!confirm(`Are you sure you want to delete workflow "${name}"? This action cannot be undone.`)) {
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

<style scoped>
.workflow-list {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 600;
}

.btn-primary {
  padding: 0.75rem 1.5rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
}

.btn-primary:hover {
  background: #0056b3;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.workflow-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.workflow-card {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.workflow-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.workflow-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.5rem;
}

.workflow-card-header h3 {
  margin: 0;
  color: #333;
  flex: 1;
}

.delete-button {
  padding: 0.375rem;
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  color: #dc3545;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.delete-button:hover:not(:disabled) {
  background: #fee;
  color: #c82333;
}

.delete-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.workflow-card p {
  color: #666;
  margin-bottom: 1rem;
  font-size: 0.9rem;
}

.workflow-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
}

.status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-weight: 500;
}

.status.active {
  background: #d4edda;
  color: #155724;
}

.status.inactive {
  background: #f8d7da;
  color: #721c24;
}

.nodes-count {
  color: #666;
}
</style>

<template>
  <div class="flex flex-col gap-4">
    <div v-if="node.type === 'trigger'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Subtype</label
      >
      <select
        v-model="localNode.subtype"
        @change="handleSubtypeChange"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="manual">Manual</option>
        <option value="webhook">Webhook</option>
        <option value="cron">Cron</option>
      </select>
    </div>
    <div v-if="node.type === 'trigger' && node.subtype === 'webhook'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Webhook URL</label
      >
      <div v-if="webhookUrl" class="flex gap-2">
        <input
          :value="webhookUrl"
          readonly
          class="flex-1 px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-gray-50 dark:bg-gray-800 text-sm font-mono text-text-light-secondary dark:text-text-dark-secondary"
        />
        <button
          @click="copyWebhookUrl"
          class="px-4 py-2 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 text-sm font-medium transition-colors"
        >
          Copy
        </button>
      </div>
      <div
        v-else
        class="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-800 dark:text-yellow-200 text-sm"
      >
        Save the node to generate webhook URL
      </div>
    </div>
    <div v-if="node.type === 'trigger' && node.subtype === 'cron'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Cron Expression</label
      >
      <input
        v-model="cronExpression"
        type="text"
        placeholder="0 0 * * * * (every hour)"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <div class="flex flex-col gap-2">
        <div class="text-xs font-medium text-text-light-secondary dark:text-text-dark-secondary">
          Quick Actions:
        </div>
        <div class="flex flex-wrap gap-2">
          <button
            type="button"
            @click="setCronExpression('*/1 * * * * *')"
            class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            1s
          </button>
          <button
            type="button"
            @click="setCronExpression('*/5 * * * * *')"
            class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            5s
          </button>
          <button
            type="button"
            @click="setCronExpression('0 * * * * *')"
            class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            1 min
          </button>
          <button
            type="button"
            @click="setCronExpression('0 0 * * * *')"
            class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            1h
          </button>
          <button
            type="button"
            @click="setCronExpression('0 0 0 * * *')"
            class="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 text-xs font-medium transition-colors"
          >
            1d
          </button>
        </div>
      </div>
      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 px-4 py-2 rounded-lg bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 text-sm font-medium transition-colors"
          @click="handleCronSave"
        >
          Save
        </button>
        <button
          type="button"
          class="flex-1 px-4 py-2 rounded-lg bg-red-500 dark:bg-red-600 text-white hover:bg-red-600 dark:hover:bg-red-700 text-sm font-medium transition-colors"
          @click="handleCronDelete"
        >
          Delete
        </button>
      </div>
      <small
        class="text-xs text-text-light-secondary dark:text-text-dark-secondary leading-relaxed"
      >
        Format: second minute hour day month dayOfWeek
        <br />
        Examples: "0 0 * * * *" (every hour), "0 0 0 * * *" (daily), "*/5 * * * * *" (every 5
        seconds)
      </small>
    </div>
    <div v-if="node.type === 'http'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Method</label
      >
      <select
        v-model="localNode.method"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>
    <div v-if="node.type === 'http'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >URL</label
      >
      <input
        v-model="localNode.url"
        type="text"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
    <div v-if="node.type === 'http'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Body Template</label
      >
      <textarea
        v-model="localNode.bodyTemplate"
        rows="4"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
      ></textarea>
    </div>
    <div v-if="node.type === 'transform'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Template (JSON)</label
      >
      <textarea
        v-model="templateJson"
        rows="6"
        placeholder='{"username": "{{name}}", "isAdult": "{{age > 18}}"}'
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
      ></textarea>
    </div>
    <div v-if="node.type === 'agent'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Name</label
      >
      <input
        v-model="localNode.name"
        type="text"
        placeholder="Agent name"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
    <div v-if="node.type === 'agent'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Config (JSON)</label
      >
      <textarea
        v-model="configJson"
        rows="6"
        placeholder='{"model": "gpt-4", "temperature": 0.7}'
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary/50"
      ></textarea>
    </div>
    <div v-if="node.type === 'delay'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Delay Type</label
      >
      <select
        v-model="delayType"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      >
        <option value="ms">Delay (milliseconds)</option>
        <option value="until">Wait until date/time</option>
      </select>
    </div>
    <div v-if="node.type === 'delay' && delayType === 'ms'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Delay (milliseconds)</label
      >
      <input
        v-model.number="delayMs"
        type="number"
        min="0"
        placeholder="1000"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <small class="text-xs text-text-light-secondary dark:text-text-dark-secondary"
        >Delay execution for specified milliseconds</small
      >
    </div>
    <div v-if="node.type === 'delay' && delayType === 'until'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Wait Until (date/time)</label
      >
      <input
        v-model="delayUntil"
        type="datetime-local"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <small class="text-xs text-text-light-secondary dark:text-text-dark-secondary"
        >Wait until the specified date and time</small
      >
    </div>
    <div v-if="node.type === 'parent'" class="flex flex-col gap-2">
      <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
        >Name</label
      >
      <input
        v-model="localNode.name"
        type="text"
        placeholder="Parent node name"
        class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
    </div>
    <div v-if="node.type === 'if'" class="flex flex-col gap-4">
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
          >Condition 1</label
        >
        <input
          v-model="ifCondition1"
          type="text"
          placeholder='{{age > 18}}'
          class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <small class="text-xs text-text-light-secondary dark:text-text-dark-secondary"
          >First condition to check. If true, execution follows the green path.</small
        >
      </div>
      <div class="flex flex-col gap-2">
        <label class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
          >Condition 2</label
        >
        <input
          v-model="ifCondition2"
          type="text"
          placeholder='{{status == "active"}}'
          class="px-3 py-2 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark text-text-light-primary dark:text-text-dark-primary font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <small class="text-xs text-text-light-secondary dark:text-text-dark-secondary"
          >Second condition to check if condition 1 is false. If true, execution follows the blue path.</small
        >
      </div>
      <div class="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <small class="text-xs text-text-light-secondary dark:text-text-dark-secondary"
          ><strong>Execution flow:</strong> If condition 1 is true → green path (condition1). If condition 1 is false and condition 2 is true → blue path (condition2). If both are false → red path (else).</small
        >
      </div>
    </div>
    <div
      v-if="
        node.type === 'http' ||
        node.type === 'transform' ||
        node.type === 'agent' ||
        node.type === 'delay' ||
        node.type === 'parent' ||
        node.type === 'if'
      "
      class="flex gap-2 pt-2"
    >
      <button
        type="button"
        @click="handleSave"
        class="flex-1 px-4 py-2 rounded-lg bg-green-500 dark:bg-green-600 text-white hover:bg-green-600 dark:hover:bg-green-700 text-sm font-medium transition-colors"
      >
        Save
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { Node } from '../api/workflows';
import { workflowsApi } from '../api/workflows';

const props = defineProps<{
  node: Node;
}>();

const emit = defineEmits<{
  update: [node: Node];
}>();

const localNode = ref<Node>({ ...props.node });
const templateJson = ref(props.node.template ? JSON.stringify(props.node.template, null, 2) : '');
const configJson = ref(props.node.config ? JSON.stringify(props.node.config, null, 2) : '');
const cronExpression = ref(props.node.config?.cronExpression || '');
const webhookUrl = ref<string | null>(null);
const delayMs = ref<number>(props.node.config?.delayMs || 0);
const delayUntil = ref<string>(
  props.node.config?.until ? new Date(props.node.config.until).toISOString().slice(0, 16) : '',
);
const delayType = ref<'ms' | 'until'>(props.node.config?.until ? 'until' : 'ms');
const ifCondition1 = ref<string>(props.node.config?.condition1 || '');
const ifCondition2 = ref<string>(props.node.config?.condition2 || '');

watch(
  () => props.node,
  async (newNode) => {
    localNode.value = { ...newNode };
    templateJson.value = newNode.template ? JSON.stringify(newNode.template, null, 2) : '';
    configJson.value = newNode.config ? JSON.stringify(newNode.config, null, 2) : '';
    cronExpression.value = newNode.config?.cronExpression || '';
    delayMs.value = newNode.config?.delayMs || 0;
    delayUntil.value = newNode.config?.until
      ? new Date(newNode.config.until).toISOString().slice(0, 16)
      : '';
    delayType.value = newNode.config?.until ? 'until' : 'ms';
    ifCondition1.value = newNode.config?.condition1 || '';
    ifCondition2.value = newNode.config?.condition2 || '';

    if (newNode.type === 'trigger' && newNode.subtype === 'webhook' && newNode.id) {
      await loadWebhookUrl();
    } else {
      webhookUrl.value = null;
    }
  },
  { deep: true },
);

const handleUpdate = () => {
  emit('update', { ...localNode.value });
};

const handleSave = () => {
  if (localNode.value.type === 'transform') {
    try {
      localNode.value.template = JSON.parse(templateJson.value);
    } catch (error) {
      alert('Invalid JSON in template');
      return;
    }
  }
  if (localNode.value.type === 'agent') {
    try {
      localNode.value.config = JSON.parse(configJson.value);
    } catch (error) {
      alert('Invalid JSON in config');
      return;
    }
  }
  if (localNode.value.type === 'delay') {
    if (!localNode.value.config) {
      localNode.value.config = {};
    }
    if (delayType.value === 'ms') {
      delete localNode.value.config.until;
      localNode.value.config.delayMs = delayMs.value;
    } else {
      delete localNode.value.config.delayMs;
      if (delayUntil.value) {
        localNode.value.config.until = new Date(delayUntil.value).toISOString();
      } else {
        delete localNode.value.config.until;
      }
    }
  }
  if (localNode.value.type === 'if') {
    if (!localNode.value.config) {
      localNode.value.config = {};
    }
    localNode.value.config.condition1 = ifCondition1.value;
    localNode.value.config.condition2 = ifCondition2.value;
    delete localNode.value.config.condition;
  }
  // Parent node only needs name, which is already in localNode.value.name
  handleUpdate();
};

const handleSubtypeChange = () => {
  if (localNode.value.subtype === 'webhook' || localNode.value.subtype === 'cron') {
    if (!localNode.value.config) {
      localNode.value.config = {};
    }
  }
  handleUpdate();
};

const handleCronSave = async () => {
  if (!localNode.value.config) {
    localNode.value.config = {};
  }
  const expression = cronExpression.value.trim();
  if (!expression) {
    delete localNode.value.config.cronExpression;
    localNode.value.config.cronActive = false;
    handleUpdate();
    return;
  }
  localNode.value.config.cronExpression = expression;
  handleUpdate();
  if (props.node.id && localNode.value.subtype === 'cron') {
    try {
      await workflowsApi.startCron(props.node.id);
      localNode.value.config.cronActive = true;
      handleUpdate();
    } catch (error) {
      console.error('Failed to start cron job:', error);
    }
  }
};

const handleCronDelete = async () => {
  cronExpression.value = '';
  if (!localNode.value.config) {
    localNode.value.config = {};
  }
  delete localNode.value.config.cronExpression;
  localNode.value.config.cronActive = false;
  if (props.node.id && localNode.value.subtype === 'cron') {
    try {
      await workflowsApi.stopCron(props.node.id);
    } catch (error) {
      console.error('Failed to stop cron job:', error);
    }
  }
  handleUpdate();
};

const setCronExpression = (expression: string) => {
  cronExpression.value = expression;
};

const loadWebhookUrl = async () => {
  if (!props.node.id) {
    return;
  }
  try {
    const data = await workflowsApi.getWebhookInfo(props.node.id);
    webhookUrl.value = data?.url || null;
  } catch (error) {
    console.error('Failed to load webhook URL:', error);
    webhookUrl.value = null;
  }
};

const copyWebhookUrl = async () => {
  if (webhookUrl.value) {
    await navigator.clipboard.writeText(webhookUrl.value);
    alert('Webhook URL copied to clipboard!');
  }
};

onMounted(() => {
  if (props.node.type === 'trigger' && props.node.subtype === 'webhook' && props.node.id) {
    loadWebhookUrl();
  }
});
</script>

<style scoped></style>

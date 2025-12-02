<template>
  <div class="node-config-form">
    <div v-if="node.type === 'trigger'" class="form-group">
      <label>Subtype</label>
      <select v-model="localNode.subtype" @change="handleSubtypeChange">
        <option value="manual">Manual</option>
        <option value="webhook">Webhook</option>
        <option value="cron">Cron</option>
      </select>
    </div>
    <div v-if="node.type === 'trigger' && node.subtype === 'webhook'" class="form-group">
      <label>Webhook URL</label>
      <div v-if="webhookUrl" class="webhook-url-display">
        <input :value="webhookUrl" readonly class="readonly-input" />
        <button @click="copyWebhookUrl" class="btn-copy">Copy</button>
      </div>
      <div v-else class="webhook-info">Save the node to generate webhook URL</div>
    </div>
    <div v-if="node.type === 'trigger' && node.subtype === 'cron'" class="form-group">
      <label>Cron Expression</label>
      <input
        v-model="cronExpression"
        @input="handleCronChange"
        type="text"
        placeholder="0 * * * * (every hour)"
      />
      <small class="form-hint">
        Format: minute hour day month dayOfWeek
        <br />
        Examples: "0 * * * *" (every hour), "0 0 * * *" (daily), "*/5 * * * *" (every 5 minutes)
      </small>
    </div>
    <div v-if="node.type === 'http'" class="form-group">
      <label>Method</label>
      <select v-model="localNode.method" @change="handleUpdate">
        <option value="GET">GET</option>
        <option value="POST">POST</option>
        <option value="PUT">PUT</option>
        <option value="DELETE">DELETE</option>
      </select>
    </div>
    <div v-if="node.type === 'http'" class="form-group">
      <label>URL</label>
      <input v-model="localNode.url" @input="handleUpdate" type="text" />
    </div>
    <div v-if="node.type === 'http'" class="form-group">
      <label>Body Template</label>
      <textarea v-model="localNode.bodyTemplate" @input="handleUpdate" rows="4"></textarea>
    </div>
    <div v-if="node.type === 'transform'" class="form-group">
      <label>Template (JSON)</label>
      <textarea
        v-model="templateJson"
        @input="handleTemplateChange"
        rows="6"
        placeholder='{"username": "{{name}}", "isAdult": "{{age > 18}}"}'
      ></textarea>
    </div>
    <div v-if="node.type === 'agent'" class="form-group">
      <label>Config (JSON)</label>
      <textarea
        v-model="configJson"
        @input="handleConfigChange"
        rows="6"
        placeholder='{"model": "gpt-4", "temperature": 0.7}'
      ></textarea>
    </div>
    <div v-if="node.type === 'delay'" class="form-group">
      <label>Delay Type</label>
      <select v-model="delayType" @change="handleDelayTypeChange">
        <option value="ms">Delay (milliseconds)</option>
        <option value="until">Wait until date/time</option>
      </select>
    </div>
    <div v-if="node.type === 'delay' && delayType === 'ms'" class="form-group">
      <label>Delay (milliseconds)</label>
      <input
        v-model.number="delayMs"
        @input="handleDelayMsChange"
        type="number"
        min="0"
        placeholder="1000"
      />
      <small class="form-hint">Delay execution for specified milliseconds</small>
    </div>
    <div v-if="node.type === 'delay' && delayType === 'until'" class="form-group">
      <label>Wait Until (date/time)</label>
      <input
        v-model="delayUntil"
        @input="handleDelayUntilChange"
        type="datetime-local"
      />
      <small class="form-hint">Wait until the specified date and time</small>
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
  props.node.config?.until
    ? new Date(props.node.config.until).toISOString().slice(0, 16)
    : '',
);
const delayType = ref<'ms' | 'until'>(
  props.node.config?.until ? 'until' : 'ms',
);

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

const handleSubtypeChange = () => {
  if (localNode.value.subtype === 'webhook' || localNode.value.subtype === 'cron') {
    if (!localNode.value.config) {
      localNode.value.config = {};
    }
  }
  handleUpdate();
};

const handleCronChange = () => {
  if (!localNode.value.config) {
    localNode.value.config = {};
  }
  localNode.value.config.cronExpression = cronExpression.value;
  handleUpdate();
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

const handleTemplateChange = () => {
  try {
    localNode.value.template = JSON.parse(templateJson.value);
    handleUpdate();
  } catch (error) {
    // Invalid JSON, ignore for now
  }
};

const handleConfigChange = () => {
  try {
    localNode.value.config = JSON.parse(configJson.value);
    handleUpdate();
  } catch (error) {
    // Invalid JSON, ignore for now
  }
};

const handleDelayTypeChange = () => {
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
    }
  }
  handleUpdate();
};

const handleDelayMsChange = () => {
  if (!localNode.value.config) {
    localNode.value.config = {};
  }
  localNode.value.config.delayMs = delayMs.value;
  delete localNode.value.config.until;
  handleUpdate();
};

const handleDelayUntilChange = () => {
  if (!localNode.value.config) {
    localNode.value.config = {};
  }
  if (delayUntil.value) {
    localNode.value.config.until = new Date(delayUntil.value).toISOString();
  } else {
    delete localNode.value.config.until;
  }
  delete localNode.value.config.delayMs;
  handleUpdate();
};

onMounted(() => {
  if (props.node.type === 'trigger' && props.node.subtype === 'webhook' && props.node.id) {
    loadWebhookUrl();
  }
});
</script>

<style scoped>
.node-config-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.85rem;
  font-weight: 500;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  font-size: 0.9rem;
}

.form-group textarea {
  font-family: monospace;
  resize: vertical;
}

.webhook-url-display {
  display: flex;
  gap: 0.5rem;
}

.readonly-input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 0.25rem;
  background: #f5f5f5;
  font-size: 0.85rem;
  font-family: monospace;
}

.btn-copy {
  padding: 0.5rem 1rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.85rem;
}

.btn-copy:hover {
  background: #0056b3;
}

.webhook-info {
  padding: 0.5rem;
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 0.25rem;
  color: #856404;
  font-size: 0.85rem;
}

.form-hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #666;
  line-height: 1.4;
}
</style>

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
            Manage your credentials for connecting to various services.
          </p>
        </div>
        <button
          class="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm hover:bg-primary/90"
          @click="handleAddCredential"
        >
          <span class="material-symbols-outlined">add</span>
          <span class="truncate">Add Credential</span>
        </button>
      </div>
      <div class="mt-8">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div class="lg:col-span-1">
            <h2 class="text-xl font-bold text-text-light-primary dark:text-text-dark-primary">
              Credential Types
            </h2>
            <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
              Select a credential type to configure.
            </p>
            <div class="mt-4 space-y-2">
              <button
                v-for="type in credentialTypes"
                :key="type.value"
                class="w-full flex items-center justify-between p-3 rounded-lg border transition-colors"
                :class="
                  selectedType === type.value
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-border-light dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800'
                "
                @click="selectType(type.value)"
              >
                <span
                  class="font-medium text-sm"
                  :class="
                    selectedType === type.value
                      ? 'text-primary'
                      : 'text-text-light-primary dark:text-text-dark-primary'
                  "
                >
                  {{ type.label }}
                </span>
                <span
                  class="material-symbols-outlined text-lg"
                  :class="
                    selectedType === type.value
                      ? 'text-primary'
                      : 'text-text-light-secondary dark:text-text-dark-secondary'
                  "
                >
                  arrow_forward_ios
                </span>
              </button>
            </div>
          </div>
          <div class="lg:col-span-2">
            <div
              v-if="selectedType"
              class="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm"
            >
              <div class="p-6 border-b border-border-light dark:border-border-dark">
                <h3 class="text-lg font-bold text-text-light-primary dark:text-text-dark-primary">
                  Configure {{ getTypeLabel(selectedType) }}
                </h3>
                <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                  Enter the details for your {{ getTypeLabel(selectedType) }} credential.
                </p>
              </div>
              <div class="p-6">
                <form class="space-y-6" @submit.prevent="handleSave">
                  <div>
                    <label
                      class="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
                      for="cred-name"
                    >
                      Credential Name
                    </label>
                    <input
                      id="cred-name"
                      v-model="formData.name"
                      class="mt-1 block w-full rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2"
                      placeholder="My OpenAI API Key"
                      type="text"
                    />
                  </div>
                  <div v-if="selectedType === 'api_key'">
                    <label
                      class="block text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
                      for="api-key"
                    >
                      API Key
                    </label>
                    <div class="relative mt-1">
                      <input
                        id="api-key"
                        v-model="formData.config.apiKey"
                        class="block w-full rounded-md border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark shadow-sm focus:border-primary focus:ring-primary sm:text-sm px-3 py-2 pr-10"
                        placeholder="Enter your API key"
                        :type="showPassword ? 'text' : 'password'"
                      />
                      <button
                        class="absolute inset-y-0 right-0 flex items-center px-3 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                        type="button"
                        @click="showPassword = !showPassword"
                      >
                        <span class="material-symbols-outlined text-base">
                          {{ showPassword ? 'visibility' : 'visibility_off' }}
                        </span>
                      </button>
                    </div>
                    <p class="mt-2 text-xs text-text-light-secondary dark:text-text-dark-secondary">
                      Your API Key is encrypted and stored securely.
                    </p>
                  </div>
                  <div
                    v-if="selectedType === 'api_key' && formData.name"
                    class="rounded-lg bg-background-light dark:bg-background-dark p-4"
                  >
                    <p
                      class="text-sm font-medium text-text-light-primary dark:text-text-dark-primary"
                    >
                      How to use in a workflow
                    </p>
                    <p class="text-sm text-text-light-secondary dark:text-text-dark-secondary mt-1">
                      To use this credential in an HTTP node, reference it using the following
                      expression:
                    </p>
                    <div
                      class="mt-2 flex items-center justify-between gap-2 rounded-md bg-white dark:bg-gray-900 p-2 border border-border-light dark:border-border-dark"
                    >
                      <code class="text-xs text-primary dark:text-indigo-400 select-all font-mono">
                        {{ credentialExpression }}
                      </code>
                      <button
                        class="flex-shrink-0 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary"
                        type="button"
                        @click="copyToClipboard(credentialExpression)"
                      >
                        <span class="material-symbols-outlined text-sm">content_copy</span>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
              <div
                class="px-6 py-4 bg-gray-50 dark:bg-card-dark/50 border-t border-border-light dark:border-border-dark flex items-center justify-between"
              >
                <button
                  class="flex items-center justify-center gap-2 rounded-md h-9 px-4 text-white text-sm font-medium bg-primary hover:bg-primary/90"
                  type="button"
                  @click="handleTestConnection"
                >
                  <span class="material-symbols-outlined text-base">power</span>
                  <span>Test Connection</span>
                </button>
                <div class="flex items-center gap-4">
                  <button
                    v-if="editingCredential"
                    class="text-sm font-medium text-error hover:text-error/90"
                    type="button"
                    @click="handleDelete"
                  >
                    Delete
                  </button>
                  <button
                    class="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-10 px-5 bg-gray-900 text-white text-sm font-bold leading-normal tracking-[0.015em] shadow-sm hover:bg-gray-800 dark:bg-gray-50 dark:text-gray-900 dark:hover:bg-gray-200"
                    type="button"
                    @click="handleSave"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
            <div
              v-else
              class="bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark rounded-lg shadow-sm p-12 text-center"
            >
              <p class="text-text-light-secondary dark:text-text-dark-secondary">
                Select a credential type to get started
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import AppLayout from '../components/AppLayout.vue';
import { credentialsApi, type CredentialType, type Credential } from '../api/credentials';

const credentialTypes = [
  { value: 'api_key' as CredentialType, label: 'API Key' },
  { value: 'oauth2' as CredentialType, label: 'OAuth 2.0' },
  { value: 'custom_headers' as CredentialType, label: 'Custom Headers' },
];

const selectedType = ref<CredentialType | null>(null);
const showPassword = ref(false);
const editingCredential = ref<Credential | null>(null);
const isLoading = ref(false);

const formData = reactive({
  name: '',
  config: {
    apiKey: '',
  } as Record<string, any>,
});

const getTypeLabel = (type: CredentialType): string => {
  const typeObj = credentialTypes.find((t) => t.value === type);
  return typeObj?.label || type;
};

const getCredentialVariableName = (name: string): string => {
  return name
    .replace(/[^a-zA-Z0-9]/g, '')
    .replace(/\s+/g, '')
    .replace(/^(.)/, (match) => match.toLowerCase());
};

const credentialExpression = computed(() => {
  if (!formData.name) {
    return '';
  }
  const varName = getCredentialVariableName(formData.name);
  return `{{ $credentials.${varName}.apiKey }}`;
});

const selectType = (type: CredentialType): void => {
  selectedType.value = type;
  if (!editingCredential.value) {
    formData.name = '';
    formData.config = { apiKey: '' };
  }
};

const handleAddCredential = (): void => {
  selectedType.value = 'api_key';
  editingCredential.value = null;
  formData.name = '';
  formData.config = { apiKey: '' };
};

const handleSave = async (): Promise<void> => {
  if (!selectedType.value || !formData.name) {
    return;
  }

  isLoading.value = true;
  try {
    if (editingCredential.value) {
      await credentialsApi.update(editingCredential.value.id, {
        name: formData.name,
        type: selectedType.value,
        config: formData.config,
      });
    } else {
      await credentialsApi.create({
        name: formData.name,
        type: selectedType.value,
        config: formData.config,
      });
    }
    handleAddCredential();
  } catch (error) {
    console.error('Failed to save credential:', error);
  } finally {
    isLoading.value = false;
  }
};

const handleTestConnection = async (): Promise<void> => {
  if (!editingCredential.value) {
    return;
  }

  isLoading.value = true;
  try {
    const result = await credentialsApi.testConnection(editingCredential.value.id);
    if (result.success) {
      alert('Connection test successful!');
    } else {
      alert(`Connection test failed: ${result.message || 'Unknown error'}`);
    }
  } catch (error) {
    console.error('Failed to test connection:', error);
    alert('Failed to test connection');
  } finally {
    isLoading.value = false;
  }
};

const handleDelete = async (): Promise<void> => {
  if (!editingCredential.value) {
    return;
  }

  if (!confirm('Are you sure you want to delete this credential?')) {
    return;
  }

  isLoading.value = true;
  try {
    await credentialsApi.delete(editingCredential.value.id);
    handleAddCredential();
  } catch (error) {
    console.error('Failed to delete credential:', error);
  } finally {
    isLoading.value = false;
  }
};

const copyToClipboard = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
  }
};
</script>

<style scoped></style>

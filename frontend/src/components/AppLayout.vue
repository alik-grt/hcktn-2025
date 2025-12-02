<template>
  <div class="relative flex min-h-screen w-full">
    <aside
      class="flex h-screen w-64 flex-col border-r border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark p-4 sticky top-0"
    >
      <div class="flex flex-col gap-4 flex-grow">
        <div class="flex items-center gap-3 px-2 h-10">
          <span class="text-text-light-primary dark:text-text-dark-primary font-bold text-lg"
            >Automation Studio</span
          >
        </div>
        <nav class="flex flex-col gap-2">
          <router-link
            to="/"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
            exact-active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">dashboard</span>
            <p class="text-sm font-medium leading-normal">Dashboard</p>
          </router-link>
          <router-link
            to="/workflows"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">hub</span>
            <p class="text-sm font-medium leading-normal">Workflows</p>
          </router-link>
          <router-link
            to="/executions"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">history</span>
            <p class="text-sm font-medium leading-normal">Executions</p>
          </router-link>
          <router-link
            to="/variables"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">data_object</span>
            <p class="text-sm font-medium leading-normal">Variables</p>
          </router-link>
          <router-link
            to="/credentials"
            class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
            active-class="bg-gray-100 dark:bg-gray-700 text-primary"
          >
            <span class="material-symbols-outlined">key</span>
            <p class="text-sm font-medium leading-normal">Credentials</p>
          </router-link>
        </nav>
      </div>
      <div class="flex flex-col gap-2 border-t border-border-light dark:border-border-dark pt-4">
        <a
          class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
          href="#"
        >
          <span class="material-symbols-outlined">help</span>
          <p class="text-sm font-medium leading-normal">Help & Support</p>
        </a>
        <a
          class="flex items-center gap-3 px-3 py-2 rounded text-text-light-secondary dark:text-text-dark-secondary hover:bg-gray-100 dark:hover:bg-gray-700"
          href="#"
        >
          <span class="material-symbols-outlined">settings</span>
          <p class="text-sm font-medium leading-normal">Settings</p>
        </a>
      </div>
    </aside>
    <main class="flex-1 p-8">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped></style>


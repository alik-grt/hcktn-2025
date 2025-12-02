import { createRouter, createWebHistory } from 'vue-router';
import WorkflowBuilder from '../views/WorkflowBuilder.vue';
import WorkflowList from '../views/WorkflowList.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: WorkflowList,
    },
    {
      path: '/workflow/:id',
      name: 'workflow',
      component: WorkflowBuilder,
    },
    {
      path: '/workflow/new',
      name: 'new-workflow',
      component: WorkflowBuilder,
    },
  ],
});

export default router;

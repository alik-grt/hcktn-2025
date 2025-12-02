import { createRouter, createWebHistory } from 'vue-router';
import WorkflowBuilder from '../views/WorkflowBuilder.vue';
import WorkflowList from '../views/WorkflowList.vue';
import Dashboard from '../views/Dashboard.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard,
    },
    {
      path: '/workflows',
      name: 'workflows',
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
    {
      path: '/executions',
      name: 'executions',
      component: () => import('../views/Executions.vue'),
    },
    {
      path: '/executions/:id',
      name: 'execution-detail',
      component: () => import('../views/ExecutionDetail.vue'),
    },
    {
      path: '/variables',
      name: 'variables',
      component: () => import('../views/Variables.vue'),
    },
    {
      path: '/credentials',
      name: 'credentials',
      component: () => import('../views/Credentials.vue'),
    },
  ],
});

export default router;

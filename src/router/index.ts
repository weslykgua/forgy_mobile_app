import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
import TabsPage from '../views/NavBarView.vue';

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/auth',
  },

  // ✅ Login fuera de Tabs (SIN navbar)
  {
    path: '/auth',
    component: () => import('@/views/AuthView.vue'),
  },

  // ✅ Tabs con navbar
  {
    path: '/tabs/',
    component: TabsPage,
    children: [
      {
        path: '',
        redirect: '/tabs/home',
      },
      {
        path: 'home',
        component: () => import('@/views/HomePage.vue'),
      },
      {
        path: 'tab1',
        component: () => import('@/views/ExercisesView.vue'),
      },
      {
        path: 'tab2',
        component: () => import('@/views/TrainView.vue'),
      },
      {
        path: 'tab3',
        component: () => import('@/views/ProgressView.vue'),
      },
      {
        path: 'tab4',
        component: () => import('@/views/ProfileView.vue'),
      },
      {
        path: 'bmi',
        component: () => import('@/views/BmiTestView.vue'),
      },
      {
        path: 'rm',
        component: () => import('@/views/RmCalculatorView.vue'),
      },
    ],
  },
  {
    path: '/tabs/tab5',
    redirect: '/auth',
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

import { createRouter, createWebHistory } from '@ionic/vue-router';
import { RouteRecordRaw } from 'vue-router';
// import TabsPage from '../views/TabsPage.vue';
import TabsPage from '@/views/TabsPage.vue';

// Guard de autenticación para verificar si el token es válido y no ha expirado
const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const tokenData = localStorage.getItem('token_data');
  if (token && tokenData) {
    try {
      const data = JSON.parse(tokenData);
      const now = new Date();
      const until = new Date(data.until);
      return now <= until;
    } catch (e) {
      return false;
    }
  }
  return false;
};

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    redirect: '/auth',
  },
  {
    path: '/auth',
    component: () => import('@/views/AuthView.vue'),
  },
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
        path: 'exercises',
        component: () => import('@/views/ExercisesView.vue'),
      },
      {
        path: 'train',
        component: () => import('@/views/TrainView.vue'),
      },
      {
        path: 'train',
        component: () => import('@/views/TrainView.vue'),
      },
      {
        path: 'progress',
        component: () => import('@/views/ProgressView.vue'),
      },
      {
        path: 'profile',
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
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

// Único Guard Global de Autenticación
router.beforeEach((to, from, next) => {
  const auth = isAuthenticated();

  if (!auth && to.path !== '/auth') {
    // Limpiar restos corruptos de sesión si es inválida
    localStorage.clear();
    next('/auth');
  } else if (auth && to.path === '/auth') {
    next('/tabs/home');
  } else {
    next();
  }
});

export default router;

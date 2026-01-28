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
    beforeEnter: (to, from, next) => {
      // Si el usuario no está autenticado, lo redirigimos a la página de login
      if (isAuthenticated()) {
        next();
      } else {
        next('/auth');
      }
    },
  },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
});

export default router;

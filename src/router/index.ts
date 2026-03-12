import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/LoginView.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/reports',
    name: 'Reports',
    component: () => import('../views/ReportsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/students',
    name: 'Students',
    component: () => import('../views/StudentsView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/leaderboard',
    name: 'Leaderboard',
    component: () => import('../views/LeaderboardView.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../views/SettingsView.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Track if we're in the middle of a route change to prevent loops
let isNavigating = false;

router.beforeEach((to, from, next) => {
  // Prevent duplicate navigation
  if (isNavigating) {
    next(false);
    return;
  }

  const token = localStorage.getItem('token');
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  console.log(`[Router] to: ${to.path}, requires auth: ${requiresAuth}, has token: ${!!token}`);

  if (requiresAuth && !token) {
    console.log('[Router] Redirecting to login - auth required but no token');
    isNavigating = true;
    next('/login');
  } else if ((to.path === '/login' || to.path === '/register') && token) {
    console.log('[Router] Already logged in, redirecting to dashboard');
    isNavigating = true;
    next('/dashboard');
  } else {
    next();
  }
});

router.afterEach(() => {
  isNavigating = false;
});

export default router;

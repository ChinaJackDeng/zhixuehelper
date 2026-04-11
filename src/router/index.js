// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'


const routes = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('@/views/auth/Login.vue'),
        meta: {
            title: '登录 - 智学助手',
            guestOnly: true  // 只有未登录用户可访问
        }
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('@/views/auth/Register.vue'),
        meta: {
            title: '注册 - 智学助手',
            guestOnly: true
        }
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('@/views/auth/ForgotPassword.vue'),
        meta: {
            title: '找回密码 - 智学助手',
            guestOnly: true
        }
    },
    {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/Dashboard.vue'),
        meta: {
            title: '主页 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/knowledge',
        name: 'Knowledge',
        component:()=>import('@/views/knowledge/KnowledgePage.vue'),
        meta: {
            title:'知识库 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/knowledge-graph',
        name: 'KnowledgeGraph',
        component:()=>import('@/views/knowledge/KnowledgeGraph.vue'),
        meta: {
            title:'知识图谱 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/knowledge-api-test',
        name: 'KnowledgeAPITest',
        component:()=>import('@/views/knowledge/APITest.vue'),
        meta: {
            title:'API 测试 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/exam',
        name: 'Exam',
        component:()=>import('@/views/exam/QuestionGenerator.vue'),
        alias: ['/question-bank/generate'],
        meta: {
            title:'题目生成 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/practice',
        name: 'Practice',
        component:()=>import('@/views/practice/PracticePage.vue'),
        meta: {
            title:'练习/考试 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/analytics',
        name: 'Analytics',
        component:()=>import('@/views/analytics/AnalyticsPage.vue'),
        meta: {
            title:'个人数据 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/profile',
        name: 'Profile',
        component:()=>import('@/views/dashboard/ProfileSettings.vue'),
        meta: {
            title:'个人资料与设置 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/settings',
        name: 'Settings',
        component:()=>import('@/views/dashboard/ProfileSettings.vue'),
        meta: {
            title:'个人资料与设置 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/wrong-questions',
        name: 'WrongQuestions',
        component:()=>import('@/views/wrong/WrongQuestions.vue'),
        meta: {
            title:'错题本 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/wrong-questions/set/:setId',
        name: 'WrongQuestionSetDetail',
        component:()=>import('@/views/wrong/WrongQuestionSetDetail.vue'),
        meta: {
            title:'错题集详情 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/wrong-questions/:id',
        name: 'WrongQuestionDetail',
        component:()=>import('@/views/wrong/WrongQuestionDetail.vue'),
        meta: {
            title:'错题详情 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path:'/reinforcement-practice',
        name: 'ReinforcementPractice',
        component:()=>import('@/views/wrong/ReinforcementPractice.vue'),
        meta: {
            title:'强化练习 - 智学助手',
            requiresAuth: true
        }
    },
    {
        path: '/admin/login',
        name: 'AdminLogin',
        component: () => import('@/views/admin/AdminLogin.vue'),
        meta: {
            title: '管理端登录 - 智学助手',
            guestOnly: true
        }
    },
    {
        path: '/admin',
        component: () => import('@/views/admin/AdminLayout.vue'),
        redirect: '/admin/dashboard',
        meta: {
            requiresAuth: true,
            requiresAdmin: true
        },
        children: [
            {
                path: 'dashboard',
                name: 'AdminDashboard',
                component: () => import('@/views/admin/AdminDashboard.vue'),
                meta: {
                    title: '系统总览 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'incidents',
                name: 'AdminIncidents',
                component: () => import('@/views/admin/AdminIncidents.vue'),
                meta: {
                    title: '异常处置中心 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'quality',
                name: 'AdminQuality',
                component: () => import('@/views/admin/AdminQuality.vue'),
                meta: {
                    title: '题目质量运营台 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'reach',
                name: 'AdminReach',
                component: () => import('@/views/admin/AdminReach.vue'),
                meta: {
                    title: '通知与触达 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'notifications',
                name: 'AdminNotifications',
                component: () => import('@/views/admin/AdminNotifications.vue'),
                meta: {
                    title: '通知运营 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('@/views/admin/AdminUsers.vue'),
                meta: {
                    title: '用户管理 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'logs',
                name: 'AdminLogs',
                component: () => import('@/views/admin/AdminLogs.vue'),
                meta: {
                    title: '日志管理 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            },
            {
                path: 'ai-config',
                name: 'AdminAIConfig',
                component: () => import('@/views/admin/AdminAIConfig.vue'),
                meta: {
                    title: 'AI 配置 - 管理端',
                    requiresAuth: true,
                    requiresAdmin: true
                }
            }
        ]
    }

]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 检查是否已登录
const isAuthenticated = () => {
    const token = localStorage.getItem('access_token')
    return !!token
}

const isAdmin = () => {
    const raw = localStorage.getItem('userInfo')
    if (!raw) return false
    try {
        const info = JSON.parse(raw)
        return Boolean(info?.isAdmin || info?.role === 'admin')
    } catch (error) {
        return false
    }
}

// 路由守卫
router.beforeEach((to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
        document.title = to.meta.title
    }

    const authenticated = isAuthenticated()
    const admin = isAdmin()

    if (to.meta.requiresAdmin) {
        if (!authenticated) {
            next({
                path: '/admin/login',
                query: { redirect: to.fullPath }
            })
            return
        }
        if (!admin) {
            next('/analytics')
            return
        }
    }

    // 需要登录的页面
    if (to.meta.requiresAuth && !authenticated) {
        next({
            path: '/login',
            query: { redirect: to.fullPath }
        })
        return
    }

    // 只有未登录用户可访问的页面（登录页、注册页）
    if (to.meta.guestOnly && authenticated) {
        if (to.path.startsWith('/admin')) {
            next(admin ? '/admin/dashboard' : '/analytics')
            return
        }
        next('/analytics')
        return
    }

    next()
})

export default router

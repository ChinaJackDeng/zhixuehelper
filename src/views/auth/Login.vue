<template>
  <div class="login-container">
    <!-- 背景设计 -->
    <div class="background-pattern"></div>

    <div class="login-wrapper">
      <!-- 左侧装饰区 -->
      <div class="login-decoration">
        <div class="decoration-content">
          <div class="logo-title-container">
            <img src="@/assets/images/ZhiXue.jpg" alt="智学助手" class="system-logo" />
            <h1 class="system-title">智学助手</h1>
          </div>
          <p class="system-subtitle">基于大语言模型的个性化学习系统</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon><Collection /></el-icon>
              <span>本地知识库</span>
            </div>
            <div class="feature-item">
              <el-icon><Edit /></el-icon>
              <span>题卷生成</span>
            </div>
            <div class="feature-item">
              <el-icon><Check /></el-icon>
              <span>练习考试</span>
            </div>
            <div class="feature-item">
              <el-icon><TrendCharts /></el-icon>
              <span>学习情况分析</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-form">
        <div class="form-header">
          <h2>用户登录</h2>
          <p>欢迎使用智能学习助手</p>
        </div>

        <el-form
            ref="loginFormRef"
            :model="loginForm"
            :rules="loginRules"
            class="login-form-content"
            @submit.prevent="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
                v-model="loginForm.username"
                placeholder="用户名或邮箱"
                size="large"
                :prefix-icon="User"
                class="custom-input"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
                class="custom-input"
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin"
            />
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="loginForm.rememberMe">记住我</el-checkbox>
              <span class="forgot-password" @click="handleForgot">
                忘记密码？
              </span>
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                size="large"
                :loading="loading"
                @click="handleLogin"
                class="login-btn"
            >
              登录
            </el-button>
          </el-form-item>

          <div class="divider">
            <span>或</span>
          </div>

          <el-form-item>
            <el-button
                type="default"
                size="large"
                class="register-btn"
                @click="$router.push('/register')"
            >
              注册账号
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { User, Lock, Collection, Edit, Check, TrendCharts } from '@element-plus/icons-vue'

const router = useRouter()
const store = useStore()
const loginFormRef = ref()

// 计算属性获取登录状态
import { computed } from 'vue'
const isLoggedIn = computed(() => store.getters['auth/isLoggedIn'])

// 表单数据
const loginForm = reactive({
  username: '',
  password: '',
  rememberMe: false
})

// 表单验证规则
const loginRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
})

// 状态
const loading = ref(false)

// 页面加载时检查是否已登录
onMounted(() => {
  if (isLoggedIn.value) {
    router.push('/analytics')
  }

  // 恢复记住的用户名
  const rememberedUsername = localStorage.getItem('rememberedUsername')
  if (rememberedUsername) {
    loginForm.username = rememberedUsername
    loginForm.rememberMe = true
  }
})

// 登录处理
const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    // 验证表单
    await loginFormRef.value.validate()

    loading.value = true

    const loginTable={identifier: loginForm.username,
      password: loginForm.password}
    console.log(loginTable)
    // 调用 Vuex action
    await store.dispatch('auth/login', loginTable)

    // 处理记住我功能
    if (loginForm.rememberMe) {
      localStorage.setItem('rememberedUsername', loginForm.username)
    } else {
      localStorage.removeItem('rememberedUsername')
    }

    // 登录成功提示
    ElMessage.success({
      message: '登录成功！',
      duration: 2000
    })

    // 获取重定向路径
    const redirectPath = router.currentRoute.value.query.redirect || '/analytics'

    console.log('跳转到:', redirectPath)
    // 跳转到目标页面
    setTimeout(() => {
      router.push(redirectPath)
    }, 1000)

  } catch (error) {
    console.error('登录失败:', error)

    // 错误处理
    let errorMessage = '登录失败，请稍后重试'

    if (error.response) {
      const status = error.response.status
      const data = error.response.data

      switch (status) {
        case 401:
          errorMessage = data?.detail || '用户名或密码错误'
          break
        case 400:
          errorMessage = data?.detail || '请求参数错误'
          break
        case 404:
          errorMessage = '接口不存在，请检查网络配置'
          break
        case 500:
          errorMessage = '服务器内部错误，请稍后重试'
          break
        default:
          errorMessage = data?.detail || data?.message || `登录失败 (${status})`
      }
    } else if (error.message.includes('Network Error')) {
      errorMessage = '网络连接失败，请检查网络设置'
    } else if (error.message) {
      errorMessage = error.message
    }

    ElMessage.error(errorMessage)
  } finally {
    loading.value = false
  }
}

// 忘记密码
const handleForgot = () => {
  router.push('/forgot-password')
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  position: relative;
  overflow: hidden;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.login-wrapper {
  display: flex;
  width: 1000px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(74, 144, 226, 0.2);
  overflow: hidden;
}

.login-decoration {
  flex: 1;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.logo-title-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.logo-title-container .system-title {
  margin: 0;
  line-height: 1;
  vertical-align: middle;
}

.system-logo {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  vertical-align: middle;
  display: inline-block;
}

.decoration-content {
  text-align: center;
}

.system-title {
  font-size: 36px;
  font-weight: bold;
  margin-bottom: 20px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.system-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 40px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
  opacity: 0.9;
  transition: all 0.3s;
  padding: 12px 20px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.feature-item:hover {
  opacity: 1;
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.2);
}

.feature-item .el-icon {
  font-size: 20px;
}

.login-form {
  flex: 1;
  padding: 40px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 40px;
  text-align: center;
}

.form-header h2 {
  font-size: 28px;
  color: #333;
  margin-bottom: 10px;
  font-weight: 600;
}

.form-header p {
  color: #666;
  font-size: 14px;
}

.login-form-content {
  width: 100%;
}

:deep(.custom-input .el-input__wrapper) {
  height: 54px;
  padding: 0 15px;
  font-size: 19px;
  border-radius: 10px;
  margin-top: 4px;
}

:deep(.custom-input .el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

:deep(.custom-input .el-input__wrapper.is-focus) {
  border-color: #4a90e2;
  box-shadow: 0 0 0 2px rgba(74, 144, 226, 0.1);
}

:deep(.el-form-item__error) {
  font-size: 16px;
  line-height: 1.4;
  padding-top: 4px;
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.forgot-password {
  color: #4a90e2;
  text-decoration: none;
  font-size: 16px;
  transition: color 0.3s;
  cursor: pointer;
}

.forgot-password:hover {
  color: #357abd;
  text-decoration: underline;
}

.login-btn {
  width: 100%;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: none;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(74, 144, 226, 0.4);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  border-color: #dcdfe6;
  border-radius: 8px;
  transition: all 0.3s;
}

.register-btn:hover {
  border-color: #c0c4cc;
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #909399;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  border-bottom: 1px solid #dcdfe6;
}

.divider span {
  padding: 0 20px;
  font-size: 14px;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .login-wrapper {
    flex-direction: column;
    width: 90%;
    height: auto;
    max-width: 500px;
  }

  .login-decoration {
    padding: 40px 30px;
  }

  .login-form {
    padding: 40px 30px;
  }

  .system-title {
    font-size: 28px;
  }
}

@media (max-width: 576px) {
  .login-form {
    padding: 30px 20px;
  }

  .form-header h2 {
    font-size: 24px;
  }
}
</style>
<template>
  <div class="admin-login-page">
    <div class="login-wrap">
      <div class="brand-panel">
        <img class="brand-logo" :src="logoUrl" alt="智学助手" />
        <div class="brand-title">智学助手</div>
        <div class="brand-subtitle">管理员运营中心</div>
      </div>
      <el-card class="login-card">
        <h2>管理端登录</h2>
        <el-form :model="form" label-position="top" @submit.prevent>
          <el-form-item label="账号">
            <el-input v-model="form.identifier" placeholder="请输入管理员账号" />
          </el-form-item>
          <el-form-item label="密码">
            <el-input v-model="form.password" show-password type="password" placeholder="请输入密码" />
          </el-form-item>
          <el-button type="primary" :loading="loading" class="full-btn" @click="handleLogin">登录</el-button>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { adminLogin } from '@/api/admin'
import logoUrl from '@/assets/images/ZhiXue.jpg'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({
  identifier: '',
  password: ''
})

const handleLogin = async () => {
  if (!form.identifier || !form.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  try {
    loading.value = true
    const data = await adminLogin({
      identifier: form.identifier,
      password: form.password,
      remember_me: false
    })
    const token = data?.token
    const userInfo = data?.userInfo
    if (!token || !userInfo?.isAdmin) {
      throw new Error('管理员登录失败')
    }
    localStorage.setItem('access_token', token)
    localStorage.setItem('userInfo', JSON.stringify(userInfo))
    ElMessage.success('登录成功')
    const redirect = route.query.redirect || '/admin/dashboard'
    router.replace(redirect)
  } catch (error) {
    ElMessage.error(error?.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #081a33, #112f57 45%, #214a7a);
  --el-color-primary: #1f4f8a;
  --el-color-primary-light-3: #3f6799;
  --el-color-primary-dark-2: #173e6f;
  --el-font-size-base: 17px;
  padding: 24px;
}

.login-wrap {
  width: min(920px, 100%);
  display: grid;
  grid-template-columns: 1fr 420px;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(5, 18, 37, 0.35);
}

.brand-panel {
  background: linear-gradient(160deg, #0b2343, #123865);
  color: #eaf3ff;
  padding: 52px 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
}

.brand-logo {
  width: 76px;
  height: 76px;
  border-radius: 14px;
  object-fit: cover;
  border: 2px solid rgba(255, 255, 255, 0.25);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.brand-title {
  margin-top: 20px;
  font-size: 34px;
  font-weight: 700;
  line-height: 1.2;
}

.brand-subtitle {
  margin-top: 10px;
  font-size: 20px;
  color: #c7daf8;
}

.login-card {
  width: 100%;
  border: none;
  border-radius: 0;
  background: #ffffff;
  color: #1f2d3d;
  padding: 10px 8px;
}

h2 {
  margin: 0 0 22px;
  text-align: left;
  font-size: 32px;
  color: #0f172a;
}

.full-btn {
  width: 100%;
  height: 44px;
  font-size: 17px;
}

:deep(.el-form-item__label),
:deep(.el-input__inner) {
  font-size: 17px;
}

:deep(.el-input__wrapper) {
  background: #ffffff;
  box-shadow: 0 0 0 1px #cfd8e5 inset;
}

@media (max-width: 860px) {
  .login-wrap {
    grid-template-columns: 1fr;
  }

  .brand-panel {
    align-items: center;
    text-align: center;
    padding: 32px 24px;
  }

  h2 {
    text-align: center;
  }
}
</style>

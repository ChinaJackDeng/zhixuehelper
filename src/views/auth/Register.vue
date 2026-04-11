<template>
  <div class="register-container">
    <div class="background-pattern"></div>

    <div class="register-wrapper">
      <div class="register-form">
        <div class="form-header">
          <h2>注册账号</h2>
          <p>加入智学助手，开启学习之旅</p>
        </div>

        <div class="avatar-section">
          <div class="avatar-preview">
            <img :src="getAvatarUrl(selectedAvatar)" :alt="selectedAvatar" class="preview-img" />
          </div>
          <div class="avatar-choose">
            <span class="choose-label">选择头像</span>
            <div class="avatar-grid">
              <div
                  v-for="avatar in avatarOptions"
                  :key="avatar"
                  class="avatar-item"
                  :class="{ selected: selectedAvatar === avatar }"
                  @click="selectedAvatar = avatar"
              >
                <img :src="getAvatarUrl(avatar)" :alt="avatar" />
                <div v-if="selectedAvatar === avatar" class="avatar-check">
                  <el-icon><Check /></el-icon>
                </div>
              </div>
            </div>
          </div>
        </div>

        <el-form
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules"
            class="register-form-content"
            @submit.prevent="handleRegister"
        >
          <el-form-item prop="username">
            <el-input
                class="custom-input"
                v-model="registerForm.username"
                placeholder="用户名（3-20位）"
                size="large"
                :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="email">
            <el-input
                class="custom-input"
                v-model="registerForm.email"
                placeholder="邮箱"
                size="large"
                :prefix-icon="Message"
            />
          </el-form-item>

          <!-- 验证码输入区域 -->
          <el-form-item prop="verificationCode" class="verification-item">
            <div class="verification-input-wrapper">
              <el-input
                  class="custom-input verification-input"
                  v-model="registerForm.verificationCode"
                  placeholder="邮箱验证码"
                  size="large"
                  :prefix-icon="Key"
                  maxlength="6"
              />
              <el-button
                  type="primary"
                  class="send-code-btn"
                  :loading="sendingCode"
                  :disabled="!canSendCode"
                  @click="handleSendCode"
              >
                {{ countdown > 0 ? `${countdown}s后重发` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input
                class="custom-input"
                v-model="registerForm.password"
                type="password"
                placeholder="密码（至少8位）"
                size="large"
                :prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item prop="confirmPassword">
            <el-input
                class="custom-input"
                v-model="registerForm.confirmPassword"
                type="password"
                placeholder="确认密码"
                size="large"
                :prefix-icon="Lock"
                show-password
            />
          </el-form-item>

          <el-form-item prop="agree">
            <el-checkbox v-model="registerForm.agree">
              我已阅读并同意
              <span class="terms-link" @click="showTerms">《服务协议》</span>
              和
              <span class="terms-link" @click="showPrivacy">《隐私政策》</span>
            </el-checkbox>
          </el-form-item>

          <el-form-item>
            <el-button
                type="primary"
                size="large"
                :loading="registering"
                @click="handleRegister"
                class="register-btn"
            >
              注册
            </el-button>
          </el-form-item>

          <div class="divider">
            <span>已有账号？</span>
          </div>

          <el-form-item>
            <el-button
                type="default"
                size="large"
                class="login-btn"
                @click="$router.push('/login')"
            >
              立即登录
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <div class="register-decoration">
        <div class="decoration-content">
          <div class="logo-title-container">
            <img src="@/assets/images/ZhiXue.jpg" alt="智学助手" class="system-logo" />
            <h3>加入我们，享智能体验</h3>
          </div>
          <div class="benefit-list">
            <div class="benefit-item">
              <el-icon><Collection /></el-icon>
              <div>
                <h4>智能知识库</h4>
                <p>结构化知识管理，快速查找学习资料</p>
              </div>
            </div>
            <div class="benefit-item">
               <el-icon><Edit /></el-icon>
              <div>
                <h4>题卷生成</h4>
                <p>自动生成针对性练习题和试卷</p>
              </div>
            </div>
            <div class="benefit-item">
              <el-icon><TrendCharts /></el-icon>
              <div>
                <h4>个人数据中心</h4>
                <p>学习进度可视化，掌握学习趋势</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  Message,
  Key,
  Lock,
  Collection,
  Edit,
  TrendCharts,
  Check
} from '@element-plus/icons-vue'
// 导入封装好的接口函数
import { userRegister, sendVerificationCode } from '@/api/user'

const router = useRouter()
const registerFormRef = ref()

// 头像选项
const avatarOptions = ['avatar_boy_1.png', 'avatar_boy_2.png', 'avatar_girl_1.png', 'avatar_girl_2.png']
const selectedAvatar = ref('avatar_boy_1.png')

// 获取头像URL
const getAvatarUrl = (avatar) => {
  return `/images/${avatar}`
}

// 表单数据
const registerForm = reactive({
  username: '',
  email: '',
  verificationCode: '',
  password: '',
  confirmPassword: '',
  agree: false
})

// 状态
const sendingCode = ref(false)
const registering = ref(false)
const countdown = ref(0)
let countdownTimer = null
const usernameRegex = /^[a-zA-Z0-9]{3,20}$/

// 计算属性：是否可以发送验证码（用户名与邮箱格式正确 + 倒计时结束）
const canSendCode = computed(() => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  const normalizedUsername = String(registerForm.username || '').trim()
  const normalizedEmail = String(registerForm.email || '').trim().toLowerCase()
  return usernameRegex.test(normalizedUsername) && emailRegex.test(normalizedEmail) && countdown.value === 0
})

// 验证码验证规则
const validateCode = () => {
  if (!registerForm.verificationCode) {
    return Promise.reject('请输入验证码')
  }
  if (registerForm.verificationCode.length !== 6) {
    return Promise.reject('验证码为6位数字')
  }
  return Promise.resolve()
}

// 表单验证规则
const registerRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, message: '用户名至少3个字符', trigger: 'blur' },
    { max: 20, message: '用户名不能超过20个字符', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]+$/, message: '用户名只能使用英文字母和数字', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { 
      type: 'email', 
      message: '请输入正确的邮箱格式', 
      trigger: 'blur' 
    }
  ],
  verificationCode: [
    { 
      validator: (rule, value, callback) => {
        validateCode().then(() => callback()).catch(err => callback(new Error(err)))
      },
      trigger: 'blur'
    }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '密码至少8位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== registerForm.password) {
          callback(new Error('两次密码不一致'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  agree: [
    {
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('请同意协议'))
        } else {
          callback()
        }
      },
      trigger: 'change'
    }
  ]
})

// 开始倒计时
const startCountdown = (seconds = 60) => {
  countdown.value = seconds
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 发送验证码
const handleSendCode = async () => {
  if (!canSendCode.value) return

  try {
    sendingCode.value = true
    
    // 调用发送验证码接口
    const response = await sendVerificationCode({
      username: String(registerForm.username || '').trim(),
      email: String(registerForm.email || '').trim().toLowerCase(),
      purpose: '注册'
    })

    if (response?.status === 'username_required') {
      ElMessage.warning('请先输入用户名')
      return
    }
    if (response?.status === 'username_exists') {
      ElMessage.warning('用户名已存在，请更换后再发送验证码')
      return
    }
    if (response?.status === 'email_exists') {
      ElMessage.warning('该邮箱已被注册，请更换邮箱')
      return
    }
    
    // 开始60秒倒计时
    startCountdown(60)
    
    ElMessage.success({
      message: '验证码已发送到邮箱，请注意查收',
      duration: 3000
    })
    
    // 记录发送记录（用于防刷）
    localStorage.setItem(`last_send_${registerForm.email}`, Date.now())
    
  } catch (error) {
    const errData = error.response?.data
    let errMsg = errData?.detail || error.message || '验证码发送失败，请稍后重试'
    ElMessage.error(errMsg)
  } finally {
    sendingCode.value = false
  }
}

// 注册处理
const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    // 1. 验证表单
    await registerFormRef.value.validate()
    
    registering.value = true
    
    // 2. 组装注册参数
    const registerData = {
      username: String(registerForm.username || '').trim(),
      email: String(registerForm.email || '').trim().toLowerCase(),
      password: registerForm.password,
      code: registerForm.verificationCode,
      avatar: selectedAvatar.value
    }
    
    // 3. 调用注册接口
    await userRegister(registerData)
    
    ElMessage.success({
      message: '注册成功！即将跳转到登录页',
      duration: 2000
    })
    
    // 4. 2秒后跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 2000)
    
  } catch (error) {
    // 处理错误
    if (error.name === 'ValidationError' || error.errors) {
      // Element Plus 表单验证错误
      ElMessage.error('请检查表单输入是否正确')
    } else if (error.response) {
      // 接口返回的错误
      const detail = error.response?.data?.detail || ''
      let errMsg = detail || error.response?.data?.message || '注册失败'
      if (detail.includes('用户名已存在')) {
        errMsg = '用户名已存在，请更换其他用户名'
      } else if (detail.includes('邮箱已被注册')) {
        errMsg = '该邮箱已被注册，请更换其他邮箱'
      }
      ElMessage.error(errMsg)
    } else {
      // 网络或其他错误
      ElMessage.error(error.message || '注册失败，请稍后重试')
    }
  } finally {
    registering.value = false
  }
}

// 显示协议（占位）
const showTerms = () => {
  ElMessage.info('服务协议功能开发中')
}

const showPrivacy = () => {
  ElMessage.info('隐私政策功能开发中')
}

// 监听邮箱变化，清空验证码
watch(() => registerForm.email, (newEmail, oldEmail) => {
  if (newEmail !== oldEmail && registerForm.verificationCode) {
    registerForm.verificationCode = ''
  }
})

// 组件卸载时清理定时器
onUnmounted(() => {
  clearInterval(countdownTimer)
})
</script>

<style scoped>
.register-container {
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

.register-wrapper {
  display: flex;
  width: 900px;
  min-height: 700px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(74, 144, 226, 0.2);
  overflow: visible;
}

.register-form {
  flex: 1.2;
  padding: 40px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-header {
  margin-bottom: 24px;
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

.register-form-content {
  width: 100%;
}

/* 自定义输入框 */
:deep(.custom-input .el-input__wrapper) {
  height: 53px;
  padding: 0 14px;
  font-size: 19px;
  border-radius: 10px;
  transition: all 0.3s;
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
  padding-top: 5px;
}

/* 验证码输入区域 */
.verification-item {
  margin-bottom: 20px;
}

.verification-input-wrapper {
  display: flex;
  gap: 12px;
  width: 100%;
}

.verification-input {
  flex: 1;
}

.send-code-btn {
  min-width: 120px;
  height: 56px;
  font-size: 14px;
  border-radius: 10px;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: none;
  transition: all 0.3s;
  white-space: nowrap;
}

.send-code-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.send-code-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #a0cfff;
}

.terms-link {
  color: #4a90e2;
  cursor: pointer;
  transition: color 0.3s;
  font-size: 16px;
}

.terms-link:hover {
  color: #357abd;
  text-decoration: underline;
}

.register-btn {
  width: 100%;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: none;
  height: 56px;
  font-size: 16px;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.3s;
  margin-top: 10px;
}

.register-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(74, 144, 226, 0.4);
}

.register-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-btn {
  width: 100%;
  height: 56px;
  font-size: 16px;
  border-color: #dcdfe6;
  border-radius: 10px;
  transition: all 0.3s;
}

.login-btn:hover {
  border-color: #c0c4cc;
  background-color: #f5f7fa;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.divider {
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 20px 0;
  color: #909399;
  font-size: 14px;
}

.register-decoration {
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
  margin-bottom: 40px;
}

.decoration-content .logo-title-container h3 {
  margin: 0;
  line-height: 1;
  vertical-align: middle;
  font-size: 24px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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

.decoration-content h3 {
  font-size: 24px;
  margin-bottom: 40px;
  text-align: center;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 12px;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.benefit-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.benefit-item .el-icon {
  font-size: 24px;
  color: white;
  margin-top: 4px;
  flex-shrink: 0;
}

.benefit-item h4 {
  font-size: 18px;
  margin-bottom: 8px;
  font-weight: 600;
  color: white;
}

.benefit-item p {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.5;
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
}

/* 响应式设计 */
@media (max-width: 992px) {
  .register-wrapper {
    flex-direction: column;
    width: 90%;
    height: auto;
    max-width: 500px;
  }
  
  .register-form {
    padding: 40px 30px;
  }
  
  .register-decoration {
    padding: 40px 30px;
  }
  
  .benefit-list {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .benefit-item {
    flex: 1;
    min-width: 200px;
  }
}

@media (max-width: 576px) {
  .register-form {
    padding: 30px 20px;
  }
  
  .verification-input-wrapper {
    flex-direction: column;
  }
  
  .send-code-btn {
    width: 100%;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
}

/* 头像选择区域 */
.avatar-section {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8f4fd 100%);
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
}

.avatar-preview {
  flex-shrink: 0;
}

.preview-img {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #4a90e2;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.avatar-choose {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choose-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.avatar-grid {
  display: flex;
  gap: 8px;
}

.avatar-item {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  overflow: hidden;
  cursor: pointer;
  position: relative;
  border: 3px solid transparent;
  transition: all 0.3s ease;
  background: white;
}

.avatar-item:hover {
  transform: scale(1.08);
  border-color: #a0cfff;
}

.avatar-item.selected {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.25);
}

.avatar-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-check {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  background: #4a90e2;
  color: white;
  width: 18px;
  height: 18px;
  border-radius: 50% 50% 0 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-check .el-icon {
  font-size: 10px;
  margin-top: 2px;
}

@media (max-width: 576px) {
  .avatar-section {
    flex-direction: column;
    gap: 12px;
  }

  .avatar-grid {
    justify-content: center;
  }
}
</style>

<!-- src/views/auth/ForgotPassword.vue -->
<template>
  <div class="forgot-password-container">
    <div class="background-pattern"></div>

    <div class="forgot-password-wrapper">
      <!-- 左侧装饰区 -->
      <div class="forgot-decoration">
        <div class="decoration-content">
          <h1 class="system-title">重置密码</h1>
          <p class="system-subtitle">通过邮箱验证重新设置您的密码</p>
          <div class="step-guide">
            <div class="step-item" :class="{ active: currentStep >= 1 }">
              <div class="step-number">1</div>
              <div class="step-info">
                <h4>验证邮箱</h4>
                <p>输入注册时使用的邮箱地址</p>
              </div>
            </div>
            <div class="step-item" :class="{ active: currentStep >= 2 }">
              <div class="step-number">2</div>
              <div class="step-info">
                <h4>验证码验证</h4>
                <p>输入收到的验证码</p>
              </div>
            </div>
            <div class="step-item" :class="{ active: currentStep >= 3 }">
              <div class="step-number">3</div>
              <div class="step-info">
                <h4>设置新密码</h4>
                <p>设置您的新密码</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧表单区 -->
      <div class="forgot-form">
        <div class="form-header">
          <h2>找回密码</h2>
          <p>请按照步骤重置您的密码</p>
        </div>

        <!-- 步骤1: 输入邮箱 -->
        <div v-if="currentStep === 1" class="step-content">
          <el-form
            ref="emailFormRef"
            :model="formData"
            :rules="emailRules"
            class="form-content"
            @submit.prevent="handleSendCode"
          >
            <el-form-item prop="email">
              <el-input
                v-model="formData.email"
                placeholder="请输入注册邮箱"
                size="large"
                :prefix-icon="Message"
                class="form-input"
              />
            </el-form-item>

            <el-button
              type="primary"
              size="large"
              :loading="sendingCode"
              @click="handleSendCode"
              class="action-btn"
            >
              发送验证码
            </el-button>

            <div class="back-login">
              <el-button
                type="text"
                class="back-btn"
                @click="$router.push('/login')"
              >
                <el-icon><ArrowLeft /></el-icon>
                返回登录
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 步骤2: 输入验证码 -->
        <div v-else-if="currentStep === 2" class="step-content">
          <el-form
            ref="codeFormRef"
            :model="formData"
            :rules="codeRules"
            class="form-content"
            @submit.prevent="handleVerifyCode"
          >
            <div class="email-hint">
              <el-icon><Message /></el-icon>
              <span>验证码已发送至：{{ formData.email }}</span>
            </div>

            <el-form-item prop="code">
              <el-input
                v-model="formData.code"
                placeholder="请输入6位验证码"
                size="large"
                :prefix-icon="Key"
                maxlength="6"
                class="form-input"
                @input="handleCodeInput"
              />
            </el-form-item>

            <div class="code-resend">
              <span v-if="countdown > 0" class="countdown">
                {{ countdown }}秒后重新发送
              </span>
              <el-button
                v-else
                type="text"
                :disabled="countdown > 0"
                @click="handleResendCode"
                class="resend-btn"
              >
                重新发送验证码
              </el-button>
            </div>

            <div class="step-actions">
              <el-button
                type="default"
                size="large"
                @click="currentStep = 1"
                class="back-step-btn"
              >
                上一步
              </el-button>
              <el-button
                type="primary"
                size="large"
                :loading="verifyingCode"
                @click="handleVerifyCode"
                class="action-btn"
              >
                验证验证码
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 步骤3: 设置新密码 -->
        <div v-else class="step-content">
          <el-form
            ref="passwordFormRef"
            :model="formData"
            :rules="passwordRules"
            class="form-content"
            @submit.prevent="handleResetPassword"
          >
            <el-form-item prop="newPassword">
              <el-input
                v-model="formData.newPassword"
                type="password"
                placeholder="请输入新密码（6-20位字符）"
                size="large"
                :prefix-icon="Lock"
                show-password
                class="form-input"
              />
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <el-input
                v-model="formData.confirmPassword"
                type="password"
                placeholder="请确认新密码"
                size="large"
                :prefix-icon="Lock"
                show-password
                class="form-input"
                @blur="validatePasswordMatch"
              />
            </el-form-item>

            <div class="password-strength">
              <div class="strength-title">密码强度：</div>
              <div class="strength-bar">
                <div 
                  class="strength-segment" 
                  :class="{
                    weak: passwordStrength === 'weak',
                    medium: passwordStrength === 'medium' || passwordStrength === 'strong',
                    strong: passwordStrength === 'strong'
                  }"
                ></div>
                <div 
                  class="strength-segment" 
                  :class="{
                    medium: passwordStrength === 'medium' || passwordStrength === 'strong',
                    strong: passwordStrength === 'strong'
                  }"
                ></div>
                <div 
                  class="strength-segment" 
                  :class="{ strong: passwordStrength === 'strong' }"
                ></div>
              </div>
              <div class="strength-text">{{ passwordStrengthText }}</div>
            </div>

            <div class="step-actions">
              <el-button
                type="default"
                size="large"
                @click="currentStep = 2"
                class="back-step-btn"
              >
                上一步
              </el-button>
              <el-button
                type="primary"
                size="large"
                :loading="resettingPassword"
                @click="handleResetPassword"
                class="action-btn"
              >
                重置密码
              </el-button>
            </div>
          </el-form>
        </div>

        <!-- 进度指示器 -->
        <div class="progress-indicator">
          <div class="progress-steps">
            <div 
              v-for="step in 3" 
              :key="step"
              class="step-dot"
              :class="{ active: currentStep >= step, current: currentStep === step }"
            ></div>
          </div>
          <div class="progress-text">步骤 {{ currentStep }}/3</div>
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
  Message, 
  Key, 
  Lock, 
  ArrowLeft 
} from '@element-plus/icons-vue'
import { sendVerificationCode, verifyCode, forgotPassword } from '@/api/user'

const router = useRouter()

// 状态管理
const currentStep = ref(1)
const sendingCode = ref(false)
const verifyingCode = ref(false)
const resettingPassword = ref(false)
const countdown = ref(0)
let countdownTimer = null

// 表单数据
const formData = reactive({
  email: '',
  code: '',
  newPassword: '',
  confirmPassword: ''
})

// 表单引用
const emailFormRef = ref()
const codeFormRef = ref()
const passwordFormRef = ref()

// 验证规则
const emailRules = reactive({
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
})

const codeRules = reactive({
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { min: 6, max: 6, message: '验证码为6位数字', trigger: 'blur' },
    { pattern: /^\d{6}$/, message: '验证码必须为6位数字', trigger: 'blur' }
  ]
})

const passwordRules = reactive({
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { max: 20, message: '密码长度不能超过20位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== formData.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
})

// 计算密码强度
const passwordStrength = computed(() => {
  const password = formData.newPassword
  if (!password) return 'none'
  
  let strength = 0
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'medium'
  return 'strong'
})

const passwordStrengthText = computed(() => {
  const map = {
    none: '无',
    weak: '弱',
    medium: '中',
    strong: '强'
  }
  return map[passwordStrength.value]
})

// 监听密码变化
watch(() => formData.newPassword, () => {
  if (formData.confirmPassword && formData.newPassword !== formData.confirmPassword) {
    passwordFormRef.value?.validateField('confirmPassword')
  }
})

// 验证码输入处理
const handleCodeInput = (value) => {
  formData.code = value.replace(/\D/g, '')
  if (value.length === 6) {
    handleVerifyCode()
  }
}

// 验证密码是否匹配
const validatePasswordMatch = () => {
  if (formData.confirmPassword && formData.newPassword) {
    passwordFormRef.value?.validateField('confirmPassword')
  }
}

// 发送验证码
const handleSendCode = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    sendingCode.value = true
    
    const response = await sendVerificationCode({
      email: formData.email,
      purpose: 'forgot_password'
    })
    
    sendingCode.value = false
    ElMessage.success(response.message || '验证码已发送，请查收邮箱')
    startCountdown()
    currentStep.value = 2
  } catch (error) {
    sendingCode.value = false
    ElMessage.error(error.message || '验证码发送失败')
  }
}

// 重新发送验证码
const handleResendCode = async () => {
  if (!emailFormRef.value) return

  try {
    await emailFormRef.value.validate()
    sendingCode.value = true
    
    const response = await sendVerificationCode({
      email: formData.email,
      purpose: 'forgot_password'
    })
    
    sendingCode.value = false
    ElMessage.success(response.message || '验证码已重新发送')
    startCountdown()
  } catch (error) {
    sendingCode.value = false
    ElMessage.error(error.message || '验证码发送失败')
  }
}

// 开始倒计时
const startCountdown = () => {
  countdown.value = 60
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--
    } else {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 验证验证码
const handleVerifyCode = async () => {
  if (!codeFormRef.value) return

  try {
    await codeFormRef.value.validate()
    verifyingCode.value = true
    
    const response = await verifyCode({
      email: formData.email,
      code: formData.code
    })
    
    verifyingCode.value = false
    ElMessage.success(response.message || '验证码验证成功')
    currentStep.value = 3
  } catch (error) {
    verifyingCode.value = false
    ElMessage.error(error.message || '验证码验证失败')
  }
}

// 重置密码
const handleResetPassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    resettingPassword.value = true
    
    const response = await forgotPassword({
      email: formData.email,
      code: formData.code,
      new_password: formData.newPassword
    })
    
    resettingPassword.value = false
    ElMessage.success(response.message || '密码重置成功，请重新登录')
    
    // 清空表单
    formData.newPassword = ''
    formData.confirmPassword = ''
    formData.code = ''
    
    // 跳转到登录页
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (error) {
    resettingPassword.value = false
    ElMessage.error(error.message || '密码重置失败')
  }
}

// 清理定时器
onUnmounted(() => {
  clearInterval(countdownTimer)
})
</script>

<style scoped>
.forgot-password-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.background-pattern {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

.forgot-password-wrapper {
  display: flex;
  width: 100%;
  max-width: 1000px;
  height: 600px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 40px rgba(74, 144, 226, 0.2);
  overflow: hidden;
}

/* 左侧装饰区 */
.forgot-decoration {
  flex: 1;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  color: white;
  padding: 60px 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
  margin-bottom: 50px;
}

.step-guide {
  display: flex;
  flex-direction: column;
  gap: 30px;
  max-width: 300px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 20px;
  opacity: 0.6;
  transition: all 0.3s;
}

.step-item.active {
  opacity: 1;
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.step-item.active .step-number {
  background: white;
  color: #4a90e2;
  border-color: white;
}

.step-info h4 {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px 0;
  text-align: left;
}

.step-info p {
  font-size: 14px;
  margin: 0;
  opacity: 0.8;
  text-align: left;
}

/* 右侧表单区 */
.forgot-form {
  flex: 1;
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
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

/* 步骤内容 */
.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.form-content {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.form-input {
  width: 100%;
}

.form-input :deep(.el-input__wrapper) {
  height: 52px;
  border-radius: 10px;
  border: 2px solid #e4e7ed;
  transition: all 0.3s;
  font-size: 15px;
}

.form-input :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.form-input :deep(.el-input__wrapper.is-focus) {
  border-color: #4a90e2;
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

/* 邮箱提示 */
.email-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f6f9ff;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  color: #666;
  border: 1px solid #e4e7ed;
}

.email-hint .el-icon {
  color: #4a90e2;
}

/* 验证码重发 */
.code-resend {
  text-align: center;
  margin: 20px 0 30px;
}

.countdown {
  color: #999;
  font-size: 14px;
}

.resend-btn {
  color: #4a90e2;
  font-weight: 500;
}

.resend-btn:hover {
  color: #357abd;
}

/* 上一步/下一步按钮 */
.step-actions {
  display: flex;
  gap: 16px;
  margin-top: 30px;
}

.back-step-btn {
  flex: 1;
  height: 52px;
  border-color: #dcdfe6;
  border-radius: 10px;
  font-size: 16px;
  transition: all 0.3s;
}

.back-step-btn:hover {
  border-color: #c0c4cc;
  background-color: #f5f7fa;
  transform: translateY(-1px);
}

.action-btn {
  flex: 2;
  height: 52px;
  background: linear-gradient(135deg, #4a90e2 0%, #357abd 100%);
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(74, 144, 226, 0.3);
}

.action-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 返回登录 */
.back-login {
  text-align: center;
  margin-top: 30px;
}

.back-btn {
  color: #4a90e2;
  font-weight: 500;
}

.back-btn:hover {
  color: #357abd;
}

.back-btn .el-icon {
  margin-right: 6px;
}

/* 密码强度 */
.password-strength {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 20px 0 30px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
}

.strength-title {
  font-size: 14px;
  color: #666;
  white-space: nowrap;
}

.strength-bar {
  display: flex;
  gap: 4px;
  flex: 1;
}

.strength-segment {
  flex: 1;
  height: 6px;
  background: #e4e7ed;
  border-radius: 3px;
  transition: all 0.3s;
}

.strength-segment.weak {
  background: #f56c6c;
}

.strength-segment.medium {
  background: #e6a23c;
}

.strength-segment.strong {
  background: #67c23a;
}

.strength-text {
  font-size: 14px;
  font-weight: 500;
  min-width: 40px;
  text-align: center;
}

.strength-segment.weak ~ .strength-text {
  color: #f56c6c;
}

.strength-segment.medium ~ .strength-text {
  color: #e6a23c;
}

.strength-segment.strong ~ .strength-text {
  color: #67c23a;
}

/* 进度指示器 */
.progress-indicator {
  position: absolute;
  bottom: 30px;
  left: 0;
  right: 0;
  text-align: center;
}

.progress-steps {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e4e7ed;
  transition: all 0.3s;
}

.step-dot.active {
  background: #4a90e2;
}

.step-dot.current {
  width: 12px;
  height: 12px;
  background: #357abd;
}

.progress-text {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 992px) {
  .forgot-password-wrapper {
    flex-direction: column;
    height: auto;
    max-width: 500px;
  }
  
  .forgot-decoration {
    padding: 40px 20px;
  }
  
  .forgot-form {
    padding: 40px 30px;
  }
  
  .step-guide {
    max-width: 100%;
  }
  
  .step-item {
    justify-content: center;
  }
  
  .system-title {
    font-size: 28px;
  }
}

@media (max-width: 576px) {
  .forgot-password-container {
    padding: 10px;
  }
  
  .forgot-form {
    padding: 30px 20px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .step-actions {
    flex-direction: column;
  }
  
  .back-step-btn,
  .action-btn {
    width: 100%;
  }
}
</style>
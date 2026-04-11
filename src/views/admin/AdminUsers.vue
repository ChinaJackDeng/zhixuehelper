<template>
  <el-card>
    <template #header>
      <div class="header-row">
        <span>用户管理</span>
        <div class="header-actions">
          <el-input
            v-model="keyword"
            placeholder="按用户名或邮箱搜索"
            clearable
            style="width: 260px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          />
          <el-button @click="handleSearch">查询</el-button>
        </div>
      </div>
    </template>

    <el-table :data="rows" v-loading="loading" style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column prop="username" label="用户名" min-width="160" />
      <el-table-column prop="email" label="邮箱" min-width="220" />
      <el-table-column prop="role" label="角色" width="130">
        <template #default="{ row }">
          <el-tag :type="row.role === 'admin' ? 'danger' : 'info'">
            {{ row.role }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" min-width="180">
        <template #default="{ row }">
          {{ formatTime(row.created_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.role !== 'admin'"
            type="danger"
            link
            :loading="updatingMap[row.id]"
            @click="changeRole(row, 'admin')"
          >
            设为管理员
          </el-button>
          <el-button
            v-else
            type="primary"
            link
            :loading="updatingMap[row.id]"
            @click="changeRole(row, 'user')"
          >
            设为普通用户
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pager-wrap">
      <el-pagination
        background
        layout="total, prev, pager, next, sizes"
        :total="total"
        :page-size="pageSize"
        :current-page="page"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handlePageChange"
        @size-change="handleSizeChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getAdminUsers, updateAdminUserRole } from '@/api/admin'

const loading = ref(false)
const rows = ref([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const updatingMap = reactive({})

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await getAdminUsers({
      offset: (page.value - 1) * pageSize.value,
      limit: pageSize.value,
      keyword: keyword.value
    })
    rows.value = Array.isArray(data?.items) ? data.items : []
    total.value = Number(data?.total || 0)
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  page.value = 1
  await fetchUsers()
}

const handlePageChange = async (value) => {
  page.value = value
  await fetchUsers()
}

const handleSizeChange = async (value) => {
  pageSize.value = value
  page.value = 1
  await fetchUsers()
}

const changeRole = async (row, role) => {
  const actionText = role === 'admin' ? '设为管理员' : '设为普通用户'
  try {
    await ElMessageBox.confirm(`确认将 ${row.username} ${actionText}吗？`, '提示', {
      type: 'warning'
    })
    updatingMap[row.id] = true
    await updateAdminUserRole(row.id, role)
    ElMessage.success('角色更新成功')
    await fetchUsers()
  } catch (error) {
    if (error === 'cancel' || error === 'close') {
      return
    }
    throw error
  } finally {
    updatingMap[row.id] = false
  }
}

const formatTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const yyyy = date.getFullYear()
  const mm = `${date.getMonth() + 1}`.padStart(2, '0')
  const dd = `${date.getDate()}`.padStart(2, '0')
  const hh = `${date.getHours()}`.padStart(2, '0')
  const mi = `${date.getMinutes()}`.padStart(2, '0')
  const ss = `${date.getSeconds()}`.padStart(2, '0')
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`
}

onMounted(fetchUsers)
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.pager-wrap {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>

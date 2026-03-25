# 智学助手 API 文档

## 概述

智学助手是一个基于大语言模型的个性化学习系统，提供知识库管理、智能练习、学习分析等功能。

**Base URL**: `http://localhost:8000/api`

**认证方式**: Bearer Token (在请求头中携带 `Authorization: Bearer {token}`)

---

## 目录

- [认证模块](#认证模块)
- [用户模块](#用户模块)
- [知识库模块](#知识库模块)
- [练习模块](#练习模块)
- [考试模块](#考试模块)
- [分析模块](#分析模块)
- [错题本模块](#错题本模块)
- [响应格式](#响应格式)
- [错误码](#错误码)

---

## 认证模块

### 1. 用户登录

**接口地址**: `POST /auth/login/`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名或邮箱 |
| password | string | 是 | 密码 |

**请求示例**:
```json
{
  "username": "user@example.com",
  "password": "password123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "1",
      "username": "user@example.com",
      "nickname": "张三",
      "avatar": "https://example.com/avatar.jpg"
    }
  }
}
```

---

### 2. 用户注册

**接口地址**: `POST /auth/register/`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名（3-20位） |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（至少8位） |
| code | string | 是 | 邮箱验证码 |

**请求示例**:
```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "code": "123456"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "2",
      "username": "newuser",
      "email": "newuser@example.com"
    }
  }
}
```

---

### 3. 用户登出

**接口地址**: `POST /auth/logout/`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登出成功"
}
```

---

### 4. 发送验证码

**接口地址**: `POST /user/send_code`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 接收验证码的邮箱 |
| purpose | string | 否 | 验证码用途（register/forgot_password等），默认为register |

**请求示例**:
```json
{
  "email": "user@example.com",
  "purpose": "register"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "验证码已发送"
}
```

---

### 5. 找回密码

**接口地址**: `POST /user/forgot_password`

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| email | string | 是 | 邮箱地址 |
| code | string | 是 | 邮箱验证码 |
| new_password | string | 是 | 新密码 |

**请求示例**:
```json
{
  "email": "user@example.com",
  "code": "123456",
  "new_password": "newpassword123"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "密码重置成功"
}
```

---

## 用户模块

### 1. 获取用户信息

**接口地址**: `GET /user/info`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "1",
    "username": "user@example.com",
    "nickname": "张三",
    "email": "user@example.com",
    "avatar": "https://example.com/avatar.jpg",
    "created_at": "2024-01-01T00:00:00Z",
    "last_login": "2024-01-25T10:30:00Z"
  }
}
```

---

### 2. 更新用户信息

**接口地址**: `PUT /user/update`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| nickname | string | 否 | 昵称 |
| email | string | 否 | 邮箱 |
| avatar | string | 否 | 头像URL |

**请求示例**:
```json
{
  "nickname": "李四",
  "avatar": "https://example.com/new-avatar.jpg"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "1",
    "username": "user@example.com",
    "nickname": "李四",
    "avatar": "https://example.com/new-avatar.jpg"
  }
}
```

---

### 3. 修改密码

**接口地址**: `PUT /user/password`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码 |

**请求示例**:
```json
{
  "old_password": "oldpassword123",
  "new_password": "newpassword456"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "密码修改成功"
}
```

---

## 知识库模块

### 1. 获取文档列表

**接口地址**: `GET /knowledge/documents`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认12 |
| tags | string | 否 | 标签ID，多个用逗号分隔 |
| keyword | string | 否 | 搜索关键词 |

**请求示例**:
```
GET /knowledge/documents?page=1&page_size=12&tags=1,2&keyword=JavaScript
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "documents": [
      {
        "id": "1",
        "title": "JavaScript 基础知识",
        "content": "JavaScript是一种解释型、即时编译型的编程语言...",
        "type": "text",
        "tags": [
          { "id": "1", "name": "JavaScript", "color": "#f39c12" },
          { "id": "2", "name": "前端开发", "color": "#3498db" }
        ],
        "chunk_count": 5,
        "size": 2048,
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:20:00Z",
        "creator": { "id": "1", "name": "张三" },
        "last_accessed": "2024-01-25T09:15:00Z",
        "access_count": 12
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 12,
      "total": 25,
      "total_pages": 3
    }
  }
}
```

---

### 2. 上传文档

**接口地址**: `POST /knowledge/documents/upload`

**请求头**:
```
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| file | File | 是 | 文件对象 |
| tags | string | 否 | 标签ID，多个用逗号分隔 |

**请求示例**:
```
POST /knowledge/documents/upload
Content-Type: multipart/form-data

file: [binary data]
tags: 1,2,3
```

**响应示例**:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "id": "26",
    "title": "uploaded_file.pdf",
    "type": "pdf",
    "size": 1024000,
    "chunk_count": 10,
    "created_at": "2024-01-25T11:00:00Z"
  }
}
```

---

### 3. 创建文本文档

**接口地址**: `POST /knowledge/documents/text`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| title | string | 是 | 文档标题 |
| content | string | 是 | 文档内容 |
| tags | string | 否 | 标签ID，多个用逗号分隔 |

**请求示例**:
```json
{
  "title": "Vue 3 核心概念",
  "content": "Vue 3 引入了 Composition API...",
  "tags": "3,2"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "27",
    "title": "Vue 3 核心概念",
    "type": "text",
    "chunk_count": 1,
    "created_at": "2024-01-25T11:05:00Z"
  }
}
```

---

### 4. 获取文档详情

**接口地址**: `GET /knowledge/documents/{document_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| document_id | string | 是 | 文档ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "1",
    "title": "JavaScript 基础知识",
    "content": "完整文档内容...",
    "type": "text",
    "tags": [...],
    "chunks": [
      {
        "id": "1",
        "content": "第一段内容...",
        "embedding": [0.1, 0.2, ...]
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:20:00Z"
  }
}
```

---

### 5. 删除文档

**接口地址**: `DELETE /knowledge/documents/{document_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| document_id | string | 是 | 文档ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

### 6. 获取标签列表

**接口地址**: `GET /knowledge/tags`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "id": "1",
      "name": "JavaScript",
      "color": "#f39c12",
      "doc_count": 5,
      "created_by": "system"
    },
    {
      "id": "2",
      "name": "前端开发",
      "color": "#3498db",
      "doc_count": 12,
      "created_by": "system"
    }
  ]
}
```

---

### 7. 创建标签

**接口地址**: `POST /knowledge/tags`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| name | string | 是 | 标签名称 |
| color | string | 否 | 标签颜色，默认#409EFF |

**请求示例**:
```json
{
  "name": "Python",
  "color": "#3776ab"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "9",
    "name": "Python",
    "color": "#3776ab",
    "doc_count": 0,
    "created_by": "user"
  }
}
```

---

### 8. 删除标签

**接口地址**: `DELETE /knowledge/tags/{tag_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tag_id | string | 是 | 标签ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

### 9. 为文档添加标签

**接口地址**: `POST /knowledge/documents/{document_id}/tags`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| document_id | string | 是 | 文档ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| tag_ids | array | 是 | 标签ID数组 |

**请求示例**:
```json
{
  "tag_ids": ["1", "2", "3"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "标签添加成功"
}
```

---

### 10. 从文档移除标签

**接口地址**: `DELETE /knowledge/documents/{document_id}/tags/{tag_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| document_id | string | 是 | 文档ID |
| tag_id | string | 是 | 标签ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "标签移除成功"
}
```

---

## 练习模块

### 1. 获取题目集列表

**接口地址**: `GET /practice/sets`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "sets": [
      {
        "id": "1",
        "name": "JavaScript 基础题集",
        "description": "JavaScript基础知识练习",
        "question_count": 20,
        "created_at": "2024-01-15T10:00:00Z",
        "updated_at": "2024-01-20T14:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 10,
      "total": 15,
      "total_pages": 2
    }
  }
}
```

---

### 2. 获取题目集详情

**接口地址**: `GET /practice/sets/{set_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| set_id | string | 是 | 题目集ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "1",
    "name": "JavaScript 基础题集",
    "description": "JavaScript基础知识练习",
    "questions": [
      {
        "id": "1",
        "type": "single",
        "question": "JavaScript中，以下哪个是基本数据类型？",
        "options": ["String", "Array", "Object", "Function"],
        "answer": "A",
        "explanation": "String是JavaScript的基本数据类型之一",
        "knowledge": "数据类型",
        "difficulty": "easy"
      }
    ],
    "question_count": 20
  }
}
```

---

### 3. 保存单题答案

**接口地址**: `POST /practice/answers`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| practice_id | string | 是 | 练习ID |
| question_id | string | 是 | 题目ID |
| answer | string | 是 | 用户答案 |
| mode | string | 是 | 模式（practice/exam） |

**请求示例**:
```json
{
  "practice_id": "1",
  "question_id": "1",
  "answer": "A",
  "mode": "practice"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "答案保存成功",
  "data": {
    "is_correct": true,
    "correct_answer": "A"
  }
}
```

---

### 4. 批量提交答案

**接口地址**: `POST /practice/submit`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| practice_id | string | 是 | 练习ID |
| answers | array | 是 | 答案数组 |
| mode | string | 是 | 模式（practice/exam） |

**请求示例**:
```json
{
  "practice_id": "1",
  "answers": [
    { "question_id": "1", "answer": "A" },
    { "question_id": "2", "answer": "B" }
  ],
  "mode": "exam"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "提交成功",
  "data": {
    "practice_id": "1",
    "score": 85,
    "correct_count": 17,
    "total_count": 20,
    "duration": 1800
  }
}
```

---

### 5. 获取练习报告

**接口地址**: `GET /practice/{practice_id}/report`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| practice_id | string | 是 | 练习ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "practice_id": "1",
    "set_name": "JavaScript 基础题集",
    "score": 85,
    "correct_count": 17,
    "total_count": 20,
    "duration": 1800,
    "start_time": "2024-01-25T10:00:00Z",
    "end_time": "2024-01-25T10:30:00Z",
    "question_details": [
      {
        "question_id": "1",
        "user_answer": "A",
        "correct_answer": "A",
        "is_correct": true,
        "time_spent": 30
      }
    ]
  }
}
```

---

### 6. 获取已完成的练习记录

**接口地址**: `GET /practice/completed`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| set_id | string | 否 | 题目集ID筛选 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "practices": [
      {
        "id": "1",
        "set_name": "JavaScript 基础题集",
        "score": 85,
        "completed_at": "2024-01-25T10:30:00Z",
        "duration": 1800
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 10,
      "total": 5,
      "total_pages": 1
    }
  }
}
```

---

### 7. 更新题目标记/备注

**接口地址**: `PUT /practice/questions/{question_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| question_id | string | 是 | 题目ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| mark | string | 否 | 标记（important/difficult等） |
| note | string | 否 | 备注 |

**请求示例**:
```json
{
  "mark": "important",
  "note": "这道题需要重点复习"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "更新成功"
}
```

---

### 8. 将题目加入错题本

**接口地址**: `POST /practice/wrong/{question_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| question_id | string | 是 | 题目ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_answer | string | 是 | 用户答案 |
| note | string | 否 | 备注 |

**请求示例**:
```json
{
  "user_answer": "B",
  "note": "混淆了Array和Object"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "已加入错题本"
}
```

---

## 考试模块

### 1. 生成试卷

**接口地址**: `POST /exam/generate`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| knowledge_points | array | 是 | 知识点ID数组 |
| difficulty | string | 否 | 难度（easy/medium/hard），默认medium |
| question_count | integer | 否 | 题目数量，默认20 |
| question_types | array | 否 | 题型（single/multiple/fill/essay） |

**请求示例**:
```json
{
  "knowledge_points": ["1", "2"],
  "difficulty": "medium",
  "question_count": 20,
  "question_types": ["single", "multiple"]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "试卷生成成功",
  "data": {
    "exam_id": "1",
    "questions": [
      {
        "id": "1",
        "type": "single",
        "question": "题目内容...",
        "options": ["A", "B", "C", "D"],
        "knowledge": "数据类型"
      }
    ],
    "total_count": 20
  }
}
```

---

### 2. 提交试卷

**接口地址**: `POST /exam/{exam_id}/submit`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| exam_id | string | 是 | 考试ID |

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| answers | array | 是 | 答案数组 |

**请求示例**:
```json
{
  "answers": [
    { "question_id": "1", "answer": "A" },
    { "question_id": "2", "answer": "B" }
  ]
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "提交成功",
  "data": {
    "exam_id": "1",
    "score": 90,
    "correct_count": 18,
    "total_count": 20,
    "rank": 5
  }
}
```

---

## 分析模块

### 1. 获取学习统计数据

**接口地址**: `GET /analytics/stats`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 否 | 时间周期（week/month/year），默认week |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "period": "week",
    "total_questions": 150,
    "correct_rate": 0.85,
    "study_duration": 7200,
    "wrong_count": 23,
    "knowledge_points_learned": 15
  }
}
```

---

### 2. 获取知识点掌握雷达图数据

**接口地址**: `GET /analytics/knowledge-radar`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "name": "数据类型",
      "score": 85
    },
    {
      "name": "函数",
      "score": 72
    },
    {
      "name": "对象",
      "score": 90
    },
    {
      "name": "数组",
      "score": 68
    },
    {
      "name": "异步编程",
      "score": 55
    }
  ]
}
```

---

### 3. 获取学习趋势数据

**接口地址**: `GET /analytics/trend`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| type | string | 否 | 数据类型（questions/duration），默认questions |
| period | string | 否 | 时间周期（week/month/year），默认week |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "type": "questions",
    "period": "week",
    "trend": [
      { "date": "2024-01-19", "value": 20 },
      { "date": "2024-01-20", "value": 25 },
      { "date": "2024-01-21", "value": 18 },
      { "date": "2024-01-22", "value": 30 },
      { "date": "2024-01-23", "value": 22 },
      { "date": "2024-01-24", "value": 28 },
      { "date": "2024-01-25", "value": 35 }
    ]
  }
}
```

---

### 4. 获取错题分布数据

**接口地址**: `GET /analytics/error-distribution`

**请求头**:
```
Authorization: Bearer {token}
```

**响应示例**:
```json
{
  "code": 200,
  "data": [
    {
      "knowledge_point": "异步编程",
      "count": 8,
      "percentage": 35
    },
    {
      "knowledge_point": "数组方法",
      "count": 6,
      "percentage": 26
    },
    {
      "knowledge_point": "闭包",
      "count": 5,
      "percentage": 22
    },
    {
      "knowledge_point": "原型链",
      "count": 4,
      "percentage": 17
    }
  ]
}
```

---

### 5. 生成AI学习建议

**接口地址**: `POST /analytics/generate-advice`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| user_id | string | 是 | 用户ID |
| period | string | 否 | 分析周期，默认week |

**请求示例**:
```json
{
  "user_id": "1",
  "period": "week"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "advice": "根据你本周的学习情况，建议重点复习异步编程和数组方法。你的正确率为85%，表现不错！建议每天保持20-30道的练习量。",
    "recommendations": [
      {
        "type": "knowledge",
        "content": "重点复习异步编程相关知识点"
      },
      {
        "type": "practice",
        "content": "每天完成20道数组方法相关题目"
      }
    ]
  }
}
```

---

### 6. 生成周期性学习报告

**接口地址**: `POST /analytics/report`

**请求头**:
```
Authorization: Bearer {token}
```

**请求参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 否 | 报告周期（week/month/year），默认week |

**请求示例**:
```json
{
  "period": "week"
}
```

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "period": "week",
    "start_date": "2024-01-19",
    "end_date": "2024-01-25",
    "summary": {
      "total_questions": 178,
      "correct_rate": 0.85,
      "study_duration": 8640,
      "knowledge_points_mastered": 12
    },
    "achievements": [
      "连续学习7天",
      "正确率超过80%",
      "掌握12个知识点"
    ],
    "improvements": [
      "加强异步编程练习",
      "提高解题速度"
    ]
  }
}
```

---

## 错题本模块

### 1. 获取错题本列表

**接口地址**: `GET /practice/wrong`

**请求头**:
```
Authorization: Bearer {token}
```

**查询参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | integer | 否 | 页码，默认1 |
| page_size | integer | 否 | 每页数量，默认10 |
| knowledge_point | string | 否 | 知识点筛选 |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "wrong_questions": [
      {
        "id": "1",
        "question": "JavaScript中，Promise的状态有哪些？",
        "type": "single",
        "user_answer": "A",
        "correct_answer": "B",
        "knowledge": "异步编程",
        "added_at": "2024-01-25T10:00:00Z",
        "note": "混淆了Promise的状态"
      }
    ],
    "pagination": {
      "current_page": 1,
      "page_size": 10,
      "total": 23,
      "total_pages": 3
    }
  }
}
```

---

### 2. 获取错题集详情

**接口地址**: `GET /practice/wrong/{wrong_set_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| wrong_set_id | string | 是 | 错题集ID |

**响应示例**:
```json
{
  "code": 200,
  "data": {
    "id": "1",
    "name": "异步编程错题集",
    "description": "异步编程相关错题",
    "questions": [
      {
        "id": "1",
        "question": "题目内容...",
        "type": "single",
        "user_answer": "A",
        "correct_answer": "B",
        "explanation": "解析内容...",
        "note": "备注内容"
      }
    ],
    "question_count": 8
  }
}
```

---

### 3. 移除错题

**接口地址**: `DELETE /practice/wrong/{wrong_question_id}`

**请求头**:
```
Authorization: Bearer {token}
```

**路径参数**:

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| wrong_question_id | string | 是 | 错题ID |

**响应示例**:
```json
{
  "code": 200,
  "message": "移除成功"
}
```

---

## 响应格式

所有API接口的响应都遵循以下格式：

### 成功响应

```json
{
  "code": 200,
  "message": "操作成功",
  "data": {
    // 响应数据
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "错误描述信息"
}
```

---

## 错误码

| 错误码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或token过期 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 附录

### 题目类型

| 类型 | 说明 |
|------|------|
| single | 单选题 |
| multiple | 多选题 |
| fill | 填空题 |
| essay | 简答题 |
| judge | 判断题 |

### 文档类型

| 类型 | 说明 |
|------|------|
| text | 文本文档 |
| pdf | PDF文档 |
| image | 图片文档 |

### 难度级别

| 级别 | 说明 |
|------|------|
| easy | 简单 |
| medium | 中等 |
| hard | 困难 |

---

## 更新日志

- **2024-01-25**: 初始版本发布

# 文档内容处理规范 - 后端需求

## 📌 核心要求

**后端在处理用户上传的文件时，必须将所有文件内容转换为标准的 Markdown 格式纯文本返回，并通过 API 的 `content` 字段返回给前端。**

---

## 🎯 返回数据格式示例

```json
{
  "data": {
    "id": 22,
    "title": "职位介绍",
    "content": "# 职位介绍\n\n## 岗位职责\n\n1、模型部署与优化\n2、框架适配与开发\n\n- 项目1\n- 项目2\n\n**粗体文本** 和 *斜体文本*",
    "file_type": "image",
    "created_at": "2026-03-26T12:07:47"
  },
  "status": 200
}
```

---

## 📋 按文件类型的处理规范

### **1. 纯文本文件 (.txt)**
- ✅ 直接返回原始内容
- ✅ **保留所有换行符** (`\n`)
- ✅ **保留缩进和空格**
- ✅ 如文件已是 Markdown (.md)，直接返回

### **2. PDF 文件 (.pdf)**
- ✅ 使用 OCR 或文本提取工具（如 `pdfplumber`）提取文本
- ✅ **每页之间用双换行分隔**（`\n\n`）
- ✅ **保留换行符和段落结构**（不能合并为一行）
- ✅ **识别标题**并用 Markdown 标记（`# ## ###`）
- ✅ **保留列表结构**（用 `-` 或 `1.` 表示）
- ❌ 不能返回 HTML、富文本或二进制数据

**推荐库**: `pdfplumber` 或 `PyPDF2`

### **3. 图片文件 (.jpg, .png, .bmp 等)**
- ✅ 使用 OCR 技术提取文本（`PaddleOCR`、百度/阿里云 API）
- ✅ **保留换行和段落结构**
- ✅ **识别标题和列表**（可选但推荐）
- ✅ 清理多余空格，但**保留有意义的缩进**
- ✅ 返回纯文本，**不能返回图片 URL 或 Base64**

**推荐库**: `paddleocr`（支持中文）

### **4. Word 文件 (.doc, .docx)**
- ✅ 使用 `python-docx` 提取文本
- ✅ **识别标题样式**并转为 `# ## ###` 格式
- ✅ **保留列表结构**并转为 Markdown 格式
- ✅ **保留加粗/斜体**（转为 `**粗体**` 和 `*斜体*`）
- ✅ **段落间用双换行分隔**（`\n\n`）
- ✅ 返回纯文本 Markdown

**推荐库**: `python-docx`

---

## 🔧 通用约束（所有文件类型）

| 约束项 | 要求 | 说明 |
|--------|------|------|
| **编码格式** | UTF-8 | 确保中文等多语言字符不乱码 |
| **换行符** | 保留 `\n` | 标准 Unix 换行符 |
| **段落分隔** | 使用 `\n\n` | Markdown 需要双换行形成段落 |
| **行尾空白** | 清理 | 移除每行末尾的多余空格 |
| **连续空行** | 最多 2 个 | 移除超过 2 个的连续空行 |
| **缩进** | 保留 | 用于嵌套列表和代码块 |
| **特殊字符** | 正确转义 | 如 `*`、`#`、`` ` ``、`[` 等 |
| **表格** | Markdown 格式 | `\| 列1 \| 列2 \|` 等 |
| **链接** | Markdown 格式 | `[文字](url)` |
| **代码块** | 三反引号格式 | `` ```语言\n代码\n``` `` |

---

## ✅ Markdown 格式标准示例

后端返回的 `content` 应符合以下格式：

```markdown
# 一级标题

## 二级标题

### 三级标题

这是普通段落。段落与段落之间用双换行（\n\n）分隔。

**这是粗体文本** 和 *这是斜体文本*

无序列表：
- 项目 1
- 项目 2
  - 嵌套项目（使用 2 个空格缩进）

有序列表：
1. 项目 1
2. 项目 2

`这是行内代码`

代码块（使用三个反引号）：
\`\`\`python
def hello():
    print("Hello World")
\`\`\`

引用文本：
> 这是引用
> 可以多行

表格：
| 表头 1 | 表头 2 |
|--------|--------|
| 行 1 列 1 | 行 1 列 2 |
| 行 2 列 1 | 行 2 列 2 |

[超链接文本](https://example.com)

---

水平线用 3 个以上的连字符表示
```

---

## 🚀 后端实现检查清单

- [ ] **PDF 处理**：集成 `pdfplumber` 或 `PyPDF2`，保留换行符
- [ ] **OCR 处理**：集成 `paddleocr` 或云 API（百度/阿里），识别中文
- [ ] **Word 处理**：集成 `python-docx`，识别标题和列表样式
- [ ] **文本清理**：实现标准化函数，移除多余空行和行尾空白
- [ ] **编码验证**：确保返回 UTF-8 编码，中文不乱码
- [ ] **测试验证**：上传各类型文件，验证 `content` 是否为格式良好的 Markdown
- [ ] **API 返回**：确保 API 响应中 `content` 字段包含纯文本（无 HTML/富文本/二进制）

---

## 📞 技术支持参考

| 问题 | 解决方案 |
|------|---------|
| 如何保留 PDF 中的换行? | 使用 `text = page.extract_text()` 而非 `extract_text_simple()`，然后拼接换行符 |
| 如何识别 DOCX 中的标题? | 通过 `para.style.name` 检查是否为 `Heading 1/2/3` 等 |
| 中文 OCR 不准确 | 使用 `paddleocr` 并设置 `lang='ch'`，或使用商业 API |
| 如何处理多页 PDF | 遍历 `pdf.pages`，每页内容用 `\n\n` 分隔 |

---

## ❌ 不要做的事

- ❌ 返回 HTML 或富文本格式（前端需要纯 Markdown）
- ❌ 返回 JSON 嵌套数据（content 应该是扁平的字符串）
- ❌ 返回图片 URL 或 Base64 编码（图片文件需转为文本）
- ❌ 移除所有换行符（会导致段落结构丢失）
- ❌ 返回二进制文件数据（必须是文本格式）
- ❌ 混淆不同文件类型的处理逻辑（每种类型需要不同的提取方法）

---

## 📝 示例代码框架（Python）

```python
def process_uploaded_file(file_path: str, file_type: str) -> str:
    """
    统一处理上传的文件，返回 Markdown 格式内容
    """
    if file_type == 'pdf':
        return extract_from_pdf(file_path)
    elif file_type == 'docx':
        return extract_from_docx(file_path)
    elif file_type in ['jpg', 'png']:
        return extract_from_image(file_path)
    elif file_type == 'txt':
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def extract_from_pdf(pdf_path: str) -> str:
    """从 PDF 提取文本，保留换行和段落"""
    import pdfplumber
    
    full_text = ""
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            full_text += text + "\n\n"
    
    return full_text.strip()


def extract_from_docx(docx_path: str) -> str:
    """从 DOCX 提取文本，转为 Markdown 格式"""
    from docx import Document
    
    doc = Document(docx_path)
    content = ""
    
    for para in doc.paragraphs:
        text = para.text.strip()
        if text:
            # 识别标题
            if para.style.name.startswith('Heading'):
                level = int(para.style.name[-1])
                content += "#" * level + " " + text + "\n\n"
            else:
                content += text + "\n\n"
    
    return content.strip()


def extract_from_image(image_path: str) -> str:
    """使用 OCR 从图片提取文本"""
    from paddleocr import PaddleOCR
    
    ocr = PaddleOCR(use_angle_cls=True, lang='ch')
    result = ocr.ocr(image_path, cls=True)
    
    content = ""
    for line in result:
        line_text = "".join([word[1][0] for word in line if word[1][1] > 0.5])
        if line_text.strip():
            content += line_text + "\n"
    
    return content.strip()
```

---

## 📧 总结

**一句话总结**：后端必须将所有上传的文件内容转换为**格式良好的 Markdown 纯文本**，通过 API `content` 字段返回。前端会使用 `marked` 库将其渲染为 HTML 显示。

如有疑问，请与前端团队沟通。

---

*文档生成日期*: 2026-03-26  
*适用范围*: 智学视界 - 知识库文档处理模块

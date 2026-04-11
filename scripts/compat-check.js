const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const viewsDir = path.join(root, 'src', 'views')
const indexHtmlPath = path.join(root, 'public', 'index.html')

function listVueFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...listVueFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.vue')) {
      files.push(fullPath)
    }
  }
  return files
}

function countMatches(content, regex) {
  const matches = content.match(regex)
  return matches ? matches.length : 0
}

function run() {
  const result = {
    checked_at: new Date().toISOString(),
    viewport_meta_present: false,
    files_checked: 0,
    media_query_files: 0,
    total_media_queries: 0,
    hard_px_width_rules: 0,
    key_pages: {}
  }

  const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
  result.viewport_meta_present = /<meta\s+name=["']viewport["']/i.test(indexHtml)

  const vueFiles = listVueFiles(viewsDir)
  result.files_checked = vueFiles.length

  for (const filePath of vueFiles) {
    const content = fs.readFileSync(filePath, 'utf8')
    const mediaCount = countMatches(content, /@media\s*\(/g)
    const hardPxWidthCount = countMatches(content, /width\s*:\s*(3\d{2,}|[4-9]\d{2,})px/g)
    if (mediaCount > 0) {
      result.media_query_files += 1
      result.total_media_queries += mediaCount
    }
    result.hard_px_width_rules += hardPxWidthCount
  }

  const keyPageMap = {
    knowledge: 'src/views/knowledge/KnowledgePage.vue',
    graph: 'src/views/knowledge/KnowledgeGraph.vue',
    exam: 'src/views/practice/PracticePage.vue',
    analytics: 'src/views/analytics/AnalyticsPage.vue'
  }

  for (const [key, relativePath] of Object.entries(keyPageMap)) {
    const absPath = path.join(root, relativePath)
    const content = fs.readFileSync(absPath, 'utf8')
    result.key_pages[key] = {
      path: relativePath,
      has_media_query: /@media\s*\(/.test(content),
      has_flexible_layout: /(display\s*:\s*flex|display\s*:\s*grid)/.test(content)
    }
  }

  result.compatibility_baseline_passed =
    result.viewport_meta_present &&
    result.media_query_files >= Math.floor(result.files_checked * 0.4) &&
    Object.values(result.key_pages).every((item) => item.has_media_query && item.has_flexible_layout)

  console.log(JSON.stringify(result, null, 2))
  process.exit(result.compatibility_baseline_passed ? 0 : 1)
}

run()

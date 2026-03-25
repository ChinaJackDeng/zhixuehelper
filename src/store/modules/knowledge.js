import { ElMessage } from 'element-plus'
import { api } from '@/api'
import { useStore } from 'vuex'

export function useKnowledgeStore() {
    const store = useStore()
    
    const getFilteredDocuments = (selectedTags, keyword) => {
        const documents = store.state.knowledge.documents || []
        if (!Array.isArray(documents)) {
            return []
        }
        return documents.filter(doc => {
            const matchKeyword = !keyword || 
                doc.title?.toLowerCase().includes(keyword.toLowerCase()) ||
                (doc.content && doc.content.toLowerCase().includes(keyword.toLowerCase()))
            const matchTags = !selectedTags.length ||
                selectedTags.every(tagId => doc.tags && doc.tags.some(t => t.id === tagId))
            return matchKeyword && matchTags
        })
    }
    
    const allTags = () => {
        const tags = store.state.knowledge.tags || []
        const documents = store.state.knowledge.documents || []
        if (!Array.isArray(documents)) {
            return tags.map(tag => ({
                ...tag,
                id: tag.name,
                docCount: 0
            }))
        }
        return tags.map(tag => ({
            ...tag,
            id: tag.name,
            docCount: documents.filter(doc => 
                doc.tags && doc.tags.some(t => t.name === tag.name)
            ).length
        }))
    }
    
    return {
        state: store.state.knowledge,
        getFilteredDocuments,
        allTags,
        fetchDocuments: (params) => store.dispatch('knowledge/fetchDocuments', params),
        fetchTags: () => Promise.resolve(),
        searchDocuments: (keyword) => store.dispatch('knowledge/updateFilters', { keyword }),
        uploadDocument: (file) => store.dispatch('knowledge/uploadFile', { file, tags: [] }),
        createTextDocument: (data) => store.dispatch('knowledge/pasteText', {
            name: data.title,
            content: data.content,
            tags: data.tags || []
        }),
        recordDocumentAccess: (docId) => {
            const doc = store.state.knowledge.documents.find(d => d.id === docId)
            if (doc) {
                doc.accessCount = (doc.accessCount || 0) + 1
                doc.lastAccessTime = Date.now()
            }
        },
        removeTagFromDocument: (docId, tagId) => {
            const doc = store.state.knowledge.documents.find(d => d.id === docId)
            if (doc && doc.tags) {
                const tag = doc.tags.find(t => t.id === tagId)
                if (tag) {
                    return store.dispatch('knowledge/removeTagFromDoc', { docId, tagName: tag.name })
                }
            }
            return Promise.resolve()
        },
        addTagsToDocument: (docId, tags) => {
            const doc = store.state.knowledge.documents.find(d => d.id === docId)
            if (doc) {
                const newTags = tags.map(tagId => {
                    const tag = store.state.knowledge.tags.find(t => t.name === tagId || t.id === tagId)
                    return tag ? { id: tag.name, name: tag.name, color: tag.color } : null
                }).filter(Boolean)
                
                const existingTagNames = doc.tags.map(t => t.name)
                const tagsToAdd = newTags.filter(t => !existingTagNames.includes(t.name))
                
                doc.tags = [...doc.tags, ...tagsToAdd]
                return store.dispatch('knowledge/updateDoc', { id: docId, data: { tags: doc.tags } })
            }
            return Promise.resolve()
        },
        getDocumentById: (docId) => store.state.knowledge.documents.find(d => d.id === docId),
        deleteDocument: (docId) => store.dispatch('knowledge/deleteDoc', docId),
        uploadFile: (data) => store.dispatch('knowledge/uploadFile', data),
        pasteText: (data) => store.dispatch('knowledge/pasteText', data),
        deleteDoc: (docId) => store.dispatch('knowledge/deleteDoc', docId),
        updateDoc: (data) => store.dispatch('knowledge/updateDoc', data),
        removeTagFromDoc: (data) => store.dispatch('knowledge/removeTagFromDoc', data),
        createTag: (tag) => store.dispatch('knowledge/createTag', tag),
        selectDoc: (doc) => store.dispatch('knowledge/selectDoc', doc),
        updateFilters: (filters) => store.dispatch('knowledge/updateFilters', filters),
        clearFilters: () => store.dispatch('knowledge/clearFilters')
    }
}


export default {
    namespaced: true,

    state: () => ({
        documents: [],
        tags: [
            { name: '数学', color: '#1a73e8', editable: true },
            { name: '物理', color: '#67c23a', editable: true },
            { name: '化学', color: '#909399', editable: true },
            { name: '英语', color: '#e6a23c', editable: true },
            { name: '编程', color: '#409eff', editable: true },
            { name: '历史', color: '#f56c6c', editable: true }
        ],
        selectedDoc: null,
        filters: {
            keyword: '',
            selectedTags: []
        },
        loading: false
    }),

    getters: {
        // 筛选后的文档列表
        filteredDocs: (state) => {
            return state.documents.filter(doc => {
                const matchKeyword = !state.filters.keyword ||
                    doc.name.toLowerCase().includes(state.filters.keyword.toLowerCase())
                const matchTags = !state.filters.selectedTags.length ||
                    state.filters.selectedTags.every(tag => doc.tags.includes(tag))
                return matchKeyword && matchTags
            })
        },

        // 所有标签名称
        allTagNames: (state) => state.tags.map(t => t.name),

        // 文档数量
        documentCount: (state) => state.documents.length,

        // 当前选中文档的文本块数量
        selectedDocChunkCount: (state) => state.selectedDoc?.chunks?.length || 0
    },

    mutations: {
        SET_DOCUMENTS(state, documents) {
            state.documents = documents
        },

        ADD_DOCUMENT(state, document) {
            state.documents.unshift(document)
        },

        REMOVE_DOCUMENT(state, docId) {
            state.documents = state.documents.filter(d => d.id !== docId)
            if (state.selectedDoc?.id === docId) {
                state.selectedDoc = null
            }
        },

        UPDATE_DOCUMENT(state, { id, data }) {
            const index = state.documents.findIndex(d => d.id === id)
            if (index !== -1) {
                state.documents[index] = { ...state.documents[index], ...data }
            }
        },

        SET_TAGS(state, tags) {
            state.tags = tags
        },

        ADD_TAG(state, tag) {
            state.tags.push(tag)
        },

        REMOVE_TAG(state, tagName) {
            state.tags = state.tags.filter(t => t.name !== tagName)
        },

        SET_SELECTED_DOC(state, doc) {
            state.selectedDoc = doc
        },

        UPDATE_FILTERS(state, filters) {
            state.filters = { ...state.filters, ...filters }
        },

        CLEAR_FILTERS(state) {
            state.filters = { keyword: '', selectedTags: [] }
        },

        SET_LOADING(state, loading) {
            state.loading = loading
        },

        REMOVE_TAG_FROM_DOC(state, { docId, tagName }) {
            const doc = state.documents.find(d => d.id === docId)
            if (doc) {
                doc.tags = doc.tags.filter(t => t !== tagName)
            }
            if (state.selectedDoc?.id === docId) {
                state.selectedDoc.tags = state.selectedDoc.tags.filter(t => t !== tagName)
            }
        }
    },

    actions: {
        // 获取文档列表
        async fetchDocuments({ commit, state }) {
            commit('SET_LOADING', true)
            try {
                const params = {
                    keyword: state.filters.keyword,
                    tags: state.filters.selectedTags.join(',')
                }
                const documents = await api.knowledge.list(params)
                commit('SET_DOCUMENTS', documents)
            } catch (error) {
                ElMessage.error('获取文档列表失败')
                console.error(error)
            } finally {
                commit('SET_LOADING', false)
            }
        },

        // 上传文件
        async uploadFile({ commit }, { file, tags }) {
            commit('SET_LOADING', true)
            try {
                const formData = new FormData()
                formData.append('file', file)
                formData.append('tags', JSON.stringify(tags))

                const doc = await api.knowledge.upload(formData)
                commit('ADD_DOCUMENT', doc)
                ElMessage.success('文件上传成功')
                return doc
            } catch (error) {
                ElMessage.error('上传失败：' + error.message)
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        // 粘贴文本创建文档
        async pasteText({ commit }, { name, content, tags }) {
            commit('SET_LOADING', true)
            try {
                const doc = await api.knowledge.create({ name, content, tags })
                commit('ADD_DOCUMENT', doc)
                ElMessage.success('文档创建成功')
                return doc
            } catch (error) {
                ElMessage.error('创建失败：' + error.message)
                throw error
            } finally {
                commit('SET_LOADING', false)
            }
        },

        // 删除文档
        async deleteDoc({ commit }, docId) {
            try {
                await api.knowledge.delete(docId)
                commit('REMOVE_DOCUMENT', docId)
                ElMessage.success('删除成功')
            } catch (error) {
                ElMessage.error('删除失败')
                throw error
            }
        },

        // 更新文档
        async updateDoc({ commit }, { id, data }) {
            try {
                await api.knowledge.update(id, data)
                commit('UPDATE_DOCUMENT', { id, data })
                ElMessage.success('更新成功')
            } catch (error) {
                ElMessage.error('更新失败')
                throw error
            }
        },

        // 从文档移除标签
        async removeTagFromDoc({ commit, state }, { docId, tagName }) {
            try {
                const doc = state.documents.find(d => d.id === docId)
                if (doc) {
                    const newTags = doc.tags.filter(t => t !== tagName)
                    await api.knowledge.update(docId, { tags: newTags })
                    commit('REMOVE_TAG_FROM_DOC', { docId, tagName })
                    ElMessage.success(`已移除标签：${tagName}`)
                }
            } catch (error) {
                ElMessage.error('移除标签失败')
                throw error
            }
        },

        // 创建新标签
        async createTag({ commit, state }, newTag) {
            if (state.tags.some(t => t.name === newTag.name)) {
                ElMessage.warning('标签已存在')
                return
            }
            commit('ADD_TAG', { ...newTag, editable: true })
            ElMessage.success('标签创建成功')
        },

        // 选择文档
        selectDoc({ commit }, doc) {
            commit('SET_SELECTED_DOC', doc)
        },

        // 更新筛选条件
        updateFilters({ commit }, filters) {
            commit('UPDATE_FILTERS', filters)
        },

        // 清除筛选
        clearFilters({ commit }) {
            commit('CLEAR_FILTERS')
        }
    }
}
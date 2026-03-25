export default {
    isLoading: state => state.isLoading,
    appVersion: state => state.appVersion,

    // 跨模块组合 getter
    userKnowledgeStats: (state, getters, rootState) => ({
        totalDocs: rootState.knowledge.documents.length,
        totalTags: rootState.knowledge.tags.length,
        practiceCount: rootState.practice.completedSets?.length || 0,
        averageScore: getters.practiceAverageScore
    })
}
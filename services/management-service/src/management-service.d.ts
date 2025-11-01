import { FilterRule, ForgettingPolicy, MemoryStats } from '@agent-memory/shared';
export declare class ManagementService {
    private openai;
    private forgettingScheduler?;
    constructor();
    /**
     * Set filter rules for an agent
     */
    setFilterRules(agentId: string, rules: FilterRule[]): Promise<void>;
    /**
     * Apply filter rules to memory input
     */
    applyFilters(agentId: string, content: string, metadata: any): Promise<boolean>;
    private evaluateContentFilter;
    private evaluateMetadataFilter;
    private evaluateImportanceFilter;
    /**
     * Set forgetting policy for an agent
     */
    setForgettingPolicy(agentId: string, policy: ForgettingPolicy): Promise<void>;
    /**
     * Start forgetting scheduler
     */
    private startForgettingScheduler;
    /**
     * Run forgetting process for all agents
     */
    private runForgettingProcess;
    /**
     * Forget memories based on policy
     */
    private forgetMemories;
    /**
     * Consolidate memories (summarize and compress)
     */
    consolidateMemories(agentId: string, options?: {
        timeRange?: {
            start: Date;
            end: Date;
        };
        summarizationLevel?: 'low' | 'medium' | 'high';
    }): Promise<{
        originalCount: number;
        consolidatedCount: number;
        summary: string;
    }>;
    /**
     * Generate summary using LLM
     */
    private generateSummary;
    /**
     * Get memory statistics
     */
    getMemoryStats(agentId: string): Promise<MemoryStats>;
    /**
     * Export memories
     */
    exportMemories(agentId: string, format: 'json' | 'csv'): Promise<Buffer>;
    /**
     * Purge all memories for an agent
     */
    purgeMemories(agentId: string): Promise<number>;
}
export declare function getManagementService(): ManagementService;
//# sourceMappingURL=management-service.d.ts.map
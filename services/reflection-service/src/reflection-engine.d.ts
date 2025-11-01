import { Reflection, ReflectionContext } from '@agent-memory/shared';
export declare class ReflectionEngine {
    private openai;
    private defaultThreshold;
    constructor();
    /**
     * Check if reflection should be triggered
     */
    shouldReflect(agentId: string): Promise<boolean>;
    /**
     * Get accumulated importance since last reflection
     */
    private getAccumulatedImportance;
    /**
     * Increment accumulated importance
     */
    incrementAccumulated(agentId: string, importance: number): Promise<void>;
    /**
     * Reset accumulated importance
     */
    private resetAccumulated;
    /**
     * Get reflection threshold for agent
     */
    private getThreshold;
    /**
     * Trigger reflection process
     */
    triggerReflection(agentId: string, context?: ReflectionContext): Promise<Reflection>;
    /**
     * Retrieve recent memories for reflection
     */
    private retrieveRecentMemories;
    /**
     * Generate insights from memories using LLM
     */
    private generateInsights;
    /**
     * Store reflection in database
     */
    private storeReflection;
    /**
     * Get reflection history for an agent
     */
    getReflections(agentId: string, limit?: number): Promise<Reflection[]>;
}
export declare function getReflectionEngine(): ReflectionEngine;
//# sourceMappingURL=reflection-engine.d.ts.map
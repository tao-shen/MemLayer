export interface STMConfig {
    defaultWindowSize?: number;
    ttl?: number;
}
export declare class STMEngine {
    private defaultWindowSize;
    private ttl;
    constructor(config?: STMConfig);
    /**
     * Add content to short-term memory
     */
    addToSTM(sessionId: string, content: string): Promise<void>;
    /**
     * Get short-term memory contents
     */
    getSTM(sessionId: string): Promise<string[]>;
    /**
     * Get STM as a single concatenated string
     */
    getSTMAsString(sessionId: string, separator?: string): Promise<string>;
    /**
     * Clear short-term memory
     */
    clearSTM(sessionId: string): Promise<void>;
    /**
     * Set window size for a session
     */
    setWindowSize(sessionId: string, size: number): Promise<void>;
    /**
     * Get window size for a session
     */
    getWindowSize(sessionId: string): Promise<number>;
    /**
     * Get STM length
     */
    getSTMLength(sessionId: string): Promise<number>;
    /**
     * Check if STM exists for session
     */
    hasSTM(sessionId: string): Promise<boolean>;
    /**
     * Get TTL for STM
     */
    getSTMTTL(sessionId: string): Promise<number>;
    /**
     * Refresh STM expiration
     */
    refreshSTM(sessionId: string): Promise<void>;
    /**
     * Get statistics for all sessions
     */
    getStats(): Promise<{
        totalSessions: number;
        totalItems: number;
        averageWindowSize: number;
    }>;
    /**
     * Generate Redis key for STM
     */
    private getSTMKey;
    /**
     * Generate Redis key for window size
     */
    private getWindowSizeKey;
}
export declare function getSTMEngine(config?: STMConfig): STMEngine;
//# sourceMappingURL=stm-engine.d.ts.map
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.STMEngine = void 0;
exports.getSTMEngine = getSTMEngine;
const cache = __importStar(require("@agent-memory/cache"));
const shared_1 = require("@agent-memory/shared");
const logger = (0, shared_1.createLogger)('STMEngine');
class STMEngine {
    defaultWindowSize;
    ttl;
    constructor(config = {}) {
        this.defaultWindowSize = config.defaultWindowSize || 10;
        this.ttl = config.ttl || 3600; // 1 hour default
    }
    /**
     * Add content to short-term memory
     */
    async addToSTM(sessionId, content) {
        try {
            const key = this.getSTMKey(sessionId);
            const windowSize = await this.getWindowSize(sessionId);
            // Add to list (right push)
            await cache.rpush(key, content);
            // Trim to window size (keep only last N items)
            const length = await cache.llen(key);
            if (length > windowSize) {
                await cache.ltrim(key, length - windowSize, -1);
            }
            // Set expiration
            await cache.expire(key, this.ttl);
            logger.debug('Added to STM', { sessionId, contentLength: content.length, windowSize });
        }
        catch (error) {
            logger.error('Failed to add to STM', error, { sessionId });
            throw error;
        }
    }
    /**
     * Get short-term memory contents
     */
    async getSTM(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            const contents = await cache.lrange(key, 0, -1);
            logger.debug('Retrieved STM', { sessionId, count: contents.length });
            return contents;
        }
        catch (error) {
            logger.error('Failed to get STM', error, { sessionId });
            throw error;
        }
    }
    /**
     * Get STM as a single concatenated string
     */
    async getSTMAsString(sessionId, separator = '\n') {
        const contents = await this.getSTM(sessionId);
        return contents.join(separator);
    }
    /**
     * Clear short-term memory
     */
    async clearSTM(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            await cache.del(key);
            logger.info('Cleared STM', { sessionId });
        }
        catch (error) {
            logger.error('Failed to clear STM', error, { sessionId });
            throw error;
        }
    }
    /**
     * Set window size for a session
     */
    async setWindowSize(sessionId, size) {
        if (size < 1 || size > 100) {
            throw new Error('Window size must be between 1 and 100');
        }
        try {
            const key = this.getWindowSizeKey(sessionId);
            await cache.set(key, size.toString(), this.ttl);
            // Trim existing STM to new size
            const stmKey = this.getSTMKey(sessionId);
            const length = await cache.llen(stmKey);
            if (length > size) {
                await cache.ltrim(stmKey, length - size, -1);
            }
            logger.info('Set window size', { sessionId, size });
        }
        catch (error) {
            logger.error('Failed to set window size', error, { sessionId, size });
            throw error;
        }
    }
    /**
     * Get window size for a session
     */
    async getWindowSize(sessionId) {
        try {
            const key = this.getWindowSizeKey(sessionId);
            const size = await cache.get(key);
            return size ? parseInt(size) : this.defaultWindowSize;
        }
        catch (error) {
            logger.error('Failed to get window size', error, { sessionId });
            return this.defaultWindowSize;
        }
    }
    /**
     * Get STM length
     */
    async getSTMLength(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            return await cache.llen(key);
        }
        catch (error) {
            logger.error('Failed to get STM length', error, { sessionId });
            return 0;
        }
    }
    /**
     * Check if STM exists for session
     */
    async hasSTM(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            return await cache.exists(key);
        }
        catch (error) {
            logger.error('Failed to check STM existence', error, { sessionId });
            return false;
        }
    }
    /**
     * Get TTL for STM
     */
    async getSTMTTL(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            return await cache.ttl(key);
        }
        catch (error) {
            logger.error('Failed to get STM TTL', error, { sessionId });
            return -1;
        }
    }
    /**
     * Refresh STM expiration
     */
    async refreshSTM(sessionId) {
        try {
            const key = this.getSTMKey(sessionId);
            await cache.expire(key, this.ttl);
            logger.debug('Refreshed STM expiration', { sessionId });
        }
        catch (error) {
            logger.error('Failed to refresh STM', error, { sessionId });
            throw error;
        }
    }
    /**
     * Get statistics for all sessions
     */
    async getStats() {
        try {
            const pattern = 'stm:*';
            const keys = await cache.keys(pattern);
            const sessionKeys = keys.filter((k) => !k.includes(':window_size'));
            let totalItems = 0;
            for (const key of sessionKeys) {
                const length = await cache.llen(key);
                totalItems += length;
            }
            return {
                totalSessions: sessionKeys.length,
                totalItems,
                averageWindowSize: sessionKeys.length > 0 ? totalItems / sessionKeys.length : 0,
            };
        }
        catch (error) {
            logger.error('Failed to get STM stats', error);
            return { totalSessions: 0, totalItems: 0, averageWindowSize: 0 };
        }
    }
    /**
     * Generate Redis key for STM
     */
    getSTMKey(sessionId) {
        return `stm:${sessionId}`;
    }
    /**
     * Generate Redis key for window size
     */
    getWindowSizeKey(sessionId) {
        return `stm:${sessionId}:window_size`;
    }
}
exports.STMEngine = STMEngine;
// Singleton instance
let stmEngine;
function getSTMEngine(config) {
    if (!stmEngine) {
        stmEngine = new STMEngine(config);
    }
    return stmEngine;
}
//# sourceMappingURL=stm-engine.js.map
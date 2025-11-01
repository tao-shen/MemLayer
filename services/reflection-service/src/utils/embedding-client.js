"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEmbeddingClient = getEmbeddingClient;
const client_1 = require("../../../embedding-service/src/client");
let embeddingClient = null;
function getEmbeddingClient() {
    if (!embeddingClient) {
        embeddingClient = new client_1.EmbeddingClient({
            apiKey: process.env.OPENAI_API_KEY || '',
            model: process.env.EMBEDDING_MODEL || 'text-embedding-3-small',
            dimension: parseInt(process.env.EMBEDDING_DIMENSION || '1536'),
            timeout: parseInt(process.env.EMBEDDING_TIMEOUT || '30000'),
            maxRetries: parseInt(process.env.EMBEDDING_MAX_RETRIES || '3'),
        });
    }
    return embeddingClient;
}
//# sourceMappingURL=embedding-client.js.map
import React, { FC, useState, useEffect } from 'react';
import { useMemoryMinting, MemoryInput, CostEstimate } from '../hooks/useMemoryMinting';

export interface BatchMintFormProps {
  onSuccess?: (batchId: string, assetIds: string[]) => void;
  onError?: (error: Error) => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Form component for batch minting memories
 */
export const BatchMintForm: FC<BatchMintFormProps> = ({
  onSuccess,
  onError,
  apiEndpoint,
  className = '',
}) => {
  const { mintBatch, estimateCost, minting, estimating, canMint } = useMemoryMinting(apiEndpoint);
  
  const [memories, setMemories] = useState<MemoryInput[]>([
    { content: '', agentId: '' },
  ]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [result, setResult] = useState<any>(null);

  // Estimate cost when memories change
  useEffect(() => {
    const validMemories = memories.filter(m => m.content && m.agentId);
    if (validMemories.length > 0) {
      estimateCost(validMemories.length).then(setCostEstimate).catch(console.error);
    }
  }, [memories, estimateCost]);

  const addMemory = () => {
    setMemories([...memories, { content: '', agentId: '' }]);
  };

  const removeMemory = (index: number) => {
    setMemories(memories.filter((_, i) => i !== index));
  };

  const updateMemory = (index: number, field: keyof MemoryInput, value: string) => {
    const updated = [...memories];
    updated[index] = { ...updated[index], [field]: value };
    setMemories(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validMemories = memories.filter(m => m.content && m.agentId);
    
    if (validMemories.length === 0) {
      return;
    }

    // Add metadata to each memory
    const memoriesWithMetadata = validMemories.map(m => ({
      ...m,
      metadata: {
        source: 'web-ui-batch',
        timestamp: new Date().toISOString(),
      },
    }));

    try {
      const batchResult = await mintBatch(memoriesWithMetadata, { priority });
      setResult(batchResult);
      onSuccess?.(batchResult.batchId, batchResult.assetIds);
      
      // Reset form
      setMemories([{ content: '', agentId: '' }]);
      setCostEstimate(null);
    } catch (error) {
      console.error('Error minting batch:', error);
      onError?.(error as Error);
    }
  };

  if (!canMint) {
    return (
      <div className={`batch-mint-form not-connected ${className}`}>
        <p>Please connect your wallet to mint memories</p>
      </div>
    );
  }

  const validCount = memories.filter(m => m.content && m.agentId).length;

  return (
    <div className={`batch-mint-form ${className}`}>
      <h3>Batch Mint Memories</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="memories-list">
          {memories.map((memory, index) => (
            <div key={index} className="memory-item">
              <div className="memory-header">
                <h4>Memory {index + 1}</h4>
                {memories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeMemory(index)}
                    className="remove-button"
                    disabled={minting}
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="form-group">
                <label>Agent ID</label>
                <input
                  type="text"
                  value={memory.agentId}
                  onChange={(e) => updateMemory(index, 'agentId', e.target.value)}
                  placeholder="Enter agent ID"
                  disabled={minting}
                />
              </div>

              <div className="form-group">
                <label>Content</label>
                <textarea
                  value={memory.content}
                  onChange={(e) => updateMemory(index, 'content', e.target.value)}
                  placeholder="Enter memory content"
                  rows={4}
                  disabled={minting}
                />
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addMemory}
          className="add-memory-button"
          disabled={minting || memories.length >= 100}
        >
          + Add Memory
        </button>

        <div className="form-group">
          <label htmlFor="priority">Priority</label>
          <select
            id="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as any)}
            disabled={minting}
          >
            <option value="low">Low (Cheaper, Slower)</option>
            <option value="medium">Medium (Balanced)</option>
            <option value="high">High (Faster, More Expensive)</option>
          </select>
        </div>

        {costEstimate && validCount > 0 && (
          <div className="cost-estimate">
            <h4>Estimated Cost for {validCount} Memories</h4>
            <div className="cost-breakdown">
              <div className="cost-item">
                <span>Solana:</span>
                <span>{(costEstimate.solanaCost / 1e9).toFixed(6)} SOL</span>
              </div>
              <div className="cost-item">
                <span>Arweave:</span>
                <span>{(costEstimate.arweaveCost / 1e12).toFixed(6)} AR</span>
              </div>
              <div className="cost-item total">
                <span>Total:</span>
                <span>
                  {(costEstimate.totalCost / 1e9).toFixed(6)} SOL
                  {costEstimate.totalCostUSD && ` (~$${costEstimate.totalCostUSD.toFixed(4)})`}
                </span>
              </div>
              <div className="cost-item per-memory">
                <span>Per Memory:</span>
                <span>{(costEstimate.totalCost / validCount / 1e9).toFixed(6)} SOL</span>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={minting || estimating || validCount === 0}
          className="mint-button"
        >
          {minting ? 'Minting...' : estimating ? 'Estimating...' : `Mint ${validCount} Memories`}
        </button>
      </form>

      {result && (
        <div className="mint-result success">
          <h4>✓ Batch Minted Successfully!</h4>
          <div className="result-details">
            <div className="result-item">
              <span>Batch ID:</span>
              <code>{result.batchId}</code>
            </div>
            <div className="result-item">
              <span>Success Count:</span>
              <span>{result.successCount} / {result.successCount + result.failedCount}</span>
            </div>
            <div className="result-item">
              <span>Total Cost:</span>
              <span>{(result.totalCost / 1e9).toFixed(6)} SOL</span>
            </div>
            <div className="result-item">
              <span>Asset IDs:</span>
              <div className="asset-ids">
                {result.assetIds.map((id: string, i: number) => (
                  <code key={i}>{id}</code>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchMintForm;

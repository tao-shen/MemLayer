import React, { FC, useState, useEffect } from 'react';
import { useMemoryMinting, MemoryInput, CostEstimate } from '../hooks/useMemoryMinting';

export interface MintMemoryFormProps {
  onSuccess?: (assetId: string) => void;
  onError?: (error: Error) => void;
  apiEndpoint?: string;
  className?: string;
}

/**
 * Form component for minting a single memory
 */
export const MintMemoryForm: FC<MintMemoryFormProps> = ({
  onSuccess,
  onError,
  apiEndpoint,
  className = '',
}) => {
  const { mintMemory, estimateCost, minting, estimating, canMint } = useMemoryMinting(apiEndpoint);
  
  const [content, setContent] = useState('');
  const [agentId, setAgentId] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [result, setResult] = useState<any>(null);

  // Estimate cost when form is ready
  useEffect(() => {
    if (content && agentId) {
      estimateCost(1).then(setCostEstimate).catch(console.error);
    }
  }, [content, agentId, estimateCost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content || !agentId) {
      return;
    }

    const memory: MemoryInput = {
      content,
      agentId,
      metadata: {
        source: 'web-ui',
        timestamp: new Date().toISOString(),
      },
    };

    try {
      const mintResult = await mintMemory(memory, { priority });
      setResult(mintResult);
      onSuccess?.(mintResult.assetId);
      
      // Reset form
      setContent('');
      setAgentId('');
      setCostEstimate(null);
    } catch (error) {
      console.error('Error minting memory:', error);
      onError?.(error as Error);
    }
  };

  if (!canMint) {
    return (
      <div className={`mint-memory-form not-connected ${className}`}>
        <p>Please connect your wallet to mint memories</p>
      </div>
    );
  }

  return (
    <div className={`mint-memory-form ${className}`}>
      <h3>Mint Memory to Blockchain</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="agentId">Agent ID</label>
          <input
            id="agentId"
            type="text"
            value={agentId}
            onChange={(e) => setAgentId(e.target.value)}
            placeholder="Enter agent ID"
            required
            disabled={minting}
          />
        </div>

        <div className="form-group">
          <label htmlFor="content">Memory Content</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter memory content"
            rows={6}
            required
            disabled={minting}
          />
        </div>

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

        {costEstimate && (
          <div className="cost-estimate">
            <h4>Estimated Cost</h4>
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
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={minting || estimating || !content || !agentId}
          className="mint-button"
        >
          {minting ? 'Minting...' : estimating ? 'Estimating...' : 'Mint Memory'}
        </button>
      </form>

      {result && (
        <div className="mint-result success">
          <h4>✓ Memory Minted Successfully!</h4>
          <div className="result-details">
            <div className="result-item">
              <span>Asset ID:</span>
              <code>{result.assetId}</code>
            </div>
            <div className="result-item">
              <span>Arweave ID:</span>
              <code>{result.arweaveId}</code>
            </div>
            <div className="result-item">
              <span>Transaction:</span>
              <a
                href={`https://explorer.solana.com/tx/${result.transactionSignature}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on Explorer
              </a>
            </div>
            <div className="result-item">
              <span>Cost:</span>
              <span>{(result.cost / 1e9).toFixed(6)} SOL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MintMemoryForm;

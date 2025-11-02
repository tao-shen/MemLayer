import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import bs58 from 'bs58';

const API_URL = 'http://localhost:3000';

const MintMemoryForm: React.FC = () => {
  const { publicKey, signMessage } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    content: '',
    metadata: {
      title: '',
      description: '',
      tags: ''
    }
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.startsWith('metadata.')) {
      const metadataKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          [metadataKey]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const getAuthToken = async (): Promise<string | null> => {
    if (!publicKey || !signMessage) {
      setError('钱包未连接或不支持签名');
      return null;
    }

    try {
      // 1. 获取挑战消息
      const challengeResponse = await axios.post(`${API_URL}/v1/blockchain/auth/challenge`, {
        walletAddress: publicKey.toBase58()
      });

      const { message } = challengeResponse.data;

      // 2. 签名消息
      const messageBytes = new TextEncoder().encode(message);
      const signature = await signMessage(messageBytes);

      // 3. 验证签名并获取 token
      const verifyResponse = await axios.post(`${API_URL}/v1/blockchain/auth/verify`, {
        walletAddress: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message
      });

      return verifyResponse.data.token;
    } catch (err: any) {
      console.error('认证失败:', err);
      setError(err.response?.data?.error || '认证失败');
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // 获取认证 token
      const token = await getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // 准备元数据
      const metadata: any = {
        title: formData.metadata.title,
        description: formData.metadata.description
      };

      if (formData.metadata.tags) {
        metadata.tags = formData.metadata.tags.split(',').map(t => t.trim());
      }

      // 铸造记忆 NFT
      const response = await axios.post(
        `${API_URL}/v1/blockchain/memories/mint`,
        {
          content: formData.content,
          metadata,
          encrypted: false
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccess(`记忆 NFT 铸造成功！资产 ID: ${response.data.assetId}`);
      
      // 重置表单
      setFormData({
        content: '',
        metadata: {
          title: '',
          description: '',
          tags: ''
        }
      });
    } catch (err: any) {
      console.error('铸造失败:', err);
      setError(err.response?.data?.error || '铸造失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ marginBottom: '20px', color: '#2d3748' }}>铸造新的记忆 NFT</h3>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <div className="form-group">
        <label>标题 *</label>
        <input
          type="text"
          name="metadata.title"
          value={formData.metadata.title}
          onChange={handleInputChange}
          placeholder="输入记忆标题"
          required
        />
      </div>

      <div className="form-group">
        <label>内容 *</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleInputChange}
          placeholder="输入记忆内容..."
          required
        />
      </div>

      <div className="form-group">
        <label>描述</label>
        <input
          type="text"
          name="metadata.description"
          value={formData.metadata.description}
          onChange={handleInputChange}
          placeholder="简短描述这个记忆"
        />
      </div>

      <div className="form-group">
        <label>标签（用逗号分隔）</label>
        <input
          type="text"
          name="metadata.tags"
          value={formData.metadata.tags}
          onChange={handleInputChange}
          placeholder="例如: AI, 对话, 重要"
        />
      </div>

      <button 
        type="submit" 
        className="button"
        disabled={loading || !publicKey}
      >
        {loading ? '铸造中...' : '铸造记忆 NFT'}
      </button>
    </form>
  );
};

export default MintMemoryForm;

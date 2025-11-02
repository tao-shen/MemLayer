import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3000';

const ApiStatus: React.FC = () => {
  const [status, setStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [version, setVersion] = useState<string>('');

  useEffect(() => {
    checkApiStatus();
    const interval = setInterval(checkApiStatus, 30000); // 每30秒检查一次
    return () => clearInterval(interval);
  }, []);

  const checkApiStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/health`);
      if (response.data.status === 'healthy') {
        setStatus('online');
        setVersion(response.data.version || 'v1');
      } else {
        setStatus('offline');
      }
    } catch (error) {
      setStatus('offline');
    }
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ marginBottom: '10px' }}>API 状态</h2>
          <p style={{ color: '#718096', fontSize: '14px' }}>
            后端服务: {API_URL}
          </p>
        </div>
        <div>
          {status === 'checking' && (
            <span className="status-badge" style={{ background: '#feebc8', color: '#744210' }}>
              检查中...
            </span>
          )}
          {status === 'online' && (
            <span className="status-badge status-connected">
              在线 {version}
            </span>
          )}
          {status === 'offline' && (
            <span className="status-badge status-disconnected">
              离线
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ApiStatus;

import React, { useState } from 'react';
import { MemoryVisualizationDashboard } from './components/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  // In a real app, this would come from routing or props
  const [agentId] = useState('demo-agent-123');

  return (
    <ErrorBoundary>
      <div className="w-full h-full">
        <MemoryVisualizationDashboard agentId={agentId} />
      </div>
    </ErrorBoundary>
  );
}

export default App;

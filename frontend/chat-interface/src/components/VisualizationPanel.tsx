import { useEffect } from 'react';
import { useVisualizationStore } from '../stores/visualizationStore';
import MemoryTimeline from './MemoryTimeline';
import KnowledgeGraph from './KnowledgeGraph';
import MemoryList from './MemoryList';
import StatisticsView from './StatisticsView';
import BlockchainAssets from './BlockchainAssets';
import { LoadingSpinner } from './LoadingSpinner';

interface VisualizationPanelProps {
  agentId: string;
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ agentId }) => {
  const { activeView, setActiveView, isLoading, loadVisualizationData } =
    useVisualizationStore();

  useEffect(() => {
    if (agentId) {
      loadVisualizationData(agentId);
    }
  }, [agentId, loadVisualizationData]);

  const views = [
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'graph', label: 'Graph', icon: '🕸️' },
    { id: 'list', label: 'List', icon: '📋' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'blockchain', label: 'Blockchain', icon: '⛓️' },
  ];

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner />
        </div>
      );
    }

    switch (activeView) {
      case 'timeline':
        return <MemoryTimeline className="h-full" />;
      case 'graph':
        return <KnowledgeGraph className="h-full" />;
      case 'list':
        return <MemoryList className="h-full" />;
      case 'stats':
        return <StatisticsView className="h-full" />;
      case 'blockchain':
        return <BlockchainAssets agentId={agentId} className="h-full" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header with View Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex overflow-x-auto scrollbar-hide">
          {views.map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id as any)}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeView === view.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="mr-2">{view.icon}</span>
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
};

export { VisualizationPanel };
export default VisualizationPanel;

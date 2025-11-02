import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useVisualizationStore } from '../store/visualizationStore';
import { useRealtimeUpdates } from '../hooks/useRealtimeUpdates';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { apiClient } from '../api/client';
import { TimelineView } from './TimelineView';
import { GraphView } from './GraphView';
import { ListView } from './ListView';
import { StatisticsView } from './StatisticsView';
import { FilterPanel } from './FilterPanel';
import { MemoryDetailPanel } from './MemoryDetailPanel';
import { ExportButton } from './ExportButton';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';

interface DashboardProps {
  agentId: string;
  initialView?: 'timeline' | 'graph' | 'list' | 'statistics';
}

export const MemoryVisualizationDashboard: React.FC<DashboardProps> = ({
  agentId,
  initialView = 'timeline',
}) => {
  const { currentView, setCurrentView, filters, selectedMemory, setSelectedMemory, updateFilters, resetFilters } = useVisualizationStore();
  const [showFilters, setShowFilters] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Enable real-time updates
  useRealtimeUpdates(agentId, true);

  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setShowFilters(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCurrentView(initialView);
  }, [initialView, setCurrentView]);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: '1',
      ctrl: true,
      callback: () => setCurrentView('timeline'),
      description: 'Switch to Timeline view',
    },
    {
      key: '2',
      ctrl: true,
      callback: () => setCurrentView('graph'),
      description: 'Switch to Graph view',
    },
    {
      key: '3',
      ctrl: true,
      callback: () => setCurrentView('list'),
      description: 'Switch to List view',
    },
    {
      key: '4',
      ctrl: true,
      callback: () => setCurrentView('statistics'),
      description: 'Switch to Statistics view',
    },
    {
      key: 'f',
      ctrl: true,
      callback: () => setShowFilters(!showFilters),
      description: 'Toggle filters',
    },
    {
      key: 'Escape',
      callback: () => setSelectedMemory(null),
      description: 'Close detail panel',
    },
  ]);

  // Fetch data based on current view
  const { data: timelineData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline', agentId, filters],
    queryFn: () => apiClient.getTimelineData(agentId, filters),
    enabled: currentView === 'timeline',
  });

  const { data: graphData, isLoading: graphLoading } = useQuery({
    queryKey: ['graph', agentId, filters],
    queryFn: () => apiClient.getGraphData(agentId, filters, { showSimilarityEdges: true }),
    enabled: currentView === 'graph',
  });

  const { data: visualizationData, isLoading: listLoading } = useQuery({
    queryKey: ['visualization', agentId, filters],
    queryFn: () => apiClient.getVisualizationData(agentId, filters),
    enabled: currentView === 'list',
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['statistics', agentId],
    queryFn: () => apiClient.getStatistics(agentId, { includeAccessFrequency: true }),
    enabled: currentView === 'statistics',
  });

  const isLoading = timelineLoading || graphLoading || listLoading || statsLoading;

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <LoadingSpinner message={`Loading ${currentView} data...`} size="lg" />
        </div>
      );
    }

    switch (currentView) {
      case 'timeline':
        if (!timelineData || timelineData.memories.length === 0) {
          return (
            <EmptyState
              title="No memories in timeline"
              message="There are no memories to display in the timeline view. Try adjusting your filters or create some memories first."
              action={{
                label: 'Reset Filters',
                onClick: resetFilters,
              }}
            />
          );
        }
        return (
          <TimelineView
            data={timelineData}
            onMemoryClick={(memory) => setSelectedMemory(memory)}
          />
        );

      case 'graph':
        if (!graphData || graphData.nodes.length === 0) {
          return (
            <EmptyState
              title="No memories in graph"
              message="There are no memories to display in the graph view. Try adjusting your filters or create some memories first."
              action={{
                label: 'Reset Filters',
                onClick: resetFilters,
              }}
            />
          );
        }
        return (
          <GraphView
            data={graphData}
            onNodeClick={(node) => setSelectedMemory(node.memory)}
          />
        );

      case 'list':
        if (!visualizationData || visualizationData.memories.length === 0) {
          return (
            <EmptyState
              title="No memories found"
              message="There are no memories to display. Try adjusting your filters or create some memories first."
              action={{
                label: 'Reset Filters',
                onClick: resetFilters,
              }}
            />
          );
        }
        return (
          <ListView
            memories={visualizationData.memories}
            onMemoryClick={(memory) => setSelectedMemory(memory)}
          />
        );

      case 'statistics':
        if (!statistics || statistics.summary.totalMemories === 0) {
          return (
            <EmptyState
              title="No statistics available"
              message="There are no memories to generate statistics from."
            />
          );
        }
        return <StatisticsView statistics={statistics} />;

      default:
        return <div>Unknown view</div>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            {isMobile ? 'Memories' : 'Memory Visualization'}
          </h1>
          <div className="flex items-center space-x-2 md:space-x-4">
            {!isMobile && <ExportButton agentId={agentId} filters={filters} />}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 md:px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              title="Toggle filters (Ctrl+F)"
            >
              {isMobile ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              ) : (
                <>{showFilters ? 'Hide' : 'Show'} Filters</>
              )}
            </button>
            {!isMobile && <div className="text-sm text-gray-500">Agent: {agentId}</div>}
          </div>
        </div>
      </header>

      {/* View Tabs */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 overflow-x-auto">
        <nav className="flex space-x-4 md:space-x-8">
          {(['timeline', 'graph', 'list', 'statistics'] as const).map((view, index) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              title={`Switch to ${view} view (Ctrl+${index + 1})`}
              className={`
                py-3 md:py-4 px-1 border-b-2 font-medium text-xs md:text-sm capitalize whitespace-nowrap
                ${
                  currentView === view
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {view}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col md:flex-row">
        {/* Filter Sidebar */}
        {showFilters && (
          <>
            {isMobile && (
              <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40"
                onClick={() => setShowFilters(false)}
              />
            )}
            <aside
              className={`
                ${isMobile ? 'fixed inset-y-0 left-0 z-50 w-80' : 'w-80 border-r'}
                bg-gray-50 border-gray-200 overflow-y-auto p-4
              `}
            >
              {isMobile && (
                <button
                  onClick={() => setShowFilters(false)}
                  className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <FilterPanel
                filters={filters}
                onChange={updateFilters}
                onReset={resetFilters}
              />
            </aside>
          </>
        )}

        {/* Visualization Area */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {renderView()}
        </div>
      </main>

      {/* Detail Panel */}
      {selectedMemory && (
        <MemoryDetailPanel
          memory={selectedMemory}
          onClose={() => setSelectedMemory(null)}
          onNavigateToMemory={(memoryId) => {
            // TODO: Implement navigation to specific memory
            console.log('Navigate to memory:', memoryId);
          }}
        />
      )}
    </div>
  );
};

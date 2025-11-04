import { lazy, Suspense } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from './hooks/useQuery';
import { MainLayout, LoadingSpinner } from './components';
import { useWebSocketConnection } from './hooks/useWebSocket';
import { ThemeProvider } from './contexts/ThemeContext';
import { GlobalLiveRegion } from './components/LiveRegion';
import { SkipToContent } from './components/SkipToContent';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy load major components for code splitting
const SessionSidebar = lazy(() => import('./components/SessionSidebar'));
const ChatPanel = lazy(() => import('./components/ChatPanel'));
const VisualizationPanel = lazy(() => import('./components/VisualizationPanel'));

const queryClient = createQueryClient();

// For demo purposes, using a fixed agent ID
const AGENT_ID = 'demo-agent-001';

function App() {
  // Connect to WebSocket
  const { connected } = useWebSocketConnection(AGENT_ID);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          {/* Skip to content link for accessibility */}
          <SkipToContent />
          
          {/* Global live region for screen reader announcements */}
          <GlobalLiveRegion />
          
          <div id="main-content" className="h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
            <MainLayout
              sessionSidebar={
                <Suspense fallback={<LoadingSpinner />}>
                  <SessionSidebar agentId={AGENT_ID} />
                </Suspense>
              }
              chatPanel={
                <Suspense fallback={<LoadingSpinner />}>
                  <ChatPanel agentId={AGENT_ID} />
                </Suspense>
              }
              visualizationPanel={
                <Suspense fallback={<LoadingSpinner />}>
                  <VisualizationPanel agentId={AGENT_ID} />
                </Suspense>
              }
            />
            
            {/* WebSocket Status Indicator */}
            <div className="fixed bottom-4 right-4 z-50" role="status" aria-live="polite">
              <div
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  connected
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                <span className="sr-only">WebSocket connection status: </span>
                {connected ? '● Connected' : '○ Disconnected'}
              </div>
            </div>
          </div>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

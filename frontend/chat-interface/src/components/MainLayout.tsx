import { useState } from 'react';
import { useBreakpoint, useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useBreakpoint';
import clsx from 'clsx';

interface MainLayoutProps {
  children?: React.ReactNode;
  sessionSidebar?: React.ReactNode;
  chatPanel?: React.ReactNode;
  visualizationPanel?: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  sessionSidebar,
  chatPanel,
  visualizationPanel,
}) => {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [visualizationCollapsed, setVisualizationCollapsed] = useState(false);
  const [mobileView, setMobileView] = useState<'sessions' | 'chat' | 'visualization'>('chat');

  if (isMobile) {
    return (
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
        {/* Mobile View */}
        <div className="flex-1 overflow-hidden">
          {mobileView === 'sessions' && sessionSidebar}
          {mobileView === 'chat' && chatPanel}
          {mobileView === 'visualization' && visualizationPanel}
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div className="flex justify-around py-2">
            <button
              onClick={() => setMobileView('sessions')}
              className={clsx(
                'flex flex-col items-center px-4 py-2 rounded-lg',
                mobileView === 'sessions'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
              </svg>
              <span className="text-xs mt-1">Sessions</span>
            </button>
            <button
              onClick={() => setMobileView('chat')}
              className={clsx(
                'flex flex-col items-center px-4 py-2 rounded-lg',
                mobileView === 'chat'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <span className="text-xs mt-1">Chat</span>
            </button>
            <button
              onClick={() => setMobileView('visualization')}
              className={clsx(
                'flex flex-col items-center px-4 py-2 rounded-lg',
                mobileView === 'visualization'
                  ? 'text-primary-600 dark:text-primary-400'
                  : 'text-gray-600 dark:text-gray-400'
              )}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span className="text-xs mt-1">Viz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isTablet) {
    return (
      <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
        {/* Tablet: Two columns + drawer */}
        {!sidebarCollapsed && (
          <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {sessionSidebar}
          </div>
        )}
        <div className="flex-1 flex flex-col">
          {chatPanel}
        </div>
        {!visualizationCollapsed && (
          <div className="w-80 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            {visualizationPanel}
          </div>
        )}
      </div>
    );
  }

  // Desktop: Three columns
  return (
    <div className="h-screen flex bg-gray-50 dark:bg-gray-900">
      {!sidebarCollapsed && (
        <div className="w-64 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          {sessionSidebar}
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        {chatPanel}
      </div>
      {!visualizationCollapsed && (
        <div className="w-96 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex-shrink-0">
          {visualizationPanel}
        </div>
      )}
    </div>
  );
};

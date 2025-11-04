// Simple test version of App
function AppSimple() {
  return (
    <div className="h-screen w-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          AI Agent Memory System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Chat Interface Loading...
        </p>
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    </div>
  );
}

export default AppSimple;

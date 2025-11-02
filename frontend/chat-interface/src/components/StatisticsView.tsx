import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useVisualizationStore } from '../stores/visualizationStore';

interface StatisticsViewProps {
  className?: string;
}

const StatisticsView: React.FC<StatisticsViewProps> = ({ className = '' }) => {
  const { memories, entities, relationships } = useVisualizationStore();
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('week');

  // Calculate statistics
  const stats = useMemo(() => {
    const byType = {
      stm: memories.filter(m => m.type === 'stm').length,
      episodic: memories.filter(m => m.type === 'episodic').length,
      semantic: memories.filter(m => m.type === 'semantic').length,
      reflection: memories.filter(m => m.type === 'reflection').length,
    };

    const onChainCount = memories.filter(m => m.onChain).length;
    const avgImportance = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.importance, 0) / memories.length
      : 0;

    return {
      total: memories.length,
      byType,
      entities: entities.length,
      relationships: relationships.length,
      onChain: onChainCount,
      avgImportance,
    };
  }, [memories, entities, relationships]);

  // Prepare trend data
  const trendData = useMemo(() => {
    const now = new Date();
    const data: Array<{ date: string; count: number; stm: number; episodic: number; semantic: number; reflection: number }> = [];
    
    let days = 7;
    if (timeRange === 'day') days = 24; // hours
    if (timeRange === 'month') days = 30;
    if (timeRange === 'year') days = 12; // months

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      if (timeRange === 'day') {
        date.setHours(date.getHours() - i);
      } else if (timeRange === 'year') {
        date.setMonth(date.getMonth() - i);
      } else {
        date.setDate(date.getDate() - i);
      }

      const dateStr = timeRange === 'day'
        ? date.toLocaleTimeString([], { hour: '2-digit' })
        : timeRange === 'year'
        ? date.toLocaleDateString([], { month: 'short' })
        : date.toLocaleDateString([], { month: 'numeric', day: 'numeric' });

      const memoriesInRange = memories.filter(m => {
        const memDate = new Date(m.createdAt);
        if (timeRange === 'day') {
          return memDate.getHours() === date.getHours() && memDate.getDate() === date.getDate();
        } else if (timeRange === 'year') {
          return memDate.getMonth() === date.getMonth() && memDate.getFullYear() === date.getFullYear();
        } else {
          return memDate.toDateString() === date.toDateString();
        }
      });

      data.push({
        date: dateStr,
        count: memoriesInRange.length,
        stm: memoriesInRange.filter(m => m.type === 'stm').length,
        episodic: memoriesInRange.filter(m => m.type === 'episodic').length,
        semantic: memoriesInRange.filter(m => m.type === 'semantic').length,
        reflection: memoriesInRange.filter(m => m.type === 'reflection').length,
      });
    }

    return data;
  }, [memories, timeRange]);

  // Prepare type distribution data
  const typeDistribution = [
    { name: 'Short-term', value: stats.byType.stm, color: '#3b82f6' },
    { name: 'Episodic', value: stats.byType.episodic, color: '#10b981' },
    { name: 'Semantic', value: stats.byType.semantic, color: '#f59e0b' },
    { name: 'Reflection', value: stats.byType.reflection, color: '#8b5cf6' },
  ];

  // Prepare importance distribution data
  const importanceDistribution = useMemo(() => {
    const ranges = [
      { range: '0-2', min: 0, max: 2 },
      { range: '2-4', min: 2, max: 4 },
      { range: '4-6', min: 4, max: 6 },
      { range: '6-8', min: 6, max: 8 },
      { range: '8-10', min: 8, max: 10 },
    ];

    return ranges.map(r => ({
      range: r.range,
      count: memories.filter(m => m.importance >= r.min && m.importance < r.max).length,
    }));
  }, [memories]);

  // Top memories by access count
  const topMemories = useMemo(() => {
    return [...memories]
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 10);
  }, [memories]);

  // Top entities by connection count
  const topEntities = useMemo(() => {
    return [...entities]
      .sort((a, b) => (b.memoryIds?.length || 0) - (a.memoryIds?.length || 0))
      .slice(0, 10);
  }, [entities]);

  return (
    <div className={`flex flex-col h-full overflow-y-auto ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
        <div className="flex space-x-2">
          {(['day', 'week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range === 'day' ? '24h' : range === 'week' ? '7d' : range === 'month' ? '30d' : '1y'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Memories</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Entities</p>
                <p className="text-2xl font-bold text-gray-900">{stats.entities}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Relationships</p>
                <p className="text-2xl font-bold text-gray-900">{stats.relationships}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">On-chain</p>
                <p className="text-2xl font-bold text-gray-900">{stats.onChain}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-5a1 1 0 100 2 1 1 0 000-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Trend chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Memory Formation Trend</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="stm" stroke="#3b82f6" name="STM" />
              <Line type="monotone" dataKey="episodic" stroke="#10b981" name="Episodic" />
              <Line type="monotone" dataKey="semantic" stroke="#f59e0b" name="Semantic" />
              <Line type="monotone" dataKey="reflection" stroke="#8b5cf6" name="Reflection" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Type distribution and importance distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Type Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Importance Distribution</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={importanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top memories and entities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Most Accessed Memories</h4>
            <div className="space-y-2">
              {topMemories.map((memory, index) => (
                <div key={memory.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <p className="text-sm text-gray-700 truncate">{memory.content}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-600 ml-2">{memory.accessCount}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Entities</h4>
            <div className="space-y-2">
              {topEntities.map((entity, index) => (
                <div key={entity.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                    <p className="text-sm text-gray-700 truncate">{entity.name}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600 ml-2">
                    {entity.memoryIds?.length || 0} connections
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;

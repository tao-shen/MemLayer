import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Statistics, MemoryType } from '../types';

interface StatisticsViewProps {
  statistics: Statistics;
}

const MEMORY_TYPE_COLORS: Record<MemoryType, string> = {
  stm: '#3b82f6',
  episodic: '#10b981',
  semantic: '#f59e0b',
  reflection: '#8b5cf6',
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ statistics }) => {
  // Prepare type distribution data for pie chart
  const typeDistributionData = Object.entries(statistics.typeDistribution).map(
    ([type, count]) => ({
      name: type.toUpperCase(),
      value: count,
      color: MEMORY_TYPE_COLORS[type as MemoryType],
    })
  );

  // Prepare time distribution data for bar chart
  const timeDistributionData = statistics.timeDistribution.data.map((item) => ({
    date: new Date(item.timestamp).toLocaleDateString(),
    ...item.byType,
    total: item.count,
  }));

  // Prepare importance distribution data
  const importanceData = statistics.importanceDistribution.ranges.map((range) => ({
    range: `${range.min}-${range.max}`,
    count: range.count,
  }));

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Total Memories</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.summary.totalMemories}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Average Importance</div>
          <div className="mt-2 text-3xl font-bold text-gray-900">
            {statistics.summary.averageImportance.toFixed(1)}
            <span className="text-lg text-gray-500">/10</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Oldest Memory</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {statistics.summary.oldestMemory
              ? new Date(statistics.summary.oldestMemory).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Newest Memory</div>
          <div className="mt-2 text-lg font-semibold text-gray-900">
            {statistics.summary.newestMemory
              ? new Date(statistics.summary.newestMemory).toLocaleDateString()
              : 'N/A'}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Type Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Memory Type Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={typeDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {typeDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Importance Distribution Bar Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Importance Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={importanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="range" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Time Distribution Line Chart */}
        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Memory Creation Over Time
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeDistributionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="stm"
                stroke={MEMORY_TYPE_COLORS.stm}
                name="STM"
              />
              <Line
                type="monotone"
                dataKey="episodic"
                stroke={MEMORY_TYPE_COLORS.episodic}
                name="Episodic"
              />
              <Line
                type="monotone"
                dataKey="semantic"
                stroke={MEMORY_TYPE_COLORS.semantic}
                name="Semantic"
              />
              <Line
                type="monotone"
                dataKey="reflection"
                stroke={MEMORY_TYPE_COLORS.reflection}
                name="Reflection"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Access Frequency */}
      {statistics.accessFrequency && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Most Accessed Memories
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-500 mb-4">
              Average Access Count: {statistics.accessFrequency.averageAccessCount.toFixed(1)}
            </div>
            {statistics.accessFrequency.topAccessed.slice(0, 10).map((item, index) => (
              <div
                key={item.memoryId}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <span className="text-sm font-medium text-gray-700">
                  #{index + 1} Memory {item.memoryId.substring(0, 8)}...
                </span>
                <span className="text-sm text-gray-900 font-semibold">
                  {item.accessCount} accesses
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Type Breakdown Table */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Memory Type Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(statistics.summary.byType).map(([type, count]) => (
                <tr key={type}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: MEMORY_TYPE_COLORS[type as MemoryType] }}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {type.toUpperCase()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {((count / statistics.summary.totalMemories) * 100).toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

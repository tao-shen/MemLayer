import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Memory } from '../data/mockData';

interface StatisticsViewProps {
  memories: Memory[];
}

const typeColors = {
  stm: '#3B82F6',
  episodic: '#10B981',
  semantic: '#F59E0B',
  reflection: '#8B5CF6',
};

const typeNames = {
  stm: '短期记忆',
  episodic: '情景记忆',
  semantic: '语义记忆',
  reflection: '反思记忆',
};

export const StatisticsView: React.FC<StatisticsViewProps> = ({ memories }) => {
  // 类型分布
  const typeDistribution = Object.entries(
    memories.reduce((acc, m) => {
      acc[m.type] = (acc[m.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: typeNames[type as keyof typeof typeNames],
    value: count,
    color: typeColors[type as keyof typeof typeColors],
  }));

  // 重要性分布
  const importanceDistribution = [
    { range: '1-3', count: memories.filter(m => m.importance >= 1 && m.importance <= 3).length },
    { range: '4-6', count: memories.filter(m => m.importance >= 4 && m.importance <= 6).length },
    { range: '7-10', count: memories.filter(m => m.importance >= 7 && m.importance <= 10).length },
  ];

  // 时间分布（按周）
  const now = new Date();
  const weeklyDistribution = [];
  for (let i = 4; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    const weekMemories = memories.filter(m => 
      m.timestamp >= weekStart && m.timestamp < weekEnd
    );
    
    weeklyDistribution.push({
      week: `第${5-i}周`,
      stm: weekMemories.filter(m => m.type === 'stm').length,
      episodic: weekMemories.filter(m => m.type === 'episodic').length,
      semantic: weekMemories.filter(m => m.type === 'semantic').length,
      reflection: weekMemories.filter(m => m.type === 'reflection').length,
    });
  }

  // 统计摘要
  const totalMemories = memories.length;
  const avgImportance = (memories.reduce((sum, m) => sum + m.importance, 0) / totalMemories).toFixed(1);
  const oldestMemory = memories.reduce((oldest, m) => 
    m.timestamp < oldest.timestamp ? m : oldest
  );
  const newestMemory = memories.reduce((newest, m) => 
    m.timestamp > newest.timestamp ? m : newest
  );

  return (
    <div className="w-full h-full overflow-auto p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">总记忆数</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{totalMemories}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">平均重要性</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{avgImportance}</div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">最早记忆</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">
              {oldestMemory.timestamp.toLocaleDateString('zh-CN')}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-sm text-gray-500">最新记忆</div>
            <div className="text-lg font-semibold text-gray-900 mt-2">
              {newestMemory.timestamp.toLocaleDateString('zh-CN')}
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 类型分布饼图 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">记忆类型分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
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

          {/* 重要性分布柱状图 */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">重要性分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={importanceDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 时间分布堆叠柱状图 */}
          <div className="bg-white p-6 rounded-lg shadow md:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">时间分布（按周）</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="stm" stackId="a" fill={typeColors.stm} name="短期记忆" />
                <Bar dataKey="episodic" stackId="a" fill={typeColors.episodic} name="情景记忆" />
                <Bar dataKey="semantic" stackId="a" fill={typeColors.semantic} name="语义记忆" />
                <Bar dataKey="reflection" stackId="a" fill={typeColors.reflection} name="反思记忆" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 详细统计 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">详细统计</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(typeNames).map(([type, name]) => {
              const typeMemories = memories.filter(m => m.type === type);
              const avgImp = typeMemories.length > 0
                ? (typeMemories.reduce((sum, m) => sum + m.importance, 0) / typeMemories.length).toFixed(1)
                : '0';
              
              return (
                <div key={type} className="border-l-4 pl-4" style={{ borderColor: typeColors[type as keyof typeof typeColors] }}>
                  <div className="text-sm font-medium text-gray-500">{name}</div>
                  <div className="mt-2 space-y-1">
                    <div className="text-sm text-gray-700">数量: {typeMemories.length}</div>
                    <div className="text-sm text-gray-700">平均重要性: {avgImp}</div>
                    <div className="text-sm text-gray-700">
                      占比: {((typeMemories.length / totalMemories) * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

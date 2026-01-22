import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Memory } from '../data/mockData';

interface TimelineViewProps {
  memories: Memory[];
  onMemoryClick: (memory: Memory) => void;
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

export const TimelineView: React.FC<TimelineViewProps> = ({ memories, onMemoryClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || memories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;
    const margin = { top: 60, right: 40, bottom: 60, left: 40 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // 按时间排序
    const sortedMemories = [...memories].sort((a, b) => 
      a.timestamp.getTime() - b.timestamp.getTime()
    );

    // 时间比例尺
    const xScale = d3.scaleTime()
      .domain([
        d3.min(sortedMemories, d => d.timestamp)!,
        d3.max(sortedMemories, d => d.timestamp)!
      ])
      .range([0, innerWidth]);

    // 绘制时间轴
    const xAxis = d3.axisBottom(xScale)
      .ticks(8)
      .tickFormat(d => d3.timeFormat('%m/%d')(d as Date));

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // 绘制时间线
    g.append('line')
      .attr('x1', 0)
      .attr('y1', innerHeight / 2)
      .attr('x2', innerWidth)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2);

    // 按类型分组，计算 y 位置
    const typeYPositions: Record<string, number> = {
      stm: innerHeight * 0.15,
      episodic: innerHeight * 0.35,
      semantic: innerHeight * 0.55,
      reflection: innerHeight * 0.75,
    };

    // 绘制记忆节点
    const nodes = g.selectAll('.memory-node')
      .data(sortedMemories)
      .enter()
      .append('g')
      .attr('class', 'memory-node')
      .attr('transform', d => `translate(${xScale(d.timestamp)},${typeYPositions[d.type]})`)
      .style('cursor', 'pointer')
      .on('click', (event, d) => onMemoryClick(d));

    // 节点圆圈
    nodes.append('circle')
      .attr('r', d => 5 + d.importance)
      .attr('fill', d => typeColors[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => 8 + d.importance)
          .style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => 5 + d.importance)
          .style('opacity', 0.8);
      });

    // 连接线
    nodes.append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', d => innerHeight / 2 - typeYPositions[d.type])
      .attr('stroke', d => typeColors[d.type])
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '2,2')
      .style('opacity', 0.3);

    // Tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', 'tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);

    nodes.on('mouseover', (event, d) => {
      tooltip.transition().duration(200).style('opacity', 1);
      tooltip.html(`
        <div><strong>${typeNames[d.type]}</strong></div>
        <div>${d.content.substring(0, 50)}...</div>
        <div>重要性: ${d.importance}/10</div>
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => {
      tooltip.transition().duration(200).style('opacity', 0);
    });

    // 类型标签
    Object.entries(typeNames).forEach(([type, name]) => {
      g.append('text')
        .attr('x', -10)
        .attr('y', typeYPositions[type])
        .attr('text-anchor', 'end')
        .attr('dominant-baseline', 'middle')
        .style('font-size', '12px')
        .style('fill', typeColors[type as keyof typeof typeColors])
        .style('font-weight', 'bold')
        .text(name);
    });

    return () => {
      tooltip.remove();
    };
  }, [memories, onMemoryClick]);

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

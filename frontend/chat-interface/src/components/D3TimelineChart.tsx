import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { Memory } from '../types';

interface D3TimelineChartProps {
  memories: Memory[];
  onMemoryClick?: (memory: Memory) => void;
  highlightedMemoryIds?: string[];
}

const D3TimelineChart: React.FC<D3TimelineChartProps> = ({
  memories,
  onMemoryClick,
  highlightedMemoryIds = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height: 400 });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !memories.length) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const width = dimensions.width - margin.left - margin.right;
    const height = dimensions.height - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Time scale
    const timeExtent = d3.extent(memories, d => new Date(d.createdAt)) as [Date, Date];
    const timeScale = d3.scaleTime()
      .domain(timeExtent)
      .range([0, width]);

    // Importance scale for circle size
    const importanceScale = d3.scaleSqrt()
      .domain([0, 10])
      .range([4, 20]);

    // Color mapping by memory type
    const colorMap: Record<string, string> = {
      stm: '#3b82f6',      // blue
      episodic: '#10b981', // green
      semantic: '#f59e0b', // orange
      reflection: '#8b5cf6' // purple
    };

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', `translate(${margin.left + event.transform.x},${margin.top + event.transform.y}) scale(${event.transform.k})`);
      });

    svg.call(zoom as any);

    // Draw time axis
    const xAxis = d3.axisBottom(timeScale)
      .ticks(6)
      .tickFormat(d3.timeFormat('%m/%d %H:%M') as any);

    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${height / 2})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px')
      .style('fill', '#6b7280');

    // Draw timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', height / 2)
      .attr('x2', width)
      .attr('y2', height / 2)
      .attr('stroke', '#d1d5db')
      .attr('stroke-width', 2);

    // Draw memory nodes
    const nodes = g.selectAll('.memory-node')
      .data(memories)
      .enter()
      .append('g')
      .attr('class', 'memory-node')
      .attr('transform', d => {
        const x = timeScale(new Date(d.createdAt));
        const y = height / 2 + (Math.random() - 0.5) * 100; // Random vertical offset
        return `translate(${x},${y})`;
      })
      .style('cursor', 'pointer');

    // Draw circles
    nodes.append('circle')
      .attr('r', d => importanceScale(d.importance))
      .attr('fill', d => colorMap[d.type] || '#9ca3af')
      .attr('stroke', d => highlightedMemoryIds.includes(d.id) ? '#ef4444' : '#fff')
      .attr('stroke-width', d => highlightedMemoryIds.includes(d.id) ? 3 : 2)
      .attr('opacity', 0.8)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 1)
          .attr('r', importanceScale(d.importance) * 1.2);

        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="font-semibold">${d.type.toUpperCase()}</div>
            <div class="text-sm mt-1">${d.content.substring(0, 100)}${d.content.length > 100 ? '...' : ''}</div>
            <div class="text-xs mt-1 text-gray-500">Importance: ${d.importance.toFixed(1)}</div>
            <div class="text-xs text-gray-500">${new Date(d.createdAt).toLocaleString()}</div>
          `);
      })
      .on('mouseout', function(event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('opacity', 0.8)
          .attr('r', importanceScale(d.importance));

        tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        event.stopPropagation();
        onMemoryClick?.(d);
      });

    // Add labels for high importance memories
    nodes.filter(d => d.importance >= 8)
      .append('text')
      .attr('dy', d => -importanceScale(d.importance) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '10px')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text(d => d.content.substring(0, 20) + '...');

    // Add legend
    const legend = svg.append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${margin.left}, 10)`);

    const legendData = [
      { type: 'stm', label: 'Short-term', color: colorMap.stm },
      { type: 'episodic', label: 'Episodic', color: colorMap.episodic },
      { type: 'semantic', label: 'Semantic', color: colorMap.semantic },
      { type: 'reflection', label: 'Reflection', color: colorMap.reflection },
    ];

    legendData.forEach((item, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(${i * 120}, 0)`);

      legendItem.append('circle')
        .attr('r', 6)
        .attr('fill', item.color);

      legendItem.append('text')
        .attr('x', 12)
        .attr('y', 4)
        .style('font-size', '12px')
        .style('fill', '#374151')
        .text(item.label);
    });

  }, [memories, dimensions, highlightedMemoryIds, onMemoryClick]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full"
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs opacity-0 transition-opacity z-10"
      />
    </div>
  );
};

export default D3TimelineChart;

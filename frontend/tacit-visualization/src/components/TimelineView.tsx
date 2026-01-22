import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { TimelineData, TimelineTacit, TacitType } from '../types';

interface TimelineViewProps {
  data: TimelineData;
  onTacitClick?: (tacit: TimelineTacit) => void;
  width?: number;
  height?: number;
}

const TACIT_TYPE_COLORS: Record<TacitType, string> = {
  stm: '#3b82f6',      // blue
  episodic: '#10b981', // green
  semantic: '#f59e0b', // amber
  reflection: '#8b5cf6', // purple
};

const TACIT_TYPE_ICONS: Record<TacitType, string> = {
  stm: '⚡',
  episodic: '📅',
  semantic: '📚',
  reflection: '💡',
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  data,
  onTacitClick,
  width = 1200,
  height = 600,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: string;
  }>({ visible: false, x: 0, y: 0, content: '' });

  useEffect(() => {
    if (!svgRef.current || !data.tacits.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain([data.timeRange.start, data.timeRange.end])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0]);

    // Add axes
    const xAxis = d3.axisBottom(xScale).ticks(10);
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .style('font-size', '12px');

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .call(
        d3
          .axisBottom(xScale)
          .ticks(20)
          .tickSize(-innerHeight)
          .tickFormat(() => '')
      );

    // Draw timeline line
    g.append('line')
      .attr('x1', 0)
      .attr('y1', innerHeight / 2)
      .attr('x2', innerWidth)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 2);

    // Draw milestones
    data.milestones.forEach((milestone) => {
      const x = xScale(milestone.timestamp);
      
      g.append('line')
        .attr('x1', x)
        .attr('y1', 0)
        .attr('x2', x)
        .attr('y2', innerHeight)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '5,5')
        .attr('opacity', 0.5);

      g.append('text')
        .attr('x', x)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .attr('fill', '#f59e0b')
        .attr('font-weight', 'bold')
        .text(milestone.label);
    });

    // Draw tacit knowledge nodes
    const nodes = g
      .selectAll('.tacit-node')
      .data(data.tacits)
      .enter()
      .append('g')
      .attr('class', 'tacit-node')
      .attr('transform', (d) => {
        const x = xScale(new Date(d.timestamp));
        const y = yScale(d.y);
        return `translate(${x},${y})`;
      })
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onTacitClick) {
          onTacitClick(d);
        }
      })
      .on('mouseenter', (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltip({
          visible: true,
          x: x + 10,
          y: y - 10,
          content: `${TACIT_TYPE_ICONS[d.type]} ${d.type.toUpperCase()}\n${d.content.substring(0, 100)}${d.content.length > 100 ? '...' : ''}\nImportance: ${d.importance || 'N/A'}`,
        });
      })
      .on('mouseleave', () => {
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

    // Add circles
    nodes
      .append('circle')
      .attr('r', (d) => {
        const baseSize = 6;
        const importanceBonus = (d.importance || 5) / 2;
        return baseSize + importanceBonus;
      })
      .attr('fill', (d) => TACIT_TYPE_COLORS[d.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.3s');

    // Add importance indicator for high-importance memories
    nodes
      .filter((d) => (d.importance || 0) >= 8)
      .append('circle')
      .attr('r', (d) => {
        const baseSize = 6;
        const importanceBonus = (d.importance || 5) / 2;
        return baseSize + importanceBonus + 4;
      })
      .attr('fill', 'none')
      .attr('stroke', (d) => MEMORY_TYPE_COLORS[d.type])
      .attr('stroke-width', 2)
      .attr('opacity', 0.5);

    // Add legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(${width - 150}, 20)`);

    const tacitTypes: TacitType[] = ['stm', 'episodic', 'semantic', 'reflection'];
    tacitTypes.forEach((type, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(0, ${i * 25})`);

      legendRow
        .append('circle')
        .attr('r', 6)
        .attr('fill', TACIT_TYPE_COLORS[type]);

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 5)
        .attr('font-size', '12px')
        .text(`${TACIT_TYPE_ICONS[type]} ${type.toUpperCase()}`);
    });

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

  }, [data, width, height, onTacitClick]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg bg-white"
      />
      {tooltip.visible && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded px-3 py-2 pointer-events-none whitespace-pre-line max-w-xs"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            zIndex: 1000,
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
};

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { TacitGraph, GraphNode, GraphEdge, EdgeType, TacitType } from '../types';

interface GraphViewProps {
  data: TacitGraph;
  onNodeClick?: (node: GraphNode) => void;
  width?: number;
  height?: number;
}

const TACIT_TYPE_COLORS: Record<TacitType, string> = {
  stm: '#3b82f6',
  episodic: '#10b981',
  semantic: '#f59e0b',
  reflection: '#8b5cf6',
};

const EDGE_TYPE_COLORS: Record<EdgeType, string> = {
  reflection: '#8b5cf6',
  similarity: '#06b6d4',
  temporal: '#6b7280',
  semantic: '#f59e0b',
};

export const GraphView: React.FC<GraphViewProps> = ({
  data,
  onNodeClick,
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
    if (!svgRef.current || !data.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create force simulation
    const simulation = d3
      .forceSimulation(data.nodes as any)
      .force(
        'link',
        d3
          .forceLink(data.edges)
          .id((d: any) => d.id)
          .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.size + 5));

    // Create container group
    const g = svg.append('g');

    // Draw edges
    const link = g
      .selectAll('.link')
      .data(data.edges)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', (d) => EDGE_TYPE_COLORS[d.type])
      .attr('stroke-width', (d) => Math.max(1, d.weight * 3))
      .attr('stroke-opacity', 0.6)
      .attr('marker-end', 'url(#arrowhead)');

    // Add arrowhead marker
    svg
      .append('defs')
      .append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 20)
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-5L10,0L0,5')
      .attr('fill', '#999');

    // Draw nodes
    const node = g
      .selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(
        d3
          .drag<any, any>()
          .on('start', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d: any) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      )
      .on('click', (event, d) => {
        if (onNodeClick) {
          onNodeClick(d);
        }
      })
      .on('mouseenter', (event, d) => {
        const [x, y] = d3.pointer(event, svgRef.current);
        setTooltip({
          visible: true,
          x: x + 10,
          y: y - 10,
          content: `${d.tacit.type.toUpperCase()}\n${d.tacit.content.substring(0, 100)}${d.tacit.content.length > 100 ? '...' : ''}\nImportance: ${d.tacit.importance || 'N/A'}`,
        });
      })
      .on('mouseleave', () => {
        setTooltip({ visible: false, x: 0, y: 0, content: '' });
      });

    // Add circles to nodes
    node
      .append('circle')
      .attr('r', (d) => d.size)
      .attr('fill', (d) => TACIT_TYPE_COLORS[d.tacit.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2);

    // Add labels to important nodes
    node
      .filter((d) => (d.memory.importance || 0) >= 7)
      .append('text')
      .attr('dy', (d) => d.size + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('fill', '#374151')
      .text((d) => d.memory.content.substring(0, 20) + '...');

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Add zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // Add legend
    const legend = svg
      .append('g')
      .attr('class', 'legend')
      .attr('transform', `translate(20, 20)`);

    legend
      .append('rect')
      .attr('width', 180)
      .attr('height', 140)
      .attr('fill', 'white')
      .attr('stroke', '#e5e7eb')
      .attr('rx', 4);

    const memoryTypes: MemoryType[] = ['stm', 'episodic', 'semantic', 'reflection'];
    memoryTypes.forEach((type, i) => {
      const legendRow = legend
        .append('g')
        .attr('transform', `translate(10, ${i * 25 + 20})`);

      legendRow
        .append('circle')
        .attr('r', 6)
        .attr('fill', TACIT_TYPE_COLORS[type]);

      legendRow
        .append('text')
        .attr('x', 15)
        .attr('y', 5)
        .attr('font-size', '12px')
        .text(type.toUpperCase());
    });

    // Edge type legend
    const edgeTypes: EdgeType[] = ['reflection', 'similarity', 'temporal', 'semantic'];
    legend
      .append('text')
      .attr('x', 10)
      .attr('y', 120)
      .attr('font-size', '11px')
      .attr('font-weight', 'bold')
      .text('Edge Types:');

    return () => {
      simulation.stop();
    };
  }, [data, width, height, onNodeClick]);

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

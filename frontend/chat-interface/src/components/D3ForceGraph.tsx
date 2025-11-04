import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { GraphNode, GraphEdge } from '../types';

interface D3ForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick?: (node: GraphNode) => void;
  highlightedNodeIds?: string[];
}

const D3ForceGraph: React.FC<D3ForceGraphProps> = ({
  nodes,
  edges,
  onNodeClick,
  highlightedNodeIds = [],
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const handleResize = () => {
      if (svgRef.current) {
        const { width, height } = svgRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !nodes.length) return;

    const svg = d3.select(svgRef.current);
    const tooltip = d3.select(tooltipRef.current);
    
    const width = dimensions.width;
    const height = dimensions.height;

    // Clear previous content
    svg.selectAll('*').remove();

    // Create main group
    const g = svg.append('g');

    // Node color mapping
    const nodeColorMap: Record<string, string> = {
      entity: '#3b82f6',   // blue
      memory: '#10b981',   // green
      concept: '#f59e0b',  // orange
    };

    // Node size scale
    const nodeSizeScale = d3.scaleSqrt()
      .domain([0, 10])
      .range([8, 40]);

    // Create force simulation
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(edges)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => nodeSizeScale(d.importance) + 5));

    // Add zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

    svg.call(zoom as any);

    // Draw edges
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(edges)
      .enter()
      .append('line')
      .attr('stroke', '#9ca3af')
      .attr('stroke-opacity', 0.6)
      .attr('stroke-width', (d: GraphEdge) => Math.sqrt(d.weight) * 2);

    // Draw nodes
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // Draw node circles
    node.append('circle')
      .attr('r', (d: GraphNode) => nodeSizeScale(d.importance))
      .attr('fill', (d: GraphNode) => nodeColorMap[d.type] || '#9ca3af')
      .attr('stroke', (d: GraphNode) => highlightedNodeIds.includes(d.id) ? '#ef4444' : '#fff')
      .attr('stroke-width', (d: GraphNode) => highlightedNodeIds.includes(d.id) ? 3 : 2)
      .attr('opacity', 0.9);

    // Draw node labels
    node.append('text')
      .attr('dy', (d: GraphNode) => nodeSizeScale(d.importance) + 15)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', '#374151')
      .style('pointer-events', 'none')
      .text((d: GraphNode) => d.label.length > 15 ? d.label.substring(0, 15) + '...' : d.label);

    // Node interactions
    node
      .on('mouseover', function(event, d: GraphNode) {
        // Highlight connected nodes and edges
        const connectedNodeIds = new Set<string>();
        edges.forEach(edge => {
          if (edge.source === d.id || (edge.source as any).id === d.id) {
            connectedNodeIds.add(typeof edge.target === 'string' ? edge.target : (edge.target as any).id);
          }
          if (edge.target === d.id || (edge.target as any).id === d.id) {
            connectedNodeIds.add(typeof edge.source === 'string' ? edge.source : (edge.source as any).id);
          }
        });

        node.selectAll('circle')
          .attr('opacity', (n: any) => n.id === d.id || connectedNodeIds.has(n.id) ? 1 : 0.3);

        link
          .attr('stroke-opacity', (l: any) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (sourceId === d.id || targetId === d.id) ? 1 : 0.1;
          })
          .attr('stroke-width', (l: any) => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (sourceId === d.id || targetId === d.id) ? Math.sqrt(l.weight) * 3 : Math.sqrt(l.weight) * 2;
          });

        // Show tooltip
        tooltip
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 10}px`)
          .html(`
            <div class="font-semibold">${d.label}</div>
            <div class="text-sm mt-1 text-gray-600">${d.type.toUpperCase()}</div>
            <div class="text-xs mt-1 text-gray-500">Importance: ${d.importance.toFixed(1)}</div>
            ${d.properties && Object.keys(d.properties).length > 0 ? `
              <div class="text-xs mt-2 text-gray-500">
                ${Object.entries(d.properties).slice(0, 3).map(([key, value]) => 
                  `<div>${key}: ${value}</div>`
                ).join('')}
              </div>
            ` : ''}
          `);
      })
      .on('mouseout', function() {
        node.selectAll('circle').attr('opacity', 0.9);
        link
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', (d: any) => Math.sqrt(d.weight) * 2);
        tooltip.style('opacity', 0);
      })
      .on('click', (event, d: GraphNode) => {
        event.stopPropagation();
        onNodeClick?.(d);
      });

    // Update positions on simulation tick
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    // Drag functions
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    // Cleanup
    return () => {
      simulation.stop();
    };

  }, [nodes, edges, dimensions, highlightedNodeIds, onNodeClick]);

  return (
    <div className="relative w-full h-full">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      />
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none bg-white border border-gray-200 rounded-lg shadow-lg p-3 max-w-xs opacity-0 transition-opacity z-10"
      />
    </div>
  );
};

export default D3ForceGraph;

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Memory, MemoryRelationship } from '../data/mockData';

interface GraphViewProps {
  memories: Memory[];
  relationships: MemoryRelationship[];
  onMemoryClick: (memory: Memory) => void;
}

const typeColors = {
  stm: '#3B82F6',
  episodic: '#10B981',
  semantic: '#F59E0B',
  reflection: '#8B5CF6',
};

const edgeColors = {
  reflection: '#8B5CF6',
  semantic: '#F59E0B',
  temporal: '#6B7280',
};

export const GraphView: React.FC<GraphViewProps> = ({ memories, relationships, onMemoryClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || memories.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    // 创建节点和边数据
    const nodes = memories.map(m => ({
      id: m.id,
      memory: m,
      x: width / 2,
      y: height / 2,
    }));

    const links = relationships.map(r => ({
      source: r.source,
      target: r.target,
      type: r.type,
    }));

    // 力导向图模拟
    const simulation = d3.forceSimulation(nodes as any)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    const g = svg.append('g');

    // 缩放行为
    const zoom = d3.zoom()
      .scaleExtent([0.5, 3])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom as any);

    // 绘制边
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', d => edgeColors[d.type])
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6);

    // 绘制节点
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended) as any);

    // 节点圆圈
    node.append('circle')
      .attr('r', d => 8 + d.memory.importance)
      .attr('fill', d => typeColors[d.memory.type])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('click', (event, d) => {
        event.stopPropagation();
        onMemoryClick(d.memory);
      })
      .on('mouseover', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => 12 + d.memory.importance);
      })
      .on('mouseout', function() {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', d => 8 + d.memory.importance);
      });

    // 节点标签
    node.append('text')
      .attr('dx', 15)
      .attr('dy', 4)
      .style('font-size', '10px')
      .style('fill', '#374151')
      .text(d => d.memory.content.substring(0, 20) + '...');

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

    node.on('mouseover', (event, d) => {
      tooltip.transition().duration(200).style('opacity', 1);
      tooltip.html(`
        <div><strong>${d.memory.type.toUpperCase()}</strong></div>
        <div>${d.memory.content.substring(0, 60)}...</div>
        <div>重要性: ${d.memory.importance}/10</div>
      `)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px');
    })
    .on('mouseout', () => {
      tooltip.transition().duration(200).style('opacity', 0);
    });

    // 更新位置
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }

    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }

    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [memories, relationships, onMemoryClick]);

  return (
    <div className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import D3ForceGraph from './D3ForceGraph';
import type { GraphNode } from '../types';
import { useVisualizationStore } from '../stores/visualizationStore';

interface KnowledgeGraphProps {
  className?: string;
}

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ className = '' }) => {
  const { entities, relationships, selectedMemory, selectMemory } = useVisualizationStore();
  const [layout, setLayout] = useState<'force' | 'hierarchical' | 'radial'>('force');
  const [showSimilarityEdges, setShowSimilarityEdges] = useState(false);

  // Convert entities and relationships to graph nodes and edges
  const { nodes, edges } = useMemo(() => {
    const graphNodes: GraphNode[] = entities.map(entity => ({
      id: entity.id,
      label: entity.name,
      type: 'entity',
      properties: entity.properties,
      importance: entity.importance,
    }));

    const graphEdges = relationships.map(rel => ({
      source: rel.sourceId,
      target: rel.targetId,
      type: rel.type,
      weight: rel.weight,
    }));

    return { nodes: graphNodes, edges: graphEdges };
  }, [entities, relationships, showSimilarityEdges]);

  // Get highlighted node IDs
  const highlightedNodeIds = useMemo(() => {
    const ids: string[] = [];
    if (selectedMemory && selectedMemory.entities) {
      ids.push(...selectedMemory.entities.map(e => e.id));
    }
    return ids;
  }, [selectedMemory]);

  const handleNodeClick = (node: GraphNode) => {
    // Find memories associated with this entity
    const entity = entities.find(e => e.id === node.id);
    if (entity && entity.memoryIds && entity.memoryIds.length > 0) {
      // For now, just log - in a real app, you'd navigate to the memory
      console.log('Entity memories:', entity.memoryIds);
    }
  };

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No knowledge graph</h3>
          <p className="mt-1 text-sm text-gray-500">
            No entities or relationships found.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Knowledge Graph</h3>
        <div className="flex items-center space-x-4">
          {/* Layout selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Layout:</label>
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as any)}
              className="px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="force">Force</option>
              <option value="hierarchical">Hierarchical</option>
              <option value="radial">Radial</option>
            </select>
          </div>

          {/* Similarity edges toggle */}
          <label className="flex items-center space-x-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showSimilarityEdges}
              onChange={(e) => setShowSimilarityEdges(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Show similarity</span>
          </label>
        </div>
      </div>

      {/* Graph visualization */}
      <div className="flex-1 overflow-hidden">
        <D3ForceGraph
          nodes={nodes}
          edges={edges}
          onNodeClick={handleNodeClick}
          highlightedNodeIds={highlightedNodeIds}
        />
      </div>

      {/* Stats footer */}
      <div className="flex items-center justify-between p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex space-x-6 text-sm">
          <div>
            <span className="text-gray-500">Nodes:</span>
            <span className="ml-2 font-semibold text-gray-900">{nodes.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Edges:</span>
            <span className="ml-2 font-semibold text-gray-900">{edges.length}</span>
          </div>
          <div>
            <span className="text-gray-500">Entities:</span>
            <span className="ml-2 font-semibold text-blue-600">
              {nodes.filter(n => n.type === 'entity').length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Memories:</span>
            <span className="ml-2 font-semibold text-green-600">
              {nodes.filter(n => n.type === 'memory').length}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Concepts:</span>
            <span className="ml-2 font-semibold text-orange-600">
              {nodes.filter(n => n.type === 'concept').length}
            </span>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Drag nodes • Scroll to zoom • Click for details
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;

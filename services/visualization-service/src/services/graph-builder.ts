import {
  AggregatedMemory,
  MemoryGraph,
  GraphNode,
  GraphEdge,
  GraphOptions,
  MemoryRelationship,
  SimilarityEdge,
  LayoutAlgorithm,
  VisualizationError,
  VisualizationErrorCodes,
} from '../types';

export class GraphBuilder {
  private readonly typeColors: Record<string, string> = {
    stm: '#3B82F6',      // Blue
    episodic: '#10B981', // Green
    semantic: '#F59E0B', // Amber
    reflection: '#8B5CF6', // Purple
  };

  /**
   * Build memory graph from memories and relationships
   */
  async buildGraph(
    memories: AggregatedMemory[],
    options: GraphOptions,
    relationships: MemoryRelationship[] = []
  ): Promise<MemoryGraph> {
    try {
      // Create nodes from memories
      const nodes = this.createNodes(memories);

      // Create edges from relationships
      const edges = this.createEdges(relationships, memories);

      // Apply layout algorithm
      const graph: MemoryGraph = {
        nodes,
        edges,
        layout: {
          algorithm: options.layout,
          width: options.width,
          height: options.height,
        },
      };

      const layoutedGraph = await this.applyLayout(graph, options.layout);

      return layoutedGraph;
    } catch (error) {
      throw new VisualizationError(
        `Failed to build graph: ${error instanceof Error ? error.message : 'Unknown error'}`,
        VisualizationErrorCodes.GRAPH_BUILD_FAILED,
        500
      );
    }
  }

  /**
   * Create graph nodes from memories
   */
  private createNodes(memories: AggregatedMemory[]): GraphNode[] {
    return memories.map(memory => ({
      id: memory.id,
      memory,
      x: 0, // Will be set by layout algorithm
      y: 0,
      size: this.calculateNodeSize(memory),
      color: this.typeColors[memory.type] || '#6B7280',
    }));
  }

  /**
   * Calculate node size based on importance
   */
  private calculateNodeSize(memory: AggregatedMemory): number {
    const baseSize = 10;
    const importance = memory.importance || 5;
    return baseSize + (importance * 2);
  }

  /**
   * Create edges from relationships
   */
  private createEdges(relationships: MemoryRelationship[], memories: AggregatedMemory[]): GraphEdge[] {
    const memoryIds = new Set(memories.map(m => m.id));
    
    return relationships
      .filter(rel => memoryIds.has(rel.sourceId) && memoryIds.has(rel.targetId))
      .map(rel => ({
        source: rel.sourceId,
        target: rel.targetId,
        type: rel.type,
        weight: 1,
      }));
  }

  /**
   * Add similarity edges to graph
   */
  async addSimilarityEdges(
    graph: MemoryGraph,
    similarities: SimilarityEdge[]
  ): Promise<MemoryGraph> {
    const nodeIds = new Set(graph.nodes.map(n => n.id));
    
    const similarityEdges: GraphEdge[] = similarities
      .filter(sim => nodeIds.has(sim.sourceId) && nodeIds.has(sim.targetId))
      .map(sim => ({
        source: sim.sourceId,
        target: sim.targetId,
        type: 'similarity',
        weight: sim.similarity,
      }));

    return {
      ...graph,
      edges: [...graph.edges, ...similarityEdges],
    };
  }

  /**
   * Apply layout algorithm to position nodes
   */
  async applyLayout(graph: MemoryGraph, algorithm: LayoutAlgorithm): Promise<MemoryGraph> {
    switch (algorithm) {
      case 'force-directed':
        return this.applyForceDirectedLayout(graph);
      case 'hierarchical':
        return this.applyHierarchicalLayout(graph);
      case 'circular':
        return this.applyCircularLayout(graph);
      default:
        return this.applyForceDirectedLayout(graph);
    }
  }

  /**
   * Apply force-directed layout algorithm
   */
  private applyForceDirectedLayout(graph: MemoryGraph): MemoryGraph {
    const { width, height } = graph.layout;
    const nodes = [...graph.nodes];
    const edges = graph.edges;

    // Initialize random positions
    nodes.forEach(node => {
      node.x = Math.random() * width;
      node.y = Math.random() * height;
    });

    // Simulation parameters
    const iterations = 100;
    const k = Math.sqrt((width * height) / nodes.length); // Optimal distance
    const c = 0.1; // Cooling factor

    // Build adjacency map
    const adjacency = new Map<string, Set<string>>();
    edges.forEach(edge => {
      if (!adjacency.has(edge.source)) adjacency.set(edge.source, new Set());
      if (!adjacency.has(edge.target)) adjacency.set(edge.target, new Set());
      adjacency.get(edge.source)!.add(edge.target);
      adjacency.get(edge.target)!.add(edge.source);
    });

    // Run simulation
    for (let iter = 0; iter < iterations; iter++) {
      const temperature = (1 - iter / iterations) * c;

      // Calculate forces
      const forces = new Map<string, { x: number; y: number }>();
      nodes.forEach(node => forces.set(node.id, { x: 0, y: 0 }));

      // Repulsive forces between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const node1 = nodes[i];
          const node2 = nodes[j];

          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const repulsion = (k * k) / distance;
          const fx = (dx / distance) * repulsion;
          const fy = (dy / distance) * repulsion;

          const force1 = forces.get(node1.id)!;
          const force2 = forces.get(node2.id)!;

          force1.x -= fx;
          force1.y -= fy;
          force2.x += fx;
          force2.y += fy;
        }
      }

      // Attractive forces for connected nodes
      edges.forEach(edge => {
        const node1 = nodes.find(n => n.id === edge.source);
        const node2 = nodes.find(n => n.id === edge.target);

        if (node1 && node2) {
          const dx = node2.x - node1.x;
          const dy = node2.y - node1.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;

          const attraction = (distance * distance) / k;
          const fx = (dx / distance) * attraction * edge.weight;
          const fy = (dy / distance) * attraction * edge.weight;

          const force1 = forces.get(node1.id)!;
          const force2 = forces.get(node2.id)!;

          force1.x += fx;
          force1.y += fy;
          force2.x -= fx;
          force2.y -= fy;
        }
      });

      // Apply forces
      nodes.forEach(node => {
        const force = forces.get(node.id)!;
        node.x += force.x * temperature;
        node.y += force.y * temperature;

        // Keep within bounds
        node.x = Math.max(node.size, Math.min(width - node.size, node.x));
        node.y = Math.max(node.size, Math.min(height - node.size, node.y));
      });
    }

    return {
      ...graph,
      nodes,
    };
  }

  /**
   * Apply hierarchical layout algorithm
   */
  private applyHierarchicalLayout(graph: MemoryGraph): MemoryGraph {
    const { width, height } = graph.layout;
    const nodes = [...graph.nodes];

    // Sort by timestamp (oldest to newest)
    nodes.sort((a, b) => a.memory.timestamp.getTime() - b.memory.timestamp.getTime());

    // Arrange in layers
    const layerHeight = height / Math.max(1, Math.ceil(nodes.length / 10));
    const nodesPerLayer = Math.ceil(width / 100);

    nodes.forEach((node, index) => {
      const layer = Math.floor(index / nodesPerLayer);
      const positionInLayer = index % nodesPerLayer;

      node.y = layer * layerHeight + layerHeight / 2;
      node.x = (positionInLayer + 0.5) * (width / nodesPerLayer);
    });

    return {
      ...graph,
      nodes,
    };
  }

  /**
   * Apply circular layout algorithm
   */
  private applyCircularLayout(graph: MemoryGraph): MemoryGraph {
    const { width, height } = graph.layout;
    const nodes = [...graph.nodes];

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 50;

    nodes.forEach((node, index) => {
      const angle = (2 * Math.PI * index) / nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    return {
      ...graph,
      nodes,
    };
  }
}

import { describe, it, expect, beforeEach } from 'vitest';
import { TopologyModel, SAMPLE_NODES, SAMPLE_EDGES } from '../src/core/models/graph';

describe('TopologyModel', () => {
  let graph;

  beforeEach(() => {
    graph = new TopologyModel();
  });

  it('should initialize empty or with provided nodes', () => {
    expect(Object.keys(graph.nodes).length).toBe(0);
    
    const sampleGraph = new TopologyModel(SAMPLE_NODES, SAMPLE_EDGES);
    expect(Object.keys(sampleGraph.nodes).length).toBe(6);
    expect(Object.keys(sampleGraph.edges).length).toBe(8);
  });

  it('should add nodes', () => {
    graph.addNode('A', 'Router A', 10, 10);
    expect(graph.nodes['A']).toBeDefined();
    expect(graph.nodes['A'].label).toBe('Router A');
    
    expect(() => graph.addNode('A', 'Duplicate')).toThrowError(/already exists/);
  });

  it('should add edges correctly preventing self-loops and duplicates', () => {
    graph.addNode('A', 'A', 0, 0);
    graph.addNode('B', 'B', 0, 0);
    
    graph.addEdge('A', 'B', 5);
    expect(Object.keys(graph.edges).length).toBe(1);
    
    // Sort logic makes sure A-B and B-A have same ID
    expect(() => graph.addEdge('B', 'A', 2)).toThrowError(/already exists/);
    expect(() => graph.addEdge('A', 'A', 1)).toThrowError(/Self-loops are not allowed/);
  });
  
  it('should enforce non-negative finite costs', () => {
    graph.addNode('A', 'A', 0, 0);
    graph.addNode('B', 'B', 0, 0);
    
    expect(() => graph.addEdge('A', 'B', -1)).toThrowError(/Cost must be/);
    expect(() => graph.addEdge('A', 'B', Infinity)).toThrowError(/Cost must be/);
    
    const id = graph.addEdge('A', 'B', 10);
    expect(() => graph.updateEdgeCost(id, -5)).toThrowError(/Cost must be/);
  });

  it('should remove node and connected edges', () => {
    graph.addNode('A', 'A', 0, 0);
    graph.addNode('B', 'B', 0, 0);
    graph.addNode('C', 'C', 0, 0);
    
    graph.addEdge('A', 'B', 1);
    graph.addEdge('B', 'C', 2);
    
    graph.removeNode('B');
    
    expect(graph.nodes['B']).toBeUndefined();
    expect(Object.keys(graph.edges).length).toBe(0); // Both A-B and B-C should be gone
  });

  it('should update coordinates without affecting graph adjacency', () => {
    graph.addNode('A', 'Router A', 10, 10);
    graph.addNode('B', 'Router B', 20, 20);
    graph.addEdge('A', 'B', 5);

    const originalAdj = graph.getAdjacencyList();
    
    graph.updateNodePosition('A', 100, 100);
    
    expect(graph.nodes['A'].x).toBe(100);
    expect(graph.nodes['A'].y).toBe(100);
    
    // Node B remains unchanged
    expect(graph.nodes['B'].x).toBe(20);
    
    // Adjacency is completely unchanged
    expect(graph.getAdjacencyList()).toEqual(originalAdj);

    // Safely ignore updates to non-existent nodes
    expect(() => {
      graph.updateNodePosition('Z', 50, 50);
    }).not.toThrow();
  });

  it('should correctly generate adjacency list skipping disabled links', () => {
    graph.addNode('A', 'A', 0, 0);
    graph.addNode('B', 'B', 0, 0);
    graph.addNode('C', 'C', 0, 0);
    
    const _ab = graph.addEdge('A', 'B', 1);
    const bc = graph.addEdge('B', 'C', 2);
    
    let adj = graph.getAdjacencyList();
    expect(adj['A']['B']).toBe(1);
    expect(adj['B']['A']).toBe(1);
    expect(adj['B']['C']).toBe(2);
    
    // Disable B-C
    graph.toggleEdge(bc);
    
    adj = graph.getAdjacencyList();
    expect(adj['A']['B']).toBe(1);
    expect(adj['B']['C']).toBeUndefined(); // shouldn't exist
  });
});

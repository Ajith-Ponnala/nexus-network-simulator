import { describe, it, expect } from 'vitest';
import { findShortestPath } from '../src/core/algorithms/dijkstra';

describe('Dijkstra Shortest Path Algorithm', () => {
  it('should find shortest path with direct connection', () => {
    const graph = {
      'A': { 'B': 2 },
      'B': { 'A': 2 }
    };
    const res = findShortestPath(graph, 'A', 'B');
    expect(res.pathExists).toBe(true);
    expect(res.totalCost).toBe(2);
    expect(res.path).toEqual(['A', 'B']);
    expect(res.edges).toEqual(['A-B']);
  });

  it('should choose the shorter of multiple possible paths', () => {
    const graph = {
      'A': { 'B': 5, 'C': 1 },
      'B': { 'A': 5, 'D': 2 },
      'C': { 'A': 1, 'B': 1, 'D': 6 },
      'D': { 'B': 2, 'C': 6 }
    };
    // Path A -> C -> B -> D is 1 + 1 + 2 = 4
    // Path A -> B -> D is 5 + 2 = 7
    const res = findShortestPath(graph, 'A', 'D');
    expect(res.pathExists).toBe(true);
    expect(res.totalCost).toBe(4);
    expect(res.path).toEqual(['A', 'C', 'B', 'D']);
  });

  it('should correctly handle zero-cost links', () => {
    const graph = {
      'A': { 'B': 0 },
      'B': { 'A': 0, 'C': 5 },
      'C': { 'B': 5, 'A': 10 }
    };
    const res = findShortestPath(graph, 'A', 'C');
    expect(res.pathExists).toBe(true);
    expect(res.totalCost).toBe(5); // A -> B(0) -> C(5)
    expect(res.path).toEqual(['A', 'B', 'C']);
  });

  it('should handle disconnected destinations', () => {
    const graph = {
      'A': { 'B': 1 },
      'B': { 'A': 1 },
      'C': {}
    };
    const res = findShortestPath(graph, 'A', 'C');
    expect(res.pathExists).toBe(false);
    expect(res.error).toMatch(/No route exists/);
  });

  it('should handle source equals destination', () => {
    const graph = { 'A': { 'B': 1 }, 'B': { 'A': 1 } };
    const res = findShortestPath(graph, 'A', 'A');
    expect(res.pathExists).toBe(true);
    expect(res.totalCost).toBe(0);
    expect(res.path).toEqual(['A']);
  });

  it('should handle invalid source or destination gracefully', () => {
    const graph = { 'A': {} };
    const res = findShortestPath(graph, 'A', 'Z');
    expect(res.pathExists).toBe(false);
    expect(res.error).toMatch(/Invalid source or destination/);
  });

  it('should improve distance with a later-discovered route', () => {
    // A-B is 10
    // A-C is 1
    // C-B is 1
    // Initial discovery of B via A is 10. Later via C is 2.
    const graph = {
      'A': { 'B': 10, 'C': 1 },
      'B': { 'A': 10, 'C': 1 },
      'C': { 'A': 1, 'B': 1 }
    };
    const res = findShortestPath(graph, 'A', 'B');
    expect(res.totalCost).toBe(2);
    expect(res.path).toEqual(['A', 'C', 'B']);
  });
});

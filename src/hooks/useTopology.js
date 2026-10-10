import { useState, useCallback } from 'react';
import { TopologyModel, SAMPLE_NODES, SAMPLE_EDGES } from '../core/models/graph';

export function useTopology() {
  const [model, setModel] = useState(() => new TopologyModel(SAMPLE_NODES, SAMPLE_EDGES));
  const [error, setError] = useState(null);
  const [sourceNode, setSourceNode] = useState(null);
  const [destNode, setDestNode] = useState(null);

  const triggerUpdate = useCallback((newModel) => {
    // Re-instantiating forces a new reference for React state
    setModel(new TopologyModel(newModel.nodes, newModel.edges));
    setError(null);
  }, []);

  const execute = useCallback((action) => {
    try {
      action(model);
      // Validate selected nodes exist
      if (sourceNode && !model.nodes[sourceNode]) setSourceNode(null);
      if (destNode && !model.nodes[destNode]) setDestNode(null);
      triggerUpdate(model);
    } catch (err) {
      setError(err.message);
    }
  }, [model, sourceNode, destNode, triggerUpdate]);

  const addNode = (id, label, x, y) => execute((m) => m.addNode(id, label, x, y));
  const removeNode = (id) => execute((m) => m.removeNode(id));
  const updateNodePosition = (id, x, y) => execute((m) => m.updateNodePosition(id, x, y));
  const addEdge = (source, target, cost) => execute((m) => m.addEdge(source, target, cost));
  const removeEdge = (id) => execute((m) => m.removeEdge(id));
  const updateEdgeCost = (id, cost) => execute((m) => m.updateEdgeCost(id, cost));
  const toggleEdge = (id) => execute((m) => m.toggleEdge(id));
  
  const resetToSample = () => {
    setModel(new TopologyModel(SAMPLE_NODES, SAMPLE_EDGES));
    setSourceNode(null);
    setDestNode(null);
    setError(null);
  };
  const clearError = () => setError(null);

  return {
    nodes: model.nodes,
    edges: model.edges,
    getGraph: () => model.getAdjacencyList(), // compatibility with older code if any
    error,
    clearError,
    addNode,
    removeNode,
    updateNodePosition,
    addEdge,
    removeEdge,
    updateEdgeCost,
    toggleEdge,
    resetToSample,
    sourceNode,
    destNode,
    setSourceNode,
    setDestNode
  };
}

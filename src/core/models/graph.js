export const SAMPLE_NODES = {
  'R1': { id: 'R1', label: 'R1', x: 100, y: 150 },
  'R2': { id: 'R2', label: 'R2', x: 300, y: 100 },
  'R3': { id: 'R3', label: 'R3', x: 300, y: 250 },
  'R4': { id: 'R4', label: 'R4', x: 500, y: 100 },
  'R5': { id: 'R5', label: 'R5', x: 500, y: 250 },
  'R6': { id: 'R6', label: 'R6', x: 700, y: 175 }
};

export const SAMPLE_EDGES = {
  'R1-R2': { id: 'R1-R2', source: 'R1', target: 'R2', cost: 2, enabled: true },
  'R1-R3': { id: 'R1-R3', source: 'R1', target: 'R3', cost: 4, enabled: true },
  'R2-R3': { id: 'R2-R3', source: 'R2', target: 'R3', cost: 1, enabled: true },
  'R2-R4': { id: 'R2-R4', source: 'R2', target: 'R4', cost: 7, enabled: true },
  'R3-R5': { id: 'R3-R5', source: 'R3', target: 'R5', cost: 3, enabled: true },
  'R4-R5': { id: 'R4-R5', source: 'R4', target: 'R5', cost: 2, enabled: true },
  'R4-R6': { id: 'R4-R6', source: 'R4', target: 'R6', cost: 1, enabled: true },
  'R5-R6': { id: 'R5-R6', source: 'R5', target: 'R6', cost: 5, enabled: true }
};

export class TopologyModel {
  constructor(initialNodes = {}, initialEdges = {}) {
    // Deep copy to prevent reference mutations from outside
    this.nodes = JSON.parse(JSON.stringify(initialNodes));
    this.edges = JSON.parse(JSON.stringify(initialEdges));
  }

  addNode(id, label, x, y) {
    if (!id || id.trim() === '') {
      throw new Error("Node ID cannot be empty.");
    }
    if (this.nodes[id]) {
      throw new Error(`Node with ID ${id} already exists.`);
    }
    this.nodes[id] = { id, label: label || id, x, y };
  }

  removeNode(id) {
    if (!this.nodes[id]) return;
    delete this.nodes[id];
    // Remove all connected edges
    for (const edgeId in this.edges) {
      const edge = this.edges[edgeId];
      if (edge.source === id || edge.target === id) {
        delete this.edges[edgeId];
      }
    }
  }

  updateNodePosition(id, x, y) {
    if (this.nodes[id]) {
      this.nodes[id].x = x;
      this.nodes[id].y = y;
    }
  }

  addEdge(source, target, cost = 1) {
    if (!this.nodes[source] || !this.nodes[target]) {
      throw new Error("Both source and target nodes must exist.");
    }
    if (source === target) {
      throw new Error("Self-loops are not allowed.");
    }
    const numCost = Number(cost);
    if (isNaN(numCost) || numCost < 0 || !isFinite(numCost)) {
      throw new Error("Cost must be a non-negative finite number.");
    }
    
    // Sort to ensure undirected graph consistency for ID
    const [s, t] = [source, target].sort();
    const id = `${s}-${t}`;
    
    if (this.edges[id]) {
      throw new Error(`Edge between ${source} and ${target} already exists.`);
    }

    this.edges[id] = { id, source: s, target: t, cost: numCost, enabled: true };
    return id;
  }

  removeEdge(id) {
    delete this.edges[id];
  }

  updateEdgeCost(id, cost) {
    const numCost = Number(cost);
    if (isNaN(numCost) || numCost < 0 || !isFinite(numCost)) {
      throw new Error("Cost must be a non-negative finite number.");
    }
    if (this.edges[id]) {
      this.edges[id].cost = numCost;
    }
  }

  toggleEdge(id) {
    if (this.edges[id]) {
      this.edges[id].enabled = !this.edges[id].enabled;
    }
  }

  getAdjacencyList() {
    const list = {};
    for (const nodeId in this.nodes) {
      list[nodeId] = {};
    }
    for (const edgeId in this.edges) {
      const edge = this.edges[edgeId];
      if (edge.enabled) {
        // Undirected edge
        list[edge.source][edge.target] = edge.cost;
        list[edge.target][edge.source] = edge.cost;
      }
    }
    return list;
  }
}

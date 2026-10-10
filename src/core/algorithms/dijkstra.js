/**
 * A Binary Min-Heap Implementation for the Priority Queue.
 * Enables O(log V) insertions and extractions.
 */
class MinHeap {
  constructor() {
    this.heap = [];
  }

  push(node, priority) {
    this.heap.push({ node, priority });
    let idx = this.heap.length - 1;
    while (idx > 0) {
      let pIdx = Math.floor((idx - 1) / 2);
      if (this.heap[pIdx].priority <= this.heap[idx].priority) break;
      // Swap with parent
      [this.heap[idx], this.heap[pIdx]] = [this.heap[pIdx], this.heap[idx]];
      idx = pIdx;
    }
  }

  pop() {
    if (this.heap.length === 1) return this.heap.pop();
    const top = this.heap[0];
    this.heap[0] = this.heap.pop();
    let idx = 0;
    while (true) {
      let left = 2 * idx + 1;
      let right = 2 * idx + 2;
      let swap = null;

      if (left < this.heap.length && this.heap[left].priority < this.heap[idx].priority) {
        swap = left;
      }
      if (right < this.heap.length && this.heap[right].priority < (swap === null ? this.heap[idx].priority : this.heap[left].priority)) {
        swap = right;
      }

      if (swap === null) break;
      [this.heap[idx], this.heap[swap]] = [this.heap[swap], this.heap[idx]];
      idx = swap;
    }
    return top;
  }

  isEmpty() {
    return this.heap.length === 0;
  }
}

/**
 * Dijkstra's Shortest Path Algorithm
 * 
 * Time Complexity: O((V + E) log V) where V is the number of vertices and E is the number of edges.
 * Space Complexity: O(V + E) to store the priority queue, distances, and path data.
 * 
 * We use a lazy-deletion approach for the priority queue: instead of updating priorities,
 * we insert new (node, distance) pairs and simply ignore popped pairs that are stale.
 * 
 * @param {Object} graph - Adjacency list (e.g., { 'A': { 'B': 1 }, 'B': { 'A': 1 } })
 * @param {string} sourceId - The ID of the source node.
 * @param {string} destinationId - The ID of the destination node.
 * @returns {Object} Result payload with path, cost, and metadata.
 */
export function findShortestPath(graph, sourceId, destinationId) {
  if (!graph) {
    return { pathExists: false, path: [], totalCost: Infinity, edges: [], error: "Graph is null or undefined." };
  }
  if (!graph[sourceId] || !graph[destinationId]) {
    return { pathExists: false, path: [], totalCost: Infinity, edges: [], error: "Invalid source or destination node." };
  }
  
  // Edge case: Source is destination
  if (sourceId === destinationId) {
    return { 
      pathExists: true, 
      path: [sourceId], 
      totalCost: 0, 
      edges: [], 
      distances: { [sourceId]: 0 },
      predecessors: { [sourceId]: null },
      error: null 
    };
  }

  const distances = {};
  const predecessors = {};
  
  // Initialize state
  for (const node in graph) {
    distances[node] = Infinity;
    predecessors[node] = null;
  }
  distances[sourceId] = 0;
  
  const pq = new MinHeap();
  pq.push(sourceId, 0);
  
  while (!pq.isEmpty()) {
    const { node: current, priority: currentDist } = pq.pop();
    
    // Lazy deletion check: ignore stale queue entries
    if (currentDist > distances[current]) continue;
    
    // Early exit: Stop exploring if we've locked in the shortest path to our destination
    if (current === destinationId) break;
    
    for (const neighbor in graph[current]) {
      const edgeCost = graph[current][neighbor];
      
      // Ensure we safely handle 0 costs without failing truthy checks
      if (edgeCost < 0) continue; // Algorithm requirement: Non-negative costs
      
      const newDist = currentDist + edgeCost;
      
      // If we find a strictly shorter path, update and push to heap
      if (newDist < distances[neighbor]) {
        distances[neighbor] = newDist;
        predecessors[neighbor] = current;
        pq.push(neighbor, newDist);
      }
    }
  }
  
  // Reconstruct path
  if (distances[destinationId] === Infinity) {
    return { 
      pathExists: false, 
      path: [], 
      totalCost: Infinity, 
      edges: [], 
      distances, 
      predecessors,
      error: `No route exists between ${sourceId} and ${destinationId}.` 
    };
  }
  
  const path = [];
  let curr = destinationId;
  while (curr !== null) {
    path.unshift(curr);
    curr = predecessors[curr];
  }
  
  // Reconstruct edge IDs
  const edges = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [s, t] = [path[i], path[i+1]].sort();
    edges.push(`${s}-${t}`);
  }
  
  return {
    pathExists: true,
    path,
    totalCost: distances[destinationId],
    edges,
    distances,
    predecessors,
    error: null
  };
}

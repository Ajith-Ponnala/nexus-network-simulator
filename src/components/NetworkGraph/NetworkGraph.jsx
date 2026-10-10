import React, { useState, useRef, useEffect } from 'react';

export default function NetworkGraph({ nodes, edges, highlightedEdges = [], sourceNode, destNode, currentEvent, onNodePositionChange }) {
  const [localNodes, setLocalNodes] = useState({});
  const [draggingNode, setDraggingNode] = useState(null);
  const svgRef = useRef(null);

  // Sync local nodes when props change (except when dragging)
  useEffect(() => {
    if (!draggingNode) {
      setLocalNodes(nodes);
    }
  }, [nodes, draggingNode]);

  const nodesList = Object.values(localNodes);
  const edgesList = Object.values(edges);

  let activeTransmitEdge = null;
  if (currentEvent?.type === 'TRANSMIT' && localNodes[currentEvent.from] && localNodes[currentEvent.to]) {
    activeTransmitEdge = {
      from: localNodes[currentEvent.from],
      to: localNodes[currentEvent.to]
    };
  }

  const getSVGPoint = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: e.clientX, y: e.clientY };
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  };

  const handlePointerDown = (e, nodeId) => {
    if (!onNodePositionChange) return; // read-only check
    e.stopPropagation();
    e.target.setPointerCapture(e.pointerId);
    
    const point = getSVGPoint(e);
    const node = localNodes[nodeId];
    
    setDraggingNode({
      id: nodeId,
      offsetX: point.x - node.x,
      offsetY: point.y - node.y,
      pointerId: e.pointerId
    });
  };

  const handlePointerMove = (e) => {
    if (!draggingNode || e.pointerId !== draggingNode.pointerId) return;
    
    const point = getSVGPoint(e);
    const newX = point.x - draggingNode.offsetX;
    const newY = point.y - draggingNode.offsetY;
    
    setLocalNodes(prev => ({
      ...prev,
      [draggingNode.id]: {
        ...prev[draggingNode.id],
        x: newX,
        y: newY
      }
    }));
  };

  const handlePointerUp = (e) => {
    if (!draggingNode || e.pointerId !== draggingNode.pointerId) return;
    e.target.releasePointerCapture(e.pointerId);
    
    const finalNode = localNodes[draggingNode.id];
    if (onNodePositionChange) {
      onNodePositionChange(draggingNode.id, Math.round(finalNode.x), Math.round(finalNode.y));
    }
    setDraggingNode(null);
  };

  return (
    <svg 
      className="network-svg" 
      ref={svgRef}
      style={{ touchAction: 'none' }} // prevent scrolling on touch devices while dragging
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Draw Edges */}
      {edgesList.map(edge => {
        const sNode = localNodes[edge.source];
        const tNode = localNodes[edge.target];
        if (!sNode || !tNode) return null;

        const isHighlighted = highlightedEdges.includes(edge.id);
        const edgeClass = `edge-line ${isHighlighted ? 'highlighted-path' : ''} ${!edge.enabled ? 'disabled-edge' : ''}`;
        
        const midX = (sNode.x + tNode.x) / 2;
        const midY = (sNode.y + tNode.y) / 2;

        return (
          <g key={edge.id}>
            <line
              x1={sNode.x}
              y1={sNode.y}
              x2={tNode.x}
              y2={tNode.y}
              className={edgeClass}
            />
            <rect
              x={midX - 12}
              y={midY - 12}
              width={24}
              height={24}
              className={`edge-weight-bg ${!edge.enabled ? 'disabled-bg' : ''}`}
            />
            <text
              x={midX}
              y={midY}
              dominantBaseline="middle"
              textAnchor="middle"
              className={`edge-weight-text ${!edge.enabled ? 'disabled-text' : ''}`}
            >
              {edge.cost}
            </text>
          </g>
        );
      })}

      {/* Active Packet Animation */}
      {activeTransmitEdge && (
        <circle
          className="packet-marker"
          r="8"
          style={{
            '--startX': `${activeTransmitEdge.from.x}px`,
            '--startY': `${activeTransmitEdge.from.y}px`,
            '--endX': `${activeTransmitEdge.to.x}px`,
            '--endY': `${activeTransmitEdge.to.y}px`,
          }}
        />
      )}

      {/* Draw Nodes */}
      {nodesList.map(node => {
        const isSource = node.id === sourceNode;
        const isDest = node.id === destNode;
        let nodeClass = "node-shape";
        if (isSource) nodeClass += " source-node";
        if (isDest) nodeClass += " dest-node";
        
        const isDragging = draggingNode?.id === node.id;

        return (
          <g 
            key={node.id} 
            className="node-group" 
            transform={`translate(${node.x}, ${node.y})`}
            onPointerDown={(e) => handlePointerDown(e, node.id)}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ 
              cursor: onNodePositionChange ? (isDragging ? 'grabbing' : 'grab') : 'default',
              opacity: isDragging ? 0.8 : 1
            }}
          >
            <circle className={nodeClass} r={25} />
            <text className="node-text" dominantBaseline="middle" textAnchor="middle" style={{ pointerEvents: 'none', userSelect: 'none' }}>
              {node.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

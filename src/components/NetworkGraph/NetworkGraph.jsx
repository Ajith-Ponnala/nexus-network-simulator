import React, { useState, useRef, useEffect } from 'react';

export default function NetworkGraph({ 
  nodes, 
  edges, 
  highlightedEdges = [], 
  sourceNode, 
  destNode, 
  currentEvent, 
  onNodePositionChange,
  onToggleEdge
}) {
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

  // Calculate stable viewBox across all nodes to guarantee 100% visibility of all routers
  const nodesArr = Object.values(nodes);
  const xs = nodesArr.map(n => n.x);
  const ys = nodesArr.map(n => n.y);

  const minX = xs.length ? Math.min(...xs) : 100;
  const maxX = xs.length ? Math.max(...xs) : 700;
  const minY = ys.length ? Math.min(...ys) : 100;
  const maxY = ys.length ? Math.max(...ys) : 250;

  const paddingX = 65;
  const paddingTop = 60; // accommodates SRC / DEST tags above nodes at y - 35
  const paddingBottom = 65; // accommodates DROP / VALIDATED tags below nodes at y + 36

  const boxX = Math.min(20, minX - paddingX);
  const boxY = Math.min(20, minY - paddingTop);
  const boxWidth = Math.max(760, (maxX + paddingX) - boxX);
  const boxHeight = Math.max(300, (maxY + paddingBottom) - boxY);

  return (
    <svg 
      className="network-svg" 
      ref={svgRef}
      viewBox={`${boxX} ${boxY} ${boxWidth} ${boxHeight}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ touchAction: 'none' }} // prevent scrolling on touch devices while dragging
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="destGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
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

        const edgeTooltip = edge.enabled 
          ? `Link ${edge.source} ↔ ${edge.target} (Cost: ${edge.cost}, ON) — Click to Turn OFF` 
          : `Link ${edge.source} ↔ ${edge.target} (Cost: ${edge.cost}, OFF/Disabled) — Click to Turn ON`;

        return (
          <g key={edge.id} className={`edge-group ${!edge.enabled ? 'is-disabled' : ''}`}>
            {/* Wider transparent hit line for effortless click-to-toggle */}
            {onToggleEdge && (
              <line
                x1={sNode.x}
                y1={sNode.y}
                x2={tNode.x}
                y2={tNode.y}
                stroke="transparent"
                strokeWidth="20"
                style={{ cursor: 'pointer' }}
                onClick={() => onToggleEdge(edge.id)}
              >
                <title>{edgeTooltip}</title>
              </line>
            )}

            {/* Visible link line */}
            <line
              x1={sNode.x}
              y1={sNode.y}
              x2={tNode.x}
              y2={tNode.y}
              className={edgeClass}
              style={{ pointerEvents: 'none' }}
            />

            {/* Interactive Weight / On-Off Badge */}
            <g 
              transform={`translate(${midX}, ${midY})`}
              style={{ cursor: onToggleEdge ? 'pointer' : 'default' }}
              onClick={() => onToggleEdge && onToggleEdge(edge.id)}
            >
              <title>{edgeTooltip}</title>
              
              {edge.enabled ? (
                <>
                  <rect
                    x={-14}
                    y={-12}
                    width={28}
                    height={24}
                    className="edge-weight-bg"
                  />
                  <text
                    x={0}
                    y={1}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className="edge-weight-text"
                  >
                    {edge.cost}
                  </text>
                </>
              ) : (
                <>
                  <rect
                    x={-17}
                    y={-14}
                    width={34}
                    height={28}
                    className="edge-weight-bg disabled-bg"
                  />
                  <text
                    x={0}
                    y={-3}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    className="edge-weight-text disabled-text"
                  >
                    {edge.cost}
                  </text>
                  {/* Small red OFF pill indicator */}
                  <rect
                    x={-12}
                    y={3}
                    width={24}
                    height={9}
                    rx={2.5}
                    fill="#ef4444"
                  />
                  <text
                    x={0}
                    y={8.5}
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="6.5"
                    fontWeight="800"
                    fontFamily="var(--font-mono)"
                  >
                    OFF
                  </text>
                  {/* Diagonal strikethrough over cost */}
                  <line
                    x1={-9}
                    y1={-8}
                    x2={9}
                    y2={1}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>
          </g>
        );
      })}

      {/* Active Packet Animation */}
      {activeTransmitEdge && (
        <g className="active-packet-visual">
          <circle
            className={`packet-marker ${currentEvent?.wasCorrupted ? 'corrupted-packet' : 'clean-packet'}`}
            r="8.5"
            style={{
              '--startX': `${activeTransmitEdge.from.x}px`,
              '--startY': `${activeTransmitEdge.from.y}px`,
              '--endX': `${activeTransmitEdge.to.x}px`,
              '--endY': `${activeTransmitEdge.to.y}px`,
            }}
          />
          {/* Midpoint in-transit tag */}
          <g 
            transform={`translate(${(activeTransmitEdge.from.x + activeTransmitEdge.to.x) / 2}, ${(activeTransmitEdge.from.y + activeTransmitEdge.to.y) / 2 - 20})`}
            pointerEvents="none"
          >
            <rect
              x="-46"
              y="-10"
              width="92"
              height="20"
              rx="10"
              fill={currentEvent?.wasCorrupted ? '#ef4444' : '#0ea5e9'}
              filter="url(#glow)"
            />
            <text
              x="0"
              y="1.5"
              dominantBaseline="middle"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="8.5"
              fontWeight="800"
              fontFamily="var(--font-mono)"
            >
              {currentEvent?.wasCorrupted ? '⚡ NOISY FRAME' : '✓ IN TRANSIT'}
            </text>
          </g>
        </g>
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
            {/* Concentric pulsing target ring for destination */}
            {isDest && (
              <circle
                className="dest-pulse-ring"
                r={34}
                fill="none"
                stroke="var(--node-dest, #FF9F1C)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            {/* Pulsing ring for source node */}
            {isSource && !isDest && (
              <circle
                className="src-pulse-ring"
                r={34}
                fill="none"
                stroke="var(--status-success, #10B981)"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}

            <circle className={nodeClass} r={25} />

            <text 
              className={`node-text ${isDest ? 'dest-node-text' : ''} ${isSource ? 'source-node-text' : ''}`} 
              dominantBaseline="middle" 
              textAnchor="middle" 
              style={{ pointerEvents: 'none', userSelect: 'none' }}
            >
              {node.label}
            </text>

            {/* Destination Badge above node */}
            {isDest && (
              <g className="dest-badge-tag" transform="translate(0, -35)" pointerEvents="none">
                <rect x="-18" y="-7" width="36" height="15" rx="7.5" fill="var(--node-dest, #FF9F1C)" />
                <text 
                  x="0" 
                  y="1.5" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fill="#080D18" 
                  fontSize="9" 
                  fontWeight="800" 
                  fontFamily="var(--font-mono)"
                >
                  DEST
                </text>
              </g>
            )}

            {/* Source Badge above node */}
            {isSource && !isDest && (
              <g className="src-badge-tag" transform="translate(0, -35)" pointerEvents="none">
                <rect x="-16" y="-7" width="32" height="15" rx="7.5" fill="var(--status-success, #10B981)" />
                <text 
                  x="0" 
                  y="1.5" 
                  dominantBaseline="middle" 
                  textAnchor="middle" 
                  fill="#080D18" 
                  fontSize="9" 
                  fontWeight="800" 
                  fontFamily="var(--font-mono)"
                >
                  SRC
                </text>
              </g>
            )}

            {/* Live Simulation Hop Status Badges below node */}
            {currentEvent?.type === 'DROP' && currentEvent.at === node.id && (
              <g className="node-sim-alert drop" transform="translate(0, 36)" pointerEvents="none">
                <rect x="-56" y="-9" width="112" height="18" rx="9" fill="#ef4444" />
                <text x="0" y="1.5" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="var(--font-mono)">
                  ⚠ CRC FAIL · DROPPED
                </text>
              </g>
            )}

            {currentEvent?.type === 'HOP_SUCCESS' && currentEvent.at === node.id && (
              <g className="node-sim-alert success" transform="translate(0, 36)" pointerEvents="none">
                <rect x="-52" y="-9" width="104" height="18" rx="9" fill="#10b981" />
                <text x="0" y="1.5" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="var(--font-mono)">
                  ✓ CRC VALIDATED
                </text>
              </g>
            )}

            {currentEvent?.type === 'PACKET_DELIVERED' && currentEvent.at === node.id && (
              <g className="node-sim-alert delivered" transform="translate(0, 36)" pointerEvents="none">
                <rect x="-56" y="-9" width="112" height="18" rx="9" fill="#8b5cf6" />
                <text x="0" y="1.5" dominantBaseline="middle" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="800" fontFamily="var(--font-mono)">
                  🎉 PKT DELIVERED
                </text>
              </g>
            )}
          </g>
        );
      })}
    </svg>
  );
}

import React, { useState } from 'react';

export default function TopologyEditor({ topology, routeResult, onCalculateRoute }) {
  const { 
    nodes, edges, error, clearError, resetToSample, 
    addNode, removeNode, addEdge, removeEdge, updateEdgeCost, toggleEdge,
    sourceNode, setSourceNode, destNode, setDestNode
  } = topology;

  const [newNodeId, setNewNodeId] = useState('');
  const [edgeSource, setEdgeSource] = useState('');
  const [edgeTarget, setEdgeTarget] = useState('');
  const [edgeCost, setEdgeCost] = useState('1');

  const handleAddNode = (e) => {
    e.preventDefault();
    if (newNodeId.trim()) {
      // randomly place node for now
      const x = Math.floor(Math.random() * 400) + 100;
      const y = Math.floor(Math.random() * 300) + 100;
      addNode(newNodeId.trim(), newNodeId.trim(), x, y);
      setNewNodeId('');
    }
  };

  const handleAddEdge = (e) => {
    e.preventDefault();
    if (edgeSource && edgeTarget && edgeCost) {
      addEdge(edgeSource, edgeTarget, edgeCost);
      setEdgeSource('');
      setEdgeTarget('');
      setEdgeCost('1');
    }
  };

  const nodeIds = Object.keys(nodes);

  return (
    <div className="topology-editor">
      
      {error && (
        <div className="error-banner">
          <span>{error}</span>
          <button type="button" className="close-btn" onClick={clearError}>×</button>
        </div>
      )}

      {/* Editor Controls */}
      <div className="surface" style={{ marginBottom: '1.5rem' }}>
        <div className="surface-header">
          <span className="surface-title">Graph Editor</span>
          <button type="button" className="btn btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={resetToSample}>Reset Sample</button>
        </div>
        <div className="surface-body">

        {/* Add Node */}
        <form onSubmit={handleAddNode} className="editor-form">
          <div className="input-group row">
            <input 
              type="text" 
              placeholder="New Node ID (e.g. R7)" 
              value={newNodeId}
              onChange={(e) => setNewNodeId(e.target.value)}
              aria-label="New Node ID"
            />
            <button type="submit" className="primary-btn small" disabled={!newNodeId.trim()}>Add Node</button>
          </div>
        </form>

        {/* Add Edge */}
        <form onSubmit={handleAddEdge} className="editor-form" style={{ marginTop: '1rem' }}>
          <div className="input-group row multi">
            <select value={edgeSource} onChange={e => setEdgeSource(e.target.value)} aria-label="Edge Source">
              <option value="" disabled>Src</option>
              {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <select value={edgeTarget} onChange={e => setEdgeTarget(e.target.value)} aria-label="Edge Target">
              <option value="" disabled>Dst</option>
              {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
            <input 
              type="number" 
              placeholder="Cost" 
              min="0" 
              value={edgeCost} 
              onChange={e => setEdgeCost(e.target.value)}
              style={{ width: '60px' }}
              aria-label="Edge Cost"
            />
            <button type="submit" className="primary-btn small" disabled={!edgeSource || !edgeTarget || !edgeCost}>Add Edge</button>
          </div>
        </form>
        </div>
      </div>

      {/* Manage Nodes & Edges */}
      <div className="surface" style={{ marginBottom: '1.5rem' }}>
        <div className="surface-header">
          <span className="surface-title">Manage Elements</span>
        </div>
        <div className="surface-body">
        
        <div className="elements-list">
          <h4 className="list-heading">Nodes</h4>
          {nodeIds.length === 0 ? <p className="empty-text">No nodes</p> : (
            <div className="chip-container">
              {nodeIds.map(id => (
                <div key={id} className="chip">
                  <span>{id}</span>
                  <button type="button" className="delete-btn" onClick={() => removeNode(id)} aria-label={`Delete ${id}`}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="elements-list" style={{ marginTop: '1rem' }}>
          <h4 className="list-heading">Edges</h4>
          {Object.keys(edges).length === 0 ? <p className="empty-text">No edges</p> : (
            <ul className="edge-list">
              {Object.values(edges).map(edge => (
                <li key={edge.id} className={`edge-item ${edge.enabled ? '' : 'disabled'}`}>
                  <span className="edge-name">{edge.source} ↔ {edge.target}</span>
                  <div className="edge-actions">
                    <input 
                      type="number" 
                      min="0"
                      value={edge.cost}
                      onChange={(e) => updateEdgeCost(edge.id, e.target.value)}
                      className="cost-input"
                      aria-label={`Cost for ${edge.id}`}
                    />
                    <button 
                      type="button" 
                      className={`toggle-btn ${edge.enabled ? 'toggle-on' : 'toggle-off'}`} 
                      onClick={() => toggleEdge(edge.id)} 
                      title={edge.enabled ? 'Link is ON — Click to Disable' : 'Link is OFF — Click to Enable'}
                      aria-label={edge.enabled ? 'Disable' : 'Enable'}
                    >
                      <span className="toggle-thumb" />
                      <span>{edge.enabled ? 'ON' : 'OFF'}</span>
                    </button>
                    <button type="button" className="delete-btn" onClick={() => removeEdge(edge.id)} aria-label={`Delete ${edge.id}`}>×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>
      </div>
      
      {/* Route Selection (Source/Dest) */}
      <div className="surface" style={{ marginBottom: '1.5rem' }}>
        <div className="surface-header">
          <span className="surface-title">Routing</span>
        </div>
        <div className="surface-body">
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="source-node">
              <span className="src-indicator-dot" /> Source
            </label>
            <select 
              id="source-node" 
              value={sourceNode || ''} 
              onChange={(e) => setSourceNode(e.target.value)}
              style={sourceNode ? { borderColor: 'var(--status-success)' } : {}}
            >
              <option value="" disabled>Select Source</option>
              {nodeIds.map(id => <option key={`src-${id}`} value={id}>{id}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="dest-node">
              <span className="dest-indicator-dot" /> Destination
            </label>
            <select 
              id="dest-node" 
              value={destNode || ''} 
              onChange={(e) => setDestNode(e.target.value)}
              style={destNode ? { borderColor: 'var(--node-dest)' } : {}}
            >
              <option value="" disabled>Select Dest</option>
              {nodeIds.map(id => <option key={`dst-${id}`} value={id}>{id}</option>)}
            </select>
          </div>
        </div>
        
        <button 
          type="button" 
          className="primary-btn" 
          disabled={!sourceNode || !destNode}
          onClick={onCalculateRoute}
          style={{ width: '100%', marginTop: '0.5rem' }}
        >
          Calculate Shortest Path
        </button>

        {routeResult && (
          <div className="route-result" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
            {routeResult.pathExists ? (
              <>
                <div style={{ color: 'var(--success)', fontWeight: 'bold', marginBottom: '0.5rem' }}>Route Found!</div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}><strong>Path:</strong> {routeResult.path.join(' → ')}</div>
                <div style={{ fontSize: '0.9rem' }}><strong>Total Cost:</strong> {routeResult.totalCost}</div>
              </>
            ) : (
              <>
                <div style={{ color: 'var(--danger)', fontWeight: 'bold', marginBottom: '0.5rem' }}>No Route Available</div>
                <div style={{ fontSize: '0.9rem' }}>{routeResult.error}</div>
              </>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

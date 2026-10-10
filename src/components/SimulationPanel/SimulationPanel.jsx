import React from 'react';

export default function SimulationPanel({ nodes }) {
  const nodeIds = Object.keys(nodes);

  return (
    <div className="simulation-panel">
      {/* Routing Section */}
      <section className="control-group card" aria-labelledby="routing-heading">
        <h3 id="routing-heading" className="group-title">1. Routing Selection</h3>
        <div className="form-row">
          <div className="input-group">
            <label htmlFor="source-node">Source</label>
            <select id="source-node" disabled defaultValue="">
              <option value="" disabled>Select Source</option>
              {nodeIds.map(id => <option key={`src-${id}`} value={id}>{id}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label htmlFor="dest-node">Destination</label>
            <select id="dest-node" disabled defaultValue="">
              <option value="" disabled>Select Dest</option>
              {nodeIds.map(id => <option key={`dst-${id}`} value={id}>{id}</option>)}
            </select>
          </div>
        </div>
        <p className="pending-note">Dijkstra's shortest path pending implementation...</p>
      </section>

      {/* Framing Section */}
      <section className="control-group card" aria-labelledby="framing-heading">
        <h3 id="framing-heading" className="group-title">2. Framing Configuration</h3>
        <div className="input-group">
          <label htmlFor="framing-method">Method</label>
          <select id="framing-method" disabled>
            <option>Character Count</option>
            <option>Byte Stuffing</option>
            <option>Bit Stuffing</option>
          </select>
        </div>
        <p className="pending-note">Framing logic pending implementation...</p>
      </section>

      {/* CRC Section */}
      <section className="control-group card" aria-labelledby="crc-heading">
        <h3 id="crc-heading" className="group-title">3. Error Detection (CRC)</h3>
        <div className="input-group">
          <label htmlFor="crc-poly">Polynomial</label>
          <select id="crc-poly" disabled>
            <option>CRC-8 (100000111)</option>
            <option>CRC-16 (11000000000000101)</option>
            <option>Custom Polynomial...</option>
          </select>
        </div>
        <p className="pending-note">CRC generation pending implementation...</p>
      </section>

      {/* Transmission Controls */}
      <section className="control-group card" aria-labelledby="transmit-heading">
        <h3 id="transmit-heading" className="group-title">4. Transmission Controls</h3>
        <div className="action-buttons">
          <button type="button" className="primary-btn" disabled>
            Start Simulation
          </button>
          <button type="button" className="secondary-btn" disabled>
            Corrupt Bit (Test Error)
          </button>
        </div>
        <p className="pending-note">Simulation orchestration pending implementation...</p>
      </section>
    </div>
  );
}

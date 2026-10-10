import React, { useState, useEffect, useRef } from 'react';
import { METHOD } from '../../core/algorithms/framing';
import { simulateTransmission } from '../../simulation/transmission';

export default function TransmissionPanel({ topology, onSimulationUpdate }) {
  const { getGraph, nodes } = topology;
  const nodeIds = Object.keys(nodes);
  
  // Inputs
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [message, setMessage] = useState('HELLO NETWORK');
  const [method, setMethod] = useState(METHOD.BYTE_STUFFING);
  const [maxSize, setMaxSize] = useState(5);
  const [crcGen, setCrcGen] = useState('1011');
  
  const [isError, setIsError] = useState(false);
  const [errPacket, setErrPacket] = useState(0);
  const [errHop, setErrHop] = useState(0);
  const [errBit, setErrBit] = useState(0);
  
  // Simulation State
  const [simEvents, setSimEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const timerRef = useRef(null);

  // Generate Simulation
  const handleStart = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    
    const config = {
      graph: getGraph(),
      sourceId: source,
      destinationId: dest,
      message,
      framingMethod: method,
      maxPayloadSize: maxSize,
      crcGenerator: crcGen,
      errorConfig: isError ? { packetIndex: errPacket, hopIndex: errHop, bitIndex: errBit } : null
    };
    
    const result = simulateTransmission(config);
    setSimEvents(result.events);
    setSimResult(result);
    
    if (result.events.length > 0) {
      setCurrentIndex(0);
      onSimulationUpdate(result.events.slice(0, 1), null);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setSimEvents([]);
    setSimResult(null);
    setCurrentIndex(-1);
    onSimulationUpdate([], null);
  };

  const handleStep = () => {
    if (currentIndex < simEvents.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onSimulationUpdate(simEvents.slice(0, nextIdx + 1), simEvents[nextIdx]);
    } else {
      setIsPlaying(false);
    }
  };

  // Play/Pause effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev < simEvents.length - 1) {
            const nextIdx = prev + 1;
            onSimulationUpdate(simEvents.slice(0, nextIdx + 1), simEvents[nextIdx]);
            return nextIdx;
          } else {
            setIsPlaying(false);
            return prev;
          }
        });
      }, 800); // 800ms per step
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, simEvents, onSimulationUpdate]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      
      <div className="form-row">
        <div className="input-group">
          <label>Source Router</label>
          <select value={source} onChange={e => setSource(e.target.value)}>
            <option value="" disabled>Select Source</option>
            {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div className="input-group">
          <label>Dest Router</label>
          <select value={dest} onChange={e => setDest(e.target.value)}>
            <option value="" disabled>Select Dest</option>
            {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
      </div>
      
      <div className="input-group">
        <label>Message Payload</label>
        <input type="text" value={message} onChange={e => setMessage(e.target.value)} />
      </div>

      <div className="form-row">
        <div className="input-group">
          <label>Framing Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            <option value={METHOD.CHAR_COUNT}>Character Count</option>
            <option value={METHOD.BYTE_STUFFING}>Byte Stuffing</option>
            <option value={METHOD.BIT_STUFFING}>Bit Stuffing</option>
          </select>
        </div>
        <div className="input-group">
          <label>Max Payload</label>
          <input type="number" min="1" max="254" value={maxSize} onChange={e => setMaxSize(parseInt(e.target.value) || 1)} />
        </div>
        <div className="input-group">
          <label>CRC Poly</label>
          <input type="text" value={crcGen} onChange={e => setCrcGen(e.target.value)} />
        </div>
      </div>

      <div style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '1rem' }}>
        <label style={{ display: 'flex', gap: '0.5rem', cursor: 'pointer', marginBottom: isError ? '0.5rem' : 0 }}>
          <input type="checkbox" checked={isError} onChange={e => setIsError(e.target.checked)} />
          <strong>Inject Malicious Error</strong>
        </label>
        {isError && (
          <div className="form-row" style={{ fontSize: '0.85rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Packet Index</label>
              <input type="number" min="0" value={errPacket} onChange={e => setErrPacket(parseInt(e.target.value) || 0)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Hop Index</label>
              <input type="number" min="0" value={errHop} onChange={e => setErrHop(parseInt(e.target.value) || 0)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label>Bit Index</label>
              <input type="number" min="0" value={errBit} onChange={e => setErrBit(parseInt(e.target.value) || 0)} />
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <button className="primary-btn" disabled={!source || !dest || simEvents.length > 0} onClick={handleStart}>
          Generate Simulation
        </button>
        <button className="secondary-btn" disabled={simEvents.length === 0} onClick={handleReset}>
          Reset
        </button>
      </div>

      {simEvents.length > 0 && (
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem' }}>
          <button className="secondary-btn" onClick={() => setIsPlaying(!isPlaying)} style={{ flex: 1 }}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
          <button className="secondary-btn" onClick={handleStep} disabled={isPlaying || currentIndex >= simEvents.length - 1} style={{ flex: 1 }}>
            ⏭ Step
          </button>
        </div>
      )}
      
      {simEvents.length > 0 && (
        <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center' }}>
          Event {currentIndex + 1} of {simEvents.length}
        </div>
      )}
    </div>
  );
}

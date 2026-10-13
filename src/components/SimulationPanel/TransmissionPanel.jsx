import React, { useState, useEffect, useRef } from 'react';
import { METHOD } from '../../core/algorithms/framing';
import { simulateTransmission } from '../../simulation/transmission';
import { 
  Play, Pause, SkipForward, SkipBack, RotateCcw, 
  Sparkles, AlertTriangle, CheckCircle, ShieldAlert, Zap,
  CheckCircle2, XCircle, Info, ArrowRight
} from 'lucide-react';

const SIMULATION_PRESETS = [
  {
    name: 'Clean Transmission (R1 → R6)',
    desc: 'Multi-hop journey with CRC verification at every intermediate router.',
    source: 'R1',
    dest: 'R6',
    message: 'HELLO NETWORK',
    method: METHOD.BYTE_STUFFING,
    maxSize: 5,
    crcGen: '1011',
    isError: false,
    errPacket: 0,
    errHop: 0,
    errBit: 0
  },
  {
    name: 'CRC Catches Noise (Drop at R2)',
    desc: 'Simulates bit corruption on link R1-R2. Router R2 catches the error and drops the frame.',
    source: 'R1',
    dest: 'R6',
    message: 'HELLO NETWORK',
    method: METHOD.BYTE_STUFFING,
    maxSize: 5,
    crcGen: '1011',
    isError: true,
    errPacket: 0,
    errHop: 0,
    errBit: 3
  },
  {
    name: 'Multi-Packet Chunking',
    desc: 'Splits a longer payload into multiple sequential packets to demonstrate reassembly.',
    source: 'R1',
    dest: 'R6',
    message: 'NEXUS PROTOCOL LAB 2026',
    method: METHOD.CHAR_COUNT,
    maxSize: 4,
    crcGen: '1011',
    isError: false,
    errPacket: 0,
    errHop: 0,
    errBit: 0
  },
  {
    name: 'Flag Collision Escaping',
    desc: 'Payload containing 0x7E and 0x7D triggers byte stuffing escapes across the wire.',
    source: 'R1',
    dest: 'R6',
    message: 'FLAG~DATA}TEST',
    method: METHOD.BYTE_STUFFING,
    maxSize: 6,
    crcGen: '1011',
    isError: false,
    errPacket: 0,
    errHop: 0,
    errBit: 0
  }
];

export default function TransmissionPanel({ topology, onSimulationUpdate }) {
  const { 
    getGraph, 
    nodes, 
    sourceNode, 
    setSourceNode, 
    destNode, 
    setDestNode 
  } = topology;
  const nodeIds = Object.keys(nodes);
  
  // Inputs - synchronized with topology selection
  const [localSource, setLocalSource] = useState('R1');
  const [localDest, setLocalDest] = useState('R6');

  const source = sourceNode ?? localSource;
  const setSource = (val) => {
    setLocalSource(val);
    if (setSourceNode) setSourceNode(val);
  };

  const dest = destNode ?? localDest;
  const setDest = (val) => {
    setLocalDest(val);
    if (setDestNode) setDestNode(val);
  };

  const [message, setMessage] = useState('HELLO NETWORK');
  const [method, setMethod] = useState(METHOD.BYTE_STUFFING);
  const [maxSize, setMaxSize] = useState(5);
  const [crcGen, setCrcGen] = useState('1011');
  
  // Error Injection
  const [isError, setIsError] = useState(false);
  const [errPacket, setErrPacket] = useState(0);
  const [errHop, setErrHop] = useState(0);
  const [errBit, setErrBit] = useState(3);
  
  // Simulation State & Results
  const [simEvents, setSimEvents] = useState([]);
  const [simResult, setSimResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(700); // ms per step: 1200 (0.5x), 700 (1x), 350 (2x)
  
  const timerRef = useRef(null);

  // Apply a preset (loads into form)
  const applyPreset = (preset) => {
    setIsPlaying(false);
    setSimEvents([]);
    setSimResult(null);
    setCurrentIndex(-1);
    onSimulationUpdate([], null);

    setSource(preset.source);
    setDest(preset.dest);
    setMessage(preset.message);
    setMethod(preset.method);
    setMaxSize(preset.maxSize);
    setCrcGen(preset.crcGen);
    setIsError(preset.isError);
    setErrPacket(preset.errPacket);
    setErrHop(preset.errHop);
    setErrBit(preset.errBit);
  };

  // Run preset immediately with 1 click
  const runPreset = (preset) => {
    setIsPlaying(false);
    setSource(preset.source);
    setDest(preset.dest);
    setMessage(preset.message);
    setMethod(preset.method);
    setMaxSize(preset.maxSize);
    setCrcGen(preset.crcGen);
    setIsError(preset.isError);
    setErrPacket(preset.errPacket);
    setErrHop(preset.errHop);
    setErrBit(preset.errBit);

    const config = {
      graph: getGraph(),
      sourceId: preset.source,
      destinationId: preset.dest,
      message: preset.message,
      framingMethod: preset.method,
      maxPayloadSize: preset.maxSize,
      crcGenerator: preset.crcGen,
      errorConfig: preset.isError ? { 
        packetIndex: preset.errPacket, 
        hopIndex: preset.errHop, 
        bitIndex: preset.errBit 
      } : null
    };

    const result = simulateTransmission(config);
    setSimEvents(result.events);
    setSimResult(result);

    if (result.events && result.events.length > 0) {
      setCurrentIndex(0);
      onSimulationUpdate(result.events.slice(0, 1), result.events[0]);
      setIsPlaying(true);
    } else {
      onSimulationUpdate([], null);
    }
  };

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
    
    if (result.events && result.events.length > 0) {
      setCurrentIndex(0);
      onSimulationUpdate(result.events.slice(0, 1), result.events[0]);
    } else {
      onSimulationUpdate([], null);
    }
  };

  // Reset
  const handleReset = () => {
    setIsPlaying(false);
    setSimEvents([]);
    setSimResult(null);
    setCurrentIndex(-1);
    onSimulationUpdate([], null);
  };

  // Step Forward
  const handleStepForward = () => {
    if (currentIndex < simEvents.length - 1) {
      const nextIdx = currentIndex + 1;
      setCurrentIndex(nextIdx);
      onSimulationUpdate(simEvents.slice(0, nextIdx + 1), simEvents[nextIdx]);
    } else {
      setIsPlaying(false);
    }
  };

  // Step Backward
  const handleStepBackward = () => {
    if (currentIndex > 0) {
      const nextIdx = currentIndex - 1;
      setCurrentIndex(nextIdx);
      onSimulationUpdate(simEvents.slice(0, nextIdx + 1), simEvents[nextIdx]);
    }
  };

  // Jump to arbitrary index on timeline
  const handleScrubber = (idx) => {
    if (idx >= 0 && idx < simEvents.length) {
      setCurrentIndex(idx);
      onSimulationUpdate(simEvents.slice(0, idx + 1), simEvents[idx]);
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
      }, speed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, simEvents, onSimulationUpdate, speed]);

  const currentEvent = currentIndex >= 0 ? simEvents[currentIndex] : null;

  return (
    <div className="transmission-controls-wrapper">
      {/* Simulation Presets Bar */}
      <div className="presets-bar" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
          <span className="presets-label"><Sparkles size={14} /> Guided Scenarios</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Load or ⚡ Run</span>
        </div>
        <div className="presets-list-grid">
          {SIMULATION_PRESETS.map((p, idx) => (
            <div key={idx} className="preset-card-item">
              <button 
                type="button" 
                className="preset-btn-load"
                onClick={() => applyPreset(p)}
                title={p.desc}
              >
                {p.name}
              </button>
              <button
                type="button"
                className="preset-instant-run-btn"
                onClick={() => runPreset(p)}
                title={`Instantly load and play "${p.name}"`}
              >
                <Play size={11} fill="currentColor" /> Run
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Playback HUD (when simulation generated) */}
      {simEvents.length > 0 && (
        <div className="playback-hud-card">
          <div className="playback-hud-header">
            <span className="hud-title">
              <Zap size={16} color="var(--accent-primary)" />
              Simulation Controls
            </span>
            <span className="hud-step-pill">
              Step {currentIndex + 1} of {simEvents.length}
            </span>
          </div>

          {/* Buttons Row */}
          <div className="playback-buttons-row">
            <button
              type="button"
              className="hud-ctrl-btn"
              onClick={handleStepBackward}
              disabled={currentIndex <= 0}
              title="Step Backward"
            >
              <SkipBack size={16} />
            </button>

            <button
              type="button"
              className={`hud-ctrl-btn primary-playback ${isPlaying ? 'pause' : 'play'}`}
              onClick={() => {
                if (currentIndex >= simEvents.length - 1) {
                  setCurrentIndex(0);
                  onSimulationUpdate(simEvents.slice(0, 1), simEvents[0]);
                  setIsPlaying(true);
                } else {
                  setIsPlaying(!isPlaying);
                }
              }}
              title={isPlaying ? 'Pause' : 'Play Simulation'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              <span>{isPlaying ? 'Pause' : currentIndex >= simEvents.length - 1 ? 'Replay' : 'Play'}</span>
            </button>

            <button
              type="button"
              className="hud-ctrl-btn"
              onClick={handleStepForward}
              disabled={isPlaying || currentIndex >= simEvents.length - 1}
              title="Step Forward"
            >
              <SkipForward size={16} />
            </button>

            <button
              type="button"
              className="hud-ctrl-btn reset"
              onClick={handleReset}
              title="Reset Simulation"
            >
              <RotateCcw size={16} />
            </button>
          </div>

          {/* Timeline Scrubber */}
          <div className="timeline-slider-row">
            <input 
              type="range" 
              min="0" 
              max={simEvents.length - 1} 
              value={Math.max(0, currentIndex)} 
              onChange={e => handleScrubber(parseInt(e.target.value))}
              className="timeline-scrubber"
              aria-label="Simulation progress scrubber"
            />
          </div>

          {/* Speed Selector */}
          <div className="speed-selector-row">
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Speed:</span>
            <div className="speed-pills">
              {[
                { label: '0.5x', val: 1200 },
                { label: '1.0x', val: 700 },
                { label: '2.0x', val: 350 }
              ].map(sp => (
                <button
                  key={sp.label}
                  type="button"
                  className={`speed-pill ${speed === sp.val ? 'active' : ''}`}
                  onClick={() => setSpeed(sp.val)}
                >
                  {sp.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Educational Outcome Summary Card (when simulation finishes or dropped) */}
      {currentEvent?.type === 'SIMULATION_END' && (
        <div className={`simulation-outcome-card ${currentEvent.success ? 'success' : 'failed'}`}>
          <div className="outcome-header">
            {currentEvent.success ? (
              <>
                <CheckCircle2 size={18} color="#10b981" />
                <span className="outcome-title">End-to-End Delivery Succeeded</span>
              </>
            ) : (
              <>
                <ShieldAlert size={18} color="#ef4444" />
                <span className="outcome-title">Packet Dropped (Integrity Check Failed)</span>
              </>
            )}
          </div>
          <p className="outcome-desc">{currentEvent.message}</p>
          {simResult?.finalPayload !== undefined && (
            <div className="outcome-payload-box">
              <span className="outcome-payload-label">Reassembled Payload:</span>
              <code className="outcome-payload-value">"{simResult.finalPayload}"</code>
            </div>
          )}
        </div>
      )}

      {/* Configuration Form */}
      <div className="transmission-config-card">
        {/* Source & Destination */}
        <div className="form-row">
          <div className="input-group">
            <label>
              <span className="src-indicator-dot" /> Source Router
            </label>
            <select 
              value={source || ''} 
              onChange={e => setSource(e.target.value)}
              style={source ? { borderColor: 'var(--status-success)' } : {}}
            >
              <option value="" disabled>Select Source</option>
              {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>
              <span className="dest-indicator-dot" /> Dest Router
            </label>
            <select 
              value={dest || ''} 
              onChange={e => setDest(e.target.value)}
              style={dest ? { borderColor: 'var(--node-dest)' } : {}}
            >
              <option value="" disabled>Select Dest</option>
              {nodeIds.map(id => <option key={id} value={id}>{id}</option>)}
            </select>
          </div>
        </div>
        
        {/* Payload */}
        <div className="input-group">
          <label>Message Payload</label>
          <input 
            type="text" 
            value={message} 
            onChange={e => setMessage(e.target.value)} 
            placeholder="Type message to transmit..."
            className="styled-text-input"
          />
        </div>

        {/* Framing & Parameters */}
        <div className="form-row">
          <div className="input-group" style={{ flex: 1.2 }}>
            <label>Framing Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)}>
              <option value={METHOD.BYTE_STUFFING}>Byte Stuffing (0x7E)</option>
              <option value={METHOD.CHAR_COUNT}>Character Count</option>
              <option value={METHOD.BIT_STUFFING}>Bit Stuffing (HDLC)</option>
            </select>
          </div>

          <div className="input-group" style={{ flex: 0.8 }}>
            <label>Max Payload (B)</label>
            <input 
              type="number" 
              min="1" 
              max="254" 
              value={maxSize} 
              onChange={e => setMaxSize(Math.max(1, parseInt(e.target.value) || 1))} 
              className="styled-text-input"
            />
          </div>

          <div className="input-group" style={{ flex: 0.8 }}>
            <label>CRC Poly</label>
            <input 
              type="text" 
              value={crcGen} 
              onChange={e => setCrcGen(e.target.value.replace(/[^01]/g, ''))} 
              className="styled-text-input mono"
            />
          </div>
        </div>

        {/* Error Injection Box */}
        <div className={`error-injection-box ${isError ? 'active' : ''}`}>
          <label className="error-injection-toggle">
            <input 
              type="checkbox" 
              checked={isError} 
              onChange={e => setIsError(e.target.checked)} 
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldAlert size={16} color={isError ? "var(--status-error)" : "var(--text-muted)"} />
              <strong style={{ color: isError ? "var(--status-error)" : "var(--text-primary)" }}>
                Simulate Physical Channel Noise (Inject Bit Error)
              </strong>
            </div>
          </label>
          
          {isError && (
            <div className="error-injection-inputs fade-in">
              <p className="error-note">
                Inverts 1 bit during transmission on a selected hop. The receiver will run CRC verification and drop the frame.
              </p>
              <div className="form-row" style={{ marginTop: '0.5rem', marginBottom: 0 }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Packet Index</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={errPacket} 
                    onChange={e => setErrPacket(Math.max(0, parseInt(e.target.value) || 0))} 
                    className="styled-text-input"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Hop Index (0 = 1st link)</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={errHop} 
                    onChange={e => setErrHop(Math.max(0, parseInt(e.target.value) || 0))} 
                    className="styled-text-input"
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label>Bit Index to Invert</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={errBit} 
                    onChange={e => setErrBit(Math.max(0, parseInt(e.target.value) || 0))} 
                    className="styled-text-input"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
          <button 
            type="button"
            className="primary-btn" 
            disabled={!source || !dest || simEvents.length > 0} 
            onClick={handleStart}
            style={{ flex: 1.5, padding: '0.75rem 1.25rem' }}
          >
            <Zap size={16} />
            Generate Simulation
          </button>
          
          <button 
            type="button"
            className="secondary-btn" 
            disabled={simEvents.length === 0} 
            onClick={handleReset}
            style={{ flex: 1 }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

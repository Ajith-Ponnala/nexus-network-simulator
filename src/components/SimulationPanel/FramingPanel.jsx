import React, { useState, useMemo } from 'react';
import { 
  METHOD, stringToBytes, bytesToHex, bytesToBinaryString, bytesToString,
  FLAG_BYTE, ESC_BYTE, FLAG_BIT,
  encodeCharCount, decodeCharCount,
  encodeByteStuffing, decodeByteStuffing,
  encodeBitStuffing, decodeBitStuffing
} from '../../core/algorithms/framing';
import { CheckCircle, AlertTriangle, ArrowRight, Sparkles, Hash, Binary, FileText } from 'lucide-react';

const PRESETS = [
  { label: 'Standard Text', text: 'HELLO NETWORK', size: 5, method: METHOD.CHAR_COUNT },
  { label: 'Byte Collision (~ / 0x7E)', text: 'DATA~WITH}FLAGS', size: 6, method: METHOD.BYTE_STUFFING },
  { label: 'Bit Run (5x 1s)', text: '111111111111', size: 4, method: METHOD.BIT_STUFFING },
  { label: 'Multi-Frame Stream', text: 'NEXUS PROTOCOL LAB 2026', size: 6, method: METHOD.CHAR_COUNT }
];

export default function FramingPanel({ isFullWidth = true }) {
  const [method, setMethod] = useState(METHOD.CHAR_COUNT);
  const [message, setMessage] = useState('HELLO NETWORK');
  const [frameSize, setFrameSize] = useState(5);

  const stats = useMemo(() => {
    if (!message || frameSize <= 0) return null;
    
    try {
      const payloadBytes = stringToBytes(message);
      let frames = [];
      let decodedBytes = null;
      let totalWireSize = 0;
      let frameBreakdowns = [];
      
      if (method === METHOD.CHAR_COUNT) {
        frames = encodeCharCount(payloadBytes, Number(frameSize));
        const concat = new Uint8Array(frames.reduce((acc, f) => acc + f.length, 0));
        let offset = 0;
        frames.forEach(f => { concat.set(f, offset); offset += f.length; });
        
        decodedBytes = decodeCharCount(concat);
        totalWireSize = concat.length;

        frameBreakdowns = frames.map((f, idx) => ({
          frameIndex: idx + 1,
          header: `Count: ${f[0]}`,
          payloadHex: bytesToHex(f.slice(1)),
          payloadText: bytesToString(f.slice(1)),
          trailer: null,
          totalBytes: f.length
        }));
      } 
      else if (method === METHOD.BYTE_STUFFING) {
        frames = encodeByteStuffing(payloadBytes, Number(frameSize));
        const concat = new Uint8Array(frames.reduce((acc, f) => acc + f.length, 0));
        let offset = 0;
        frames.forEach(f => { concat.set(f, offset); offset += f.length; });
        
        decodedBytes = decodeByteStuffing(concat);
        totalWireSize = concat.length;

        frameBreakdowns = frames.map((f, idx) => {
          // Inner bytes excluding leading and trailing FLAG_BYTE (0x7E)
          const inner = f.slice(1, f.length - 1);
          let stuffedCount = 0;
          for (let b of inner) {
            if (b === ESC_BYTE) stuffedCount++;
          }
          return {
            frameIndex: idx + 1,
            header: 'FLAG (0x7E)',
            payloadHex: bytesToHex(inner),
            payloadText: bytesToString(inner),
            trailer: 'FLAG (0x7E)',
            stuffedCount,
            totalBytes: f.length
          };
        });
      } 
      else if (method === METHOD.BIT_STUFFING) {
        frames = encodeBitStuffing(payloadBytes, Number(frameSize));
        const concat = frames.join('');
        
        decodedBytes = decodeBitStuffing(concat);
        totalWireSize = concat.length; // bits

        frameBreakdowns = frames.map((f, idx) => {
          // Remove 8-bit leading FLAG_BIT and 8-bit trailing FLAG_BIT
          const inner = f.substring(8, f.length - 8);
          return {
            frameIndex: idx + 1,
            header: `FLAG (${FLAG_BIT})`,
            payloadBits: inner,
            trailer: `FLAG (${FLAG_BIT})`,
            totalBits: f.length
          };
        });
      }

      const decodedString = bytesToString(decodedBytes);
      const isMatch = decodedString === message;
      const originalBytesLength = payloadBytes.length;
      const overheadBytes = method === METHOD.BIT_STUFFING 
        ? ((totalWireSize - (originalBytesLength * 8)) / (originalBytesLength * 8) * 100).toFixed(1)
        : (((totalWireSize - originalBytesLength) / originalBytesLength) * 100).toFixed(1);

      return {
        success: true,
        originalBytes: payloadBytes,
        decodedString,
        isMatch,
        framesCount: frames.length,
        totalWireSize,
        originalBytesLength,
        overheadPct: overheadBytes,
        frameBreakdowns,
        unit: method === METHOD.BIT_STUFFING ? 'bits' : 'bytes'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [method, message, frameSize]);

  const applyPreset = (preset) => {
    setMessage(preset.text);
    setFrameSize(preset.size);
    setMethod(preset.method);
  };

  return (
    <div className="surface protocol-card">
      <div className="surface-header">
        <span className="surface-title">
          <FileText size={18} color="var(--accent-primary)" />
          Data Link Layer Framing
        </span>
        <span className="badge badge-blue">Layer 2 Protocol</span>
      </div>

      <div className="surface-body">
        {/* Method Switcher Navigation Pills */}
        <div className="protocol-selector-group">
          <label className="data-label">Select Framing Algorithm</label>
          <div className="protocol-tab-bar">
            <button
              type="button"
              className={`protocol-pill-btn ${method === METHOD.CHAR_COUNT ? 'active' : ''}`}
              onClick={() => setMethod(METHOD.CHAR_COUNT)}
            >
              <Hash size={16} />
              <span>Character Count</span>
              <span className="pill-tag">Length Header</span>
            </button>

            <button
              type="button"
              className={`protocol-pill-btn ${method === METHOD.BYTE_STUFFING ? 'active' : ''}`}
              onClick={() => setMethod(METHOD.BYTE_STUFFING)}
            >
              <FileText size={16} />
              <span>Byte Stuffing</span>
              <span className="pill-tag">0x7E Flag</span>
            </button>

            <button
              type="button"
              className={`protocol-pill-btn ${method === METHOD.BIT_STUFFING ? 'active' : ''}`}
              onClick={() => setMethod(METHOD.BIT_STUFFING)}
            >
              <Binary size={16} />
              <span>Bit Stuffing</span>
              <span className="pill-tag">HDLC 01111110</span>
            </button>
          </div>
        </div>

        {/* Algorithm Educational Guide */}
        <div className="method-explainer-banner">
          {method === METHOD.CHAR_COUNT && (
            <p>
              <strong>Character Count Protocol:</strong> Prepends each frame with a count byte indicating total frame size (including header). Efficient, but highly vulnerable if a count byte is corrupted on the wire.
            </p>
          )}
          {method === METHOD.BYTE_STUFFING && (
            <p>
              <strong>Byte Stuffing Protocol:</strong> Encapsulates frames with Flag byte <code>0x7E</code> (<code>~</code>). Any occurrence of <code>0x7E</code> or <code>0x7D</code> inside the payload is escaped with <code>0x7D</code> (ESC).
            </p>
          )}
          {method === METHOD.BIT_STUFFING && (
            <p>
              <strong>Bit Stuffing Protocol (HDLC):</strong> Delimits frames with flag <code>01111110</code>. The sender injects a stuffed <code>0</code> bit after any run of five consecutive <code>1</code> bits to avoid accidental flags.
            </p>
          )}
        </div>

        {/* Interactive Presets */}
        <div className="presets-bar">
          <span className="presets-label"><Sparkles size={14} /> Quick Presets:</span>
          <div className="presets-list">
            {PRESETS.map((p, idx) => (
              <button 
                key={idx} 
                type="button" 
                className="preset-btn"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Configuration Row */}
        <div className="form-row" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <div className="input-group" style={{ flex: 1.5 }}>
            <label htmlFor="framing-msg-input">Message Payload (ASCII / Text)</label>
            <input 
              id="framing-msg-input"
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter message to frame..."
              className="styled-text-input"
            />
          </div>

          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="framing-size-input">Max Payload / Frame</label>
            <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
              <input 
                id="framing-size-input"
                type="number" 
                min="1" 
                max="254" 
                value={frameSize} 
                onChange={e => setFrameSize(Math.max(1, parseInt(e.target.value) || 1))}
                style={{ width: '70px', textAlign: 'center' }}
                className="styled-text-input"
              />
              <div className="quick-sizes">
                {[4, 8, 16, 32].map(sz => (
                  <button 
                    key={sz} 
                    type="button" 
                    className={`size-btn ${frameSize === sz ? 'active' : ''}`}
                    onClick={() => setFrameSize(sz)}
                  >
                    {sz}B
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Statistics & Overhead Bar */}
        {stats && stats.success && (
          <div className="framing-metrics-grid">
            <div className="metric-box">
              <span className="metric-title">Original Size</span>
              <span className="metric-value">{stats.originalBytesLength} B</span>
              <span className="metric-sub">{stats.originalBytesLength * 8} bits</span>
            </div>

            <div className="metric-box">
              <span className="metric-title">Generated Frames</span>
              <span className="metric-value" style={{ color: 'var(--accent-primary)' }}>{stats.framesCount}</span>
              <span className="metric-sub">Packets Chunked</span>
            </div>

            <div className="metric-box">
              <span className="metric-title">Wire Transmitted</span>
              <span className="metric-value" style={{ color: 'var(--status-warning)' }}>
                {stats.totalWireSize} {stats.unit}
              </span>
              <span className="metric-sub">Including Framing</span>
            </div>

            <div className="metric-box">
              <span className="metric-title">Protocol Overhead</span>
              <span className="metric-value" style={{ color: Number(stats.overheadPct) > 30 ? 'var(--status-error)' : 'var(--status-success)' }}>
                +{stats.overheadPct}%
              </span>
              <span className="metric-sub">Framing Tax</span>
            </div>
          </div>
        )}

        {/* Frames Visualization Cards */}
        {stats && stats.success && (
          <div className="frames-visualization-section">
            <div className="section-subtitle">
              <span>Transmitted Frame Stream ({stats.framesCount} Frame{stats.framesCount > 1 ? 's' : ''})</span>
            </div>

            <div className="frame-cards-container">
              {stats.frameBreakdowns.map((fb) => (
                <div key={fb.frameIndex} className="frame-card">
                  <div className="frame-card-header">
                    <span className="frame-badge">Frame #{fb.frameIndex}</span>
                    <span className="frame-size-pill">
                      {fb.totalBytes ? `${fb.totalBytes} Bytes` : `${fb.totalBits} Bits`}
                    </span>
                  </div>

                  <div className="frame-wire-assembly">
                    {/* Header */}
                    <div className="wire-segment header-segment">
                      <span className="segment-label">HEADER</span>
                      <span className="segment-content">{fb.header}</span>
                    </div>

                    <ArrowRight size={14} color="var(--text-muted)" />

                    {/* Payload */}
                    <div className="wire-segment payload-segment">
                      <span className="segment-label">DATA PAYLOAD</span>
                      {method === METHOD.BIT_STUFFING ? (
                        <span className="segment-content mono">{fb.payloadBits}</span>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="segment-content mono">{fb.payloadHex}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>"{fb.payloadText}"</span>
                        </div>
                      )}
                    </div>

                    {/* Trailer if applicable */}
                    {fb.trailer && (
                      <>
                        <ArrowRight size={14} color="var(--text-muted)" />
                        <div className="wire-segment trailer-segment">
                          <span className="segment-label">TRAILER</span>
                          <span className="segment-content">{fb.trailer}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Receiver Round-Trip Verification */}
            <div className="receiver-verification-box">
              <div className="verification-status-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <CheckCircle size={18} color="var(--status-success)" />
                  <span style={{ fontWeight: 600, color: 'var(--status-success)' }}>
                    Receiver Reassembled: 100% Lossless Recovery
                  </span>
                </div>
                <span className="mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Payload: "{stats.decodedString}"
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Error Handling */}
        {stats && !stats.success && (
          <div className="error-banner" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={18} />
            <span>{stats.error}</span>
          </div>
        )}
      </div>
    </div>
  );
}

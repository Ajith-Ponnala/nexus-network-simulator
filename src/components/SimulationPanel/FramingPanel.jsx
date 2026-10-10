import React, { useState, useMemo } from 'react';
import { 
  METHOD, stringToBytes, bytesToHex, bytesToBinaryString, bytesToString,
  encodeCharCount, decodeCharCount,
  encodeByteStuffing, decodeByteStuffing,
  encodeBitStuffing, decodeBitStuffing
} from '../../core/algorithms/framing';

export default function FramingPanel() {
  const [method, setMethod] = useState(METHOD.CHAR_COUNT);
  const [message, setMessage] = useState('HELLO');
  const [frameSize, setFrameSize] = useState(5);

  const stats = useMemo(() => {
    if (!message || frameSize <= 0) return null;
    
    try {
      const payloadBytes = stringToBytes(message);
      let frames = [];
      let decodedBytes = null;
      let totalWireSize = 0;
      let representation = '';
      
      if (method === METHOD.CHAR_COUNT) {
        frames = encodeCharCount(payloadBytes, Number(frameSize));
        // Concatenate for decoder test
        const concat = new Uint8Array(frames.reduce((acc, f) => acc + f.length, 0));
        let offset = 0;
        frames.forEach(f => { concat.set(f, offset); offset += f.length; });
        
        decodedBytes = decodeCharCount(concat);
        totalWireSize = concat.length; // bytes
        representation = 'Hex: ' + frames.map(f => bytesToHex(f)).join(' | ');
      } 
      else if (method === METHOD.BYTE_STUFFING) {
        frames = encodeByteStuffing(payloadBytes, Number(frameSize));
        const concat = new Uint8Array(frames.reduce((acc, f) => acc + f.length, 0));
        let offset = 0;
        frames.forEach(f => { concat.set(f, offset); offset += f.length; });
        
        decodedBytes = decodeByteStuffing(concat);
        totalWireSize = concat.length; // bytes
        representation = 'Hex: ' + frames.map(f => bytesToHex(f)).join(' | ');
      } 
      else if (method === METHOD.BIT_STUFFING) {
        frames = encodeBitStuffing(payloadBytes, Number(frameSize));
        const concat = frames.join('');
        
        decodedBytes = decodeBitStuffing(concat);
        totalWireSize = concat.length; // bits
        representation = 'Binary:\n' + frames.join('\n');
      }

      return {
        success: true,
        originalBytes: payloadBytes,
        decodedString: bytesToString(decodedBytes),
        framesCount: frames.length,
        totalWireSize,
        representation,
        unit: method === METHOD.BIT_STUFFING ? 'bits' : 'bytes'
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [method, message, frameSize]);

  return (
    <div className="surface" style={{ marginBottom: '1.5rem' }}>
      <div className="surface-header">
        <span className="surface-title">Data Link Framing</span>
      </div>
      <div className="surface-body">
      
      <div className="form-row" style={{ marginBottom: '1rem' }}>
        <div className="input-group">
          <label htmlFor="framing-method">Protocol</label>
          <select id="framing-method" value={method} onChange={e => setMethod(e.target.value)}>
            <option value={METHOD.CHAR_COUNT}>Character Count</option>
            <option value={METHOD.BYTE_STUFFING}>Byte Stuffing (0x7E)</option>
            <option value={METHOD.BIT_STUFFING}>Bit Stuffing (01111110)</option>
          </select>
        </div>
        <div className="input-group">
          <label htmlFor="frame-size">Max Payload (bytes)</label>
          <input 
            id="frame-size"
            type="number" 
            min="1" 
            max="254" 
            value={frameSize} 
            onChange={e => setFrameSize(parseInt(e.target.value) || 1)}
          />
        </div>
      </div>

      <div className="input-group">
        <label htmlFor="message-input">Message Payload</label>
        <textarea 
          id="message-input"
          value={message}
          onChange={e => setMessage(e.target.value)}
          style={{
            background: 'var(--bg-color)', color: 'var(--text-main)', 
            border: '1px solid var(--border)', borderRadius: '6px', 
            padding: '0.75rem', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical'
          }}
        />
      </div>

      {stats && stats.success ? (
        <div className="framing-results" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Original Payload:</span>
            <div style={{ wordBreak: 'break-all', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {method === METHOD.BIT_STUFFING 
                ? bytesToBinaryString(stats.originalBytes)
                : bytesToHex(stats.originalBytes)}
            </div>
          </div>
          
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Wire Representation (Frames):</span>
            <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontSize: '0.9rem', marginTop: '0.25rem', color: 'var(--success)' }}>
              {stats.representation}
            </pre>
          </div>
          
          <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Decoded Payload:</span>
            <div style={{ wordBreak: 'break-all', fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {stats.decodedString}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.75rem', fontSize: '0.85rem' }}>
            <span><strong>Frames:</strong> {stats.framesCount}</span>
            <span><strong>Wire Size:</strong> {stats.totalWireSize} {stats.unit}</span>
          </div>
        </div>
      ) : stats && !stats.success ? (
        <div className="error-banner" style={{ marginTop: '1rem' }}>
          <span>{stats.error}</span>
        </div>
      ) : null}
      </div>
    </div>
  );
}

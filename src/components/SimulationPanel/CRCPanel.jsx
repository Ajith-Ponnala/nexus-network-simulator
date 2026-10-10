import React, { useState, useMemo } from 'react';
import { generateCRC, verifyCRC, corruptBit } from '../../core/algorithms/crc';
import { stringToBytes, bytesToBinaryString } from '../../core/algorithms/framing';

export default function CRCPanel() {
  const [payloadText, setPayloadText] = useState('A');
  const [generator, setGenerator] = useState('1011');
  const [isCorrupted, setIsCorrupted] = useState(false);
  const [corruptIndex, setCorruptIndex] = useState(0);
  const [showTrace, setShowTrace] = useState(false);

  const stats = useMemo(() => {
    try {
      const payloadBits = payloadText ? bytesToBinaryString(stringToBytes(payloadText)) : '0';
      
      const genResult = generateCRC(payloadBits, generator, showTrace);
      
      let transmittedCodeword = genResult.codeword;
      let actualCorruptIndex = -1;
      
      if (isCorrupted) {
        // Clamp corrupt index to actual length bounds
        actualCorruptIndex = Math.max(0, Math.min(corruptIndex, transmittedCodeword.length - 1));
        transmittedCodeword = corruptBit(transmittedCodeword, actualCorruptIndex);
      }
      
      const verResult = verifyCRC(transmittedCodeword, generator, showTrace);
      
      return {
        success: true,
        payloadBits,
        generator,
        transmittedCodeword,
        originalCodeword: genResult.codeword,
        genRemainder: genResult.remainder,
        verRemainder: verResult.remainder,
        isValid: verResult.isValid,
        actualCorruptIndex,
        genTrace: genResult.trace,
        verTrace: verResult.trace
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [payloadText, generator, isCorrupted, corruptIndex, showTrace]);

  return (
    <div className="surface" style={{ marginBottom: '1.5rem' }}>
      <div className="surface-header">
        <span className="surface-title">CRC Error Detection</span>
      </div>
      <div className="surface-body">
      
      <div className="form-row" style={{ marginBottom: '1rem' }}>
        <div className="input-group">
          <label htmlFor="crc-payload">Payload (Text)</label>
          <input 
            id="crc-payload"
            type="text" 
            value={payloadText} 
            onChange={e => setPayloadText(e.target.value)}
          />
        </div>
        <div className="input-group">
          <label htmlFor="crc-generator">Generator Polynomial (Binary)</label>
          <input 
            id="crc-generator"
            type="text" 
            value={generator} 
            onChange={e => setGenerator(e.target.value)}
          />
        </div>
      </div>

      <div className="form-row" style={{ marginBottom: '1rem', alignItems: 'center' }}>
        <div className="input-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginBottom: 0 }}>
          <input 
            type="checkbox" 
            id="simulate-error"
            checked={isCorrupted}
            onChange={e => setIsCorrupted(e.target.checked)}
          />
          <label htmlFor="simulate-error" style={{ marginBottom: 0 }}>Simulate Bit Corruption</label>
        </div>
        
        {isCorrupted && (
          <div className="input-group" style={{ marginBottom: 0, flex: 0.5 }}>
            <label htmlFor="corrupt-index">Bit Index (0 = MSB)</label>
            <input 
              id="corrupt-index"
              type="number" 
              min="0"
              value={corruptIndex}
              onChange={e => setCorruptIndex(parseInt(e.target.value) || 0)}
            />
          </div>
        )}
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', cursor: 'pointer' }}>
          <input 
            type="checkbox" 
            checked={showTrace}
            onChange={e => setShowTrace(e.target.checked)}
          />
          Show XOR Division Trace
        </label>
      </div>

      {stats && stats.success ? (
        <div className="crc-results" style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--panel-bg)', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Payload (Binary):</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{stats.payloadBits}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generated CRC Remainder:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--primary)' }}>{stats.genRemainder}</span>
          </div>

          {isCorrupted && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', opacity: 0.7 }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Original Codeword:</span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{stats.originalCodeword}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{isCorrupted ? 'Corrupted Transmitted Codeword:' : 'Transmitted Codeword:'}</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: isCorrupted ? 'var(--warning)' : 'inherit' }}>
              {isCorrupted ? (
                <>
                  {stats.transmittedCodeword.substring(0, stats.actualCorruptIndex)}
                  <span style={{ color: 'var(--danger)', fontWeight: 'bold', textDecoration: 'underline' }}>
                    {stats.transmittedCodeword[stats.actualCorruptIndex]}
                  </span>
                  {stats.transmittedCodeword.substring(stats.actualCorruptIndex + 1)}
                </>
              ) : (
                stats.transmittedCodeword
              )}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Receiver Remainder:</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', fontWeight: 'bold' }}>{stats.verRemainder}</span>
          </div>
          
          <div style={{ 
            padding: '0.75rem', 
            borderRadius: '6px', 
            textAlign: 'center',
            fontWeight: 'bold',
            background: stats.isValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: stats.isValid ? 'var(--success)' : 'var(--danger)',
            border: `1px solid ${stats.isValid ? 'var(--success)' : 'var(--danger)'}`
          }}>
            {stats.isValid ? '✓ Remainder is Zero (No Detected Errors)' : '⚠ Remainder is Non-Zero (Error Detected)'}
          </div>

          {showTrace && stats.verTrace && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Receiver XOR Trace:</div>
              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'var(--bg-color)', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-focus)' }}>
                {stats.verTrace.map((t, idx) => (
                  <div key={idx} style={{ fontFamily: 'monospace', fontSize: '0.8rem', padding: '2px 0', color: t.op === 'XOR' ? 'var(--secondary)' : 'var(--text-muted)' }}>
                    {t.step ? `[${t.step}] ${t.current}` : `  > ${t.op}: ${t.result}`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : stats && !stats.success ? (
        <div className="error-banner" style={{ marginTop: '1rem' }}>
          <span>{stats.error}</span>
        </div>
      ) : null}
      
      <div className="pending-note" style={{ marginTop: '1rem', opacity: 0.8 }}>
        Note: CRC guarantees error detection for certain classes of bit errors, but it is not an error-correction mechanism and can theoretically miss some corruption patterns.
      </div>
      </div>
    </div>
  );
}

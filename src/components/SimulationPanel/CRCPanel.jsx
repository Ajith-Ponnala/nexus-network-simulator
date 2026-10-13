import React, { useState, useMemo } from 'react';
import { generateCRC, verifyCRC, corruptBit, validateGenerator } from '../../core/algorithms/crc';
import { stringToBytes, bytesToBinaryString } from '../../core/algorithms/framing';
import { ShieldCheck, AlertTriangle, CheckCircle, Sparkles, RefreshCw, Binary, FileText, ChevronDown, ChevronUp } from 'lucide-react';

const GENERATOR_PRESETS = [
  { label: 'CRC-4 (1011)', value: '1011', desc: 'x³ + x + 1 (Nibble Check)' },
  { label: 'CRC-8 (ATM)', value: '100000111', desc: 'x⁸ + x² + x + 1 (ATM Header)' },
  { label: 'CRC-16 (IBM)', value: '11000000000000101', desc: 'x¹⁶ + x¹⁵ + x² + 1 (Standard)' }
];

export default function CRCPanel({ isFullWidth = true }) {
  const [inputMode, setInputMode] = useState('text'); // 'text' | 'binary'
  const [payloadText, setPayloadText] = useState('A');
  const [binaryPayload, setBinaryPayload] = useState('11010110');
  const [generator, setGenerator] = useState('1011');
  
  // Interactive Bit Corruption State
  const [corruptedIndices, setCorruptedIndices] = useState(new Set());
  const [showTrace, setShowTrace] = useState(false);

  // Derive payload bits based on input mode
  const payloadBits = useMemo(() => {
    if (inputMode === 'text') {
      return payloadText ? bytesToBinaryString(stringToBytes(payloadText)) : '0';
    } else {
      return binaryPayload && /^[01]+$/.test(binaryPayload) ? binaryPayload : '0';
    }
  }, [inputMode, payloadText, binaryPayload]);

  const stats = useMemo(() => {
    try {
      validateGenerator(generator);
      const genResult = generateCRC(payloadBits, generator, true);
      
      let transmittedCodeword = genResult.codeword;
      // Apply bit flips
      corruptedIndices.forEach(idx => {
        if (idx >= 0 && idx < transmittedCodeword.length) {
          transmittedCodeword = corruptBit(transmittedCodeword, idx);
        }
      });
      
      const verResult = verifyCRC(transmittedCodeword, generator, true);
      const hasErrors = corruptedIndices.size > 0;

      return {
        success: true,
        payloadBits,
        generator,
        transmittedCodeword,
        originalCodeword: genResult.codeword,
        genRemainder: genResult.remainder,
        verRemainder: verResult.remainder,
        isValid: verResult.isValid,
        hasErrors,
        degree: generator.length - 1,
        genTrace: genResult.trace,
        verTrace: verResult.trace
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }, [payloadBits, generator, corruptedIndices]);

  // Bit toggle handler
  const toggleBitAt = (index) => {
    setCorruptedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const flipRandomBit = () => {
    if (!stats || !stats.originalCodeword) return;
    const len = stats.originalCodeword.length;
    const randIdx = Math.floor(Math.random() * len);
    toggleBitAt(randIdx);
  };

  const clearAllCorruptions = () => {
    setCorruptedIndices(new Set());
  };

  return (
    <div className="surface protocol-card">
      <div className="surface-header">
        <span className="surface-title">
          <ShieldCheck size={18} color="var(--node-dest)" />
          Cyclic Redundancy Check (CRC)
        </span>
        <span className="badge badge-green">Modulo-2 Division</span>
      </div>

      <div className="surface-body">
        {/* Generator Presets Navigation */}
        <div className="protocol-selector-group">
          <label className="data-label">Generator Polynomial Divisor (G(x))</label>
          <div className="protocol-tab-bar">
            {GENERATOR_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`protocol-pill-btn ${generator === p.value ? 'active' : ''}`}
                onClick={() => setGenerator(p.value)}
              >
                <Binary size={16} />
                <span>{p.label}</span>
                <span className="pill-tag">{p.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Configuration Row */}
        <div className="form-row" style={{ marginTop: '1rem', marginBottom: '1rem' }}>
          <div className="input-group" style={{ flex: 1.5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
              <label htmlFor="crc-input" style={{ marginBottom: 0 }}>
                Data Payload ({inputMode === 'text' ? 'ASCII String' : 'Binary Stream'})
              </label>
              <div className="input-mode-toggle">
                <button 
                  type="button" 
                  className={`mode-btn ${inputMode === 'text' ? 'active' : ''}`}
                  onClick={() => setInputMode('text')}
                >
                  <FileText size={12} /> Text
                </button>
                <button 
                  type="button" 
                  className={`mode-btn ${inputMode === 'binary' ? 'active' : ''}`}
                  onClick={() => setInputMode('binary')}
                >
                  <Binary size={12} /> Binary
                </button>
              </div>
            </div>

            {inputMode === 'text' ? (
              <input 
                id="crc-input"
                type="text" 
                value={payloadText} 
                onChange={e => setPayloadText(e.target.value)}
                placeholder="Enter payload string..."
                className="styled-text-input"
              />
            ) : (
              <input 
                id="crc-input"
                type="text" 
                value={binaryPayload} 
                onChange={e => setBinaryPayload(e.target.value.replace(/[^01]/g, ''))}
                placeholder="Enter binary bits (e.g. 110101)..."
                className="styled-text-input mono"
              />
            )}
          </div>

          <div className="input-group" style={{ flex: 1 }}>
            <label htmlFor="custom-gen-input">Generator Bits (Divisor)</label>
            <input 
              id="custom-gen-input"
              type="text" 
              value={generator} 
              onChange={e => setGenerator(e.target.value.replace(/[^01]/g, ''))}
              placeholder="e.g. 1011"
              className="styled-text-input mono"
            />
          </div>
        </div>

        {/* Interactive Bit Flipper Tape */}
        {stats && stats.success && (
          <div className="bit-flipper-container">
            <div className="bit-flipper-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={16} color="var(--accent-primary)" />
                <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  Interactive Transmitted Codeword Tape (Click any bit to corrupt)
                </span>
              </div>
              <div className="bit-flipper-actions">
                <button 
                  type="button" 
                  className="btn-tiny"
                  onClick={flipRandomBit}
                  title="Invert a random bit to test error detection"
                >
                  🎲 Flip Random Bit
                </button>
                {corruptedIndices.size > 0 && (
                  <button 
                    type="button" 
                    className="btn-tiny danger"
                    onClick={clearAllCorruptions}
                    title="Restore original codeword"
                  >
                    <RefreshCw size={12} /> Restore Original
                  </button>
                )}
              </div>
            </div>

            <div className="bit-tape-scroll">
              <div className="bit-tape">
                {Array.from(stats.transmittedCodeword).map((bit, idx) => {
                  const isCorrupted = corruptedIndices.has(idx);
                  const isRemainderBit = idx >= stats.payloadBits.length;
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`bit-tile ${isCorrupted ? 'corrupted' : ''} ${isRemainderBit ? 'remainder-bit' : ''}`}
                      onClick={() => toggleBitAt(idx)}
                      title={`Bit #${idx}: ${bit} (Click to flip to ${bit === '1' ? '0' : '1'})${isRemainderBit ? ' [CRC Parity Bit]' : ' [Data Bit]'}`}
                    >
                      <span className="bit-index">{idx}</span>
                      <span className="bit-value">{bit}</span>
                      <span className="bit-type">{isRemainderBit ? 'CRC' : 'D'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {corruptedIndices.size > 0 && (
              <div className="corruption-alert-notice">
                <AlertTriangle size={16} color="var(--status-error)" />
                <span>
                  <strong>Bit Inversion Active:</strong> {corruptedIndices.size} bit{corruptedIndices.size > 1 ? 's' : ''} inverted at index [{Array.from(corruptedIndices).sort((a,b)=>a-b).join(', ')}].
                </span>
              </div>
            )}
          </div>
        )}

        {/* 3-Stage Mathematical Verification Pipeline */}
        {stats && stats.success && (
          <div className="pipeline-grid" style={{ marginTop: '1.25rem' }}>
            {/* Step 1: Sender Generation */}
            <div className="pipeline-card">
              <div className="pipeline-step-badge">1. SENDER ENCODING</div>
              <div className="pipeline-row">
                <span className="label">Payload Bits (k):</span>
                <span className="value mono">{stats.payloadBits}</span>
              </div>
              <div className="pipeline-row">
                <span className="label">Zeros Appended ({stats.degree}):</span>
                <span className="value mono" style={{ color: 'var(--text-muted)' }}>{'0'.repeat(stats.degree)}</span>
              </div>
              <div className="pipeline-row">
                <span className="label">CRC Remainder (R):</span>
                <span className="value mono" style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>
                  {stats.genRemainder}
                </span>
              </div>
              <div className="pipeline-row summary">
                <span className="label">Transmitted Codeword:</span>
                <span className="value mono" style={{ color: 'var(--text-primary)' }}>
                  {stats.originalCodeword}
                </span>
              </div>
            </div>

            {/* Step 2: Channel Status */}
            <div className="pipeline-card">
              <div className="pipeline-step-badge">2. TRANSMISSION CHANNEL</div>
              <div className="pipeline-row">
                <span className="label">Channel Noise:</span>
                <span className="value" style={{ color: stats.hasErrors ? 'var(--status-error)' : 'var(--status-success)' }}>
                  {stats.hasErrors ? `⚠ ${corruptedIndices.size} Bit Error(s)` : '✓ Clean Wire'}
                </span>
              </div>
              <div className="pipeline-row">
                <span className="label">Transmitted String:</span>
                <span className="value mono" style={{ color: stats.hasErrors ? 'var(--status-warning)' : 'inherit' }}>
                  {stats.transmittedCodeword}
                </span>
              </div>
              <div className="pipeline-row summary">
                <span className="label">Error Detection Capacity:</span>
                <span className="value" style={{ color: 'var(--text-secondary)' }}>
                  Catches all single & double bit bursts
                </span>
              </div>
            </div>

            {/* Step 3: Receiver Verification */}
            <div className="pipeline-card">
              <div className="pipeline-step-badge">3. RECEIVER VERIFICATION</div>
              <div className="pipeline-row">
                <span className="label">Divisor (G(x)):</span>
                <span className="value mono">{stats.generator}</span>
              </div>
              <div className="pipeline-row">
                <span className="label">Receiver Remainder:</span>
                <span className="value mono" style={{ color: stats.isValid ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 800 }}>
                  {stats.verRemainder}
                </span>
              </div>
              <div className="pipeline-row summary">
                <span className="label">Frame Integrity Verdict:</span>
                <span className="value" style={{ color: stats.isValid ? 'var(--status-success)' : 'var(--status-error)', fontWeight: 700 }}>
                  {stats.isValid ? '✓ ACCEPTED' : '⚠ REJECTED'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Big Verdict Banner */}
        {stats && stats.success && (
          <div 
            className={`crc-verdict-banner ${stats.isValid ? 'verdict-valid' : 'verdict-invalid'}`}
            style={{ marginTop: '1.25rem' }}
          >
            {stats.isValid ? (
              <>
                <CheckCircle size={22} color="var(--status-success)" />
                <div>
                  <strong>CHECKSUM VALIDATED: Remainder is 0 ({stats.verRemainder})</strong>
                  <p>Modulo-2 binary division yielded zero remainder. No bit errors detected; payload is accepted and delivered.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={22} color="var(--status-error)" />
                <div>
                  <strong>CHECKSUM FAILED: Non-Zero Remainder ({stats.verRemainder})</strong>
                  <p>Modulo-2 division produced a non-zero remainder. Cyclic redundancy error detected; frame corrupted on wire and rejected.</p>
                </div>
              </>
            )}
          </div>
        )}

        {/* Step-by-Step XOR Division Trace */}
        {stats && stats.success && (
          <div className="trace-accordion-section" style={{ marginTop: '1.25rem' }}>
            <button
              type="button"
              className="trace-toggle-btn"
              onClick={() => setShowTrace(!showTrace)}
            >
              <span>Modulo-2 Binary Division Step-by-Step Trace ({stats.verTrace?.length || 0} Steps)</span>
              {showTrace ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showTrace && stats.verTrace && (
              <div className="trace-table-container fade-in">
                <div className="trace-table">
                  {stats.verTrace.map((t, idx) => (
                    <div key={idx} className={`trace-row ${t.op === 'XOR' ? 'xor-op' : ''}`}>
                      <span className="trace-step-num">Step #{idx + 1}</span>
                      <span className="trace-action">
                        {t.step ? `Window: ${t.current}` : `Operation: ${t.op}`}
                      </span>
                      <span className="trace-result mono">
                        {t.result ? `Result: ${t.result}` : t.remaining ? `Remaining: ${t.remaining}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
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

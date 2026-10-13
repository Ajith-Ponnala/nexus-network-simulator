import React, { useState } from 'react';
import FramingPanel from '../SimulationPanel/FramingPanel';
import CRCPanel from '../SimulationPanel/CRCPanel';
import { FileCode, ShieldCheck, Columns, Sparkles } from 'lucide-react';

export default function ProtocolSandbox() {
  const [activeTab, setActiveTab] = useState('framing'); // 'framing' | 'crc' | 'dual'

  return (
    <div className="sandbox-wrapper">
      {/* Educational Banner */}
      <div className="edu-notice" style={{ marginBottom: '1.25rem' }}>
        <h4>Protocol Engineering Sandbox</h4>
        <p>
          Test and verify Data Link Layer framing algorithms and Modulo-2 CRC error detection in an isolated, interactive testing lab before packets are deployed onto the network topology.
        </p>
      </div>

      {/* Main Sandbox Navigation Bar */}
      <div className="sandbox-nav-bar">
        <div className="sandbox-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'framing'}
            className={`sandbox-tab-btn ${activeTab === 'framing' ? 'active' : ''}`}
            onClick={() => setActiveTab('framing')}
          >
            <FileCode size={18} />
            <span>Data Link Framing</span>
            <span className="tab-pill-badge">3 Protocols</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'crc'}
            className={`sandbox-tab-btn ${activeTab === 'crc' ? 'active' : ''}`}
            onClick={() => setActiveTab('crc')}
          >
            <ShieldCheck size={18} />
            <span>CRC Error Detection</span>
            <span className="tab-pill-badge">Modulo-2 Math</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'dual'}
            className={`sandbox-tab-btn ${activeTab === 'dual' ? 'active' : ''}`}
            onClick={() => setActiveTab('dual')}
          >
            <Columns size={18} />
            <span>Dual View</span>
            <span className="tab-pill-badge">Side-by-Side</span>
          </button>
        </div>

        <div className="sandbox-quick-hint">
          <Sparkles size={14} color="var(--accent-primary)" />
          <span>Select a protocol module above to inspect encoding & verification</span>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="sandbox-content-area">
        {activeTab === 'framing' && (
          <div className="fade-in">
            <FramingPanel isFullWidth={true} />
          </div>
        )}

        {activeTab === 'crc' && (
          <div className="fade-in">
            <CRCPanel isFullWidth={true} />
          </div>
        )}

        {activeTab === 'dual' && (
          <div className="fade-in sandbox-dual-grid">
            <FramingPanel isFullWidth={false} />
            <CRCPanel isFullWidth={false} />
          </div>
        )}
      </div>
    </div>
  );
}

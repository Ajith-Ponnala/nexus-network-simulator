import React, { useRef, useState, useLayoutEffect, useMemo } from 'react';
import { 
  ArrowDown, 
  Radio, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle, 
  Info, 
  Layers,
  ArrowRight
} from 'lucide-react';

export default function TransmissionLog({ events = [] }) {
  const containerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'TRANSMIT' | 'DROPS' | 'DELIVERIES'
  const prevEventsLength = useRef(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 35;
    
    if (isAtBottom) {
      setIsAutoScrollEnabled(true);
      setShowJumpButton(false);
    } else {
      setIsAutoScrollEnabled(false);
    }
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    if (!events || events.length === 0) {
      setIsAutoScrollEnabled(true);
      setShowJumpButton(false);
      prevEventsLength.current = 0;
      return;
    }

    const hasNewEvents = events.length > prevEventsLength.current;
    
    if (hasNewEvents) {
      if (isAutoScrollEnabled) {
        containerRef.current.scrollTop = containerRef.current.scrollHeight;
      } else {
        setShowJumpButton(true);
      }
    } else if (events.length < prevEventsLength.current) {
      setIsAutoScrollEnabled(true);
      setShowJumpButton(false);
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
    
    prevEventsLength.current = events.length;
  }, [events, isAutoScrollEnabled]);

  const jumpToLatest = () => {
    if (!containerRef.current) return;
    containerRef.current.scrollTop = containerRef.current.scrollHeight;
    setIsAutoScrollEnabled(true);
    setShowJumpButton(false);
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (filter === 'ALL') return events;
    if (filter === 'TRANSMIT') {
      return events.filter(e => e.type === 'TRANSMIT' || e.type === 'HOP_START');
    }
    if (filter === 'DROPS') {
      return events.filter(e => e.type === 'DROP' || e.type === 'ERROR' || (e.type === 'SIMULATION_END' && !e.success));
    }
    if (filter === 'DELIVERIES') {
      return events.filter(e => e.type === 'HOP_SUCCESS' || e.type === 'PACKET_DELIVERED' || (e.type === 'SIMULATION_END' && e.success));
    }
    return events;
  }, [events, filter]);

  // Counts for filter pills
  const counts = useMemo(() => {
    if (!events) return { all: 0, transmit: 0, drops: 0, deliveries: 0 };
    return {
      all: events.length,
      transmit: events.filter(e => e.type === 'TRANSMIT' || e.type === 'HOP_START').length,
      drops: events.filter(e => e.type === 'DROP' || e.type === 'ERROR' || (e.type === 'SIMULATION_END' && !e.success)).length,
      deliveries: events.filter(e => e.type === 'HOP_SUCCESS' || e.type === 'PACKET_DELIVERED' || (e.type === 'SIMULATION_END' && e.success)).length
    };
  }, [events]);

  const renderCodewordBits = (codeword, wasCorrupted, corruptedIndex) => {
    if (!codeword) return null;
    if (!wasCorrupted || corruptedIndex === undefined || corruptedIndex < 0 || corruptedIndex >= codeword.length) {
      return <span className="codeword-string">{codeword}</span>;
    }
    const pre = codeword.slice(0, corruptedIndex);
    const flippedBit = codeword[corruptedIndex];
    const post = codeword.slice(corruptedIndex + 1);

    return (
      <span className="codeword-string">
        {pre}
        <span 
          className="corrupted-bit-chip" 
          title={`Bit #${corruptedIndex} was mathematically inverted on the wire`}
        >
          {flippedBit}
        </span>
        {post}
      </span>
    );
  };

  if (!events || events.length === 0) {
    return (
      <div className="empty-log-state">
        <div className="empty-icon">
          <Layers size={36} color="var(--accent-primary)" />
        </div>
        <h4 style={{ margin: '0.75rem 0 0.25rem', color: 'var(--text-primary)' }}>No Active Transmission</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '280px', margin: '0 auto' }}>
          Configure your network parameters or select a preset, then click <strong>Generate Simulation</strong> to watch packet hops in real time.
        </p>
      </div>
    );
  }

  return (
    <div className="transmission-log-container">
      {/* Category Filter Pills */}
      <div className="log-filter-bar">
        <button 
          type="button" 
          className={`log-filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({counts.all})
        </button>
        <button 
          type="button" 
          className={`log-filter-btn ${filter === 'TRANSMIT' ? 'active' : ''}`}
          onClick={() => setFilter('TRANSMIT')}
        >
          Hops ({counts.transmit})
        </button>
        <button 
          type="button" 
          className={`log-filter-btn ${filter === 'DROPS' ? 'active' : ''}`}
          onClick={() => setFilter('DROPS')}
        >
          Drops & Errors ({counts.drops})
        </button>
        <button 
          type="button" 
          className={`log-filter-btn ${filter === 'DELIVERIES' ? 'active' : ''}`}
          onClick={() => setFilter('DELIVERIES')}
        >
          Verified ({counts.deliveries})
        </button>
      </div>

      {/* Events List */}
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="log-scroll-area"
      >
        {filteredEvents.map((evt, idx) => {
          let cardType = 'info';
          let IconComponent = Info;
          let badgeLabel = evt.type;

          if (evt.type === 'ERROR' || evt.type === 'DROP' || (evt.type === 'SIMULATION_END' && !evt.success)) {
            cardType = 'error';
            IconComponent = ShieldAlert;
          } else if (evt.type === 'HOP_SUCCESS' || evt.type === 'PACKET_DELIVERED' || (evt.type === 'SIMULATION_END' && evt.success)) {
            cardType = 'success';
            IconComponent = CheckCircle2;
          } else if (evt.type === 'TRANSMIT') {
            cardType = evt.wasCorrupted ? 'corrupted' : 'transmit';
            IconComponent = Radio;
          }

          return (
            <div key={idx} className={`log-entry-card type-${cardType}`}>
              <div className="log-entry-header">
                <div className="log-entry-badge-group">
                  <IconComponent size={14} className="log-type-icon" />
                  <span className="log-type-name">{badgeLabel}</span>
                  {evt.packetIndex !== undefined && (
                    <span className="log-meta-tag">Pkt {evt.packetIndex + 1}</span>
                  )}
                  {evt.hopIndex !== undefined && (
                    <span className="log-meta-tag">Hop {evt.hopIndex + 1}</span>
                  )}
                </div>
                <span className="log-step-num">#{idx + 1}</span>
              </div>

              {/* Message / Details */}
              {evt.message && (
                <div className="log-entry-message">
                  {evt.message}
                </div>
              )}

              {/* TRANSMIT specifics */}
              {evt.type === 'TRANSMIT' && (
                <div className="log-transmit-details">
                  <div className="log-link-info">
                    <span>Wire link:</span> 
                    <strong>{evt.from}</strong> 
                    <ArrowRight size={12} style={{ display: 'inline', verticalAlign: 'middle', margin: '0 4px' }} /> 
                    <strong>{evt.to}</strong>
                  </div>

                  {evt.wasCorrupted ? (
                    <div className="log-error-pill">
                      ⚠ Physical noise inverted bit at index #{evt.corruptedIndex}.
                    </div>
                  ) : (
                    <div className="log-clean-pill">
                      ✓ Codeword transmitted across noiseless channel.
                    </div>
                  )}

                  <div className="log-codeword-box">
                    <span className="log-codeword-label">Codeword (Payload + FCS):</span>
                    {renderCodewordBits(evt.transmittedCodeword, evt.wasCorrupted, evt.corruptedIndex)}
                  </div>
                </div>
              )}

              {/* DROP specifics */}
              {evt.type === 'DROP' && (
                <div className="log-drop-details">
                  <div className="drop-reason-title">
                    Reason: <strong>{evt.reason}</strong> at Router <strong>{evt.at}</strong>
                  </div>
                  <p className="drop-reason-desc">
                    Receiver divided codeword by polynomial generator G(x). The remainder was non-zero, mathematically confirming bit corruption on the wire. Frame was safely rejected.
                  </p>
                </div>
              )}

              {/* HOP_SUCCESS specifics */}
              {evt.type === 'HOP_SUCCESS' && (
                <div className="log-success-details">
                  Modulo-2 polynomial division yielded remainder = 0. Router <strong>{evt.at}</strong> stripped CRC checksum and confirmed frame integrity.
                </div>
              )}

              {/* PACKET_DELIVERED specifics */}
              {evt.type === 'PACKET_DELIVERED' && (
                <div className="log-delivered-details">
                  <Sparkles size={14} color="#8b5cf6" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                  Packet successfully arrived at final destination Router <strong>{evt.at}</strong>!
                </div>
              )}

              {/* SIMULATION_END collision warning */}
              {evt.type === 'SIMULATION_END' && !evt.success && evt.message?.includes('Undetected') && (
                <div className="log-warning-note">
                  <strong>Network Theory Note:</strong> A zero CRC remainder does not guarantee 100% integrity. The corrupted bit pattern collided with a valid polynomial multiple!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Jump to Latest Floating Button */}
      {showJumpButton && (
        <button
          type="button"
          onClick={jumpToLatest}
          className="jump-to-latest-btn"
          aria-label="Scroll to newest log event"
        >
          <ArrowDown size={14} /> Latest Events
        </button>
      )}
    </div>
  );
}

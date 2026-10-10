import React, { useRef, useState, useLayoutEffect } from 'react';
import { ArrowDown } from 'lucide-react';

export default function TransmissionLog({ events }) {
  const containerRef = useRef(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [showJumpButton, setShowJumpButton] = useState(false);
  const prevEventsLength = useRef(0);

  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    
    // Consider the user "at the bottom" if they are within 30px
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 30;
    
    if (isAtBottom) {
      setIsAutoScrollEnabled(true);
      setShowJumpButton(false);
    } else {
      setIsAutoScrollEnabled(false);
    }
  };

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    
    // Handle reset or clear
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
      // Simulation reset with new smaller array
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

  if (!events || events.length === 0) {
    return (
      <div className="packet-log-container">
        <div className="empty-log-state">
          <div className="empty-icon">≡</div>
          <p>No transmission active.</p>
          <p style={{ fontSize: '0.85rem' }}>Configure and start a simulation to see the chronological event log.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', flex: 1, minHeight: 0 }}
      >
        {events.map((evt, idx) => {
          let color = 'var(--text-main)';
          let bg = 'var(--panel-bg)';
          
          if (evt.type === 'ERROR' || evt.type === 'DROP' || (evt.type === 'SIMULATION_END' && !evt.success)) {
            color = 'var(--danger)';
            bg = 'rgba(239, 68, 68, 0.1)';
          } else if (evt.type === 'HOP_SUCCESS' || evt.type === 'PACKET_DELIVERED' || (evt.type === 'SIMULATION_END' && evt.success)) {
            color = 'var(--success)';
            bg = 'rgba(16, 185, 129, 0.1)';
          } else if (evt.type === 'TRANSMIT') {
            color = 'var(--secondary)';
          }

          return (
            <div key={idx} style={{ padding: '0.75rem', borderRadius: '6px', background: bg, border: `1px solid ${color}`, opacity: 0.9 }}>
              <div style={{ fontWeight: 'bold', fontSize: '0.85rem', color, marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                [{evt.type}] {evt.packetIndex !== undefined ? `Packet ${evt.packetIndex}` : ''} {evt.hopIndex !== undefined ? `Hop ${evt.hopIndex}` : ''}
              </div>
              
              {evt.message && <div style={{ fontSize: '0.9rem' }}>{evt.message}</div>}
              
              {evt.type === 'TRANSMIT' && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', fontFamily: 'monospace' }}>
                  <div>Transmitting from <strong>{evt.from}</strong> to <strong>{evt.to}</strong></div>
                  {evt.wasCorrupted ? (
                    <div style={{ color: 'var(--danger)' }}>
                      Data was mathematically <strong>corrupted</strong> at bit index {evt.corruptedIndex} to test error detection.
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-muted)' }}>Transmitted cleanly on the wire without corruption.</div>
                  )}
                  <div style={{ marginTop: '4px', wordBreak: 'break-all', opacity: 0.8 }}>Codeword: {evt.transmittedCodeword}</div>
                </div>
              )}
              
              {evt.type === 'DROP' && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  <strong>Reason:</strong> {evt.reason} <br/>
                  <span style={{ opacity: 0.8 }}>The polynomial division yielded a non-zero remainder. The receiver mathematically proved the frame was corrupted on the wire and dropped it.</span>
                </div>
              )}

              {evt.type === 'HOP_SUCCESS' && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', opacity: 0.8 }}>
                  The receiver verified the CRC remainder was exactly zero. The frame was safely decoded and accepted for the next hop.
                </div>
              )}

              {evt.type === 'SIMULATION_END' && !evt.success && evt.message.includes('Undetected') && (
                <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--warning)' }}>
                  <strong>Educational Note:</strong> A zero CRC remainder does not guarantee absolute integrity. The injected bit errors maliciously collided to produce a valid polynomial multiple!
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showJumpButton && (
        <button
          onClick={jumpToLatest}
          style={{
            position: 'absolute',
            bottom: '1.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--accent-primary)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            zIndex: 10
          }}
        >
          <ArrowDown size={14} /> Jump to latest
        </button>
      )}
    </div>
  );
}

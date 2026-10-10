import React from 'react';

export default function PacketLog() {
  return (
    <div className="packet-log-container">
      <div className="empty-log-state">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="empty-icon"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <p>No transmission events yet.</p>
        <span className="pending-note">Log entries pending implementation...</span>
      </div>
    </div>
  );
}

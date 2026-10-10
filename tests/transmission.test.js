import { describe, it, expect } from 'vitest';
import { simulateTransmission } from '../src/simulation/transmission';
import { METHOD } from '../src/core/algorithms/framing';

const mockGraph = {
  'A': { 'B': 1, 'C': 5 },
  'B': { 'A': 1, 'D': 2 },
  'C': { 'A': 5, 'D': 1 },
  'D': { 'B': 2, 'C': 1 }
};
// Shortest path A -> B -> D (Cost: 3)

describe('End-to-End Network Transmission Simulation', () => {

  const defaultConfig = {
    graph: mockGraph,
    sourceId: 'A',
    destinationId: 'D',
    message: 'HELLO',
    framingMethod: METHOD.BYTE_STUFFING,
    maxPayloadSize: 254,
    crcGenerator: '1011',
    errorConfig: null
  };

  it('should successfully transmit a message over multiple hops', () => {
    const result = simulateTransmission(defaultConfig);
    expect(result.success).toBe(true);
    expect(result.finalPayload).toBe('HELLO');
    
    // Ensure chronological events look correct
    const types = result.events.map(e => e.type);
    expect(types).toContain('HOP_START');
    expect(types).toContain('TRANSMIT');
    expect(types).toContain('HOP_SUCCESS');
    expect(types).toContain('PACKET_DELIVERED');
    expect(types).toContain('SIMULATION_END');
  });

  it('should handle unreachable destinations', () => {
    const config = { ...defaultConfig, destinationId: 'Z' };
    const result = simulateTransmission(config);
    expect(result.success).toBe(false);
    expect(result.events[0].message).toMatch(/unreachable/i);
  });

  it('should correctly process multiple frames (chunking)', () => {
    const config = { ...defaultConfig, maxPayloadSize: 2 };
    // 'HELLO' is 5 bytes -> 3 packets (2, 2, 1)
    const result = simulateTransmission(config);
    expect(result.success).toBe(true);
    
    const delivers = result.events.filter(e => e.type === 'PACKET_DELIVERED');
    expect(delivers.length).toBe(3);
  });

  it('should drop a corrupted frame and halt its transmission', () => {
    const config = { 
      ...defaultConfig, 
      errorConfig: { packetIndex: 0, hopIndex: 0, bitIndex: 5 } // Corrupt 1st packet on A->B
    };
    
    const result = simulateTransmission(config);
    
    // It should fail the simulation since not all packets arrive
    expect(result.success).toBe(false);
    
    // Check events for the drop
    const dropEvent = result.events.find(e => e.type === 'DROP');
    expect(dropEvent).toBeDefined();
    expect(dropEvent.reason).toBe('CRC_FAILURE');
    expect(dropEvent.at).toBe('B'); // Dropped by router B
    
    // Ensure it never reached D
    const delivers = result.events.filter(e => e.type === 'PACKET_DELIVERED');
    expect(delivers.length).toBe(0);
  });

  it('should work gracefully with Bit Stuffing', () => {
    const config = { 
      ...defaultConfig, 
      framingMethod: METHOD.BIT_STUFFING,
      message: '?' // 00111111 binary, forces stuffed bits
    };
    const result = simulateTransmission(config);
    expect(result.success).toBe(true);
    expect(result.finalPayload).toBe('?');
  });

  it('should work gracefully with Character Count', () => {
    const config = { ...defaultConfig, framingMethod: METHOD.CHAR_COUNT };
    const result = simulateTransmission(config);
    expect(result.success).toBe(true);
  });

  it('should fail cleanly if the CRC generator is invalid', () => {
    const config = { ...defaultConfig, crcGenerator: 'invalid' };
    const result = simulateTransmission(config);
    expect(result.success).toBe(false);
    expect(result.events[0].type).toBe('ERROR');
  });
});

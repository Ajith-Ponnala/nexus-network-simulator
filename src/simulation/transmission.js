import { findShortestPath } from '../core/algorithms/dijkstra';
import { 
  METHOD, 
  stringToBytes, 
  bytesToString, 
  bytesToBinaryString, 
  binaryStringToBytes,
  encodeCharCount, decodeCharCount,
  encodeByteStuffing, decodeByteStuffing,
  encodeBitStuffing, decodeBitStuffing
} from '../core/algorithms/framing';
import { generateCRC, verifyCRC, corruptBit, validateGenerator } from '../core/algorithms/crc';

/**
 * Helper to safely chunk a payload into pieces no larger than maxPayloadSize.
 */
function chunkPayload(payloadBytes, maxPayloadSize) {
  if (maxPayloadSize <= 0) maxPayloadSize = 254;
  const chunks = [];
  if (payloadBytes.length === 0) {
    return [new Uint8Array(0)];
  }
  for (let i = 0; i < payloadBytes.length; i += maxPayloadSize) {
    chunks.push(payloadBytes.slice(i, i + maxPayloadSize));
  }
  return chunks;
}

/**
 * Orchestrates an end-to-end network transmission simulation.
 * 
 * Networking Model:
 * - Routing calculates the path.
 * - The Network Layer chunks the message payload into packets.
 * - For EACH hop, the Data Link layer frames the packet, appends a CRC over the frame, and transmits it.
 * - The receiver verifies the CRC. If valid, strips the CRC, decodes the frame, and passes the packet to the next hop.
 * 
 * @param {Object} config - The simulation configuration.
 * @returns {Object} { events, success, finalPayload, error }
 */
export function simulateTransmission({
  graph,
  sourceId,
  destinationId,
  message,
  framingMethod,
  maxPayloadSize,
  crcGenerator,
  errorConfig // { packetIndex, hopIndex, bitIndex }
}) {
  const events = [];
  
  // 1. Validation & Routing
  if (!graph || !sourceId || !destinationId) {
    events.push({ type: 'ERROR', message: "Invalid network parameters." });
    return { success: false, events };
  }

  try {
    validateGenerator(crcGenerator);
  } catch (err) {
    events.push({ type: 'ERROR', message: `Invalid CRC Generator: ${err.message}` });
    return { success: false, events };
  }

  const routeResult = findShortestPath(graph, sourceId, destinationId);
  if (!routeResult.pathExists) {
    events.push({ type: 'ERROR', message: "Destination unreachable." });
    return { success: false, events };
  }
  
  const path = routeResult.path;
  events.push({ type: 'INFO', message: `Route established: ${path.join(' -> ')}` });

  // 2. Network Layer Payload Chunking
  const payloadBytes = stringToBytes(message || '');
  const packets = chunkPayload(payloadBytes, maxPayloadSize);
  
  events.push({ type: 'INFO', message: `Payload split into ${packets.length} network packets.` });
  
  const receivedPackets = [];

  // 3. Packet Transmission Loop
  packetLoop: for (let pIdx = 0; pIdx < packets.length; pIdx++) {
    let currentData = packets[pIdx];
    
    events.push({ type: 'PACKET_START', packetIndex: pIdx, message: `Starting transmission for Packet ${pIdx + 1}/${packets.length}` });
    
    for (let hopIdx = 0; hopIdx < path.length - 1; hopIdx++) {
      const routerA = path[hopIdx];
      const routerB = path[hopIdx + 1];
      
      events.push({ type: 'HOP_START', packetIndex: pIdx, hopIndex: hopIdx, from: routerA, to: routerB });
      
      // A. Framing
      let framedData;
      let frameBits = '';
      try {
        if (framingMethod === METHOD.CHAR_COUNT) {
          framedData = encodeCharCount(currentData, maxPayloadSize)[0];
          frameBits = bytesToBinaryString(framedData);
        } else if (framingMethod === METHOD.BYTE_STUFFING) {
          framedData = encodeByteStuffing(currentData, maxPayloadSize)[0];
          frameBits = bytesToBinaryString(framedData);
        } else if (framingMethod === METHOD.BIT_STUFFING) {
          // Bit stuffing takes bytes but returns a bit string natively
          frameBits = encodeBitStuffing(currentData, maxPayloadSize)[0];
        } else {
          throw new Error("Unknown framing method.");
        }
      } catch (err) {
        events.push({ type: 'ERROR', packetIndex: pIdx, hopIndex: hopIdx, message: `Framing failed: ${err.message}` });
        continue packetLoop;
      }
      
      // B. CRC Generation (over the framed bits)
      const crcResult = generateCRC(frameBits, crcGenerator);
      let transmittedCodeword = crcResult.codeword;
      let wasCorrupted = false;
      let corruptedIndex = -1;
      
      // C. Error Injection Simulation
      if (errorConfig && errorConfig.packetIndex === pIdx && errorConfig.hopIndex === hopIdx) {
        corruptedIndex = errorConfig.bitIndex;
        // Clamp to valid range
        if (corruptedIndex >= 0 && corruptedIndex < transmittedCodeword.length) {
          transmittedCodeword = corruptBit(transmittedCodeword, corruptedIndex);
          wasCorrupted = true;
        }
      }
      
      events.push({ 
        type: 'TRANSMIT', 
        packetIndex: pIdx, 
        hopIndex: hopIdx, 
        from: routerA, 
        to: routerB,
        originalCodeword: crcResult.codeword,
        transmittedCodeword,
        wasCorrupted,
        corruptedIndex
      });
      
      // D. Reception & CRC Verification
      const verResult = verifyCRC(transmittedCodeword, crcGenerator);
      if (!verResult.isValid) {
        events.push({ 
          type: 'DROP', 
          packetIndex: pIdx, 
          hopIndex: hopIdx, 
          at: routerB, 
          reason: 'CRC_FAILURE',
          message: `Frame rejected at ${routerB} due to CRC failure. No retransmission configured.`
        });
        continue packetLoop; // Drop packet entirely
      }
      
      // E. CRC Pass - Extract Frame
      const r = crcGenerator.length - 1;
      const recoveredFrameBits = transmittedCodeword.substring(0, transmittedCodeword.length - r);
      
      // F. Decode Framing
      let decodedData;
      try {
        if (framingMethod === METHOD.BIT_STUFFING) {
          decodedData = decodeBitStuffing(recoveredFrameBits);
        } else {
          const recoveredBytes = binaryStringToBytes(recoveredFrameBits);
          if (framingMethod === METHOD.CHAR_COUNT) {
            decodedData = decodeCharCount(recoveredBytes);
          } else {
            decodedData = decodeByteStuffing(recoveredBytes);
          }
        }
      } catch (err) {
        events.push({ 
          type: 'DROP', 
          packetIndex: pIdx, 
          hopIndex: hopIdx, 
          at: routerB, 
          reason: 'FRAMING_ERROR',
          message: `Frame rejected at ${routerB} due to Framing decode error: ${err.message}`
        });
        continue packetLoop;
      }
      
      events.push({ type: 'HOP_SUCCESS', packetIndex: pIdx, hopIndex: hopIdx, at: routerB, message: `Packet successfully processed at ${routerB}` });
      
      // Prepare for next hop
      currentData = decodedData;
    }
    
    // Packet reached destination
    receivedPackets.push(currentData);
    events.push({ type: 'PACKET_DELIVERED', packetIndex: pIdx, at: destinationId });
  }
  
  // 4. Reassembly & Final Verification
  if (receivedPackets.length !== packets.length) {
    events.push({ type: 'SIMULATION_END', success: false, message: `Only ${receivedPackets.length}/${packets.length} packets delivered.` });
    return { success: false, events };
  }
  
  // Reconstruct byte array
  const totalLength = receivedPackets.reduce((acc, p) => acc + p.length, 0);
  const finalBytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const p of receivedPackets) {
    finalBytes.set(p, offset);
    offset += p.length;
  }
  
  const finalPayload = bytesToString(finalBytes);
  const isIntact = finalPayload === message;
  
  if (isIntact) {
    events.push({ type: 'SIMULATION_END', success: true, message: "Simulation complete. Message perfectly reconstructed at destination." });
  } else {
    // This happens if an error was maliciously injected in a way that CRC missed it (e.g. valid codeword collision)
    events.push({ type: 'SIMULATION_END', success: false, message: "Simulation complete, but final payload differs from original! Undetected corruption occurred." });
  }
  
  return {
    success: isIntact,
    events,
    finalPayload
  };
}

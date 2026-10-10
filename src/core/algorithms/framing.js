export const METHOD = {
  CHAR_COUNT: 'CHAR_COUNT',
  BYTE_STUFFING: 'BYTE_STUFFING',
  BIT_STUFFING: 'BIT_STUFFING'
};

export const FLAG_BYTE = 0x7E;
export const ESC_BYTE = 0x7D;
export const FLAG_BIT = '01111110';

export function stringToBytes(str) {
  return new TextEncoder().encode(str);
}

export function bytesToString(bytes) {
  return new TextDecoder().decode(bytes);
}

export function bytesToHex(bytes) {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0').toUpperCase()).join(' ');
}

export function bytesToBinaryString(bytes) {
  return Array.from(bytes).map(b => b.toString(2).padStart(8, '0')).join('');
}

export function binaryStringToBytes(binStr) {
  if (binStr.length % 8 !== 0) throw new Error("Binary string length not a multiple of 8.");
  const bytes = new Uint8Array(binStr.length / 8);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(binStr.substring(i * 8, i * 8 + 8), 2);
  }
  return bytes;
}

function chunkPayload(payloadBytes, maxPayloadSize) {
  if (maxPayloadSize <= 0) throw new Error("Max payload size must be positive.");
  const chunks = [];
  for (let i = 0; i < payloadBytes.length; i += maxPayloadSize) {
    chunks.push(payloadBytes.slice(i, i + maxPayloadSize));
  }
  return chunks;
}

// ============================================
// CHARACTER COUNT
// ============================================
export function encodeCharCount(payloadBytes, maxPayloadSize = 254) {
  if (maxPayloadSize > 254) throw new Error("Max payload size for 1-byte char count is 254.");
  const chunks = chunkPayload(payloadBytes, maxPayloadSize);
  return chunks.map(chunk => {
    const frame = new Uint8Array(chunk.length + 1);
    frame[0] = chunk.length + 1; // Count includes the header byte itself
    frame.set(chunk, 1);
    return frame;
  });
}

export function decodeCharCount(encodedBytes) {
  const result = [];
  let i = 0;
  while (i < encodedBytes.length) {
    const count = encodedBytes[i];
    if (count === 0) throw new Error("Malformed header: Frame length cannot be 0.");
    if (i + count > encodedBytes.length) throw new Error("Truncated frame: Not enough bytes to satisfy header count.");
    result.push(...encodedBytes.slice(i + 1, i + count));
    i += count;
  }
  return new Uint8Array(result);
}

// ============================================
// BYTE STUFFING
// ============================================
export function encodeByteStuffing(payloadBytes, maxPayloadSize = 254) {
  const chunks = chunkPayload(payloadBytes, maxPayloadSize);
  return chunks.map(chunk => {
    const stuffed = [];
    stuffed.push(FLAG_BYTE);
    for (let i = 0; i < chunk.length; i++) {
      if (chunk[i] === FLAG_BYTE || chunk[i] === ESC_BYTE) {
        stuffed.push(ESC_BYTE);
      }
      stuffed.push(chunk[i]);
    }
    stuffed.push(FLAG_BYTE);
    return new Uint8Array(stuffed);
  });
}

export function decodeByteStuffing(encodedBytes) {
  const result = [];
  let inFrame = false;
  let escapeNext = false;
  
  for (let i = 0; i < encodedBytes.length; i++) {
    const byte = encodedBytes[i];
    
    if (!inFrame) {
      if (byte === FLAG_BYTE) {
        inFrame = true;
      }
      continue;
    }
    
    if (escapeNext) {
      if (byte !== FLAG_BYTE && byte !== ESC_BYTE) {
        throw new Error("Invalid escape sequence.");
      }
      result.push(byte);
      escapeNext = false;
    } else if (byte === ESC_BYTE) {
      escapeNext = true;
    } else if (byte === FLAG_BYTE) {
      inFrame = false; // End of frame
    } else {
      result.push(byte);
    }
  }
  
  if (escapeNext) throw new Error("Incomplete frame: hanging escape byte.");
  if (inFrame) throw new Error("Incomplete frame: missing closing flag.");
  
  return new Uint8Array(result);
}

// ============================================
// BIT STUFFING
// ============================================
export function encodeBitStuffing(payloadBytes, maxPayloadSize = 254) {
  const chunks = chunkPayload(payloadBytes, maxPayloadSize);
  return chunks.map(chunk => {
    const binStr = bytesToBinaryString(chunk);
    let stuffed = '';
    let count = 0;
    for (let i = 0; i < binStr.length; i++) {
      stuffed += binStr[i];
      if (binStr[i] === '1') {
        count++;
        if (count === 5) {
          stuffed += '0';
          count = 0;
        }
      } else {
        count = 0;
      }
    }
    return FLAG_BIT + stuffed + FLAG_BIT;
  });
}

export function decodeBitStuffing(encodedBitStr) {
  let resultStr = '';
  let inFrame = false;
  let count = 0;
  
  let i = 0;
  while (i < encodedBitStr.length) {
    if (encodedBitStr.substring(i, i + 8) === FLAG_BIT) {
      inFrame = !inFrame;
      i += 8;
      count = 0;
      continue;
    }
    
    if (inFrame) {
      const bit = encodedBitStr[i];
      if (bit === '1') {
        count++;
        resultStr += bit;
        if (count === 5) {
          // next bit MUST be a stuffed 0
          if (encodedBitStr[i+1] !== '0') {
            throw new Error("Invalid bit stuffing: Missing stuffed 0 after five 1s.");
          }
          i++; // skip the stuffed 0
          count = 0;
        }
      } else {
        count = 0;
        resultStr += bit;
      }
    }
    i++;
  }
  
  if (inFrame) throw new Error("Incomplete frame: missing closing flag.");
  return binaryStringToBytes(resultStr);
}

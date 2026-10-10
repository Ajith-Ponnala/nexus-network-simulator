/**
 * CRC (Cyclic Redundancy Check) Module
 * Implements generation and verification using modulo-2 binary division.
 */

export function validateGenerator(gen) {
  if (typeof gen !== 'string' || !/^[01]+$/.test(gen)) {
    throw new Error("Generator must be a valid binary string.");
  }
  if (gen.length < 2) {
    throw new Error("Generator must be at least 2 bits long.");
  }
  if (gen[0] !== '1' || gen[gen.length - 1] !== '1') {
    throw new Error("Generator's highest and constant coefficients must be 1.");
  }
}

/**
 * Performs Modulo-2 binary polynomial division.
 * 
 * @param {string} dataStr - The dividend (data with appended zeros for generation, or codeword for verification).
 * @param {string} genStr - The divisor (generator polynomial).
 * @param {boolean} generateTrace - Whether to record the step-by-step XOR division process.
 * @returns {Object} { remainder, trace }
 */
export function divideModulo2(dataStr, genStr, generateTrace = false) {
  if (dataStr.length < genStr.length) {
    throw new Error("Data string cannot be shorter than the generator.");
  }

  const trace = [];
  let current = dataStr.substring(0, genStr.length);
  
  if (generateTrace) {
    trace.push({ step: 'Initial', current, remaining: dataStr.substring(genStr.length) });
  }

  for (let i = 0; i <= dataStr.length - genStr.length; i++) {
    if (current[0] === '1') {
      let next = '';
      for (let j = 0; j < genStr.length; j++) {
        next += current[j] === genStr[j] ? '0' : '1';
      }
      if (generateTrace) trace.push({ op: 'XOR', divisor: genStr, result: next });
      current = next;
    } else {
      if (generateTrace) trace.push({ op: 'SKIP (MSB 0)', result: current });
    }
    
    // Shift and bring down the next bit (or extract remainder at the very end)
    if (i < dataStr.length - genStr.length) {
      current = current.substring(1) + dataStr[i + genStr.length];
      if (generateTrace) trace.push({ step: 'Shift', current });
    } else {
      current = current.substring(1); // Extract the r-bit remainder
    }
  }
  
  return { remainder: current, trace };
}

/**
 * Generates the CRC Codeword for a payload.
 * 
 * @param {string} payloadBits - The original data payload as a binary string.
 * @param {string} generator - The generator polynomial as a binary string.
 * @param {boolean} generateTrace - Whether to generate XOR division trace.
 * @returns {Object} { codeword, remainder, trace }
 */
export function generateCRC(payloadBits, generator, generateTrace = false) {
  validateGenerator(generator);
  if (!/^[01]*$/.test(payloadBits)) throw new Error("Payload must be a binary string.");
  
  // Handle empty payload gracefully (as 0-length data is technically invalid for polynomial division unless padded)
  // According to some conventions, empty payload means empty codeword, but here we enforce at least a 1-bit payload or just process '0' if empty.
  const effectivePayload = payloadBits.length === 0 ? '0' : payloadBits;
  
  const r = generator.length - 1;
  const appendedData = effectivePayload + '0'.repeat(r);
  
  const { remainder, trace } = divideModulo2(appendedData, generator, generateTrace);
  
  return {
    codeword: effectivePayload + remainder,
    remainder,
    trace
  };
}

/**
 * Verifies a received CRC Codeword.
 * 
 * @param {string} codewordBits - The received binary string.
 * @param {string} generator - The generator polynomial used for division.
 * @param {boolean} generateTrace - Whether to generate XOR division trace.
 * @returns {Object} { isValid, remainder, trace }
 */
export function verifyCRC(codewordBits, generator, generateTrace = false) {
  validateGenerator(generator);
  if (!/^[01]+$/.test(codewordBits)) throw new Error("Codeword must be a binary string.");
  if (codewordBits.length < generator.length) throw new Error("Codeword is truncated and shorter than the generator.");
  
  const { remainder, trace } = divideModulo2(codewordBits, generator, generateTrace);
  
  // CRC is valid if the remainder is exactly all zeros.
  const isValid = !remainder.includes('1');
  
  return {
    isValid,
    remainder,
    trace
  };
}

/**
 * Simulates bit corruption by flipping a single bit.
 * Does not mutate the original data.
 * 
 * @param {string} bits - The binary string.
 * @param {number} zeroBasedIndex - The index of the bit to flip (0 = leftmost MSB).
 * @returns {string} The corrupted binary string.
 */
export function corruptBit(bits, zeroBasedIndex) {
  if (zeroBasedIndex < 0 || zeroBasedIndex >= bits.length) {
    throw new Error(`Invalid bit position. Must be between 0 and ${bits.length - 1}.`);
  }
  const arr = bits.split('');
  arr[zeroBasedIndex] = arr[zeroBasedIndex] === '1' ? '0' : '1';
  return arr.join('');
}

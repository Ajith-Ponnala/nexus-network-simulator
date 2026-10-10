import { describe, it, expect } from 'vitest';
import { 
  validateGenerator, 
  generateCRC, 
  verifyCRC, 
  corruptBit 
} from '../src/core/algorithms/crc';

describe('CRC Error Detection Algorithm', () => {

  describe('Generator Validation', () => {
    it('should throw on non-binary strings', () => {
      expect(() => validateGenerator('1021')).toThrow(/binary string/);
    });
    it('should throw on generators less than 2 bits', () => {
      expect(() => validateGenerator('1')).toThrow(/at least 2 bits/);
    });
    it('should throw if highest or constant coefficients are not 1', () => {
      expect(() => validateGenerator('011')).toThrow(/highest and constant coefficients/);
      expect(() => validateGenerator('110')).toThrow(/highest and constant coefficients/);
    });
    it('should accept valid polynomials', () => {
      expect(() => validateGenerator('1011')).not.toThrow();
    });
  });

  describe('CRC Generation', () => {
    it('should correctly calculate standard test vectors', () => {
      // Example: Data 1101011011, Generator 10011 -> Remainder 1110
      const payload = '1101011011';
      const gen = '10011';
      const { remainder, codeword } = generateCRC(payload, gen);
      expect(remainder).toBe('1110');
      expect(codeword).toBe('11010110111110');
    });

    it('should handle all-zero payload gracefully', () => {
      const { remainder } = generateCRC('0000', '101');
      expect(remainder).toBe('00');
    });
    
    it('should handle all-one payload', () => {
      const { remainder, codeword } = generateCRC('111', '11');
      // 111 + 0 -> 1110 / 11 -> 010 / 11 -> ... remainder '1'
      expect(remainder).toBe('1');
      expect(codeword).toBe('1111');
    });
  });

  describe('CRC Verification & Corruption', () => {
    const payload = '1101011011';
    const gen = '10011';
    
    it('should verify a clean, uncorrupted codeword', () => {
      const { codeword } = generateCRC(payload, gen);
      const { isValid, remainder } = verifyCRC(codeword, gen);
      expect(isValid).toBe(true);
      expect(remainder).toBe('0000');
    });

    it('should detect a single-bit corruption in payload', () => {
      const { codeword } = generateCRC(payload, gen);
      const badCodeword = corruptBit(codeword, 3); // Flip 4th bit
      const { isValid, remainder } = verifyCRC(badCodeword, gen);
      expect(isValid).toBe(false);
      expect(remainder).not.toBe('0000');
    });
    
    it('should detect a single-bit corruption in CRC remainder', () => {
      const { codeword } = generateCRC(payload, gen);
      const badCodeword = corruptBit(codeword, codeword.length - 1); // Flip last bit
      const { isValid } = verifyCRC(badCodeword, gen);
      expect(isValid).toBe(false);
    });

    it('should detect multiple-bit corruption', () => {
      const { codeword } = generateCRC(payload, gen);
      let bad = corruptBit(codeword, 1);
      bad = corruptBit(bad, 5);
      bad = corruptBit(bad, 9);
      const { isValid } = verifyCRC(bad, gen);
      expect(isValid).toBe(false);
    });

    it('should throw on truncated codewords', () => {
      const { codeword } = generateCRC(payload, gen);
      // Remove last 3 bits
      const truncated = codeword.substring(0, codeword.length - 3);
      // If truncated length is shorter than generator it throws explicitly.
      if (truncated.length < gen.length) {
        expect(() => verifyCRC(truncated, gen)).toThrow(/truncated/);
      } else {
        // If it's just missing bits, CRC validation fails
        const { isValid } = verifyCRC(truncated, gen);
        expect(isValid).toBe(false);
      }
    });

    it('should throw on invalid bit positions during corruption', () => {
      expect(() => corruptBit('1010', -1)).toThrow(/Invalid bit position/);
      expect(() => corruptBit('1010', 4)).toThrow(/Invalid bit position/);
    });
  });

});

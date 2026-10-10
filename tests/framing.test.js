import { describe, it, expect } from 'vitest';
import { 
  encodeCharCount, decodeCharCount, 
  encodeByteStuffing, decodeByteStuffing, 
  encodeBitStuffing, decodeBitStuffing,
  stringToBytes, bytesToString, FLAG_BYTE, ESC_BYTE, FLAG_BIT
} from '../src/core/algorithms/framing';

describe('Data Link Layer Framing', () => {

  describe('Character Count', () => {
    it('should encode and decode simple strings', () => {
      const payload = stringToBytes('HELLO');
      const frames = encodeCharCount(payload, 254);
      expect(frames.length).toBe(1);
      // 'HELLO' is 5 bytes + 1 byte header = 6
      expect(frames[0][0]).toBe(6);
      
      const decoded = decodeCharCount(frames[0]);
      expect(bytesToString(decoded)).toBe('HELLO');
    });

    it('should split payload into multiple frames', () => {
      const payload = stringToBytes('1234567890');
      const frames = encodeCharCount(payload, 4); // Max 4 bytes per payload
      expect(frames.length).toBe(3); // '1234', '5678', '90'
      
      // Concatenate frames as if received on the wire
      const concat = new Uint8Array(frames[0].length + frames[1].length + frames[2].length);
      concat.set(frames[0], 0);
      concat.set(frames[1], frames[0].length);
      concat.set(frames[2], frames[0].length + frames[1].length);
      
      const decoded = decodeCharCount(concat);
      expect(bytesToString(decoded)).toBe('1234567890');
    });

    it('should throw on truncated frames', () => {
      const frame = new Uint8Array([5, 65, 66]); // Says 5 bytes, but only has 3
      expect(() => decodeCharCount(frame)).toThrow(/Truncated frame/);
    });
  });

  describe('Byte Stuffing', () => {
    it('should encode and decode without escaping if no flags are present', () => {
      const payload = stringToBytes('TEST');
      const frames = encodeByteStuffing(payload);
      expect(frames[0][0]).toBe(FLAG_BYTE);
      expect(frames[0][frames[0].length - 1]).toBe(FLAG_BYTE);
      
      const decoded = decodeByteStuffing(frames[0]);
      expect(bytesToString(decoded)).toBe('TEST');
    });

    it('should correctly escape flag and escape bytes in payload', () => {
      // Payload contains FLAG_BYTE and ESC_BYTE
      const payload = new Uint8Array([0x41, FLAG_BYTE, 0x42, ESC_BYTE, 0x43]);
      const frames = encodeByteStuffing(payload);
      
      // Expected wire format: FLAG, 0x41, ESC, FLAG, 0x42, ESC, ESC, 0x43, FLAG
      expect(frames[0].length).toBe(9); 
      
      const decoded = decodeByteStuffing(frames[0]);
      expect(decoded).toEqual(payload);
    });

    it('should throw on incomplete frames', () => {
      const frame = new Uint8Array([FLAG_BYTE, 0x41, 0x42]); // Missing closing flag
      expect(() => decodeByteStuffing(frame)).toThrow(/Incomplete frame/);
    });

    it('should decode multiple consecutive frames', () => {
      const p1 = stringToBytes('AB');
      const p2 = stringToBytes('CD');
      const f1 = encodeByteStuffing(p1)[0];
      const f2 = encodeByteStuffing(p2)[0];
      
      const concat = new Uint8Array([...f1, ...f2]);
      const decoded = decodeByteStuffing(concat);
      // Both payloads merged
      expect(bytesToString(decoded)).toBe('ABCD');
    });
  });

  describe('Bit Stuffing', () => {
    it('should encode and decode simple payloads without stuffing', () => {
      const payload = stringToBytes('A'); // 'A' = 01000001 (no 5 consecutive 1s)
      const frames = encodeBitStuffing(payload);
      expect(frames[0]).toBe(FLAG_BIT + '01000001' + FLAG_BIT);
      
      const decoded = decodeBitStuffing(frames[0]);
      expect(bytesToString(decoded)).toBe('A');
    });

    it('should insert and remove stuffed bits for five consecutive ones', () => {
      // Payload byte 0x3F = 00111111 (6 ones)
      const payload = new Uint8Array([0x3F]);
      const frames = encodeBitStuffing(payload);
      
      // Should be stuffed after 5 ones: 0011111 0 1
      expect(frames[0]).toBe(FLAG_BIT + '001111101' + FLAG_BIT);
      
      const decoded = decodeBitStuffing(frames[0]);
      expect(decoded[0]).toBe(0x3F);
    });

    it('should throw on malformed stuffed data', () => {
      // 6 ones without a stuffed 0, but not matching FLAG_BIT
      const badFrame = FLAG_BIT + '11111111' + FLAG_BIT; 
      expect(() => decodeBitStuffing(badFrame)).toThrow(/Invalid bit stuffing/);
    });
    
    it('should throw on missing closing flag', () => {
      const badFrame = FLAG_BIT + '01010101';
      expect(() => decodeBitStuffing(badFrame)).toThrow(/Incomplete frame/);
    });
  });

});

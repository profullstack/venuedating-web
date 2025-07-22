import { expect } from 'chai';
import { convertDataCidToDataId } from '../src/utils/data-id-converter.js';

describe('Data ID Converter', () => {
  describe('convertDataCidToDataId', () => {
    it('should convert numeric data_cid to hex data_id format', () => {
      // Test case based on the example in the code
      const dataCid = '8409608661626785213';
      const result = convertDataCidToDataId(dataCid);
      
      // The result should be in format: 0x{hex1}%3A0x{hex2}
      expect(result).to.match(/^0x[0-9a-f]+%3A0x[0-9a-f]+$/i);
      expect(result).to.include('%3A'); // URL-encoded colon
    });

    it('should handle string numeric input', () => {
      const dataCid = '8409608661626785213';
      const result = convertDataCidToDataId(dataCid);
      expect(result).to.be.a('string');
      expect(result.length).to.be.greaterThan(10);
    });

    it('should handle numeric input', () => {
      const dataCid = 8409608661626785213;
      const result = convertDataCidToDataId(dataCid);
      expect(result).to.be.a('string');
      expect(result).to.match(/^0x[0-9a-f]+%3A0x[0-9a-f]+$/i);
    });

    it('should return null for invalid input', () => {
      expect(convertDataCidToDataId(null)).to.be.null;
      expect(convertDataCidToDataId(undefined)).to.be.null;
      expect(convertDataCidToDataId('')).to.be.null;
      expect(convertDataCidToDataId('invalid')).to.be.null;
    });

    it('should handle edge case of zero', () => {
      const result = convertDataCidToDataId(0);
      expect(result).to.equal('0x0%3A0x0');
    });

    it('should handle large numbers consistently', () => {
      const largeCid = '18446744073709551615'; // Max 64-bit unsigned int
      const result = convertDataCidToDataId(largeCid);
      expect(result).to.match(/^0x[0-9a-f]+%3A0x[0-9a-f]+$/i);
    });

    it('should produce consistent results for same input', () => {
      const dataCid = '8409608661626785213';
      const result1 = convertDataCidToDataId(dataCid);
      const result2 = convertDataCidToDataId(dataCid);
      expect(result1).to.equal(result2);
    });
  });
});
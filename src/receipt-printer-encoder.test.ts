import ReceiptPrinterEncoder from './receipt-printer-encoder';

describe('ReceiptPrinterEncoder', () => {
	describe('ReceiptPrinterEncoder({ language: unknown })', () => {
		it('should throw an "Language not supported" error', () => {
			expect(() => {
				// @ts-expect-error - Testing type safety of the language parameter.
				new ReceiptPrinterEncoder({ language: 'unknown' });
			}).toThrow('The specified language is not supported');
		});
	});

	describe('ReceiptPrinterEncoder({ language: esc-pos })', () => {
		it('should be .language == esc-pos', () => {
			let escposencoder = new ReceiptPrinterEncoder({ language: 'esc-pos' });
			expect(escposencoder.language).toBe('esc-pos');
		});
	});

	describe('ReceiptPrinterEncoder({ language: star-prnt })', () => {
		it('should be .language == star-prnt', () => {
			let starprntencoder = new ReceiptPrinterEncoder({ language: 'star-prnt' });
			expect(starprntencoder.language).toBe('star-prnt');
		});
	});
});

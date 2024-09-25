import ReceiptPrinterEncoder from '../receipt-printer-encoder';
import { createCanvas } from 'canvas';
import { describe, it, expect } from 'vitest';

describe('LanguageStarPrnt', () => {
	describe('text(hello)', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.text('hello').encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]));
		});
	});

	describe('text(hello).newline()', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.text('hello').newline().encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]));
		});
	});

	describe('text(hello).newline().newline()', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.text('hello').newline().newline().encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13, 10, 13]));
		});
	});

	describe('text(hello).newline(4)', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13, 10, 13, 10, 13, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.text('hello').newline(4).encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13, 10, 13, 10, 13, 10, 13]));
		});
	});

	describe('line(hello)', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.line('hello').encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]));
		});
	});

	describe('text(héllo) - é -> 176', () => {
		it('should be [ 104, 176, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.text('héllo').encode();
			expect(result).toEqual(new Uint8Array([104, 176, 108, 108, 111, 10, 13]));
		});
	});

	describe('codepage(star/katakana).text(héllo) - é -> ?', () => {
		it('should be [ 27, 29, 116, 2, 104, 63, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.codepage('star/katakana').text('héllo').encode();
			expect(result).toEqual(new Uint8Array([27, 29, 116, 2, 104, 63, 108, 108, 111, 10, 13]));
		});
	});

	describe('codepage(cp437).text(héllo) - é -> 130', () => {
		it('should be [27, 29, 116, 1, 104, 130, 108, 108, 111, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.codepage('cp437').text('héllo').encode();
			expect(result).toEqual(new Uint8Array([27, 29, 116, 1, 104, 130, 108, 108, 111, 10, 13]));
		});
	});

	describe('codepage(star/cp874).text(กำลังทดสอบ) - thai', () => {
		it('should be [27, 29, 116, 21, 161, 211, 197, 209, 167, 183, 180, 202, 205, 186, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.codepage('star/cp874').text('กำลังทดสอบ').encode();
			expect(result).toEqual(
				new Uint8Array([27, 29, 116, 21, 161, 211, 197, 209, 167, 183, 180, 202, 205, 186, 10, 13])
			);
		});
	});

	describe('codepage(windows1252).text(héllo) - é -> 233', () => {
		it('should be [27, 29, 116, 32, 104, 233, 108, 108, 111, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.codepage('windows1252').text('héllo').encode();
			expect(result).toEqual(new Uint8Array([27, 29, 116, 32, 104, 233, 108, 108, 111, 10, 13]));
		});
	});

	describe('codepage(unknown).text(héllo)', () => {
		it('should throw an "Unknown codepage" error', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			expect(() => {
				encoder.codepage('unknown').text('héllo').encode();
			}).toThrow('Unknown codepage');
		});
	});

	describe('bold(true).text(hello).bold(false)', () => {
		it('should be [ 27, 69, ..., 27, 70, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.bold(true).text('hello').bold(false).encode();
			expect(result).toEqual(new Uint8Array([27, 69, 104, 101, 108, 108, 111, 27, 70, 10, 13]));
		});
	});

	describe('bold().text(hello).bold()', () => {
		it('should be [ 27, 69, ..., 27, 70, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.bold().text('hello').bold().encode();
			expect(result).toEqual(new Uint8Array([27, 69, 104, 101, 108, 108, 111, 27, 70, 10, 13]));
		});
	});

	describe('italic().text(hello).italic()', () => {
		it('should be [ 104, 101, 108, 108, 111, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.italic().text('hello').italic().encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 10, 13]));
		});
	});

	describe('underline(true).text(hello).underline(false)', () => {
		it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.underline(true).text('hello').underline(false).encode();
			expect(result).toEqual(new Uint8Array([27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13]));
		});
	});

	describe('underline().text(hello).underline()', () => {
		it('should be [ 27, 45, 1, ..., 27, 45, 0, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.underline().text('hello').underline().encode();
			expect(result).toEqual(new Uint8Array([27, 45, 1, 104, 101, 108, 108, 111, 27, 45, 0, 10, 13]));
		});
	});

	describe('align(left).line(hello)', () => {
		it('should be [ ..., 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({
				language: 'star-prnt',
				autoFlush: false,
				width: 10,
				embedded: true
			});
			let result = encoder.align('left').line('hello').encode();
			expect(result).toEqual(new Uint8Array([104, 101, 108, 108, 111, 32, 32, 32, 32, 32, 10, 13]));
		});
	});

	describe('align(center).line(hello)', () => {
		it('should be [ 32, 32, ..., 32, 32, 32, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({
				language: 'star-prnt',
				autoFlush: false,
				width: 10,
				embedded: true
			});
			let result = encoder.align('center').line('hello').encode();
			expect(result).toEqual(new Uint8Array([32, 32, 104, 101, 108, 108, 111, 32, 32, 32, 10, 13]));
		});
	});

	describe('align(right).line(hello)', () => {
		it('should be [ 32, 32, 32, 32, 32, ..., 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({
				language: 'star-prnt',
				autoFlush: false,
				width: 10,
				embedded: true
			});
			let result = encoder.align('right').line('hello').encode();
			expect(result).toEqual(new Uint8Array([32, 32, 32, 32, 32, 104, 101, 108, 108, 111, 10, 13]));
		});
	});

	describe('qrcode(https://nielsleenheer.com)', () => {
		it('should be [ 27, 29, 121, 83, 48, 2, 27, 29, 121, 83, 50, 6, ... ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.qrcode('https://nielsleenheer.com').encode();
			expect(result).toEqual(
				new Uint8Array([
					27, 29, 121, 83, 48, 2, 27, 29, 121, 83, 50, 6, 27, 29, 121, 83, 49, 1, 27, 29, 121, 68, 49, 0, 25,
					0, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101,
					114, 46, 99, 111, 109, 27, 29, 121, 80, 10, 13
				])
			);
		});
	});

	describe('qrcode(https://nielsleenheer.com, 1, 8, h)', () => {
		it('should be [ 27, 29, 121, 83, 48, 1, 27, 29, 121, 83, 50, 8, ... ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.qrcode('https://nielsleenheer.com', 1, 8, 'h').encode();
			expect(result).toEqual(
				new Uint8Array([
					27, 29, 121, 83, 48, 1, 27, 29, 121, 83, 50, 8, 27, 29, 121, 83, 49, 3, 27, 29, 121, 68, 49, 0, 25,
					0, 104, 116, 116, 112, 115, 58, 47, 47, 110, 105, 101, 108, 115, 108, 101, 101, 110, 104, 101, 101,
					114, 46, 99, 111, 109, 27, 29, 121, 80, 10, 13
				])
			);
		});
	});

	describe('barcode(3130630574613, ean13, 60)', () => {
		it('should be [27, 98, 3, 1, 2, 60, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 30, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.barcode('3130630574613', 'ean13', 60).encode();
			expect(result).toEqual(
				new Uint8Array([27, 98, 3, 1, 2, 60, 51, 49, 51, 48, 54, 51, 48, 53, 55, 52, 54, 49, 51, 30, 10, 13])
			);
		});
	});

	describe('barcode(CODE128, code128, 60)', () => {
		it('should be [27, 98, 6, 1, 2, 60, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.barcode('CODE128', 'code128', 60).encode();
			expect(result).toEqual(new Uint8Array([27, 98, 6, 1, 2, 60, 67, 79, 68, 69, 49, 50, 56, 30, 10, 13]));
		});
	});

	describe('image(canvas, 8, 24) - with a black pixel at 0,0', () => {
		it('should be [27, 48, 27, 88, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 13, 27, 122, 1, 10, 13]', () => {
			let canvas = createCanvas(8, 24);
			let context = canvas.getContext('2d');
			context.fillStyle = 'rgba(0, 0, 0, 1)';
			context.fillRect(0, 0, 1, 1);

			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false, createCanvas });
			let result = encoder.image(canvas, 8, 24).encode();

			expect(result).toEqual(
				new Uint8Array([
					27, 48, 27, 88, 8, 0, 128, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10,
					13, 27, 122, 1, 10, 13
				])
			);
		});
	});

	describe('pulse()', () => {
		it('should be [ 27, 7, 20, 20, 7, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.pulse().encode();
			expect(result).toEqual(new Uint8Array([27, 7, 20, 20, 7, 10, 13]));
		});
	});

	describe('cut()', () => {
		it('should be [ 27, 100, 00, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.cut().encode();
			expect(result).toEqual(new Uint8Array([27, 100, 0, 10, 13]));
		});
	});

	describe('cut(full)', () => {
		it('should be [ 27, 100, 00, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.cut('full').encode();
			expect(result).toEqual(new Uint8Array([27, 100, 0, 10, 13]));
		});
	});

	describe('cut(partial)', () => {
		it('should be [ 27, 100, 01, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.cut('partial').encode();
			expect(result).toEqual(new Uint8Array([27, 100, 1, 10, 13]));
		});
	});

	describe('raw([ 0x1c, 0x2e ])', () => {
		it('should be [ 28, 46, 10, 13 ]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.raw([0x1c, 0x2e]).encode();
			expect(result).toEqual(new Uint8Array([28, 46, 10, 13]));
		});
	});

	describe('codepage(auto).text(héψжł)', () => {
		it('should be [27, 29, 116, 0, 104, 176, 27, 29, 116, 15, 175, 27, 29, 116, 10, 166, 27, 29, 116, 5, 136, 10, 13]', () => {
			let encoder = new ReceiptPrinterEncoder({ language: 'star-prnt', autoFlush: false });
			let result = encoder.codepage('auto').text('héψжł').encode();
			expect(result).toEqual(
				new Uint8Array([
					27, 29, 116, 0, 104, 176, 27, 29, 116, 15, 175, 27, 29, 116, 10, 166, 27, 29, 116, 5, 136, 10, 13
				])
			);
		});
	});
});

import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, 'src/receipt-printer-encoder.ts'),
			name: 'ReceiptPrinterEncoder',
			fileName: (format) => `receipt-printer-encoder.${format}.js`
		},
		rollupOptions: {
			external: [
				'@canvas/image-data',
				'@point-of-sale/codepage-encoder',
				'canvas-dither',
				'canvas-flatten',
				'resize-image-data'
			],
			output: {
				globals: {
					'@canvas/image-data': 'ImageData',
					'@point-of-sale/codepage-encoder': 'CodepageEncoder',
					'canvas-dither': 'Dither',
					'canvas-flatten': 'Flatten',
					'resize-image-data': 'resizeImageData'
				}
			}
		}
	}
});

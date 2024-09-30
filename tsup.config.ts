import { defineConfig } from 'tsup';

export default defineConfig([
	// Browser-friendly UMD build
	{
		entry: ['src/receipt-printer-encoder.ts'],
		format: ['iife'],
		dts: false,
		splitting: false,
		sourcemap: true,
		clean: false,
		outDir: 'dist',
		outExtension() {
			return {
				js: '.umd.js'
			};
		},
		globalName: 'ReceiptPrinterEncoder',
		target: 'es2020',
		minify: true,
		esbuildOptions(options) {
			options.banner = {
				js: '"use strict";'
			};
		}
	},
	// Browser-friendly ES module build
	{
		entry: ['src/receipt-printer-encoder.ts'],
		format: ['esm'],
		dts: false,
		splitting: false,
		sourcemap: true,
		clean: false,
		outDir: 'dist',
		outExtension() {
			return {
				js: '.esm.js'
			};
		},
		target: 'es2020',
		minify: true,
		esbuildOptions(options) {
			options.banner = {
				js: '"use strict";'
			};
		}
	},
	// CommonJS and ES module for Node
	{
		entry: ['src/receipt-printer-encoder.ts'],
		format: ['cjs', 'esm'],
		dts: true,
		splitting: false,
		sourcemap: false,
		clean: true,
		outDir: 'dist',
		outExtension({ format }) {
			return {
				js: format === 'cjs' ? '.cjs' : '.mjs'
			};
		},
		target: 'es2020',
		external: [
			'@canvas/image-data',
			'canvas-dither',
			'canvas-flatten',
			'resize-image-data',
			'@point-of-sale/codepage-encoder'
		],
		esbuildOptions(options) {
			options.banner = {
				js: '"use strict";'
			};
		}
	}
]);

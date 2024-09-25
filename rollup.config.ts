import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

const typescriptPlugin = typescript({
	sourceMap: true,
	inlineSources: true
});

export default [
	// Browser-friendly UMD build
	{
		input: 'src/receipt-printer-encoder.ts',
		output: {
			name: 'ReceiptPrinterEncoder',
			file: 'dist/receipt-printer-encoder.umd.js',
			format: 'umd',
			sourcemap: true
		},
		plugins: [resolve({ browser: true }), commonjs(), typescriptPlugin, terser()]
	},

	// Browser-friendly ES module build
	{
		input: 'src/receipt-printer-encoder.ts',
		output: {
			file: 'dist/receipt-printer-encoder.esm.js',
			format: 'es',
			sourcemap: true
		},
		plugins: [resolve({ browser: true }), commonjs(), typescriptPlugin, terser()]
	},

	// CommonJS (for Node) and ES module (for bundlers) build
	{
		input: 'src/receipt-printer-encoder.ts',
		external: [
			'@canvas/image-data',
			'canvas-dither',
			'canvas-flatten',
			'resize-image-data',
			'@point-of-sale/codepage-encoder'
		],
		output: [
			{ file: 'dist/receipt-printer-encoder.cjs', format: 'cjs', sourcemap: true },
			{ file: 'dist/receipt-printer-encoder.mjs', format: 'es', sourcemap: true }
		],
		plugins: [resolve(), commonjs(), typescriptPlugin]
	}
];

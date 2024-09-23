import type { PrinterDefinition, Font, Language } from '@printers';

/**
 * Optional parameters that can be supplied to the ReceiptPrinterEncoder constructor.
 */
export interface ReceiptPrinterEncoderOptions {
	/**
	 * Number of columns for the receipt. Overrides `width` if provided.
	 */
	columns?: number;

	/**
	 * Language protocol for the printer. Supported values are 'esc-pos', 'star-prnt', and 'star-line'.
	 */
	language?: string;

	/**
	 * Model identifier of the printer, corresponding to keys in `printerDefinitions`.
	 */
	printerModel?: keyof typeof import('../generated/printers').default;

	/**
	 * Width of the receipt paper. If provided, it overrides the `columns` option.
	 */
	width?: number;

	/**
	 * Height of the receipt (if applicable).
	 */
	height?: number;

	/**
	 * Mode for handling images. Common values might include 'raster', 'column', etc.
	 */
	imageMode?: string;

	/**
	 * Number of feed lines before cutting the paper.
	 */
	feedBeforeCut?: number;

	/**
	 * Newline character(s) to use. Defaults to '\n\r'.
	 */
	newline?: string;

	/**
	 * Codepage mapping identifier. Determines how characters are encoded.
	 */
	codepageMapping?: string;

	/**
	 * Array of codepage identifiers to attempt during auto-encoding. Can be null.
	 */
	codepageCandidates?: string[] | null;

	/**
	 * Enables or disables debug mode. Defaults to `false`.
	 */
	debug?: boolean;

	/**
	 * Indicates whether the encoder is embedded within another structure (e.g., a table cell or box).
	 */
	embedded?: boolean;

	/**
	 * Function to create a canvas, primarily used in environments like Node.js.
	 */
	createCanvas?: ((width: number, height: number) => any) | null;
}

import type { PrinterDefinition, Font, Language } from '@printers';

/**
 * Complete set of options used internally by ReceiptPrinterEncoder after merging user inputs with defaults.
 */
export interface FullReceiptPrinterEncoderOptions {
	/**
	 * Number of columns for the receipt.
	 */
	columns: number;

	/**
	 * Language protocol for the printer.
	 */
	language: string;

	/**
	 * Model identifier of the printer, corresponding to keys in `printerDefinitions`.
	 */
	printerModel?: keyof typeof import('../generated/printers').default;

	/**
	 * Width of the receipt paper.
	 */
	width?: number;

	/**
	 * Height of the receipt (if applicable).
	 */
	height?: number;

	/**
	 * Mode for handling images.
	 */
	imageMode: string;

	/**
	 * Number of feed lines before cutting the paper.
	 */
	feedBeforeCut: number;

	/**
	 * Newline character(s) to use.
	 */
	newline: string;

	/**
	 * Codepage mapping identifier.
	 */
	codepageMapping: string;

	/**
	 * Array of codepage identifiers to attempt during auto-encoding.
	 */
	codepageCandidates: string[] | null;

	/**
	 * Enables or disables debug mode.
	 */
	debug: boolean;

	/**
	 * Indicates whether the encoder is embedded within another structure.
	 */
	embedded: boolean;

	/**
	 * Function to create a canvas.
	 */
	createCanvas?: ((width: number, height: number) => any) | null;

	/**
	 * Automatically flushes the print buffer based on internal logic.
	 */
	autoFlush?: boolean;
}

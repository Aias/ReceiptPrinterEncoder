import { PrinterLanguage, CodepageMappingIdentifier } from './receipt-printer-encoder';

export type TextAlign = 'left' | 'center' | 'right';
export type VerticalAlign = 'top' | 'bottom';
export type StyleProperty = 'bold' | 'italic' | 'underline' | 'invert';
export type LineStyle = 'single' | 'double';
export type Size = { width: number; height: number };
export type FontType = keyof PrinterCapabilities['fonts'];
export type ImageMode = 'column' | 'raster';

export interface FontDefinition {
	size: string;
	columns: number;
}

export interface PrinterCapabilities {
	language: PrinterLanguage;
	codepages: CodepageMappingIdentifier;
	newline?: string;
	fonts: {
		A: FontDefinition;
		B?: FontDefinition;
		C?: FontDefinition;
		D?: FontDefinition;
		E?: FontDefinition;
	};
	barcodes: {
		supported: boolean;
		symbologies: string[];
	};
	qrcode: {
		supported: boolean;
		models: string[];
	};
	pdf417: {
		supported: boolean;
		fallback?: {
			type: string;
			symbology: number;
		};
	};
	images?: {
		mode: ImageMode;
	};
	cutter?: {
		feed: number;
	};
}

export interface PrinterDefinition {
	vendor: string;
	model: string;
	media: {
		dpi: number;
		width: number;
	};
	interfaces?: {
		usb?: {
			productName: string;
		};
	};
	capabilities: PrinterCapabilities;
}

export interface Pdf417Options {
	width: number;
	height: number;
	columns: number;
	rows: number;
	errorlevel: number;
	truncated: boolean;
}

export type QrCodeModel = 1 | 2;
export type QrCodeSize = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type QrCodeErrorLevel = 'l' | 'm' | 'q' | 'h';
export interface QrCodeOptions {
	model: QrCodeModel;
	size: QrCodeSize;
	errorlevel: QrCodeErrorLevel;
}

export interface RuleOptions {
	style: LineStyle;
	width: number;
}

export interface BarcodeOptions {
	width: number;
	height: number;
	text: boolean;
}

export interface BoxOptions {
	style: LineStyle | 'none';
	align: TextAlign;
	width: number;
	marginLeft: number;
	marginRight: number;
	paddingLeft: number;
	paddingRight: number;
}

export type Command = number[];
export type CommandArray = Command[];

export const printerDefinitions: {
	[key: string]: PrinterDefinition;
};

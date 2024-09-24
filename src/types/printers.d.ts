import { PrinterLanguage, CodepageMappingIdentifier } from '@encoder';

declare module '@printers' {
	type StringWithAutocomplete<T> = T | (string & Record<never, never>);
	export type TextAlign = 'left' | 'center' | 'right';
	export type VerticalAlign = 'top' | 'bottom';
	export type StyleProperty = 'bold' | 'italic' | 'underline' | 'invert';
	export type Size = { width: number; height: number };
	export type FontType = StringWithAutocomplete<'A' | 'B' | 'C' | 'D' | 'E'>; //https://x.com/diegohaz/status/1524257274012876801

	export interface FontDefinition {
		size: FontType;
		columns: number;
	}

	export interface Capabilities {
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
	}

	export interface Media {
		dpi: number;
		width: number;
	}

	export type ImageMode = 'column' | 'raster';

	export interface Features {
		images?: {
			mode: ImageMode;
		};
		cutter?: {
			feed: number;
		};
	}

	export interface USBInterface {
		productName: string;
	}

	export interface Interfaces {
		usb?: USBInterface;
	}

	export interface PrinterDefinition {
		vendor: string;
		model: string;
		interfaces?: Interfaces;
		media: Media;
		capabilities: Capabilities;
		features?: Features;
	}

	export interface Pdf417Options {
		columns: number;
		rows: number;
		width: number;
		height: number;
		errorlevel: number;
		truncated: boolean;
	}

	export interface QrCodeOptions {
		model: number;
		size: number;
		errorlevel: string;
	}

	export interface BarcodeOptions {
		width: number;
		height: number;
		text: boolean;
	}

	export interface BoxOptions {
		style: 'single' | 'double' | 'none';
		align?: TextAlign;
		width: number;
		marginLeft: number;
		marginRight: number;
		paddingLeft: number;
		paddingRight: number;
	}

	const printerDefinitions: {
		[key: string]: PrinterDefinition;
	};

	export default printerDefinitions;
}

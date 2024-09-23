declare module '@printers' {
	type StringWithAutocomplete<T> = T | (string & Record<never, never>);
	export type Alignment = 'left' | 'center' | 'right';
	export type StyleProperty = 'bold' | 'italic' | 'underline' | 'invert';
	export type Size = { width: number; height: number };
	export type FontType = StringWithAutocomplete<'A' | 'B' | 'C' | 'D' | 'E'>; //https://x.com/diegohaz/status/1524257274012876801

	export interface Font {
		size: FontType;
		columns: number;
	}

	export type Language = 'esc-pos' | 'star-prnt' | 'star-line';

	export interface Capabilities {
		language: string;
		codepages: string;
		newline?: string;
		fonts: {
			A: Font;
			B?: Font;
			C?: Font;
			D?: Font;
			E?: Font;
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
		align?: Alignment;
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

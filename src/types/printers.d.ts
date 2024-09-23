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

	export interface Features {
		images?: {
			mode: string;
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

	const printerDefinitions: {
		[key: string]: PrinterDefinition;
	};

	export default printerDefinitions;
}

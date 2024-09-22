declare module '@printers' {
	export interface Font {
		size: string;
		columns: number;
	}

	export type Language = 'esc-pos' | 'star-prnt';

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
